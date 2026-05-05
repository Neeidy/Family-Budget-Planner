import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { usePersonFilter } from "@/contexts/PersonFilterContext";
import { formatCurrency } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, TrendingUp, User, Users } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Incomes() {
  const { budgetData, addIncome, deleteIncome } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const { filter: globalFilter } = usePersonFilter();
  const [open, setOpen] = useState(false);
  const defaultOwner: 'Benim' | 'Esim' = currentPerson ?? 'Benim';
  const [owner, setOwner] = useState<'Benim' | 'Esim'>(defaultOwner);
  const [filter, setFilter] = useState<'all' | 'Benim' | 'Esim'>(currentPerson ?? 'all');
  const [formData, setFormData] = useState({
    name: '',
    amount: 0,
    owner: defaultOwner as 'Benim' | 'Esim',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleOwnerChange = (val: 'Benim' | 'Esim') => {
    setOwner(val);
    setFormData(prev => ({ ...prev, owner: val }));
  };

  const handleAddIncome = () => {
    if (formData.name.trim() && formData.amount > 0) {
      addIncome({ ...formData, owner });
      setFormData({
        name: '',
        amount: 0,
        owner: defaultOwner,
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setOwner(defaultOwner);
      setOpen(false);
    }
  };

  const myIncome = budgetData.incomes
    .filter(i => i.owner === 'Benim')
    .reduce((sum, i) => sum + i.amount, 0);

  const spouseIncome = budgetData.incomes
    .filter(i => i.owner === 'Esim')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalAmount = myIncome + spouseIncome;

  const effectiveFilter: 'all' | 'Benim' | 'Esim' =
    globalFilter === 'Benim' ? 'Benim' :
    globalFilter === 'Esim' ? 'Esim' :
    filter;
  const filteredIncomes = effectiveFilter === 'all'
    ? budgetData.incomes
    : budgetData.incomes.filter(i => i.owner === effectiveFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Gelirler
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Maas ve diger gelir kaynaklarini yonetin
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Gelir Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Gelir Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Kisi</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOwnerChange('Benim')}
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                      owner === 'Benim'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'border-border bg-background hover:bg-secondary'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    {person1Name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOwnerChange('Esim')}
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                      owner === 'Esim'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'border-border bg-background hover:bg-secondary'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    {person2Name}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Gelir Adi</Label>
                <Input
                  placeholder="Ornek: Aylik Maas, Bonus, Freelance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Miktar (EUR)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Tarih</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Notlar (Istege Bagli)</Label>
                <Input
                  placeholder="Ornek: Aylik maas, vergi indirimi yapilmis"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleAddIncome}
                className="w-full"
                disabled={!formData.name.trim() || formData.amount <= 0}
              >
                Gelir Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ozet Kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-muted-foreground">{person1Name}'in Geliri</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(myIncome)}</p>
        </Card>
        <Card className="p-5 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-600" />
            <p className="text-sm text-muted-foreground">{person2Name}'in Geliri</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(spouseIncome)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <p className="text-sm text-muted-foreground">Toplam Gelir</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
        </Card>
      </div>

      {/* Filtre Sekmeleri */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all', label: 'Tümü', color: 'border-gray-400 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200' },
          { key: 'Benim', label: person1Name, color: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
          { key: 'Esim', label: person2Name, color: 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
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

      {/* Gelir Listesi */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary">
                <th className="px-4 py-3 text-left font-semibold">Kisi</th>
                <th className="px-4 py-3 text-left font-semibold">Gelir Adi</th>
                <th className="px-4 py-3 text-right font-semibold">Miktar</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Tarih</th>
                <th className="px-4 py-3 text-center font-semibold">Sil</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {effectiveFilter === 'all'
                      ? 'Henuz gelir eklenmemis. Yukardaki butona tiklayin.'
                      : `Bu filtre icin henuz gelir eklenmemis.`
                    }
                  </td>
                </tr>
              ) : (
                filteredIncomes
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((income) => (
                    <tr key={income.id} className="border-b hover:bg-secondary/50">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          income.owner === 'Benim'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        }`}>
                          {income.owner === 'Benim' ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {income.owner === 'Benim' ? person1Name : person2Name}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{income.name}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-green-600">
                        {formatCurrency(income.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell text-muted-foreground">
                        {new Date(income.date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteIncome(income.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
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
