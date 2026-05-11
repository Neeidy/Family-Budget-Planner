import { useState, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";

export interface Income {
  id: string;
  name: string;
  amount: number;
  owner: "Benim" | "Esim";
  date: string;
  notes: string;
}

export interface Expense {
  id: string;
  category: string;
  subcategory: string;
  type: "Sabit" | "Degisken" | "Borc" | "Birikim";
  amount: number;
  paymentDay: string;
  status: "Odendi" | "Bekliyor" | "Gecikti";
  owner: "Ev" | "Benim" | "Esim";
  notes: string;
}

export interface Debt {
  id: string;
  name: string;
  totalDebt: number;
  monthlyPayment: number;
  dueDate: string;
  status: "Odendi" | "Bekliyor" | "Gecikti";
  owner: "Benim" | "Esim" | "Ev";
  notes: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyAllocation: number;
  targetDate: string;
  owner: "Benim" | "Esim" | "Ev";
  notes: string;
}

export interface AnnualPayment {
  id: string;
  name: string;
  amount: number;
  paymentMonth: number;
  paymentDay?: number; // 1-31, optional — falls back to 15 when null
  lastPaymentDate: string;
  notes: string;
  owner?: "Benim" | "Esim" | "Ev"; // optional, defaults to "Ev"
  category?: string; // optional, defaults to "Diger"
  subcategoryKey?: string; // optional, defaults to "Diger"
  customSubcategory?: string; // optional, set when subcategoryKey === "Diger"
}

export interface Installment {
  id: string;
  name: string;
  totalAmount: number;
  installmentCount: number;
  monthlyAmount: number;
  startYear: number;
  startMonth: number; // 1-12
  paymentDay?: number; // 1-31, optional — falls back to 1 when null
  owner: "Ev" | "Benim" | "Esim";
  notes: string;
}

export interface BudgetLimit {
  id: string;
  category: string;
  limit: number;
  owner: "Benim" | "Esim" | "Ev";
}

export interface BudgetData {
  month: string;
  year: number;
  incomes: Income[];
  expenses: Expense[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
  annualPayments: AnnualPayment[];
  budgetLimits: BudgetLimit[];
  installments: Installment[];
}

const DEFAULT_BUDGET: BudgetData = {
  month: new Date().toLocaleString("tr-TR", { month: "long" }),
  year: new Date().getFullYear(),
  incomes: [],
  expenses: [],
  debts: [],
  savingsGoals: [],
  annualPayments: [],
  budgetLimits: [],
  installments: [],
};

const STORAGE_KEY = "viyana_budget_planner";

export function useBudgetData() {
  const [budgetData, setBudgetData] = useState<BudgetData>(DEFAULT_BUDGET);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Veri migrasyonu: eski veriye annualPayments ekle
        if (!parsed.annualPayments) {
          parsed.annualPayments = [];
        }
        if (!parsed.installments) {
          parsed.installments = [];
        }
        setBudgetData(parsed);
      } catch (e) {
        console.error("Failed to parse budget data:", e);
        setBudgetData(DEFAULT_BUDGET);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(budgetData));
    }
  }, [budgetData, isLoaded]);

  // Income operations
  const addIncome = useCallback((income: Omit<Income, "id">) => {
    setBudgetData(prev => ({
      ...prev,
      incomes: [...prev.incomes, { ...income, id: Date.now().toString() }],
    }));
  }, []);

  const updateIncome = useCallback((id: string, income: Partial<Income>) => {
    setBudgetData(prev => ({
      ...prev,
      incomes: prev.incomes.map(i => (i.id === id ? { ...i, ...income } : i)),
    }));
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setBudgetData(prev => ({
      ...prev,
      incomes: prev.incomes.filter(i => i.id !== id),
    }));
  }, []);

  // Expense operations
  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    setBudgetData(prev => ({
      ...prev,
      expenses: [...prev.expenses, { ...expense, id: Date.now().toString() }],
    }));
  }, []);

  const updateExpense = useCallback((id: string, expense: Partial<Expense>) => {
    setBudgetData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e =>
        e.id === id ? { ...e, ...expense } : e
      ),
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setBudgetData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id),
    }));
  }, []);

  // Debt operations
  const addDebt = useCallback((debt: Omit<Debt, "id">) => {
    setBudgetData(prev => ({
      ...prev,
      debts: [...prev.debts, { ...debt, id: Date.now().toString() }],
    }));
  }, []);

  const updateDebt = useCallback((id: string, debt: Partial<Debt>) => {
    setBudgetData(prev => ({
      ...prev,
      debts: prev.debts.map(d => (d.id === id ? { ...d, ...debt } : d)),
    }));
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setBudgetData(prev => ({
      ...prev,
      debts: prev.debts.filter(d => d.id !== id),
    }));
  }, []);

  // Savings goals operations
  const addSavingsGoal = useCallback((goal: Omit<SavingsGoal, "id">) => {
    setBudgetData(prev => ({
      ...prev,
      savingsGoals: [
        ...prev.savingsGoals,
        { ...goal, id: Date.now().toString() },
      ],
    }));
  }, []);

  const updateSavingsGoal = useCallback(
    (id: string, goal: Partial<SavingsGoal>) => {
      setBudgetData(prev => ({
        ...prev,
        savingsGoals: prev.savingsGoals.map(g =>
          g.id === id ? { ...g, ...goal } : g
        ),
      }));
    },
    []
  );

  const deleteSavingsGoal = useCallback((id: string) => {
    setBudgetData(prev => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter(g => g.id !== id),
    }));
  }, []);

  const addAnnualPayment = useCallback((payment: Omit<AnnualPayment, "id">) => {
    setBudgetData(prev => ({
      ...prev,
      annualPayments: [
        ...prev.annualPayments,
        { ...payment, id: Date.now().toString() },
      ],
    }));
  }, []);

  const updateAnnualPayment = useCallback(
    (id: string, payment: Partial<AnnualPayment>) => {
      setBudgetData(prev => ({
        ...prev,
        annualPayments: prev.annualPayments.map(p =>
          p.id === id ? { ...p, ...payment } : p
        ),
      }));
    },
    []
  );

  const deleteAnnualPayment = useCallback((id: string) => {
    setBudgetData(prev => ({
      ...prev,
      annualPayments: prev.annualPayments.filter(p => p.id !== id),
    }));
  }, []);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    // Yıllık ödemeleri hesapla
    const currentMonth = new Date().getMonth() + 1;
    const annualPaymentsThisMonth = (budgetData.annualPayments || [])
      .filter(p => p.paymentMonth === currentMonth)
      .reduce((sum, p) => sum + p.amount, 0);

    // Kişi bazlı gelir
    const myIncome = budgetData.incomes
      .filter(i => i.owner === "Benim")
      .reduce((sum, i) => sum + i.amount, 0);

    const spouseIncome = budgetData.incomes
      .filter(i => i.owner === "Esim")
      .reduce((sum, i) => sum + i.amount, 0);

    const totalActualIncome = myIncome + spouseIncome;

    // Aktif taksitler (bu ay vade içinde olanlar)
    const isInstallmentActiveThisMonth = (inst: Installment) => {
      const now = new Date();
      const monthsElapsed =
        (now.getFullYear() - inst.startYear) * 12 +
        (now.getMonth() + 1 - inst.startMonth);
      return monthsElapsed >= 0 && monthsElapsed < inst.installmentCount;
    };

    const myInstallments = (budgetData.installments || [])
      .filter(i => i.owner === "Benim" && isInstallmentActiveThisMonth(i))
      .reduce((s, i) => s + i.monthlyAmount, 0);
    const spouseInstallments = (budgetData.installments || [])
      .filter(i => i.owner === "Esim" && isInstallmentActiveThisMonth(i))
      .reduce((s, i) => s + i.monthlyAmount, 0);
    const homeInstallments = (budgetData.installments || [])
      .filter(i => i.owner === "Ev" && isInstallmentActiveThisMonth(i))
      .reduce((s, i) => s + i.monthlyAmount, 0);

    const totalActiveInstallments =
      myInstallments + spouseInstallments + homeInstallments;

    // Ev giderlerini hesapla (direct expenses + ev taksitleri + bu ay yıllık)
    const homeExpensesDirect = budgetData.expenses
      .filter(e => e.owner === "Ev")
      .reduce((sum, e) => sum + e.amount, 0);
    const homeExpenses =
      homeExpensesDirect + homeInstallments + annualPaymentsThisMonth;

    // "Own" totals: o kişinin doğrudan owner=Benim/Esim giderleri
    // + kendi aktif taksitleri (ev payı dahil değil).
    const myExpensesOwn =
      budgetData.expenses
        .filter(e => e.owner === "Benim")
        .reduce((sum, e) => sum + e.amount, 0) + myInstallments;

    const spouseExpensesOwn =
      budgetData.expenses
        .filter(e => e.owner === "Esim")
        .reduce((sum, e) => sum + e.amount, 0) + spouseInstallments;

    // Her birinin ev payı katkısı (ortak giderlerin yarısı).
    const myHomeShare = homeExpenses / 2;
    const spouseHomeShare = homeExpenses / 2;

    // Geriye uyumlu: eski myExpenses/spouseExpenses field'ları
    // "own + ev payı" toplamını taşımaya devam eder. Yeni UI
    // myExpensesOwn + myHomeShare ayrımını kullanır.
    const myExpenses = myExpensesOwn + myHomeShare;
    const spouseExpenses = spouseExpensesOwn + spouseHomeShare;

    const totalActualExpense =
      budgetData.expenses.reduce((sum, e) => sum + e.amount, 0) +
      annualPaymentsThisMonth +
      totalActiveInstallments;

    const fixedExpenses = budgetData.expenses
      .filter(e => e.type === "Sabit")
      .reduce((sum, e) => sum + e.amount, 0);

    const variableExpenses = budgetData.expenses
      .filter(e => e.type === "Degisken")
      .reduce((sum, e) => sum + e.amount, 0);

    const debtPayments = budgetData.expenses
      .filter(e => e.type === "Borc")
      .reduce((sum, e) => sum + e.amount, 0);

    const savingsAmount = budgetData.expenses
      .filter(e => e.type === "Birikim")
      .reduce((sum, e) => sum + e.amount, 0);

    const remainingActual = totalActualIncome - totalActualExpense;

    const savingsRate =
      totalActualIncome > 0 ? savingsAmount / totalActualIncome : 0;
    const expenseRatio =
      totalActualIncome > 0 ? totalActualExpense / totalActualIncome : 0;

    return {
      totalPlannedIncome: totalActualIncome,
      totalActualIncome,
      totalPlannedExpense: totalActualExpense,
      totalActualExpense,
      fixedExpenses,
      variableExpenses,
      debtPayments,
      savingsAmount,
      remainingPlanned: remainingActual,
      remainingActual,
      savingsRate,
      expenseRatio,
      homeExpenses,
      myExpenses,
      spouseExpenses,
      myExpensesOwn,
      spouseExpensesOwn,
      myHomeShare,
      spouseHomeShare,
    };
  }, [budgetData]);

  // Get category summary
  const getCategorySummary = useCallback(() => {
    const categories = new Map<string, { amount: number }>();

    budgetData.expenses.forEach(expense => {
      const existing = categories.get(expense.category) || { amount: 0 };
      categories.set(expense.category, {
        amount: existing.amount + expense.amount,
      });
    });

    return Array.from(categories.entries()).map(([name, { amount }]) => ({
      name,
      planned: amount,
      actual: amount,
      difference: 0,
    }));
  }, [budgetData]);

  // Installment operations
  const addInstallment = useCallback((installment: Omit<Installment, "id">) => {
    setBudgetData(prev => ({
      ...prev,
      installments: [
        ...(prev.installments || []),
        { ...installment, id: Date.now().toString() },
      ],
    }));
  }, []);

  const updateInstallment = useCallback(
    (id: string, installment: Partial<Installment>) => {
      setBudgetData(prev => ({
        ...prev,
        installments: (prev.installments || []).map(i =>
          i.id === id ? { ...i, ...installment } : i
        ),
      }));
    },
    []
  );

  const deleteInstallment = useCallback((id: string) => {
    setBudgetData(prev => ({
      ...prev,
      installments: (prev.installments || []).filter(i => i.id !== id),
    }));
  }, []);

  const addBudgetLimit = useCallback((limit: Omit<BudgetLimit, "id">) => {
    const newLimit: BudgetLimit = {
      ...limit,
      id: nanoid(),
    };
    setBudgetData(prev => ({
      ...prev,
      budgetLimits: [...prev.budgetLimits, newLimit],
    }));
  }, []);

  const updateBudgetLimit = useCallback(
    (id: string, limit: Partial<BudgetLimit>) => {
      setBudgetData(prev => ({
        ...prev,
        budgetLimits: prev.budgetLimits.map(l =>
          l.id === id ? { ...l, ...limit } : l
        ),
      }));
    },
    []
  );

  const deleteBudgetLimit = useCallback((id: string) => {
    setBudgetData(prev => ({
      ...prev,
      budgetLimits: prev.budgetLimits.filter(l => l.id !== id),
    }));
  }, []);

  return {
    budgetData,
    setBudgetData,
    isLoaded,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addDebt,
    updateDebt,
    deleteDebt,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addAnnualPayment,
    updateAnnualPayment,
    deleteAnnualPayment,
    addBudgetLimit,
    updateBudgetLimit,
    deleteBudgetLimit,
    addInstallment,
    updateInstallment,
    deleteInstallment,
    calculateTotals,
    getCategorySummary,
  };
}
