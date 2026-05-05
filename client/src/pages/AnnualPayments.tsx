import { useBudget } from "@/contexts/BudgetContext";
import { AnnualPayment } from "@/hooks/useBudgetData";
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

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function AnnualPayments() {
  const budgetHook = useBudget();
  const { budgetData, addAnnualPayment, deleteAnnualPayment } = useBudget();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<AnnualPayment, 'id'>>({
    name: '',
    amount: 0,
    paymentMonth: new Date().getMonth() + 1,
    lastPaymentDate: '',
    notes: '',
  });

  const handleAddPayment = () => {
    if (formData.name.trim() && formData.amount > 0) {
      addAnnualPayment(formData);
      setFormData({
        name: '',
        amount: 0,
        paymentMonth: new Date().getMonth() + 1,
        lastPaymentDate: '',
        notes: '',
      });
      setOpen(false);
    }
  };

  const totalAnnual = budgetData.annualPayments.reduce((sum, p) => sum + p.amount, 0);
  const monthlyAverage = totalAnnual / 12;
  const currentMonth = new Date().getMonth() + 1;
  const upcomingPayments = budgetData.annualPayments.filter(p => p.paymentMonth === currentMonth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Yıllık Ödemeler</h1>
          <p className="text-muted-foreground mt-1">
            Yılda bir kez yapılan ödemeleri yönetin
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Ödeme Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Yıllık Ödeme Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Ödeme Adı</label>
                <Input
                  placeholder="Örn: Araç Sigortası, ORF, Vignette"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tutar (€)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ödeme Ayı</label>
                <Select
                  value={formData.paymentMonth.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      paymentMonth: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={month} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Son Ödeme Tarihi (İsteğe Bağlı)</label>
                <Input
                  placeholder="Örn: 31 Aralık"
                  value={formData.lastPaymentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, lastPaymentDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notlar</label>
                <Input
                  placeholder="İsteğe bağlı notlar"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleAddPayment} className="w-full">
                Ödeme Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Toplam Yıllık</p>
          <p className="text-2xl font-display font-bold text-orange-600">
            {formatCurrency(totalAnnual)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Aylık Ortalama</p>
          <p className="text-2xl font-display font-bold text-orange-600">
            {formatCurrency(monthlyAverage)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Toplam Ödemeler</p>
          <p className="text-2xl font-display font-bold text-blue-600">
            {budgetData.annualPayments.length}
          </p>
        </Card>
      </div>

      {/* Upcoming Payments Alert */}
      {upcomingPayments.length > 0 && (
        <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-900 dark:text-orange-200">
                Bu Ay Yıllık Ödemeler Var
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                {upcomingPayments.map(p => `${p.name} (${formatCurrency(p.amount)})`).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Payments by Month */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-display font-bold mb-6">Aylara Göre Dağılım</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MONTHS.map((month, monthIndex) => {
              const monthPayments = budgetData.annualPayments.filter(
                p => p.paymentMonth === monthIndex + 1
              );
              const monthTotal = monthPayments.reduce((sum, p) => sum + p.amount, 0);

              return (
                <div
                  key={month}
                  className={`p-4 rounded-lg border ${
                    monthPayments.length > 0
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                      : 'bg-secondary border-border'
                  }`}
                >
                  <p className="font-medium text-sm mb-2">{month}</p>
                  {monthPayments.length > 0 ? (
                    <div className="space-y-1">
                      {monthPayments.map(payment => (
                        <p key={payment.id} className="text-xs text-muted-foreground">
                          • {payment.name}: {formatCurrency(payment.amount)}
                        </p>
                      ))}
                      <p className="text-sm font-mono font-bold text-orange-600 mt-2">
                        Toplam: {formatCurrency(monthTotal)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Ödeme yok</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* All Payments List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary">
                <th className="px-6 py-4 text-left font-semibold">Ödeme Adı</th>
                <th className="px-6 py-4 text-right font-semibold">Tutar</th>
                <th className="px-6 py-4 text-left font-semibold">Ödeme Ayı</th>
                <th className="px-6 py-4 text-left font-semibold">Son Tarih</th>
                <th className="px-6 py-4 text-center font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {budgetData.annualPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Henüz yıllık ödeme eklenmemiş
                  </td>
                </tr>
              ) : (
                budgetData.annualPayments
                  .sort((a, b) => a.paymentMonth - b.paymentMonth)
                  .map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-secondary/50">
                      <td className="px-6 py-4 font-medium">{payment.name}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-orange-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200 rounded text-xs font-medium">
                          {MONTHS[payment.paymentMonth - 1]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {payment.lastPaymentDate || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAnnualPayment(payment.id)}
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

      {/* Info */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-display font-bold mb-2 text-blue-900 dark:text-blue-100">
          💡 Nasıl Çalışır?
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Yıllık ödemeleri buraya ekledikten sonra, ödeme ayında otomatik olarak Dashboard'da aylık giderlere eklenir. Örneğin, 600€ araç sigortasını Mart ayında ödüyorsanız, Mart ayında Dashboard'da 600€ ekstra gider olarak görünecektir.
        </p>
      </Card>
    </div>
  );
}
