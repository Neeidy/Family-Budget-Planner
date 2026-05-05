import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { usePersonFilter } from "@/contexts/PersonFilterContext";
import { Debt } from "@/hooks/useBudgetData";
import { PAYMENT_STATUSES, formatCurrency } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Debts() {
  const { budgetData, addDebt, deleteDebt } = useBudget();
  const { currentPerson, person1Name, person2Name } = usePerson();
  const { filter: globalFilter } = usePersonFilter();
  const [open, setOpen] = useState(false);
  const [filterOwner, setFilterOwner] = useState<'Benim' | 'Esim' | 'Ev' | 'Tumu'>(() => {
    if (currentPerson === 'Benim') return 'Benim';
    if (currentPerson === 'Esim') return 'Esim';
    return 'Tumu';
  });

  const [formData, setFormData] = useState<Omit<Debt, 'id'>>({
    name: '',
    totalDebt: 0,
    monthlyPayment: 0,
    dueDate: '',
    status: 'Bekliyor',
    owner: currentPerson === 'Benim' ? 'Benim' : currentPerson === 'Esim' ? 'Esim' : 'Ev',
    notes: '',
  });

  const getOwnerLabel = (owner: string) => {
    if (owner === 'Benim') return person1Name;
    if (owner === 'Esim') return person2Name;
    return 'Ortak';
  };

  const getOwnerColor = (owner: string) => {
    if (owner === 'Benim') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    if (owner === 'Esim') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  const handleAddDebt = () => {
    if (formData.name.trim()) {
      addDebt(formData);
      setFormData({
        name: '',
        totalDebt: 0,
        monthlyPayment: 0,
        dueDate: '',
        status: 'Bekliyor',
        owner: currentPerson === 'Benim' ? 'Benim' : currentPerson === 'Esim' ? 'Esim' : 'Ev',
        notes: '',
      });
      setOpen(false);
    }
  };

  const effectiveOwner: 'Benim' | 'Esim' | 'Ev' | 'Tumu' =
    globalFilter !== 'Tümü' ? globalFilter : filterOwner;
  const filteredDebts = effectiveOwner === 'Tumu'
    ? budgetData.debts
    : budgetData.debts.filter(d => d.owner === effectiveOwner || (!d.owner && effectiveOwner === 'Ev'));

  const totalDebt = filteredDebts.reduce((sum, d) => sum + d.totalDebt, 0);
  const totalMonthly = filteredDebts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const remainingDebt = filteredDebts.reduce((sum, d) => sum + (d.totalDebt - d.monthlyPayment), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Odendi': return 'text-green-600';
      case 'Bekliyor': return 'text-yellow-600';
      case 'Gecikti': return 'text-red-600';
      default: return '';
    }
  };

  const filterTabs: { label: string; value: 'Benim' | 'Esim' | 'Ev' | 'Tumu' }[] = [
    { label: person1Name, value: 'Benim' },
    { label: person2Name, value: 'Esim' },
    { label: 'Ortak', value: 'Ev' },
    { label: 'Tümü', value: 'Tumu' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Borçlar</h1>
          <p className="text-muted-foreground mt-1">
            Borçlarınızı ve ödeme yükümlülüklerinizi takip edin
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Borç Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Borç Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Borç Adı</label>
                <Input
                  placeholder="Örn: Kredi Kartı, Banka Kredisi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kime Ait?</label>
                <Select
                  value={formData.owner}
                  onValueChange={(value) => setFormData({ ...formData, owner: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Benim">{person1Name}</SelectItem>
                    <SelectItem value="Esim">{person2Name}</SelectItem>
                    <SelectItem value="Ev">Ortak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Toplam Borç (€)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.totalDebt || ''}
                    onChange={(e) => setFormData({ ...formData, totalDebt: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Aylık Ödeme (€)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.monthlyPayment || ''}
                    onChange={(e) => setFormData({ ...formData, monthlyPayment: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Son Ödeme Tarihi</label>
                <Input
                  placeholder="Örn: 25"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ödeme Durumu</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Notlar</label>
                <Input
                  placeholder="İsteğe bağlı notlar"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleAddDebt} className="w-full">
                Borç Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtre Sekmeleri */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterOwner(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              filterOwner === tab.value
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background text-muted-foreground border-border hover:bg-accent/50'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">
              ({tab.value === 'Tumu'
                ? budgetData.debts.length
                : budgetData.debts.filter(d => d.owner === tab.value || (!d.owner && tab.value === 'Ev')).length})
            </span>
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Toplam Borç</p>
          <p className="text-2xl font-display font-bold text-orange-600">
            {formatCurrency(totalDebt)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Bu Ay Ödenecek</p>
          <p className="text-2xl font-display font-bold text-orange-600">
            {formatCurrency(totalMonthly)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Kalan Borç</p>
          <p className="text-2xl font-display font-bold text-red-600">
            {formatCurrency(remainingDebt)}
          </p>
        </Card>
      </div>

      {/* Debt List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary">
                <th className="px-6 py-4 text-left font-semibold">Borç Adı</th>
                <th className="px-6 py-4 text-left font-semibold">Kime Ait</th>
                <th className="px-6 py-4 text-right font-semibold">Toplam</th>
                <th className="px-6 py-4 text-right font-semibold">Aylık</th>
                <th className="px-6 py-4 text-right font-semibold">Kalan</th>
                <th className="px-6 py-4 text-left font-semibold">Son Tarih</th>
                <th className="px-6 py-4 text-center font-semibold">Durum</th>
                <th className="px-6 py-4 text-center font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    Henüz borç eklenmemiş
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => (
                  <tr key={debt.id} className="border-b hover:bg-secondary/50">
                    <td className="px-6 py-4 font-medium">{debt.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOwnerColor(debt.owner || 'Ev')}`}>
                        {getOwnerLabel(debt.owner || 'Ev')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {formatCurrency(debt.totalDebt)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {formatCurrency(debt.monthlyPayment)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {formatCurrency(debt.totalDebt - debt.monthlyPayment)}
                    </td>
                    <td className="px-6 py-4">{debt.dueDate}</td>
                    <td className={`px-6 py-4 text-center font-medium ${getStatusColor(debt.status)}`}>
                      {debt.status}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDebt(debt.id)}
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
