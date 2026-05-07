import { describe, it, expect } from "vitest";
import {
  migrateIncome,
  migrateExpense,
  migrateBudgetLimit,
  migrateData,
} from "../shared/migrateLogic";

// ─── migrateIncome ───────────────────────────────────────────────────────────

describe("migrateIncome", () => {
  it("converts planned+actual to amount (uses actual)", () => {
    const result = migrateIncome({
      id: "1",
      name: "Maaş",
      planned: 4000,
      actual: 3800,
      owner: "Benim",
    });
    expect(result).toEqual({
      id: "1",
      name: "Maaş",
      amount: 3800,
      owner: "Benim",
    });
    expect("planned" in result).toBe(false);
    expect("actual" in result).toBe(false);
  });

  it("falls back to planned when actual is absent", () => {
    const result = migrateIncome({ id: "1", planned: 4000, owner: "Esim" });
    expect((result as any).amount).toBe(4000);
  });

  it("uses 0 when both planned and actual are absent", () => {
    const result = migrateIncome({ id: "1", owner: "Benim" });
    expect((result as any).amount).toBe(0);
  });

  it("is a no-op when already migrated (has amount, no planned/actual)", () => {
    const already = { id: "1", amount: 5000, owner: "Benim" };
    const result = migrateIncome(already);
    expect(result).toBe(already); // same reference → truly no-op
  });

  it("is idempotent: migrating twice gives same result", () => {
    const old = {
      id: "1",
      planned: 3000,
      actual: 2800,
      name: "X",
      owner: "Benim",
    };
    const once = migrateIncome(old);
    const twice = migrateIncome(once);
    expect(once).toEqual(twice);
  });
});

// ─── migrateExpense ──────────────────────────────────────────────────────────

describe("migrateExpense", () => {
  it("converts planned+actual to amount and removes urgency", () => {
    const input = {
      id: "e1",
      category: "Kira",
      type: "Sabit",
      planned: 1500,
      actual: 1500,
      urgency: "Zorunlu",
      status: "Odendi",
      owner: "Ev",
    };
    const result = migrateExpense(input);
    expect((result as any).amount).toBe(1500);
    expect("planned" in result).toBe(false);
    expect("actual" in result).toBe(false);
    expect("urgency" in result).toBe(false);
    expect(result.category).toBe("Kira");
    expect(result.type).toBe("Sabit");
    expect(result.status).toBe("Odendi");
    expect(result.owner).toBe("Ev");
  });

  it("uses actual over planned", () => {
    const result = migrateExpense({ id: "e1", planned: 500, actual: 450 });
    expect((result as any).amount).toBe(450);
  });

  it("falls back to planned when actual absent", () => {
    const result = migrateExpense({ id: "e1", planned: 300 });
    expect((result as any).amount).toBe(300);
  });

  it("is a no-op when already migrated (amount, no planned/actual/urgency)", () => {
    const already = {
      id: "e1",
      amount: 200,
      category: "Market",
      type: "Degisken",
    };
    const result = migrateExpense(already);
    expect(result).toBe(already);
  });

  it("migrates expense that only has urgency removed (no planned/actual)", () => {
    const input = {
      id: "e1",
      amount: 100,
      urgency: "Esnek",
      category: "Market",
    };
    const result = migrateExpense(input);
    expect("urgency" in result).toBe(false);
    expect((result as any).amount).toBe(100);
  });

  it("is idempotent: migrating twice gives same result", () => {
    const old = {
      id: "e1",
      planned: 200,
      actual: 180,
      urgency: "Zorunlu",
      category: "Fatura",
    };
    const once = migrateExpense(old);
    const twice = migrateExpense(once);
    expect(once).toEqual(twice);
  });
});

// ─── migrateBudgetLimit ──────────────────────────────────────────────────────

describe("migrateBudgetLimit", () => {
  it("maps 'Eşim' → 'Esim'", () => {
    const result = migrateBudgetLimit({
      id: "bl1",
      category: "Market",
      limit: 400,
      owner: "Eşim",
    });
    expect(result.owner).toBe("Esim");
  });

  it("maps 'Ortak' → 'Ev'", () => {
    const result = migrateBudgetLimit({
      id: "bl1",
      category: "Kira",
      limit: 1500,
      owner: "Ortak",
    });
    expect(result.owner).toBe("Ev");
  });

  it("leaves 'Benim' unchanged", () => {
    const result = migrateBudgetLimit({
      id: "bl1",
      category: "Eğitim",
      limit: 200,
      owner: "Benim",
    });
    expect(result.owner).toBe("Benim");
  });

  it("leaves 'Esim' unchanged (already migrated)", () => {
    const result = migrateBudgetLimit({
      id: "bl1",
      owner: "Esim",
      limit: 100,
      category: "X",
    });
    expect(result.owner).toBe("Esim");
  });

  it("leaves 'Ev' unchanged (already migrated)", () => {
    const result = migrateBudgetLimit({
      id: "bl1",
      owner: "Ev",
      limit: 100,
      category: "X",
    });
    expect(result.owner).toBe("Ev");
  });

  it("is idempotent", () => {
    const old = { id: "bl1", owner: "Eşim", limit: 300, category: "Market" };
    const once = migrateBudgetLimit(old);
    const twice = migrateBudgetLimit(once);
    expect(once).toEqual(twice);
  });
});

// ─── migrateData (integration-level, no DB) ──────────────────────────────────

describe("migrateData", () => {
  const OLD_FIXTURE = {
    incomes: JSON.stringify([
      {
        id: "i1",
        name: "Maaş",
        planned: 5000,
        actual: 4800,
        owner: "Benim",
        date: "2026-04-01",
        notes: "",
      },
    ]),
    expenses: JSON.stringify([
      {
        id: "e1",
        category: "Kira",
        subcategory: "Ev",
        type: "Sabit",
        planned: 1500,
        actual: 1500,
        urgency: "Zorunlu",
        status: "Odendi",
        owner: "Ev",
        notes: "",
        paymentDay: "1",
      },
      {
        id: "e2",
        category: "Market",
        subcategory: "Gıda",
        type: "Degisken",
        planned: 300,
        actual: 280,
        urgency: "Esnek",
        status: "Odendi",
        owner: "Benim",
        notes: "",
        paymentDay: "",
      },
    ]),
    budgetLimits: JSON.stringify([
      { id: "bl1", category: "Market", limit: 400, owner: "Eşim" },
      { id: "bl2", category: "Kira", limit: 1500, owner: "Ortak" },
      { id: "bl3", category: "Eğitim", limit: 200, owner: "Benim" },
    ]),
    debts: "[]",
    savingsGoals: "[]",
    annualPayments: "[]",
    installments: "[]",
  };

  it("migrates old fixture to new format on first run", () => {
    const result = migrateData(OLD_FIXTURE);
    expect(result.changed).toBe(true);

    const incomes = JSON.parse(result.incomes);
    expect(incomes[0].amount).toBe(4800);
    expect("planned" in incomes[0]).toBe(false);
    expect("actual" in incomes[0]).toBe(false);

    const expenses = JSON.parse(result.expenses);
    for (const e of expenses) {
      expect("urgency" in e).toBe(false);
      expect("planned" in e).toBe(false);
      expect("actual" in e).toBe(false);
      expect(typeof e.amount).toBe("number");
    }

    const limits = JSON.parse(result.budgetLimits);
    expect(limits.find((l: any) => l.id === "bl1").owner).toBe("Esim");
    expect(limits.find((l: any) => l.id === "bl2").owner).toBe("Ev");
    expect(limits.find((l: any) => l.id === "bl3").owner).toBe("Benim");
  });

  it("is idempotent: running on already-migrated data reports changed=false", () => {
    const firstPass = migrateData(OLD_FIXTURE);
    // Build a "raw" record from the first-pass output
    const alreadyMigrated = {
      ...OLD_FIXTURE,
      incomes: firstPass.incomes,
      expenses: firstPass.expenses,
      budgetLimits: firstPass.budgetLimits,
    };
    const secondPass = migrateData(alreadyMigrated);
    expect(secondPass.changed).toBe(false);
    // Output strings must equal input strings exactly
    expect(secondPass.incomes).toBe(alreadyMigrated.incomes);
    expect(secondPass.expenses).toBe(alreadyMigrated.expenses);
    expect(secondPass.budgetLimits).toBe(alreadyMigrated.budgetLimits);
  });

  it("reports changed=false when data is already clean", () => {
    const clean = {
      incomes: JSON.stringify([
        {
          id: "i1",
          amount: 5000,
          owner: "Benim",
          name: "Maaş",
          date: "",
          notes: "",
        },
      ]),
      expenses: JSON.stringify([
        {
          id: "e1",
          amount: 1500,
          category: "Kira",
          type: "Sabit",
          status: "Odendi",
          owner: "Ev",
          notes: "",
          paymentDay: "",
          subcategory: "",
        },
      ]),
      budgetLimits: JSON.stringify([
        { id: "bl1", category: "Market", limit: 400, owner: "Esim" },
      ]),
      debts: "[]",
      savingsGoals: "[]",
      annualPayments: "[]",
      installments: "[]",
    };
    const result = migrateData(clean);
    expect(result.changed).toBe(false);
  });

  it("handles empty arrays without error", () => {
    const empty = {
      incomes: "[]",
      expenses: "[]",
      budgetLimits: "[]",
      debts: "[]",
      savingsGoals: "[]",
      annualPayments: "[]",
      installments: "[]",
    };
    const result = migrateData(empty);
    expect(result.changed).toBe(false);
    expect(result.incomes).toBe("[]");
  });
});
