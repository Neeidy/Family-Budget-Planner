import { useState } from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { usePerson } from '@/contexts/PersonContext';
import { usePersonFilter } from '@/contexts/PersonFilterContext';
import { Installment } from '@/hooks/useBudgetData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ShoppingCart, Calendar, User, Home, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/categories';

const MONTHS = [
  'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
  'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 1);

function getEndMonth(startYear: number, startMonth: number, count: number) {
  const totalMonths = (startYear * 12 + startMonth - 1) + (count - 1);
  const endYear = Math.floor(totalMonths / 12);
  const endMonth = (totalMonths % 12) + 1;
  return { endYear, endMonth };
}

function getPaidInstallments(startYear: number, startMonth: number, count: number) {
  const now = new Date();
  const currentTotal = now.getFullYear() * 12 + now.getMonth(); // 0-indexed month
  const startTotal = startYear * 12 + (startMonth - 1);
  const paid = Math.min(Math.max(currentTotal - startTotal, 0), count);
  return paid;
}

function isActiveThisMonth(startYear: number, startMonth: number, count: number) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const { endYear, endMonth } = getEndMonth(startYear, startMonth, count);

  const afterStart = currentYear > startYear || (currentYear === startYear && currentMonth >= startMonth);
  const beforeEnd = currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth);
  return afterStart && beforeEnd;
}

function getOwnerLabel(owner: string, p1: string, p2: string) {
  if (owner === 'Ev') return { label: 'Ev (Ortak)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
  if (owner === 'Benim') return { label: p1, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  return { label: p2, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };
}

export default function Installments() {
  const { budgetData, addInstallment, deleteInstallment } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const { filter: globalFilter } = usePersonFilter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'Ev' | 'Benim' | 'Esim'>(currentPerson ?? 'all');
  const [form, setForm] = useState({
    name: '',
    totalAmount: '',
    installmentCount: '',
    monthlyAmount: '',
    startYear: new Date().getFullYear().toString(),
    startMonth: (new Date().getMonth() + 1).toString(),
    owner: 'Ev' as 'Ev' | 'Benim' | 'Esim',
    notes: '',
    autoCalc: true,
  });

  const installments = budgetData.installments || [];
  const effectiveFilter: 'all' | 'Ev' | 'Benim' | 'Esim' =
    globalFilter !== 'Tümü' ? globalFilter : filter;
  const filteredInstallments = effectiveFilter === 'all' ? installments : installments.filter(i => i.owner === effectiveFilter);

  // Bu ay aktif olan taksitler
  const activeThisMonth = installments.filter(i =>
    isActiveThisMonth(i.startYear, i.startMonth, i.installmentCount)
  );

  // Bu ay toplam taksit yuku
  const totalThisMonth = activeThisMonth.reduce((sum, i) => sum + i.monthlyAmount, 0);
  const myShareThisMonth = activeThisMonth.reduce((sum, i) => {
    if (i.owner === 'Benim') return sum + i.monthlyAmount;
    if (i.owner === 'Ev') return sum + i.monthlyAmount / 2;
    return sum;
  }, 0);
  const spouseShareThisMonth = activeThisMonth.reduce((sum, i) => {
    if (i.owner === 'Esim') return sum + i.monthlyAmount;
    if (i.owner === 'Ev') return sum + i.monthlyAmount / 2;
    return sum;
  }, 0);

  const handleInstallmentCountChange = (val: string) => {
    const count = parseInt(val) || 0;
    const total = parseFloat(form.totalAmount) || 0;
    if (form.autoCalc && count > 0 && total > 0) {
      setForm(prev => ({ ...prev, installmentCount: val, monthlyAmount: (total / count).toFixed(2) }));
    } else {
      setForm(prev => ({ ...prev, installmentCount: val }));
    }
  };

  const handleTotalAmountChange = (val: string) => {
    const total = parseFloat(val) || 0;
    const count = parseInt(form.installmentCount) || 0;
    if (form.autoCalc && count > 0 && total > 0) {
      setForm(prev => ({ ...prev, totalAmount: val, monthlyAmount: (total / count).toFixed(2) }));
    } else {
      setForm(prev => ({ ...prev, totalAmount: val }));
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.totalAmount || !form.installmentCount || !form.monthlyAmount) return;
    addInstallment({
      name: form.name,
      totalAmount: parseFloat(form.totalAmount),
      installmentCount: parseInt(form.installmentCount),
      monthlyAmount: parseFloat(form.monthlyAmount),
      startYear: parseInt(form.startYear),
      startMonth: parseInt(form.startMonth),
      owner: form.owner,
      notes: form.notes,
    });
    setForm({
      name: '',
      totalAmount: '',
      installmentCount: '',
      monthlyAmount: '',
      startYear: new Date().getFullYear().toString(),
      startMonth: (new Date().getMonth() + 1).toString(),
      owner: 'Ev',
      notes: '',
      autoCalc: true,
    });
    setOpen(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Taksitli Alisverisler
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Taksitli alinan urunleri ve odeme planlarini takip edin
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Yeni Taksit Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Taksitli Alisveris Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Urun / Alisveris Adi *</Label>
                <Input
                  placeholder="Kahve Makinesi, Telefon..."
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Toplam Tutar (EUR) *</Label>
                  <Input
                    type="number"
                    placeholder="400"
                    value={form.totalAmount}
                    onChange={e => handleTotalAmountChange(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Taksit Sayisi *</Label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={form.installmentCount}
                    onChange={e => handleInstallmentCountChange(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Aylik Taksit Tutari (EUR) *</Label>
                <Input
                  type="number"
                  placeholder="Otomatik hesaplanir"
                  value={form.monthlyAmount}
                  onChange={e => setForm(prev => ({ ...prev, monthlyAmount: e.target.value, autoCalc: false }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Toplam tutar ve taksit sayisi girilince otomatik hesaplanir
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Baslangic Yili</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={form.startYear}
                    onChange={e => setForm(prev => ({ ...prev, startYear: e.target.value }))}
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Baslangic Ayi</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={form.startMonth}
                    onChange={e => setForm(prev => ({ ...prev, startMonth: e.target.value }))}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Kime Ait?</Label>
                <div className="flex gap-2 mt-1">
                  {(['Ev', 'Benim', 'Esim'] as const).map(o => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, owner: o }))}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
                        form.owner === o
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-accent'
                      }`}
                    >
                      {o === 'Ev' ? 'Ev (Ortak)' : o === 'Benim' ? person1Name : person2Name}
                    </button>
                  ))}
                </div>
                {form.owner === 'Ev' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ev (Ortak) secilince aylik taksit ikiye bolunur
                  </p>
                )}
              </div>

              <div>
                <Label>Notlar</Label>
                <Input
                  placeholder="Opsiyonel not..."
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full">
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bu Ay Ozet Kartlari */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Bu Ay Aktif</p>
            <p className="text-2xl font-bold mt-1">{activeThisMonth.length}</p>
            <p className="text-xs text-muted-foreground">taksit odeme</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Bu Ay Toplam</p>
            <p className="text-2xl font-bold mt-1 text-red-500">{formatCurrency(totalThisMonth)}</p>
            <p className="text-xs text-muted-foreground">taksit yuku</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{person1Name}'in Payı</p>
            <p className="text-2xl font-bold mt-1 text-blue-500">{formatCurrency(myShareThisMonth)}</p>
            <p className="text-xs text-muted-foreground">bu ay</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{person2Name}'in Payı</p>
            <p className="text-2xl font-bold mt-1 text-purple-500">{formatCurrency(spouseShareThisMonth)}</p>
            <p className="text-xs text-muted-foreground">bu ay</p>
          </CardContent>
        </Card>
      </div>

      {/* Bu Ay Aktif Taksitler */}
      {activeThisMonth.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              Bu Ay Odenecek Taksitler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeThisMonth.map(inst => {
                const { label, color } = getOwnerLabel(inst.owner, person1Name, person2Name);
                const paid = getPaidInstallments(inst.startYear, inst.startMonth, inst.installmentCount);
                const remaining = inst.installmentCount - paid;
                return (
                  <div key={inst.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-4 h-4 text-orange-500 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{inst.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {paid}/{inst.installmentCount}. taksit - {remaining} taksit kaldi
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">{formatCurrency(inst.monthlyAmount)}</p>
                      <Badge className={`text-xs ${color}`}>{label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
              filter === tab.key ? tab.color : 'border-border bg-background text-muted-foreground hover:bg-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tum Taksitler Listesi */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {filter === 'all' ? 'Tum Taksitli Alisverisler' : `${filter === 'Benim' ? person1Name : filter === 'Esim' ? person2Name : 'Ortak'} Taksitleri`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInstallments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Henuz taksitli alisveris yok</p>
              <p className="text-sm mt-1">Yukaridaki butona tiklayarak ekleyebilirsiniz</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInstallments.map(inst => {
                const { label, color } = getOwnerLabel(inst.owner, person1Name, person2Name);
                const paid = getPaidInstallments(inst.startYear, inst.startMonth, inst.installmentCount);
                const remaining = inst.installmentCount - paid;
                const progress = (paid / inst.installmentCount) * 100;
                const { endYear, endMonth } = getEndMonth(inst.startYear, inst.startMonth, inst.installmentCount);
                const active = isActiveThisMonth(inst.startYear, inst.startMonth, inst.installmentCount);
                const completed = paid >= inst.installmentCount;

                return (
                  <div key={inst.id} className={`border rounded-lg p-4 space-y-3 ${completed ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ShoppingCart className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{inst.name}</p>
                            <Badge className={`text-xs ${color}`}>{label}</Badge>
                            {active && !completed && (
                              <Badge className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                Bu Ay Aktif
                              </Badge>
                            )}
                            {completed && (
                              <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Tamamlandi
                              </Badge>
                            )}
                          </div>
                          {inst.notes && <p className="text-xs text-muted-foreground mt-0.5">{inst.notes}</p>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteInstallment(inst.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Ilerleme cubugu */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{paid} / {inst.installmentCount} taksit odendi</span>
                        <span>%{Math.round(progress)}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${completed ? 'bg-green-500' : 'bg-primary'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Detaylar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Toplam Tutar</p>
                        <p className="font-semibold">{formatCurrency(inst.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Aylik Taksit</p>
                        <p className="font-semibold text-orange-600">{formatCurrency(inst.monthlyAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Baslangic</p>
                        <p className="font-semibold">{MONTHS[inst.startMonth - 1]} {inst.startYear}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Bitis</p>
                        <p className="font-semibold">{MONTHS[endMonth - 1]} {endYear}</p>
                      </div>
                    </div>

                    {inst.owner === 'Ev' && (
                      <div className="flex gap-4 text-xs bg-secondary/50 rounded-md p-2">
                        <span className="text-muted-foreground">Kisi basi pay:</span>
                        <span className="font-medium text-blue-600">Benim: {formatCurrency(inst.monthlyAmount / 2)}</span>
                        <span className="font-medium text-purple-600">Esim: {formatCurrency(inst.monthlyAmount / 2)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
