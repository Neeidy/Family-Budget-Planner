import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { SavingsGoal } from "@/hooks/useBudgetData";
import { formatCurrency } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Target } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type StatusFilter = "Tümü" | "Aktif" | "Tamamlanan";

export default function Hedef() {
  const { budgetData, addSavingsGoal, deleteSavingsGoal } = useBudget();
  const { currentPerson, person1Name, person2Name } = usePerson();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tümü");
  const defaultOwner = currentPerson === "Benim" ? "Benim" : currentPerson === "Esim" ? "Esim" : "Ev";

  const [formData, setFormData] = useState<Omit<SavingsGoal, "id">>({
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    monthlyAllocation: 0,
    targetDate: new Date().toISOString().split("T")[0],
    owner: defaultOwner,
    notes: "",
  });

  const handleAddGoal = () => {
    if (formData.name.trim() && formData.targetAmount > 0) {
      addSavingsGoal(formData);
      setFormData({
        name: "",
        targetAmount: 0,
        currentAmount: 0,
        monthlyAllocation: 0,
        targetDate: new Date().toISOString().split("T")[0],
        owner: defaultOwner,
        notes: "",
      });
      setOpen(false);
    }
  };

  const getOwnerLabel = (owner: string) => {
    if (owner === "Benim") return person1Name;
    if (owner === "Esim") return person2Name;
    return "Ortak";
  };

  const getOwnerColor = (owner: string) => {
    if (owner === "Benim") return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    if (owner === "Esim") return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  const allGoals = budgetData.savingsGoals;
  const filteredGoals = allGoals.filter((g) => {
    const done = g.currentAmount >= g.targetAmount;
    if (statusFilter === "Aktif") return !done;
    if (statusFilter === "Tamamlanan") return done;
    return true;
  });

  const statusTabs: { label: string; value: StatusFilter }[] = [
    { label: "Tümü", value: "Tümü" },
    { label: "Aktif", value: "Aktif" },
    { label: "Tamamlanan", value: "Tamamlanan" },
  ];

  const countFor = (f: StatusFilter) => {
    if (f === "Tümü") return allGoals.length;
    const done = f === "Tamamlanan";
    return allGoals.filter((g) => (g.currentAmount >= g.targetAmount) === done).length;
  };

  const totalTarget = filteredGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = filteredGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalMonthly = filteredGoals.reduce((s, g) => s + g.monthlyAllocation, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Birikim &amp; Hedef</h1>
          <p className="text-sm text-muted-foreground">Finansal hedeflerinizi belirleyin ve ilerlemeyi takip edin</p>
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
              <DialogTitle>Yeni Hedef Ekle</DialogTitle>
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
                  onValueChange={(v) => setFormData({ ...formData, owner: v as SavingsGoal["owner"] })}
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
                    value={formData.targetAmount || ""}
                    onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Biriken (€)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.currentAmount || ""}
                    onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Aylık Ayırılacak (€)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.monthlyAllocation || ""}
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

      {/* Status Filtresi */}
      <div className="flex gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:bg-accent/50"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">({countFor(tab.value)})</span>
          </button>
        ))}
      </div>

      {/* Özet */}
      {filteredGoals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Toplam Hedef</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(totalTarget)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Toplam Biriken</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalCurrent)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Aylık Ayırılan</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(totalMonthly)}</p>
          </Card>
        </div>
      )}

      {/* Hedef Listesi */}
      {filteredGoals.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {statusFilter === "Tümü" ? "Henüz hedef eklenmemiş" : `${statusFilter} hedef yok`}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => {
            const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            const monthsNeeded = goal.monthlyAllocation > 0 ? Math.ceil(remaining / goal.monthlyAllocation) : 0;
            const done = goal.currentAmount >= goal.targetAmount;

            return (
              <Card key={goal.id} className={`p-6 ${done ? "border-green-200 bg-green-50/30 dark:bg-green-900/10" : ""}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base">{goal.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOwnerColor(goal.owner)}`}>
                        {getOwnerLabel(goal.owner)}
                      </span>
                    </div>
                    {goal.targetDate && (
                      <p className="text-xs text-muted-foreground">
                        Hedef: {new Date(goal.targetDate).toLocaleDateString("tr-TR")}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteSavingsGoal(goal.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-muted-foreground">İlerleme</span>
                    <span className="text-sm font-mono font-bold">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${done ? "bg-green-500" : "bg-primary"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biriken</span>
                    <span className="font-mono font-medium text-green-600">{formatCurrency(goal.currentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hedef</span>
                    <span className="font-mono font-medium">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  {!done && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kalan</span>
                      <span className="font-mono font-medium text-orange-600">{formatCurrency(remaining)}</span>
                    </div>
                  )}
                  {goal.monthlyAllocation > 0 && (
                    <div className="flex justify-between pt-1.5 border-t">
                      <span className="text-muted-foreground">Aylık</span>
                      <span className="font-mono font-medium">{formatCurrency(goal.monthlyAllocation)}</span>
                    </div>
                  )}
                  {monthsNeeded > 0 && !done && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tahmini</span>
                      <span className="font-mono font-medium text-primary">{monthsNeeded} ay</span>
                    </div>
                  )}
                  {done && (
                    <div className="mt-2 pt-2 border-t text-center">
                      <span className="text-sm font-medium text-green-600">✓ Tamamlandı!</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
