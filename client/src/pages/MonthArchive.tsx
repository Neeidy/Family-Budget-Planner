import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { formatCurrency } from "@/lib/categories";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Archive, TrendingUp, TrendingDown, PiggyBank, AlertCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { BudgetData } from "@/hooks/useBudgetData";

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

function extractStats(data: BudgetData) {
  const myIncome = data.incomes.filter(i => i.owner === 'Benim').reduce((s, i) => s + i.amount, 0);
  const spouseIncome = data.incomes.filter(i => i.owner === 'Esim').reduce((s, i) => s + i.amount, 0);
  const myExpenses = data.expenses.filter(e => e.owner === 'Benim').reduce((s, e) => s + e.amount, 0);
  const spouseExpenses = data.expenses.filter(e => e.owner === 'Esim').reduce((s, e) => s + e.amount, 0);
  const homeExpenses = data.expenses.filter(e => e.owner === 'Ev').reduce((s, e) => s + e.amount, 0);
  const totalIncome = myIncome + spouseIncome;
  const totalExpenses = myExpenses + spouseExpenses + homeExpenses;
  const savings = totalIncome - totalExpenses;
  return { myIncome, spouseIncome, myExpenses: myExpenses + homeExpenses / 2, spouseExpenses: spouseExpenses + homeExpenses / 2, totalIncome, totalExpenses, savings };
}

export default function MonthArchive() {
  const { budgetData, archive, saveCurrentMonthToArchive } = useBudget();
  const { person1Name, person2Name } = usePerson();

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth(); // 0-based

  // Arşiv + mevcut ay birleşik liste
  const allMonths = useMemo(() => {
    const currentKey = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;
    const currentEntry = {
      key: currentKey,
      year: currentYear,
      month: currentMonthIdx + 1,
      monthName: MONTHS[currentMonthIdx],
      data: budgetData,
      savedAt: new Date().toISOString(),
      isCurrent: true,
    };

    const archiveEntries = archive
      .filter(a => a.key !== currentKey)
      .map(a => ({ ...a, isCurrent: false }));

    return [currentEntry, ...archiveEntries].sort((a, b) => b.key.localeCompare(a.key));
  }, [archive, budgetData, currentYear, currentMonthIdx]);

  const [selectedKey1, setSelectedKey1] = useState(() => allMonths[0]?.key ?? '');
  const [selectedKey2, setSelectedKey2] = useState(() => allMonths[1]?.key ?? allMonths[0]?.key ?? '');

  const month1Entry = allMonths.find(m => m.key === selectedKey1);
  const month2Entry = allMonths.find(m => m.key === selectedKey2);

  const month1Stats = useMemo(() => month1Entry ? extractStats(month1Entry.data) : null, [month1Entry]);
  const month2Stats = useMemo(() => month2Entry ? extractStats(month2Entry.data) : null, [month2Entry]);

  // Trend grafiği için tüm arşiv verileri (son 6 ay)
  const trendData = useMemo(() => {
    return allMonths.slice(0, 6).reverse().map(m => {
      const s = extractStats(m.data);
      return {
        name: `${m.monthName.slice(0, 3)} ${m.year}`,
        Gelir: s.totalIncome,
        Gider: s.totalExpenses,
        Tasarruf: s.savings,
      };
    });
  }, [allMonths]);

  const comparisonData = month1Stats && month2Stats ? [
    { name: 'Gelir', [month1Entry!.monthName]: month1Stats.totalIncome, [month2Entry!.monthName]: month2Stats.totalIncome },
    { name: 'Gider', [month1Entry!.monthName]: month1Stats.totalExpenses, [month2Entry!.monthName]: month2Stats.totalExpenses },
    { name: 'Tasarruf', [month1Entry!.monthName]: month1Stats.savings, [month2Entry!.monthName]: month2Stats.savings },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold">Ay Arşivi & Karşılaştırma</h1>
          <p className="text-muted-foreground mt-1">
            Geçmiş aylarınızı karşılaştırın ve eğilimleri takip edin
          </p>
        </div>
        <Button onClick={saveCurrentMonthToArchive} variant="outline" className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
          <Archive className="w-4 h-4" />
          Bu Ayı Arşive Kaydet
        </Button>
      </div>

      {/* Arşiv Durumu */}
      {allMonths.length <= 1 && (
        <Card className="p-5 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Henüz arşiv yok</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Her ay sonunda "Bu Ayı Arşive Kaydet" butonuna tıklayın. Arşivlenen aylar burada karşılaştırılabilir.
                Ayrıca Ayarlar sayfasından da arşive kayıt yapabilirsiniz.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Arşivlenen Aylar Listesi */}
      {allMonths.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {allMonths.map(m => (
            <Badge key={m.key} variant={m.isCurrent ? 'default' : 'secondary'} className="text-xs">
              {m.monthName} {m.year} {m.isCurrent ? '(Bu Ay)' : ''}
            </Badge>
          ))}
        </div>
      )}

      {/* Trend Grafiği */}
      {trendData.length > 1 && (
        <Card className="p-6">
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Aylık Trend (Son {trendData.length} Ay)
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `€${v}`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Line type="monotone" dataKey="Gelir" stroke="#10B981" strokeWidth={2} dot />
              <Line type="monotone" dataKey="Gider" stroke="#EF4444" strokeWidth={2} dot />
              <Line type="monotone" dataKey="Tasarruf" stroke="#3B82F6" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Ay Karşılaştırması */}
      {allMonths.length >= 2 && (
        <>
          <Card className="p-4">
            <h2 className="text-base font-display font-bold mb-3">Ay Karşılaştırması</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Ay 1</label>
                <Select value={selectedKey1} onValueChange={setSelectedKey1}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allMonths.map(m => (
                      <SelectItem key={m.key} value={m.key}>
                        {m.monthName} {m.year} {m.isCurrent ? '(Bu Ay)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Ay 2</label>
                <Select value={selectedKey2} onValueChange={setSelectedKey2}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allMonths.map(m => (
                      <SelectItem key={m.key} value={m.key}>
                        {m.monthName} {m.year} {m.isCurrent ? '(Bu Ay)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {month1Stats && month2Stats && month1Entry && month2Entry && (
            <>
              <Card className="p-6">
                <h2 className="text-lg font-display font-bold mb-6">Karşılaştırma Grafiği</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={v => `€${v}`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey={month1Entry.monthName} fill="#3B82F6" />
                    <Bar dataKey={month2Entry.monthName} fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ay 1 Özet */}
                <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <h3 className="font-display font-bold mb-4 text-blue-900 dark:text-blue-100">
                    {month1Entry.monthName} {month1Entry.year}
                    {month1Entry.isCurrent && <Badge className="ml-2 text-xs" variant="outline">Bu Ay</Badge>}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1"><span>👨</span> {person1Name}</span>
                      <span className="font-mono text-sm text-green-600">{formatCurrency(month1Stats.myIncome)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1"><span>👩</span> {person2Name}</span>
                      <span className="font-mono text-sm text-green-600">{formatCurrency(month1Stats.spouseIncome)}</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Toplam Gelir</span>
                      <span className="font-mono font-bold text-green-600">{formatCurrency(month1Stats.totalIncome)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Toplam Gider</span>
                      <span className="font-mono font-bold text-red-600">{formatCurrency(month1Stats.totalExpenses)}</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/40 rounded">
                      <span className="font-medium flex items-center gap-1"><PiggyBank className="w-4 h-4" /> Tasarruf</span>
                      <span className={`font-mono font-bold text-lg ${month1Stats.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(month1Stats.savings)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tasarruf Oranı</span>
                      <span className="font-mono font-bold">
                        {month1Stats.totalIncome > 0 ? ((month1Stats.savings / month1Stats.totalIncome) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Ay 2 Özet */}
                <Card className="p-6 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <h3 className="font-display font-bold mb-4 text-purple-900 dark:text-purple-100">
                    {month2Entry.monthName} {month2Entry.year}
                    {month2Entry.isCurrent && <Badge className="ml-2 text-xs" variant="outline">Bu Ay</Badge>}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1"><span>👨</span> {person1Name}</span>
                      <span className="font-mono text-sm text-green-600">{formatCurrency(month2Stats.myIncome)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1"><span>👩</span> {person2Name}</span>
                      <span className="font-mono text-sm text-green-600">{formatCurrency(month2Stats.spouseIncome)}</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Toplam Gelir</span>
                      <span className="font-mono font-bold text-green-600">{formatCurrency(month2Stats.totalIncome)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Toplam Gider</span>
                      <span className="font-mono font-bold text-red-600">{formatCurrency(month2Stats.totalExpenses)}</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between p-3 bg-purple-100 dark:bg-purple-900/40 rounded">
                      <span className="font-medium flex items-center gap-1"><PiggyBank className="w-4 h-4" /> Tasarruf</span>
                      <span className={`font-mono font-bold text-lg ${month2Stats.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(month2Stats.savings)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tasarruf Oranı</span>
                      <span className="font-mono font-bold">
                        {month2Stats.totalIncome > 0 ? ((month2Stats.savings / month2Stats.totalIncome) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Değişim Analizi */}
              <Card className="p-6">
                <h3 className="font-display font-bold mb-4">Değişim Analizi ({month1Entry.monthName} vs {month2Entry.monthName})</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Gelir Değişimi', v1: month1Stats.totalIncome, v2: month2Stats.totalIncome },
                    { label: 'Gider Değişimi', v1: month1Stats.totalExpenses, v2: month2Stats.totalExpenses },
                    { label: 'Tasarruf Değişimi', v1: month1Stats.savings, v2: month2Stats.savings },
                    { label: `${person1Name} Geliri`, v1: month1Stats.myIncome, v2: month2Stats.myIncome },
                    { label: `${person2Name} Geliri`, v1: month1Stats.spouseIncome, v2: month2Stats.spouseIncome },
                  ].map(item => {
                    const change = item.v1 - item.v2;
                    const changePercent = item.v2 !== 0 ? (change / Math.abs(item.v2)) * 100 : 0;
                    return (
                      <div key={item.label} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{month1Entry.monthName}: {formatCurrency(item.v1)} · {month2Entry.monthName}: {formatCurrency(item.v2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-sm flex items-center gap-1 justify-end">
                            {change >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-green-500" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                            {change >= 0 ? '+' : ''}{formatCurrency(change)}
                          </p>
                          <p className="text-xs font-mono" style={{ color: change >= 0 ? '#10B981' : '#EF4444' }}>
                            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
