import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { formatCurrency } from '@/lib/categories';
import { useLocation } from 'wouter';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  TrendingUp, TrendingDown, CreditCard, PiggyBank, CalendarDays,
  BarChart3, Target, Archive, Sliders, Settings, LayoutDashboard,
  ShoppingCart, DollarSign,
} from 'lucide-react';

const PAGES = [
  { label: 'Genel Bakış', path: '/', icon: LayoutDashboard },
  { label: 'Gelirler', path: '/gelir-gider', icon: TrendingUp },
  { label: 'Giderler', path: '/gelir-gider', icon: TrendingDown },
  { label: 'Borçlar', path: '/borclar', icon: CreditCard },
  { label: 'Birikim Hedefleri', path: '/birikim', icon: PiggyBank },
  { label: 'Yıllık Ödemeler', path: '/yillik-odemeler', icon: CalendarDays },
  { label: 'Analitik', path: '/analitik', icon: BarChart3 },
  { label: 'Bütçe Limitleri', path: '/butce-limitleri', icon: Sliders },
  { label: 'Hedef Planlama', path: '/hedef-planlama', icon: Target },
  { label: 'Ay Arşivi', path: '/ay-arsivi', icon: Archive },
  { label: 'Taksitler', path: '/taksitler', icon: ShoppingCart },
  { label: 'Ayarlar', path: '/ayarlar', icon: Settings },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { budgetData } = useBudget();

  // Cmd+K / Ctrl+K klavye kısayolu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = useCallback((path: string) => {
    setLocation(path);
    setOpen(false);
  }, [setLocation]);

  // Aranabilir veri öğeleri
  const dataItems = useMemo(() => {
    const items: Array<{ label: string; sub: string; path: string; amount?: number }> = [];

    budgetData.incomes.forEach(i => {
      items.push({ label: i.name, sub: `Gelir • ${i.owner === 'Benim' ? 'Yiğit' : i.owner === 'Esim' ? 'Arzu' : 'Ortak'}`, path: '/gelir-gider', amount: i.amount });
    });
    budgetData.expenses.forEach(e => {
      items.push({ label: e.category, sub: `Gider • ${e.type}`, path: '/gelir-gider', amount: e.amount });
    });
    budgetData.debts.forEach(d => {
      items.push({ label: d.name, sub: `Borç • ${d.status}`, path: '/borclar', amount: d.totalDebt });
    });
    budgetData.savingsGoals.forEach(g => {
      items.push({ label: g.name, sub: `Birikim Hedefi`, path: '/birikim', amount: g.currentAmount });
    });
    budgetData.annualPayments?.forEach(p => {
      items.push({ label: p.name, sub: `Yıllık Ödeme`, path: '/yillik-odemeler', amount: p.amount });
    });
    budgetData.installments?.forEach(i => {
      items.push({ label: i.name, sub: `Taksit • ${i.installmentCount} ay`, path: '/taksitler', amount: i.monthlyAmount });
    });

    return items;
  }, [budgetData]);

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
                  <span className="text-xs text-muted-foreground ml-2">{item.sub}</span>
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
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  };
  return { open };
}
