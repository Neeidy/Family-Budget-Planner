/**
 * Pure rollover logic — no React, no browser APIs, fully testable.
 * Used by useMonthRollover hook (client) and tests (server).
 */

export const STORED_MONTH_NAMES = [
  'ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran',
  'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık',
];

/**
 * Parse a Turkish month name (case-insensitive) → 1-12, or 0 if unrecognised.
 */
export function parseStoredMonth(monthName: string): number {
  // Use tr locale so uppercase Turkish I (U+0049) → ı (U+0131) correctly
  const lower = monthName.toLocaleLowerCase('tr-TR');
  const idx = STORED_MONTH_NAMES.indexOf(lower);
  return idx + 1; // -1 + 1 = 0 when not found
}

/**
 * Returns true when today is strictly after the stored month.
 */
export function shouldRollover(
  storedYear: number,
  storedMonth: number,
  todayYear: number,
  todayMonth: number,
): boolean {
  return todayYear * 12 + todayMonth > storedYear * 12 + storedMonth;
}

export interface RolloverExpense {
  id: string;
  type: string;
  status: string;
  [key: string]: unknown;
}

export interface BudgetState {
  incomes: unknown[];
  expenses: RolloverExpense[];
  debts: unknown[];
  savingsGoals: unknown[];
  annualPayments: unknown[];
  budgetLimits: unknown[];
  installments: unknown[];
}

/**
 * Build the next month's budget state from the current one.
 *
 * Rules:
 *   - incomes → []
 *   - expenses: keep only type='Sabit', assign new id, set status='Bekliyor'
 *   - debts / savingsGoals / annualPayments / budgetLimits / installments: preserved as-is
 *
 * @param state      Current budget state (arrays, already parsed from JSON)
 * @param newIdFn    Injectable ID generator (defaults to a simple uuid-lite)
 */
export function computeRollover(
  state: BudgetState,
  newIdFn: () => string = defaultId,
): BudgetState {
  const sabitExpenses = state.expenses
    .filter(e => e.type === 'Sabit')
    .map(e => ({ ...e, id: newIdFn(), status: 'Bekliyor' }));

  return {
    incomes: [],
    expenses: sabitExpenses,
    debts: state.debts,
    savingsGoals: state.savingsGoals,
    annualPayments: state.annualPayments,
    budgetLimits: state.budgetLimits,
    installments: state.installments,
  };
}

function defaultId(): string {
  // Minimal random ID for environments without nanoid (tests, SSR)
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
