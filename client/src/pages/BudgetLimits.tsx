import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { formatCurrency } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, AlertCircle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

export default function BudgetLimits() {
  const { budgetData, addBudgetLimit, deleteBudgetLimit } = useBudget();
  const { person1Name, person2Name } = usePerson();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: Object.keys(EXPENSE_CATEGORIES)[0],
    limit: 0,
    owner: 'Ev' as const,
  });

  const handleAddLimit = () => {
    if (formData.category && formData.limit > 0) {
      addBudgetLimit(formData);
      setFormData({
        category: Object.keys(EXPENSE_CATEGORIES)[0],
        limit: 0,
        owner: 'Ev',
      });
      setOpen(false);
    }
  };

  // Kategori başına harcama hesapla
  const getCategorySpending = (category: string) => {
    return budgetData.expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  // Limit aşan kategorileri bul
  const exceededLimits = budgetData.budgetLimits.filter(limit => {
    const spending = getCategorySpending(limit.category);
    return spending > limit.limit;
  });

  const categoryKeys = Object.keys(EXPENSE_CATEGORIES);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Butce Limitleri</h1>
          <p className="text-muted-foreground mt-1">
            Kategorilere özel harcama limitleri belirleyin
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Limit Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Butce Limiti Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Kategori</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryKeys.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Limit (€)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.limit || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limit: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kişi</label>
                <Select
                  value={formData.owner}
                  onValueChange={(value) =>
                    setFormData({ ...formData, owner: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ev">Ortak</SelectItem>
                    <SelectItem value="Benim">{person1Name}</SelectItem>
                    <SelectItem value="Esim">{person2Name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddLimit} className="w-full">
                Limit Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Aşılan Limitler Uyarısı */}
      {exceededLimits.length > 0 && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-200">
                {exceededLimits.length} Kategoride Limit Aşıldı
              </p>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                {exceededLimits.map(l => `${l.category}: ${formatCurrency(getCategorySpending(l.category))} / ${formatCurrency(l.limit)}`).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Butce Limitleri Listesi */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary">
                <th className="px-6 py-4 text-left font-semibold">Kategori</th>
                <th className="px-6 py-4 text-left font-semibold">Kişi</th>
                <th className="px-6 py-4 text-right font-semibold">Limit</th>
                <th className="px-6 py-4 text-right font-semibold">Harcanan</th>
                <th className="px-6 py-4 text-right font-semibold">Kalan</th>
                <th className="px-6 py-4 text-center font-semibold">Durum</th>
                <th className="px-6 py-4 text-center font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {budgetData.budgetLimits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Henüz bütçe limiti eklenmemiş
                  </td>
                </tr>
              ) : (
                budgetData.budgetLimits.map((limit) => {
                  const spending = getCategorySpending(limit.category);
                  const remaining = limit.limit - spending;
                  const percentage = (spending / limit.limit) * 100;
                  const isExceeded = spending > limit.limit;

                  return (
                    <tr key={limit.id} className="border-b hover:bg-secondary/50">
                      <td className="px-6 py-4 font-medium">{limit.category}</td>
                      <td className="px-6 py-4 text-sm">
                        {limit.owner === 'Ev' ? '🏠 Ortak' : limit.owner === 'Benim' ? `👤 ${person1Name}` : `👥 ${person2Name}`}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        {formatCurrency(limit.limit)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        <span style={{ color: isExceeded ? '#EF4444' : '#10B981' }}>
                          {formatCurrency(spending)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        <span style={{ color: remaining >= 0 ? '#10B981' : '#EF4444' }}>
                          {formatCurrency(remaining)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                              backgroundColor: isExceeded ? '#EF4444' : percentage > 80 ? '#F97316' : '#10B981',
                            }}
                          />
                        </div>
                        <p className="text-xs mt-1">{percentage.toFixed(0)}%</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBudgetLimit(limit.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bilgi */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-display font-bold mb-2 text-blue-900 dark:text-blue-100">
          💡 Butce Limitleri Nasıl Çalışır?
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Kategorilere özel limitler belirleyerek harcamalarınızı kontrol altında tutun. Limit aşıldığında uyarı alırsınız. Ortak limitler her iki kişinin harcamasını içerir.
        </p>
      </Card>
    </div>
  );
}
