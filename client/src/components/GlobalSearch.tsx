import { useState, useEffect, useCallback, useMemo } from "react";
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
  { label: "Ana Sayfa", path: "/", icon: LayoutDashboard },
  { label: "Gelir & Gider", path: "/gelir-gider", icon: TrendingUp },
  { label: "Borç & Ödemeler", path: "/borc-odemeler", icon: CreditCard },
  { label: "Birikim & Hedef", path: "/hedef", icon: PiggyBank },
  { label: "Raporlar", path: "/raporlar", icon: BarChart3 },
  { label: "Ayarlar", path: "/ayarlar", icon: Settings },
];

export function GlobalSearch() {
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
        sub: `Gelir • ${i.owner === "Benim" ? person1Name : i.owner === "Esim" ? person2Name : "Ev"}`,
        path: "/gelir-gider",
        amount: i.amount,
      });
    });
    budgetData.expenses.forEach(e => {
      items.push({
        label: e.category,
        sub: `Gider • ${e.type}`,
        path: "/gelir-gider",
        amount: e.amount,
      });
    });
    budgetData.debts.forEach(d => {
      items.push({
        label: d.name,
        sub: `Borç • ${d.status}`,
        path: "/borc-odemeler",
        amount: d.totalDebt,
      });
    });
    budgetData.savingsGoals.forEach(g => {
      items.push({
        label: g.name,
        sub: `Birikim Hedefi`,
        path: "/hedef",
        amount: g.currentAmount,
      });
    });
    budgetData.annualPayments?.forEach(p => {
      items.push({
        label: p.name,
        sub: `Yıllık Ödeme`,
        path: "/yillik-odemeler",
        amount: p.amount,
      });
    });
    budgetData.installments?.forEach(i => {
      items.push({
        label: i.name,
        sub: `Taksit • ${i.installmentCount} ay`,
        path: "/taksitler",
        amount: i.monthlyAmount,
      });
    });

    return items;
  }, [budgetData, person1Name, person2Name]);

  return (
    <>
      {/* Arama tetikleyici buton - DashboardLayout'tan çağrılır */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Sayfa veya veri ara... (Ctrl+K)" />
        <CommandList>
          <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>

          <CommandGroup heading="Sayfalar">
            {PAGES.map(page => (
              <CommandItem
                key={page.path}
                onSelect={() => navigate(page.path)}
                className="gap-2"
              >
                <page.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{page.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Veriler">
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
