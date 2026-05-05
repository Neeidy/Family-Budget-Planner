import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

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

    let stored: Record<string, unknown>;
    try {
      stored = {
        incomes: JSON.parse(cloudData.incomes || '[]'),
        expenses: JSON.parse(cloudData.expenses || '[]'),
        debts: JSON.parse(cloudData.debts || '[]'),
        savingsGoals: JSON.parse(cloudData.savingsGoals || '[]'),
        annualPayments: JSON.parse(cloudData.annualPayments || '[]'),
        budgetLimits: JSON.parse(cloudData.budgetLimits || '[]'),
        installments: JSON.parse((cloudData as any).installments || '[]'),
      };
    } catch {
      return;
    }

    // Find stored month/year from the data itself (there's no month/year field in familyBudget,
    // but we can try to detect it from the BudgetContext's local state).
    // We rely on localStorage for the month/year since it's not in the cloud record.
    const localRaw = localStorage.getItem('viyana_budget_planner');
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

    // Parse stored month name to number
    const MONTH_NAMES = [
      'ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran',
      'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık',
    ];
    const storedMonth = MONTH_NAMES.indexOf(storedMonthName.toLowerCase()) + 1;
    if (storedMonth === 0) return;

    const storedTotal = storedYear * 12 + storedMonth;
    const todayTotal = todayYear * 12 + todayMonth;

    if (todayTotal <= storedTotal) return; // no rollover needed

    // Rollover needed — keep only Sabit expenses, clear incomes
    const sabitExpenses = (stored.expenses as any[])
      .filter((e: any) => e.type === 'Sabit')
      .map((e: any) => ({ ...e, id: nanoid(), status: 'Bekliyor' }));

    const newData = {
      incomes: JSON.stringify([]),
      expenses: JSON.stringify(sabitExpenses),
      debts: JSON.stringify(stored.debts),
      annualPayments: JSON.stringify(stored.annualPayments),
      budgetLimits: JSON.stringify(stored.budgetLimits),
      savingsGoals: JSON.stringify(stored.savingsGoals),
      installments: JSON.stringify(stored.installments),
      expectedUpdatedAt: cloudData.updatedAt
        ? new Date(cloudData.updatedAt).toISOString()
        : null,
    };

    saveMutation.mutateAsync(newData).then(() => {
      // Update localStorage month/year
      try {
        const local = JSON.parse(localStorage.getItem('viyana_budget_planner') || '{}');
        const MONTH_NAMES_TR = [
          'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
          'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
        ];
        local.year = todayYear;
        local.month = MONTH_NAMES_TR[todayMonth - 1];
        local.incomes = [];
        local.expenses = sabitExpenses;
        localStorage.setItem('viyana_budget_planner', JSON.stringify(local));
      } catch {}

      toast.success(
        `Yeni ay açıldı — ${sabitExpenses.length} sabit gider otomatik eklendi.`,
        { duration: 5000 }
      );
    }).catch((e: unknown) => {
      if ((e as any)?.data?.code === 'CONFLICT') {
        // Another device already rolled over — just refetch
        utils.familyBudget.get.invalidate();
      }
    });
  }, [cloudData]);
}
