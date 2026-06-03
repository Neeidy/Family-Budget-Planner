import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import {
  useBudgetData,
  BudgetData,
  Income,
  Expense,
  Debt,
  SavingsGoal,
  AnnualPayment,
  BudgetLimit,
  Installment,
} from "@/hooks/useBudgetData";
import { useCloudSync } from "@/hooks/useCloudSync";
import {
  useMonthlyArchive,
  useUndoStack,
  ArchivedMonth,
} from "@/hooks/useMonthlyArchive";
import { isDemoMode } from "@/lib/demoMode";
import type { Locale } from "@/lib/locale";
import { DEMO_TRANSLATIONS } from "@shared/demoTranslations";
import { toast } from "sonner";

/**
 * Demo-only locale overlay. Replaces an item's display label (`name`, or
 * `subcategory` for expenses) and `notes` with the translation registered
 * for its `id`. Untranslated fields and untranslated ids fall through
 * unchanged. READ path only — never used on writes (demo writes are
 * FORBIDDEN server-side).
 */
function applyOverlay<
  T extends { id: string; name?: string; notes?: string; subcategory?: string },
>(item: T, locale: Locale): T {
  const tr = DEMO_TRANSLATIONS[item.id];
  if (!tr) return item;
  const next: T = { ...item };
  if (tr.name) next.name = tr.name[locale];
  if (tr.notes) next.notes = tr.notes[locale];
  if (tr.subcategory) next.subcategory = tr.subcategory[locale];
  return next;
}

// BudgetContext tipi
interface BudgetContextType {
  budgetData: BudgetData;
  setBudgetData: (data: BudgetData) => void;
  isLoaded: boolean;
  isSaving: boolean;
  // CRUD operations
  addIncome: (income: Omit<Income, "id">) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addDebt: (debt: Omit<Debt, "id">) => void;
  updateDebt: (id: string, debt: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, "id">) => void;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  addAnnualPayment: (payment: Omit<AnnualPayment, "id">) => void;
  updateAnnualPayment: (id: string, payment: Partial<AnnualPayment>) => void;
  deleteAnnualPayment: (id: string) => void;
  addBudgetLimit: (limit: Omit<BudgetLimit, "id">) => void;
  updateBudgetLimit: (id: string, limit: Partial<BudgetLimit>) => void;
  deleteBudgetLimit: (id: string) => void;
  addInstallment: (installment: Omit<Installment, "id">) => void;
  updateInstallment: (id: string, installment: Partial<Installment>) => void;
  deleteInstallment: (id: string) => void;
  calculateTotals: () => ReturnType<
    ReturnType<typeof useBudgetData>["calculateTotals"]
  >;
  getCategorySummary: () => ReturnType<
    ReturnType<typeof useBudgetData>["getCategorySummary"]
  >;
  // Undo
  undo: () => void;
  canUndo: boolean;
  undoDescription: string | null;
  // Archive
  archive: ArchivedMonth[];
  saveCurrentMonthToArchive: () => void;
  getArchivedMonth: (year: number, month: number) => ArchivedMonth | null;
  // Backup
  exportData: () => void;
  importData: (jsonString: string) => boolean;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const budgetHook = useBudgetData();
  const { archive, saveToArchive, getMonthData } = useMonthlyArchive();
  const { stack: undoStack, pushUndo, popUndo } = useUndoStack();

  // Cloud sync
  const { isSaving } = useCloudSync({
    budgetData: budgetHook.budgetData,
    setBudgetData: budgetHook.setBudgetData,
    isLoaded: budgetHook.isLoaded,
  });

  // ─── Demo locale overlay (READ path only) ─────────────────────────────────
  // On demo.aileplan.uk, translate item display names/notes to the active UI
  // locale. butce (production) is never in demo mode → raw data passes through
  // untouched. Write paths keep using budgetHook.* (raw), so persistence and
  // undo snapshots never see overlaid labels.
  const { t, i18n } = useTranslation();
  const localizedBudgetData = useMemo<BudgetData>(() => {
    const raw = budgetHook.budgetData;
    if (!isDemoMode()) return raw;
    const locale = (i18n.language.split("-")[0] as Locale) || "tr";
    return {
      ...raw,
      incomes: raw.incomes.map(i => applyOverlay(i, locale)),
      expenses: raw.expenses.map(e => applyOverlay(e, locale)),
      debts: raw.debts.map(d => applyOverlay(d, locale)),
      installments: raw.installments.map(t => applyOverlay(t, locale)),
      annualPayments: raw.annualPayments.map(a => applyOverlay(a, locale)),
      savingsGoals: raw.savingsGoals.map(s => applyOverlay(s, locale)),
      // budgetLimits: category-only (no free-text label) → untouched
    };
  }, [budgetHook.budgetData, i18n.language]);

  // ─── Undo-aware wrappers ──────────────────────────────────────────────────

  const withUndo = useCallback(
    <T extends unknown[]>(description: string, fn: (...args: T) => void) =>
      (...args: T) => {
        pushUndo(description, budgetHook.budgetData);
        fn(...args);
      },
    [budgetHook.budgetData, pushUndo]
  );

  const undo = useCallback(() => {
    const entry = popUndo();
    if (entry) {
      budgetHook.setBudgetData(entry.snapshot);
      toast.success(t("toast.undo_done", { name: entry.description }));
    }
  }, [popUndo, budgetHook, t]);

  // ─── Archive ──────────────────────────────────────────────────────────────

  const saveCurrentMonthToArchive = useCallback(() => {
    const now = new Date();
    const year = budgetHook.budgetData.year || now.getFullYear();
    const monthIndex = now.getMonth() + 1;
    saveToArchive(budgetHook.budgetData, year, monthIndex);
    toast.success(t("toast.month_archived"));
  }, [budgetHook.budgetData, saveToArchive, t]);

  // ─── Backup / Restore ─────────────────────────────────────────────────────

  const exportData = useCallback(() => {
    const exportObj = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      currentData: budgetHook.budgetData,
      archive,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `viyana-butce-yedek-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("toast.data_downloaded"));
  }, [budgetHook.budgetData, archive, t]);

  const importData = useCallback(
    (jsonString: string): boolean => {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.currentData) {
          pushUndo("Veri içe aktarıldı", budgetHook.budgetData);
          budgetHook.setBudgetData(parsed.currentData);
          toast.success(t("toast.data_imported"));
          return true;
        }
        toast.error(t("toast.invalid_backup"));
        return false;
      } catch {
        toast.error(t("toast.file_read_error"));
        return false;
      }
    },
    [budgetHook, pushUndo, t]
  );

  const value: BudgetContextType = {
    ...budgetHook,
    budgetData: localizedBudgetData,
    isSaving,
    // Undo-wrapped delete operations (most common accidental actions)
    deleteIncome: withUndo("Gelir silindi", budgetHook.deleteIncome),
    deleteExpense: withUndo("Gider silindi", budgetHook.deleteExpense),
    deleteDebt: withUndo("Borç silindi", budgetHook.deleteDebt),
    deleteSavingsGoal: withUndo(
      "Birikim hedefi silindi",
      budgetHook.deleteSavingsGoal
    ),
    deleteAnnualPayment: withUndo(
      "Yıllık ödeme silindi",
      budgetHook.deleteAnnualPayment
    ),
    deleteInstallment: withUndo("Taksit silindi", budgetHook.deleteInstallment),
    deleteBudgetLimit: withUndo(
      "Bütçe limiti silindi",
      budgetHook.deleteBudgetLimit
    ),
    // Undo
    undo,
    canUndo: undoStack.length > 0,
    undoDescription: undoStack[0]?.description ?? null,
    // Archive
    archive,
    saveCurrentMonthToArchive,
    getArchivedMonth: getMonthData,
    // Backup
    exportData,
    importData,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) {
    throw new Error("useBudget must be used within BudgetProvider");
  }
  return ctx;
}
