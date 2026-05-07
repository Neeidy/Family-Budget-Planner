import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

interface BudgetState {
  incomes: string;
  expenses: string;
  debts: string;
  annualPayments: string;
  budgetLimits: string;
  savingsGoals: string;
}

export function useAutoSync(budgetState: BudgetState | null) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "success" | "error"
  >("idle");
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // familyBudget API kullan - giriş gerektirmez
  const saveBudgetMutation = trpc.familyBudget.save.useMutation();

  useEffect(() => {
    if (!budgetState) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        setSyncStatus("syncing");

        await saveBudgetMutation.mutateAsync({
          incomes: budgetState.incomes || "[]",
          expenses: budgetState.expenses || "[]",
          debts: budgetState.debts || "[]",
          annualPayments: budgetState.annualPayments || "[]",
          budgetLimits: budgetState.budgetLimits || "[]",
          savingsGoals: budgetState.savingsGoals || "[]",
          expectedUpdatedAt: null,
        });

        setLastSync(new Date());
        setSyncStatus("success");
        setTimeout(() => setSyncStatus("idle"), 2000);
      } catch (error) {
        console.error("Auto sync error:", error);
        setSyncStatus("error");
        setTimeout(() => setSyncStatus("idle"), 3000);
      } finally {
        setIsSyncing(false);
      }
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [budgetState]);

  return {
    isSyncing,
    lastSync,
    syncStatus,
  };
}
