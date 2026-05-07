/**
 * Pure data-migration functions — no DB, no side effects, fully testable.
 * Used by scripts/migrate-data-cleanup.ts and tests.
 */

export function migrateIncome(
  i: Record<string, unknown>
): Record<string, unknown> {
  if ("amount" in i && !("planned" in i) && !("actual" in i)) return i; // already migrated
  const amount = (i.actual as number) ?? (i.planned as number) ?? 0;
  const {
    planned: _p,
    actual: _a,
    ...rest
  } = i as Record<string, unknown> & { planned?: unknown; actual?: unknown };
  return { ...rest, amount };
}

export function migrateExpense(
  e: Record<string, unknown>
): Record<string, unknown> {
  if (
    "amount" in e &&
    !("planned" in e) &&
    !("actual" in e) &&
    !("urgency" in e)
  )
    return e;
  // Prefer actual → planned → existing amount → 0
  const amount =
    "actual" in e
      ? (e.actual as number)
      : "planned" in e
        ? (e.planned as number)
        : "amount" in e
          ? (e.amount as number)
          : 0;
  const {
    planned: _p,
    actual: _a,
    urgency: _u,
    ...rest
  } = e as Record<string, unknown> & {
    planned?: unknown;
    actual?: unknown;
    urgency?: unknown;
  };
  return { ...rest, amount };
}

export function migrateBudgetLimit(
  bl: Record<string, unknown>
): Record<string, unknown> {
  let owner = bl.owner as string;
  if (owner === "Eşim") owner = "Esim";
  if (owner === "Ortak") owner = "Ev";
  return { ...bl, owner };
}

export interface RawBudgetJson {
  incomes: string;
  expenses: string;
  budgetLimits: string;
  [key: string]: string;
}

export interface MigrateResult {
  incomes: string;
  expenses: string;
  budgetLimits: string;
  changed: boolean;
}

export function migrateData(raw: RawBudgetJson): MigrateResult {
  const incomes = JSON.parse(raw.incomes || "[]").map(migrateIncome);
  const expenses = JSON.parse(raw.expenses || "[]").map(migrateExpense);
  const budgetLimits = JSON.parse(raw.budgetLimits || "[]").map(
    migrateBudgetLimit
  );

  const incomesStr = JSON.stringify(incomes);
  const expensesStr = JSON.stringify(expenses);
  const budgetLimitsStr = JSON.stringify(budgetLimits);

  const changed =
    incomesStr !== raw.incomes ||
    expensesStr !== raw.expenses ||
    budgetLimitsStr !== raw.budgetLimits;

  return {
    incomes: incomesStr,
    expenses: expensesStr,
    budgetLimits: budgetLimitsStr,
    changed,
  };
}
