import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  parseStoredMonth,
  shouldRollover,
  computeRollover,
  type BudgetState,
} from "@shared/rolloverLogic";

export function useMonthRollover() {
  const hasRun = useRef(false);
  const utils = trpc.useUtils();

  const { data: cloudData } = trpc.familyBudget.get.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const saveMutation = trpc.familyBudget.save.useMutation({
    onSuccess: () => {
      utils.familyBudget.get.invalidate();
    },
  });

  useEffect(() => {
    if (!cloudData || hasRun.current) return;
    hasRun.current = true;

    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth() + 1;

    // Read month/year from localStorage (not in the cloud record)
    const localRaw = localStorage.getItem("viyana_budget_planner");
    if (!localRaw) return;

    let localData: { month?: string; year?: number } = {};
    try {
      localData = JSON.parse(localRaw);
    } catch {
      return;
    }

    const storedYear = localData.year;
    const storedMonthName = localData.month;
    if (!storedYear || !storedMonthName) return;

    const storedMonth = parseStoredMonth(storedMonthName);
    if (storedMonth === 0) return;

    if (!shouldRollover(storedYear, storedMonth, todayYear, todayMonth)) return;

    // Parse cloud state
    let state: BudgetState;
    try {
      state = {
        incomes: JSON.parse(cloudData.incomes || "[]"),
        expenses: JSON.parse(cloudData.expenses || "[]"),
        debts: JSON.parse(cloudData.debts || "[]"),
        savingsGoals: JSON.parse(cloudData.savingsGoals || "[]"),
        annualPayments: JSON.parse(cloudData.annualPayments || "[]"),
        budgetLimits: JSON.parse(cloudData.budgetLimits || "[]"),
        installments: JSON.parse((cloudData as any).installments || "[]"),
      };
    } catch {
      return;
    }

    const next = computeRollover(state, nanoid);

    const newData = {
      incomes: JSON.stringify(next.incomes),
      expenses: JSON.stringify(next.expenses),
      debts: JSON.stringify(next.debts),
      annualPayments: JSON.stringify(next.annualPayments),
      budgetLimits: JSON.stringify(next.budgetLimits),
      savingsGoals: JSON.stringify(next.savingsGoals),
      installments: JSON.stringify(next.installments),
      expectedUpdatedAt: cloudData.updatedAt
        ? new Date(cloudData.updatedAt).toISOString()
        : null,
    };

    const MONTH_NAMES_TR = [
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ];

    saveMutation
      .mutateAsync(newData)
      .then(() => {
        try {
          const local = JSON.parse(
            localStorage.getItem("viyana_budget_planner") || "{}"
          );
          local.year = todayYear;
          local.month = MONTH_NAMES_TR[todayMonth - 1];
          local.incomes = next.incomes;
          local.expenses = next.expenses;
          localStorage.setItem("viyana_budget_planner", JSON.stringify(local));
        } catch {}

        toast.success(
          `Yeni ay açıldı — ${next.expenses.length} sabit gider otomatik eklendi.`,
          { duration: 5000 }
        );
      })
      .catch((e: unknown) => {
        if ((e as any)?.data?.code === "CONFLICT") {
          utils.familyBudget.get.invalidate();
        }
      });
  }, [cloudData]);
}
