/**
 * Idempotent data migration script.
 * - planned/actual → amount on Income and Expense
 * - urgency field removed from Expense
 * - BudgetLimit.owner: 'Eşim' → 'Esim', 'Ortak' → 'Ev'
 *
 * Usage: pnpm tsx scripts/migrate-data-cleanup.ts
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { familyBudget, familyBudgetHistory } from '../drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

function migrateIncome(i: Record<string, unknown>): Record<string, unknown> {
  if ('amount' in i && !('planned' in i) && !('actual' in i)) return i; // already migrated
  const amount = (i.actual as number) ?? (i.planned as number) ?? 0;
  const { planned: _p, actual: _a, ...rest } = i as any;
  return { ...rest, amount };
}

function migrateExpense(e: Record<string, unknown>): Record<string, unknown> {
  if ('amount' in e && !('planned' in e) && !('actual' in e) && !('urgency' in e)) return e;
  const amount = (e.actual as number) ?? (e.planned as number) ?? 0;
  const { planned: _p, actual: _a, urgency: _u, ...rest } = e as any;
  return { ...rest, amount };
}

function migrateBudgetLimit(bl: Record<string, unknown>): Record<string, unknown> {
  let owner = bl.owner as string;
  if (owner === 'Eşim') owner = 'Esim';
  if (owner === 'Ortak') owner = 'Ev';
  return { ...bl, owner };
}

function migrateData(raw: Record<string, string>): Record<string, string> {
  const incomes = JSON.parse(raw.incomes || '[]').map(migrateIncome);
  const expenses = JSON.parse(raw.expenses || '[]').map(migrateExpense);
  const budgetLimits = JSON.parse(raw.budgetLimits || '[]').map(migrateBudgetLimit);
  return {
    ...raw,
    incomes: JSON.stringify(incomes),
    expenses: JSON.stringify(expenses),
    budgetLimits: JSON.stringify(budgetLimits),
  };
}

async function run() {
  console.log('Starting data cleanup migration...');

  const rows = await db.select().from(familyBudget);
  let updatedFamilyBudget = 0;
  for (const row of rows) {
    const migrated = migrateData(row as unknown as Record<string, string>);
    if (
      migrated.incomes !== row.incomes ||
      migrated.expenses !== row.expenses ||
      migrated.budgetLimits !== row.budgetLimits
    ) {
      await db.update(familyBudget).set({
        incomes: migrated.incomes,
        expenses: migrated.expenses,
        budgetLimits: migrated.budgetLimits,
      });
      updatedFamilyBudget++;
    }
  }
  console.log(`familyBudget: ${updatedFamilyBudget} row(s) updated`);

  const historyRows = await db.select().from(familyBudgetHistory);
  let updatedHistory = 0;
  for (const row of historyRows) {
    let snap: Record<string, string>;
    try {
      snap = JSON.parse(row.snapshot);
    } catch {
      continue;
    }
    const migrated = migrateData(snap);
    const migratedStr = JSON.stringify(migrated);
    if (migratedStr !== row.snapshot) {
      const { eq } = await import('drizzle-orm');
      await db.update(familyBudgetHistory).set({ snapshot: migratedStr }).where(eq(familyBudgetHistory.id, row.id));
      updatedHistory++;
    }
  }
  console.log(`familyBudgetHistory: ${updatedHistory} row(s) updated`);
  console.log('Migration complete.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
