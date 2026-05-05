import { eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, budgetData, InsertBudgetData, familyBudget, familyBudgetHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

const HISTORY_MAX = 30; // max snapshots per family

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Budget data queries
export async function getBudgetData(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(budgetData).where(eq(budgetData.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function saveBudgetData(userId: number, data: Omit<InsertBudgetData, 'userId'>) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getBudgetData(userId);
  
  if (existing) {
    await db.update(budgetData).set(data).where(eq(budgetData.userId, userId));
    return { ...existing, ...data };
  } else {
    await db.insert(budgetData).values({ ...data, userId });
    return { ...data, userId, id: 0 };
  }
}

// Family budget queries - shared access by familyId, no auth required
export async function getFamilyBudget(familyId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(familyBudget).where(eq(familyBudget.familyId, familyId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

type FamilyBudgetData = {
  incomes: string;
  expenses: string;
  debts: string;
  annualPayments: string;
  budgetLimits: string;
  savingsGoals: string;
  installments?: string;
};

type SaveResult =
  | { updatedAt: Date }
  | { conflict: true; serverUpdatedAt: Date };

export async function saveFamilyBudget(
  familyId: string,
  data: FamilyBudgetData,
  expectedUpdatedAt: string | null,
  savedBy: string | null = null
): Promise<SaveResult> {
  const db = await getDb();
  if (!db) throw new Error("[Database] Cannot save family budget: database not available");

  const existing = await getFamilyBudget(familyId);

  const saveData = {
    incomes: data.incomes,
    expenses: data.expenses,
    debts: data.debts,
    annualPayments: data.annualPayments,
    budgetLimits: data.budgetLimits,
    savingsGoals: data.savingsGoals,
    installments: data.installments ?? '[]',
  };

  if (!existing) {
    // First save — no conflict possible
    await db.insert(familyBudget).values({ familyId, ...saveData });
    const inserted = await getFamilyBudget(familyId);
    // Snapshot the first save
    await saveSnapshot(familyId, saveData, savedBy);
    return { updatedAt: inserted?.updatedAt ?? new Date() };
  }

  // Existing record — check optimistic lock
  if (expectedUpdatedAt === null) {
    // Client thought it was a first save but DB already has data
    return { conflict: true, serverUpdatedAt: existing.updatedAt };
  }

  if (existing.updatedAt.toISOString() !== expectedUpdatedAt) {
    return { conflict: true, serverUpdatedAt: existing.updatedAt };
  }

  // Timestamps match — safe to update
  // Snapshot BEFORE overwriting so the previous state is recoverable
  await saveSnapshot(familyId, {
    incomes: existing.incomes,
    expenses: existing.expenses,
    debts: existing.debts,
    annualPayments: existing.annualPayments,
    budgetLimits: existing.budgetLimits,
    savingsGoals: existing.savingsGoals,
    installments: existing.installments,
  }, savedBy);

  await db.update(familyBudget).set(saveData).where(eq(familyBudget.familyId, familyId));
  const updated = await getFamilyBudget(familyId);
  return { updatedAt: updated?.updatedAt ?? new Date() };
}

// ---- History snapshot helpers ----

async function saveSnapshot(
  familyId: string,
  data: FamilyBudgetData & { installments?: string },
  savedBy: string | null
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Insert new snapshot
  await db.insert(familyBudgetHistory).values({
    familyId,
    snapshot: JSON.stringify(data),
    savedBy: savedBy ?? null,
  });

  // Enforce max 30 snapshots: delete oldest if exceeded
  const all = await db
    .select({ id: familyBudgetHistory.id })
    .from(familyBudgetHistory)
    .where(eq(familyBudgetHistory.familyId, familyId))
    .orderBy(asc(familyBudgetHistory.createdAt));

  if (all.length > HISTORY_MAX) {
    const toDelete = all.slice(0, all.length - HISTORY_MAX);
    for (const row of toDelete) {
      await db.delete(familyBudgetHistory).where(eq(familyBudgetHistory.id, row.id));
    }
  }
}

export async function listFamilyBudgetHistory(familyId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: familyBudgetHistory.id,
      familyId: familyBudgetHistory.familyId,
      savedBy: familyBudgetHistory.savedBy,
      createdAt: familyBudgetHistory.createdAt,
    })
    .from(familyBudgetHistory)
    .where(eq(familyBudgetHistory.familyId, familyId))
    .orderBy(desc(familyBudgetHistory.createdAt))
    .limit(HISTORY_MAX);
}

export async function getFamilyBudgetSnapshot(familyId: string, id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(familyBudgetHistory)
    .where(eq(familyBudgetHistory.id, id))
    .limit(1);

  if (result.length === 0) return null;
  // Security: ensure snapshot belongs to the requesting family
  if (result[0].familyId !== familyId) return null;
  return result[0];
}
