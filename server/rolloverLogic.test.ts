import { describe, it, expect } from "vitest";
import {
  parseStoredMonth,
  shouldRollover,
  computeRollover,
  type BudgetState,
} from "../shared/rolloverLogic";

// ─── parseStoredMonth ────────────────────────────────────────────────────────

describe("parseStoredMonth", () => {
  it("parses lowercase Turkish month names", () => {
    expect(parseStoredMonth("ocak")).toBe(1);
    expect(parseStoredMonth("şubat")).toBe(2);
    expect(parseStoredMonth("mart")).toBe(3);
    expect(parseStoredMonth("nisan")).toBe(4);
    expect(parseStoredMonth("mayıs")).toBe(5);
    expect(parseStoredMonth("haziran")).toBe(6);
    expect(parseStoredMonth("temmuz")).toBe(7);
    expect(parseStoredMonth("ağustos")).toBe(8);
    expect(parseStoredMonth("eylül")).toBe(9);
    expect(parseStoredMonth("ekim")).toBe(10);
    expect(parseStoredMonth("kasım")).toBe(11);
    expect(parseStoredMonth("aralık")).toBe(12);
  });

  it("is case-insensitive", () => {
    expect(parseStoredMonth("Ocak")).toBe(1);
    expect(parseStoredMonth("ARALIK")).toBe(12);
    expect(parseStoredMonth("Mayıs")).toBe(5);
  });

  it("returns 0 for unknown input", () => {
    expect(parseStoredMonth("")).toBe(0);
    expect(parseStoredMonth("January")).toBe(0);
    expect(parseStoredMonth("invalid")).toBe(0);
  });
});

// ─── shouldRollover ──────────────────────────────────────────────────────────

describe("shouldRollover", () => {
  it("returns true when today is one month ahead", () => {
    expect(shouldRollover(2026, 4, 2026, 5)).toBe(true);
  });

  it("returns true when today is several months ahead", () => {
    expect(shouldRollover(2026, 1, 2026, 6)).toBe(true);
  });

  it("returns true when today is a year ahead", () => {
    expect(shouldRollover(2025, 12, 2026, 1)).toBe(true);
  });

  it("returns false when same month/year", () => {
    expect(shouldRollover(2026, 5, 2026, 5)).toBe(false);
  });

  it("returns false when today is in the past", () => {
    expect(shouldRollover(2026, 5, 2026, 4)).toBe(false);
    expect(shouldRollover(2026, 5, 2025, 12)).toBe(false);
  });
});

// ─── computeRollover ─────────────────────────────────────────────────────────

function makeState(overrides: Partial<BudgetState> = {}): BudgetState {
  return {
    incomes: [],
    expenses: [],
    debts: [],
    savingsGoals: [],
    annualPayments: [],
    budgetLimits: [],
    installments: [],
    ...overrides,
  };
}

let idCounter = 0;
const deterministicId = () => `test-id-${++idCounter}`;

describe("computeRollover", () => {
  it("carries forward only type=Sabit expenses", () => {
    const state = makeState({
      expenses: [
        {
          id: "e1",
          type: "Sabit",
          status: "Odendi",
          category: "Kira",
          amount: 1200,
        },
        {
          id: "e2",
          type: "Degisken",
          status: "Odendi",
          category: "Market",
          amount: 300,
        },
        {
          id: "e3",
          type: "Borc",
          status: "Odendi",
          category: "Kredi",
          amount: 500,
        },
        {
          id: "e4",
          type: "Birikim",
          status: "Odendi",
          category: "Birikim",
          amount: 200,
        },
      ],
    });
    const result = computeRollover(state, deterministicId);
    expect(result.expenses).toHaveLength(1);
    expect(result.expenses[0].category).toBe("Kira");
  });

  it("assigns new id to each carried Sabit expense", () => {
    const state = makeState({
      expenses: [
        {
          id: "old-1",
          type: "Sabit",
          status: "Odendi",
          category: "Kira",
          amount: 1200,
        },
        {
          id: "old-2",
          type: "Sabit",
          status: "Gecikti",
          category: "İnternet",
          amount: 50,
        },
      ],
    });
    const result = computeRollover(state, deterministicId);
    expect(result.expenses).toHaveLength(2);
    for (const e of result.expenses) {
      expect(e.id).not.toBe("old-1");
      expect(e.id).not.toBe("old-2");
      expect(typeof e.id).toBe("string");
      expect(e.id.length).toBeGreaterThan(0);
    }
    // All ids are unique
    const ids = result.expenses.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("sets status=Bekliyor on all carried Sabit expenses", () => {
    const state = makeState({
      expenses: [
        { id: "e1", type: "Sabit", status: "Odendi", amount: 1200 },
        { id: "e2", type: "Sabit", status: "Gecikti", amount: 50 },
      ],
    });
    const result = computeRollover(state, deterministicId);
    for (const e of result.expenses) {
      expect(e.status).toBe("Bekliyor");
    }
  });

  it("preserves all other fields on carried expenses", () => {
    const expense = {
      id: "old-e1",
      type: "Sabit",
      status: "Odendi",
      category: "Kira",
      subcategory: "Ev Kirası",
      amount: 1500,
      owner: "Ev",
      notes: "Aylık kira",
      paymentDay: "5",
    };
    const state = makeState({ expenses: [expense] });
    const result = computeRollover(state, deterministicId);
    const carried = result.expenses[0];
    expect(carried.category).toBe("Kira");
    expect(carried.subcategory).toBe("Ev Kirası");
    expect(carried.amount).toBe(1500);
    expect(carried.owner).toBe("Ev");
    expect(carried.notes).toBe("Aylık kira");
    expect(carried.paymentDay).toBe("5");
  });

  it("preserves debts as-is", () => {
    const debts = [{ id: "d1", name: "Araba kredisi", totalDebt: 10000 }];
    const state = makeState({ debts });
    const result = computeRollover(state, deterministicId);
    expect(result.debts).toBe(debts); // same reference (not cloned)
  });

  it("preserves savingsGoals as-is", () => {
    const goals = [{ id: "g1", name: "Tatil", targetAmount: 5000 }];
    const state = makeState({ savingsGoals: goals });
    const result = computeRollover(state, deterministicId);
    expect(result.savingsGoals).toBe(goals);
  });

  it("preserves annualPayments as-is", () => {
    const payments = [{ id: "a1", name: "Sigorta", amount: 1200 }];
    const state = makeState({ annualPayments: payments });
    const result = computeRollover(state, deterministicId);
    expect(result.annualPayments).toBe(payments);
  });

  it("preserves budgetLimits as-is", () => {
    const limits = [{ id: "bl1", category: "Market", limit: 500 }];
    const state = makeState({ budgetLimits: limits });
    const result = computeRollover(state, deterministicId);
    expect(result.budgetLimits).toBe(limits);
  });

  it("preserves installments as-is", () => {
    const installments = [{ id: "i1", name: "Telefon", totalAmount: 1200 }];
    const state = makeState({ installments });
    const result = computeRollover(state, deterministicId);
    expect(result.installments).toBe(installments);
  });

  it("handles empty state (no-op rollover): expenses and incomes empty", () => {
    const state = makeState(); // all arrays empty
    const result = computeRollover(state, deterministicId);
    expect(result.incomes).toEqual([]);
    expect(result.expenses).toEqual([]);
  });

  it("handles all-Degisken expenses: result expenses is empty", () => {
    const state = makeState({
      expenses: [
        { id: "e1", type: "Degisken", status: "Odendi", amount: 200 },
        { id: "e2", type: "Borc", status: "Odendi", amount: 500 },
      ],
    });
    const result = computeRollover(state, deterministicId);
    expect(result.expenses).toEqual([]);
  });

  it("does not mutate the input state", () => {
    const expenses = [
      { id: "e1", type: "Sabit", status: "Odendi", amount: 100 },
    ];
    const state = makeState({ expenses });
    computeRollover(state, deterministicId);
    // Original expense unchanged
    expect(expenses[0].status).toBe("Odendi");
    expect(expenses[0].id).toBe("e1");
  });
});

describe("income rollover", () => {
  it("preserves Sabit incomes with new IDs", () => {
    const state = makeState({
      incomes: [
        {
          id: "i1",
          name: "Maaş",
          amount: 3000,
          type: "Sabit",
          owner: "Benim",
          date: "2026-05-01",
          notes: "",
        },
      ],
    });
    const next = computeRollover(state, deterministicId);
    expect(next.incomes).toHaveLength(1);
    expect(next.incomes[0].name).toBe("Maaş");
    expect(next.incomes[0].id).not.toBe("i1");
  });

  it("drops Ek incomes", () => {
    const state = makeState({
      incomes: [
        {
          id: "i1",
          name: "Bonus",
          amount: 500,
          type: "Ek",
          owner: "Benim",
          date: "2026-05-15",
          notes: "",
        },
      ],
    });
    const next = computeRollover(state, deterministicId);
    expect(next.incomes).toHaveLength(0);
  });

  it("preserves legacy income (no type) as Sabit", () => {
    const state = makeState({
      incomes: [
        {
          id: "i1",
          name: "Maaş",
          amount: 3000,
          owner: "Benim",
          date: "2026-05-01",
          notes: "",
        },
      ],
    });
    const next = computeRollover(state, deterministicId);
    expect(next.incomes).toHaveLength(1);
  });
});
