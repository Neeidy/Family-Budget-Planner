import { createContext, useContext, ReactNode, useCallback } from "react";
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
import { toast } from "sonner";

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
      toast.success(`Geri alındı: ${entry.description}`);
    }
  }, [popUndo, budgetHook]);

  // ─── Archive ──────────────────────────────────────────────────────────────

  const saveCurrentMonthToArchive = useCallback(() => {
    const now = new Date();
    const year = budgetHook.budgetData.year || now.getFullYear();
    const monthIndex = now.getMonth() + 1;
    saveToArchive(budgetHook.budgetData, year, monthIndex);
    toast.success("Bu ay arşive kaydedildi");
  }, [budgetHook.budgetData, saveToArchive]);

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
    toast.success("Veriler indirildi");
  }, [budgetHook.budgetData, archive]);

  const importData = useCallback(
    (jsonString: string): boolean => {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.currentData) {
          pushUndo("Veri içe aktarıldı", budgetHook.budgetData);
          budgetHook.setBudgetData(parsed.currentData);
          toast.success("Veriler başarıyla yüklendi");
          return true;
        }
        toast.error("Geçersiz yedek dosyası");
        return false;
      } catch {
        toast.error("Dosya okunamadı");
        return false;
      }
    },
    [budgetHook, pushUndo]
  );

  const value: BudgetContextType = {
    ...budgetHook,
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
