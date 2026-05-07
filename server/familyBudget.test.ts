import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getFamilyBudget: vi.fn(),
  saveFamilyBudget: vi.fn(),
  getBudgetData: vi.fn(),
  saveBudgetData: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

import { getFamilyBudget, saveFamilyBudget } from "./db";

/**
 * Creates a context with a valid family session (authenticated family member).
 */
function createFamilyContext(person: "Benim" | "Esim" = "Benim"): TrpcContext {
  return {
    user: null,
    family: { person },
    isGuest: false,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

/**
 * Creates a context without family session (unauthenticated).
 */
function createUnauthContext(): TrpcContext {
  return {
    user: null,
    family: null,
    isGuest: false,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const mockFamilyBudgetRow = {
  id: 1,
  familyId: "uk-family-budget-2026",
  incomes: JSON.stringify([{ id: "1", name: "Salary", planned: 5000, actual: 5000, owner: "Benim", date: "2026-01-01", notes: "" }]),
  expenses: JSON.stringify([]),
  debts: JSON.stringify([]),
  savings: JSON.stringify([]),
  annualPayments: JSON.stringify([]),
  budgetLimits: JSON.stringify([]),
  savingsGoals: JSON.stringify([]),
  installments: JSON.stringify([]),
  updatedAt: new Date("2026-05-01T10:00:00.000Z"),
};

const validArrayString = JSON.stringify([{ id: 1, name: "test", amount: 100 }]);

describe("familyBudget router — existing tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("familyBudget.get returns null when no data exists", async () => {
    vi.mocked(getFamilyBudget).mockResolvedValue(null);
    const caller = appRouter.createCaller(createFamilyContext());
    const result = await caller.familyBudget.get();
    expect(result).toBeNull();
  });

  it("familyBudget.get returns data when it exists", async () => {
    vi.mocked(getFamilyBudget).mockResolvedValue(mockFamilyBudgetRow);
    const caller = appRouter.createCaller(createFamilyContext());
    const result = await caller.familyBudget.get();
    expect(result).not.toBeNull();
    expect(result?.familyId).toBe("uk-family-budget-2026");
  });

  it("familyBudget.get rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.familyBudget.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("familyBudget.save rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.familyBudget.save({
        incomes: "[]",
        expenses: "[]",
        debts: "[]",
        savings: "[]",
        annualPayments: "[]",
        budgetLimits: "[]",
        savingsGoals: "[]",
        installments: "[]",
        expectedUpdatedAt: null,
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("familyBudget.getUpdatedAt returns null when no data", async () => {
    vi.mocked(getFamilyBudget).mockResolvedValue(null);
    const caller = appRouter.createCaller(createFamilyContext());
    const result = await caller.familyBudget.getUpdatedAt();
    expect(result).toBeNull();
  });

  it("familyBudget.getUpdatedAt returns date when data exists", async () => {
    vi.mocked(getFamilyBudget).mockResolvedValue(mockFamilyBudgetRow);
    const caller = appRouter.createCaller(createFamilyContext());
    const result = await caller.familyBudget.getUpdatedAt();
    expect(result).toBeInstanceOf(Date);
  });
});

describe("familyBudget.save — JSON validation (Dalga 2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid JSON string for incomes", async () => {
    const ctx = createFamilyContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.familyBudget.save({
        incomes: "bu-gecersiz-json",
        expenses: validArrayString,
        debts: validArrayString,
        savings: validArrayString,
        annualPayments: validArrayString,
        budgetLimits: validArrayString,
        savingsGoals: validArrayString,
        installments: validArrayString,
        expectedUpdatedAt: null,
      })
    ).rejects.toThrow();
  });

  it("rejects non-array JSON (object) for expenses", async () => {
    const ctx = createFamilyContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.familyBudget.save({
        incomes: validArrayString,
        expenses: '{"key":"value"}', // object, not array
        debts: validArrayString,
        savings: validArrayString,
        annualPayments: validArrayString,
        budgetLimits: validArrayString,
        savingsGoals: validArrayString,
        installments: validArrayString,
        expectedUpdatedAt: null,
      })
    ).rejects.toThrow();
  });

  it("rejects field exceeding 100KB", async () => {
    const ctx = createFamilyContext();
    const caller = appRouter.createCaller(ctx);

    // Build a JSON array string > 100KB
    const bigItem = { id: 1, description: "x".repeat(1000) };
    const bigArray = JSON.stringify(Array(120).fill(bigItem)); // ~120KB

    await expect(
      caller.familyBudget.save({
        incomes: bigArray,
        expenses: validArrayString,
        debts: validArrayString,
        savings: validArrayString,
        annualPayments: validArrayString,
        budgetLimits: validArrayString,
        savingsGoals: validArrayString,
        installments: validArrayString,
        expectedUpdatedAt: null,
      })
    ).rejects.toThrow();
  });
});

describe("familyBudget.save — optimistic locking (Dalga 2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("first save (DB empty) with expectedUpdatedAt: null succeeds", async () => {
    vi.mocked(saveFamilyBudget).mockResolvedValue({ updatedAt: new Date("2026-01-01T00:00:00.000Z") });

    const ctx = createFamilyContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.familyBudget.save({
      incomes: validArrayString,
      expenses: validArrayString,
      debts: validArrayString,
      savings: validArrayString,
      annualPayments: validArrayString,
      budgetLimits: validArrayString,
      savingsGoals: validArrayString,
      installments: validArrayString,
      expectedUpdatedAt: null,
    });

    expect(result).toHaveProperty("updatedAt");
    expect(saveFamilyBudget).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      null,
      expect.anything() // savedBy: ctx.family.person
    );
  });

  it("save with matching expectedUpdatedAt succeeds", async () => {
    const serverDate = new Date("2026-05-01T10:00:00.000Z");
    vi.mocked(saveFamilyBudget).mockResolvedValue({ updatedAt: serverDate });

    const ctx = createFamilyContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.familyBudget.save({
      incomes: validArrayString,
      expenses: validArrayString,
      debts: validArrayString,
      savings: validArrayString,
      annualPayments: validArrayString,
      budgetLimits: validArrayString,
      savingsGoals: validArrayString,
      installments: validArrayString,
      expectedUpdatedAt: "2026-05-01T10:00:00.000Z",
    });

    expect(result).toHaveProperty("updatedAt");
  });

  it("save with stale expectedUpdatedAt throws CONFLICT", async () => {
    const serverDate = new Date("2026-05-01T12:00:00.000Z");
    vi.mocked(saveFamilyBudget).mockResolvedValue({
      conflict: true,
      serverUpdatedAt: serverDate,
    });

    const ctx = createFamilyContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.familyBudget.save({
        incomes: validArrayString,
        expenses: validArrayString,
        debts: validArrayString,
        savings: validArrayString,
        annualPayments: validArrayString,
        budgetLimits: validArrayString,
        savingsGoals: validArrayString,
        installments: validArrayString,
        expectedUpdatedAt: "2026-05-01T10:00:00.000Z", // stale
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Veriler başka bir cihazdan değiştirildi",
    });
  });

  it("save with expectedUpdatedAt: null when DB has data throws CONFLICT", async () => {
    const serverDate = new Date("2026-05-01T12:00:00.000Z");
    vi.mocked(saveFamilyBudget).mockResolvedValue({
      conflict: true,
      serverUpdatedAt: serverDate,
    });

    const ctx = createFamilyContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.familyBudget.save({
        incomes: validArrayString,
        expenses: validArrayString,
        debts: validArrayString,
        savings: validArrayString,
        annualPayments: validArrayString,
        budgetLimits: validArrayString,
        savingsGoals: validArrayString,
        installments: validArrayString,
        expectedUpdatedAt: null, // client thinks first save, but DB has data
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
