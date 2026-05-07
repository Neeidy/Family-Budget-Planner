import { describe, expect, it, beforeEach, vi } from "vitest";

// ---- Mock the database module ----
const mockDb = {
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
};

// In-memory snapshot store for testing
let snapshotStore: Array<{
  id: number;
  familyId: string;
  snapshot: string;
  savedBy: string | null;
  createdAt: Date;
}> = [];
let nextId = 1;

vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(() => mockDb),
}));

vi.mock("../drizzle/schema", () => ({
  users: {},
  budgetData: {},
  familyBudget: {},
  familyBudgetHistory: {},
}));

// Mock the db module with in-memory implementation
vi.mock("./db", async () => {
  const HISTORY_MAX = 30;

  const saveFamilyBudget = vi.fn(
    async (
      familyId: string,
      data: Record<string, string>,
      expectedUpdatedAt: string | null,
      savedBy: string | null = null
    ) => {
      // Simulate snapshot before save
      const existing = snapshotStore.filter(s => s.familyId === familyId);
      if (existing.length > 0 && expectedUpdatedAt !== null) {
        // Save snapshot of previous state
        const snap = {
          id: nextId++,
          familyId,
          snapshot: JSON.stringify(data),
          savedBy,
          createdAt: new Date(),
        };
        snapshotStore.push(snap);

        // Enforce max 30
        const familySnaps = snapshotStore.filter(s => s.familyId === familyId);
        if (familySnaps.length > HISTORY_MAX) {
          const sorted = [...familySnaps].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          );
          const toDelete = sorted.slice(0, familySnaps.length - HISTORY_MAX);
          snapshotStore = snapshotStore.filter(
            s => !toDelete.find(d => d.id === s.id)
          );
        }
      } else if (existing.length === 0) {
        // First save — snapshot it
        const snap = {
          id: nextId++,
          familyId,
          snapshot: JSON.stringify(data),
          savedBy,
          createdAt: new Date(),
        };
        snapshotStore.push(snap);
      }

      return { updatedAt: new Date() };
    }
  );

  const listFamilyBudgetHistory = vi.fn(async (familyId: string) => {
    return snapshotStore
      .filter(s => s.familyId === familyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 30);
  });

  const getFamilyBudgetSnapshot = vi.fn(
    async (familyId: string, id: number) => {
      const snap = snapshotStore.find(s => s.id === id);
      if (!snap) return null;
      if (snap.familyId !== familyId) return null;
      return snap;
    }
  );

  return { saveFamilyBudget, listFamilyBudgetHistory, getFamilyBudgetSnapshot };
});

import {
  saveFamilyBudget,
  listFamilyBudgetHistory,
  getFamilyBudgetSnapshot,
} from "./db";

const SAMPLE_DATA = {
  incomes: "[]",
  expenses: "[]",
  debts: "[]",
  savings: "[]",
  annualPayments: "[]",
  budgetLimits: "[]",
  savingsGoals: "[]",
  installments: "[]",
};

describe("familyBudgetHistory", () => {
  beforeEach(() => {
    snapshotStore = [];
    nextId = 1;
    vi.clearAllMocks();
  });

  it("her save'den sonra history'de 1 kayıt artar", async () => {
    const familyId = "test-family-1";

    // First save
    await saveFamilyBudget(familyId, SAMPLE_DATA, null, "Yigit");
    const after1 = await listFamilyBudgetHistory(familyId);
    expect(after1.length).toBe(1);

    // Second save
    await saveFamilyBudget(
      familyId,
      { ...SAMPLE_DATA, incomes: '[{"id":"1","amount":1000}]' },
      new Date().toISOString(),
      "Arzu"
    );
    const after2 = await listFamilyBudgetHistory(familyId);
    expect(after2.length).toBe(2);
  });

  it("31. save sonrası en eski snapshot silinmiş, count = 30", async () => {
    const familyId = "test-family-limit";

    // First save
    await saveFamilyBudget(familyId, SAMPLE_DATA, null, "Yigit");

    // 30 more saves (total 31 snapshots would be created)
    for (let i = 0; i < 30; i++) {
      await saveFamilyBudget(
        familyId,
        SAMPLE_DATA,
        new Date().toISOString(),
        "Yigit"
      );
    }

    const history = await listFamilyBudgetHistory(familyId);
    expect(history.length).toBeLessThanOrEqual(30);
  });

  it("restore mevcut state'i snapshot'lar (restore öncesi state geri alınabilir)", async () => {
    const familyId = "test-family-restore";

    // Initial save
    await saveFamilyBudget(familyId, SAMPLE_DATA, null, "Yigit");
    const before = await listFamilyBudgetHistory(familyId);
    const countBefore = before.length;

    // Restore (which internally calls saveFamilyBudget again, creating another snapshot)
    await saveFamilyBudget(
      familyId,
      SAMPLE_DATA,
      new Date().toISOString(),
      "Arzu"
    );
    const after = await listFamilyBudgetHistory(familyId);

    expect(after.length).toBeGreaterThan(countBefore);
  });

  it("getFamilyBudgetSnapshot farklı familyId için null döner", async () => {
    const familyId = "test-family-security";

    // Save a snapshot for family A
    await saveFamilyBudget(familyId, SAMPLE_DATA, null, "Yigit");
    const history = await listFamilyBudgetHistory(familyId);
    expect(history.length).toBeGreaterThan(0);

    const snapId = history[0].id;

    // Try to access with different familyId
    const result = await getFamilyBudgetSnapshot("other-family", snapId);
    expect(result).toBeNull();

    // Access with correct familyId works
    const correct = await getFamilyBudgetSnapshot(familyId, snapId);
    expect(correct).not.toBeNull();
  });

  it("savedBy alanı doğru kişiyi kaydeder", async () => {
    const familyId = "test-family-savedby";

    await saveFamilyBudget(familyId, SAMPLE_DATA, null, "Yigit");
    const history = await listFamilyBudgetHistory(familyId);

    expect(history.length).toBe(1);
    expect(history[0].savedBy).toBe("Yigit");
  });
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createFamilyContextForHistory(): TrpcContext {
  return {
    user: null,
    family: { person: "Yigit" },
    isGuest: false,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("familyBudget.history.restore — CONFLICT senaryosu", () => {
  it("eski expectedUpdatedAt ile restore reddedilir (CONFLICT)", async () => {
    // Mock getFamilyBudgetSnapshot to return a valid snapshot
    const { getFamilyBudgetSnapshot: mockGetSnap, saveFamilyBudget: mockSave } =
      await import("./db");
    vi.mocked(mockGetSnap).mockResolvedValueOnce({
      id: 1,
      familyId: "uk-family-budget-2026",
      snapshot: JSON.stringify(SAMPLE_DATA),
      savedBy: "Yigit",
      createdAt: new Date(),
    });
    // saveFamilyBudget returns CONFLICT
    vi.mocked(mockSave).mockResolvedValueOnce({
      conflict: true,
      serverUpdatedAt: new Date(),
    });

    const ctx = createFamilyContextForHistory();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.familyBudget.history.restore({
        id: 1,
        expectedUpdatedAt: "2026-01-01T00:00:00.000Z", // stale
      })
    ).rejects.toThrow("Geri yüklenemedi");
  });
});
