import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { formatCurrency } from "@/lib/categories";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  TrendingUp,
  CreditCard,
  PiggyBank,
  BarChart3,
  Settings,
  LayoutDashboard,
  DollarSign,
} from "lucide-react";

const PAGES = [
  { labelKey: "nav.home", path: "/", icon: LayoutDashboard },
  { labelKey: "nav.income_expense", path: "/gelir-gider", icon: TrendingUp },
  { labelKey: "nav.debt_payment", path: "/borc-odemeler", icon: CreditCard },
  { labelKey: "nav.savings_goal", path: "/hedef", icon: PiggyBank },
  { labelKey: "nav.reports", path: "/raporlar", icon: BarChart3 },
  { labelKey: "nav.settings", path: "/ayarlar", icon: Settings },
];

export function GlobalSearch() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { budgetData } = useBudget();
  const { person1Name, person2Name } = usePerson();

  // Cmd+K / Ctrl+K klavye kısayolu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      setLocation(path);
      setOpen(false);
    },
    [setLocation]
  );

  // Aranabilir veri öğeleri
  const dataItems = useMemo(() => {
    const items: Array<{
      label: string;
      sub: string;
      path: string;
      amount?: number;
    }> = [];

    budgetData.incomes.forEach(i => {
      items.push({
        label: i.name,
        sub: `${t("components.global_search.result_prefix.income")} • ${i.owner === "Benim" ? person1Name : i.owner === "Esim" ? person2Name : t("filter.home")}`,
        path: "/gelir-gider",
        amount: i.amount,
      });
    });
    budgetData.expenses.forEach(e => {
      items.push({
        label: e.category,
        sub: `${t("components.global_search.result_prefix.expense")} • ${e.type}`,
        path: "/gelir-gider",
        amount: e.amount,
      });
    });
    budgetData.debts.forEach(d => {
      items.push({
        label: d.name,
        sub: `${t("components.global_search.result_prefix.debt")} • ${d.status}`,
        path: "/borc-odemeler",
        amount: d.totalDebt,
      });
    });
    budgetData.savingsGoals.forEach(g => {
      items.push({
        label: g.name,
        sub: t("components.global_search.result_prefix.goal"),
        path: "/hedef",
        amount: g.currentAmount,
      });
    });
    budgetData.annualPayments?.forEach(p => {
      items.push({
        label: p.name,
        sub: t("components.global_search.result_prefix.annual"),
        path: "/yillik-odemeler",
        amount: p.amount,
      });
    });
    budgetData.installments?.forEach(i => {
      items.push({
        label: i.name,
        sub: `${t("components.global_search.result_prefix.installment")} • ${t("components.global_search.months_count", { count: i.installmentCount })}`,
        path: "/taksitler",
        amount: i.monthlyAmount,
      });
    });

    return items;
  }, [budgetData, person1Name, person2Name, t]);

  return (
    <>
      {/* Arama tetikleyici buton - DashboardLayout'tan çağrılır */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("components.global_search.placeholder")} />
        <CommandList>
          <CommandEmpty>
            {t("components.global_search.no_results")}
          </CommandEmpty>

          <CommandGroup heading={t("components.global_search.pages_heading")}>
            {PAGES.map(page => (
              <CommandItem
                key={page.path}
                onSelect={() => navigate(page.path)}
                className="gap-2"
              >
                <page.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{t(page.labelKey)}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t("components.global_search.data_heading")}>
            {dataItems.slice(0, 20).map((item, idx) => (
              <CommandItem
                key={idx}
                onSelect={() => navigate(item.path)}
                className="gap-2"
              >
                <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {item.sub}
                  </span>
                </div>
                {item.amount !== undefined && (
                  <span className="text-xs font-mono text-muted-foreground shrink-0">
                    {formatCurrency(item.amount)}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Hook: GlobalSearch'ü dışarıdan açmak için
export function useGlobalSearch() {
  const open = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
    );
  };
  return { open };
}
