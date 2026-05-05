import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { SavingsGoal } from "@/hooks/useBudgetData";
import { formatCurrency, formatPercentage } from "@/lib/categories";
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

export default function Savings() {
  const { budgetData, addSavingsGoal, deleteSavingsGoal } = useBudget();
  const { currentPerson, person1Name, person2Name } = usePerson();
  const [open, setOpen] = useState(false);
  const [filterOwner, setFilterOwner] = useState<'Benim' | 'Esim' | 'Ev' | 'Tumu'>(() => {
    if (currentPerson === 'Benim') return 'Benim';
    if (currentPerson === 'Esim') return 'Esim';
    return 'Tumu';
  });

  const [formData, setFormData] = useState<Omit<SavingsGoal, 'id'>>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    monthlyAllocation: 0,
    targetDate: '',
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

  const handleAddGoal = () => {
    if (formData.name.trim()) {
      addSavingsGoal(formData);
      setFormData({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        monthlyAllocation: 0,
        targetDate: '',
        owner: currentPerson === 'Benim' ? 'Benim' : currentPerson === 'Esim' ? 'Esim' : 'Ev',
        notes: '',
      });
      setOpen(false);
    }
  };

  const filteredGoals = filterOwner === 'Tumu'
    ? budgetData.savingsGoals
    : budgetData.savingsGoals.filter(g => g.owner === filterOwner || (!g.owner && filterOwner === 'Ev'));

  const totalTarget = filteredGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = filteredGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalMonthly = filteredGoals.reduce((sum, g) => sum + g.monthlyAllocation, 0);

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
          <h1 className="text-3xl font-display font-bold">Birikim Hedefleri</h1>
          <p className="text-muted-foreground mt-1">
            Finansal hedeflerinizi belirleyin ve takip edin
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Hedef Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Birikim Hedefi Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Hedef Adı</label>
                <Input
                  placeholder="Örn: Tatil, Araç, Acil Fon"
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
                  <label className="text-sm font-medium">Hedef Tutar (€)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.targetAmount || ''}
                    onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Şu Ana Kadar (€)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.currentAmount || ''}
                    onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Aylık Ayrılacak (€)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.monthlyAllocation || ''}
                  onChange={(e) => setFormData({ ...formData, monthlyAllocation: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hedef Tarihi</label>
                <Input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notlar</label>
                <Input
                  placeholder="İsteğe bağlı notlar"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleAddGoal} className="w-full">
                Hedef Ekle
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
                ? budgetData.savingsGoals.length
                : budgetData.savingsGoals.filter(g => g.owner === tab.value || (!g.owner && tab.value === 'Ev')).length})
            </span>
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Toplam Hedef</p>
          <p className="text-2xl font-display font-bold text-blue-600">
            {formatCurrency(totalTarget)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Toplam Biriken</p>
          <p className="text-2xl font-display font-bold text-blue-600">
            {formatCurrency(totalCurrent)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Aylık Ayırılan</p>
          <p className="text-2xl font-display font-bold text-blue-600">
            {formatCurrency(totalMonthly)}
          </p>
        </Card>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Henüz birikim hedefi eklenmemiş</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => {
            const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            const monthsNeeded = goal.monthlyAllocation > 0 ? Math.ceil(remaining / goal.monthlyAllocation) : 0;

            return (
              <Card key={goal.id} className="p-6 card-metric-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-lg">{goal.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOwnerColor(goal.owner || 'Ev')}`}>
                        {getOwnerLabel(goal.owner || 'Ev')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {goal.targetDate ? `Hedef: ${goal.targetDate}` : 'Tarih belirlenmemiş'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSavingsGoal(goal.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">İlerleme</span>
                    <span className="text-sm font-mono font-bold text-blue-600">
                      {formatPercentage(percentage / 100)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Biriken:</span>
                    <span className="font-mono font-medium">{formatCurrency(goal.currentAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hedef:</span>
                    <span className="font-mono font-medium">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Kalan:</span>
                    <span className="font-mono font-medium text-red-600">
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Aylık:</span>
                    <span className="font-mono font-medium">{formatCurrency(goal.monthlyAllocation)}</span>
                  </div>
                  {monthsNeeded > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tahmini Ay:</span>
                      <span className="font-mono font-medium text-blue-600">
                        {monthsNeeded} ay
                      </span>
                    </div>
                  )}
                </div>

                {percentage >= 100 && (
                  <div className="mt-4 p-2 bg-green-50 dark:bg-green-900/20 rounded text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      ✓ Hedef Tamamlandı!
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
