import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { usePersonFilter } from "@/contexts/PersonFilterContext";
import { Expense } from "@/hooks/useBudgetData";
import { EXPENSE_CATEGORIES, EXPENSE_TYPES, PAYMENT_STATUSES, formatCurrency } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Home, User, Users } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const categoryKeys = Object.keys(EXPENSE_CATEGORIES);
const firstCategory = categoryKeys[0];
const firstSubcategory = EXPENSE_CATEGORIES[firstCategory as keyof typeof EXPENSE_CATEGORIES].subcategories[0];

const DEFAULT_FORM: Omit<Expense, 'id'> = {
  category: firstCategory,
  subcategory: firstSubcategory,
  type: 'Degisken',
  amount: 0,
  paymentDay: '',
  status: 'Bekliyor',
  owner: 'Benim',
  notes: '',
};

export default function Expenses() {
  const { budgetData, addExpense, deleteExpense, updateExpense } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const { filter: globalFilter } = usePersonFilter();
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(firstCategory);
  const [formData, setFormData] = useState<Omit<Expense, 'id'>>(DEFAULT_FORM);
  const [ownerSelection, setOwnerSelection] = useState<'Ev' | 'Benim' | 'Esim'>(currentPerson ?? 'Benim');
  const [filter, setFilter] = useState<'all' | 'Ev' | 'Benim' | 'Esim'>(currentPerson ?? 'all');
  const effectiveFilter: 'all' | 'Ev' | 'Benim' | 'Esim' =
    globalFilter !== 'Tümü' ? globalFilter : filter;

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const subcats = EXPENSE_CATEGORIES[cat as keyof typeof EXPENSE_CATEGORIES].subcategories;
    setFormData(prev => ({ ...prev, category: cat, subcategory: subcats[0] }));
  };

  const handleOwnerChange = (val: 'Ev' | 'Benim' | 'Esim') => {
    setOwnerSelection(val);
    setFormData(prev => ({ ...prev, owner: val }));
  };

  const handleAddExpense = () => {
    if (formData.category && formData.amount >= 0) {
      addExpense({ ...formData, owner: ownerSelection });
      setFormData(DEFAULT_FORM);
      setSelectedCategory(firstCategory);
      setOwnerSelection('Benim');
      setOpen(false);
    }
  };

  const categoryData = EXPENSE_CATEGORIES[selectedCategory as keyof typeof EXPENSE_CATEGORIES];

  const totalAmount = budgetData.expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Odendi': return 'text-green-600';
      case 'Bekliyor': return 'text-yellow-600';
      case 'Gecikti': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getOwnerBadge = (owner: string) => {
    switch (owner) {
      case 'Ev': return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"><Home className="w-3 h-3" />Ortak</span>;
      case 'Benim': return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"><User className="w-3 h-3" />{person1Name}</span>;
      case 'Esim': return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"><Users className="w-3 h-3" />{person2Name}</span>;
      default: return <span className="text-xs text-muted-foreground">{owner}</span>;
    }
  };

  const displayedExpenses = effectiveFilter === 'all'
    ? budgetData.expenses
    : budgetData.expenses.filter(e => e.owner === effectiveFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Giderler</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tum harcamalarinizi kategorilere gore takip edin
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Gider Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Gider Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Kisi secimi */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Kisi</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: 'Ev', label: 'Ortak', icon: <Home className="w-3.5 h-3.5" />, activeClass: 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
                    { key: 'Benim', label: person1Name, icon: <User className="w-3.5 h-3.5" />, activeClass: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
                    { key: 'Esim', label: person2Name, icon: <Users className="w-3.5 h-3.5" />, activeClass: 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
                  ] as const).map(o => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => handleOwnerChange(o.key)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                        ownerSelection === o.key ? o.activeClass : 'border-border bg-background hover:bg-secondary'
                      }`}
                    >
                      {o.icon}
                      {o.label}
                    </button>
                  ))}
                </div>
                {ownerSelection === 'Ev' && (
                  <p className="text-xs text-muted-foreground mt-1.5">Ortak giderler her ikisine de %50 yansir</p>
                )}
              </div>

              {/* Kategori */}
              <div>
                <Label className="text-sm font-medium">Kategori</Label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryKeys.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Alt Kategori */}
              <div>
                <Label className="text-sm font-medium">Alt Kategori</Label>
                <Select value={formData.subcategory} onValueChange={v => setFormData(prev => ({ ...prev, subcategory: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryData?.subcategories.map((sub: string) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gider Tipi */}
              <div>
                <Label className="text-sm font-medium">
                  Gider Tipi
                  {formData.type === 'Sabit' && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (Sabit ise her ay otomatik gelir, Degisken tek seferlik)
                    </span>
                  )}
                </Label>
                <Select value={formData.type} onValueChange={v => setFormData(prev => ({ ...prev, type: v as Expense['type'] }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Miktar */}
              <div>
                <Label className="text-sm font-medium">Miktar (EUR)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.amount || ''}
                  onChange={e => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>

              {/* Odeme Durumu */}
              <div>
                <Label className="text-sm font-medium">Odeme Durumu</Label>
                <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v as Expense['status'] }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notlar */}
              <div>
                <Label className="text-sm font-medium">Notlar (Istege Bagli)</Label>
                <Input
                  placeholder="Aciklama..."
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <Button onClick={handleAddExpense} className="w-full">
                Gider Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ozet */}
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Toplam Gider</p>
        <p className="text-xl font-bold mt-1 text-red-600">{formatCurrency(totalAmount)}</p>
      </Card>

      {/* Filtre Sekmeleri */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all', label: 'Tümü', color: 'border-gray-400 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200' },
          { key: 'Benim', label: person1Name, color: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
          { key: 'Esim', label: person2Name, color: 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
          { key: 'Ev', label: 'Ortak', color: 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full border-2 text-sm font-medium transition-all ${
              effectiveFilter === tab.key ? tab.color : 'border-border bg-background text-muted-foreground hover:bg-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Gider Listesi */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary">
                <th className="px-4 py-3 text-left font-semibold">Kisi</th>
                <th className="px-4 py-3 text-left font-semibold">Kategori</th>
                <th className="px-4 py-3 text-right font-semibold">Miktar</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Durum</th>
                <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Tip</th>
                <th className="px-4 py-3 text-center font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {displayedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {effectiveFilter === 'all' ? 'Henuz gider eklenmemis. Yukardaki butona tiklayin.' : 'Bu filtre icin gider bulunamadi.'}
                  </td>
                </tr>
              ) : (
                displayedExpenses.map((expense: Expense) => (
                  <tr key={expense.id} className="border-b hover:bg-secondary/50">
                    <td className="px-4 py-3">{getOwnerBadge(expense.owner)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{expense.category}</div>
                      <div className="text-xs text-muted-foreground">{expense.subcategory}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-600">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className={`px-4 py-3 text-sm hidden md:table-cell font-medium ${getStatusColor(expense.status)}`}>
                      {expense.status}
                    </td>
                    <td className="px-4 py-3 text-xs hidden lg:table-cell text-muted-foreground">
                      {expense.type}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {expense.type === 'Sabit' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateExpense(expense.id, { type: 'Degisken' })}
                            title="Tek seferlik yap (Sabit → Değişken)"
                            className="h-8 px-2 text-xs text-amber-600 hover:text-amber-700"
                          >
                            Tek seferlik
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteExpense(expense.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
