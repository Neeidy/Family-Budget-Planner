import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { formatCurrency, getCategoryColor } from "@/lib/categories";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Download, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart,
} from "recharts";

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export default function Analytics() {
  const { budgetData, archive } = useBudget();
  const { person1Name, person2Name } = usePerson();
  const [selectedPerson, setSelectedPerson] = useState<'all' | 'Benim' | 'Esim'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'trend' | 'annual'>('overview');

  const COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F97316', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F59E0B', '#6366F1', '#06B6D4',
  ];

  // Kategori bazlı gider dağılımı
  const categoryData = useMemo(() => {
    const filtered = selectedPerson === 'all'
      ? budgetData.expenses
      : budgetData.expenses.filter(e => e.owner === selectedPerson);
    const categoryMap = new Map<string, number>();
    filtered.forEach(e => categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.actual));
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [budgetData, selectedPerson]);

  // Kişi bazlı karşılaştırma
  const personComparison = useMemo(() => [
    { name: `${person1Name}`, value: budgetData.expenses.filter(e => e.owner === 'Benim').reduce((s, e) => s + e.actual, 0) },
    { name: `${person2Name}`, value: budgetData.expenses.filter(e => e.owner === 'Esim').reduce((s, e) => s + e.actual, 0) },
    { name: 'Ortak', value: budgetData.expenses.filter(e => e.owner === 'Ev').reduce((s, e) => s + e.actual, 0) },
  ], [budgetData, person1Name, person2Name]);

  // Gider tipi dağılımı
  const typeDistribution = useMemo(() => {
    const typeMap = new Map<string, number>();
    budgetData.expenses.forEach(e => typeMap.set(e.type, (typeMap.get(e.type) || 0) + e.actual));
    return Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));
  }, [budgetData]);

  // Trend verisi - arşivden son 6 ay + mevcut ay
  const trendData = useMemo(() => {
    const currentMonthNum = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Arşivden son 5 ay al
    const pastMonths = [...archive]
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
      .slice(-5)
      .map(m => ({
        month: `${MONTHS_TR[m.month - 1]} ${m.year !== currentYear ? m.year : ''}`.trim(),
        gelir: m.data.incomes.reduce((s: number, i: any) => s + (i.actual || 0), 0),
        gider: m.data.expenses.reduce((s: number, e: any) => s + (e.actual || 0), 0),
        kalan: m.data.incomes.reduce((s: number, i: any) => s + (i.actual || 0), 0) - m.data.expenses.reduce((s: number, e: any) => s + (e.actual || 0), 0),
      }));

    // Mevcut ayı ekle
    const currentIncome = budgetData.incomes.reduce((s, i) => s + i.actual, 0);
    const currentExpense = budgetData.expenses.reduce((s, e) => s + e.actual, 0);
    pastMonths.push({
      month: `${MONTHS_TR[currentMonthNum - 1]} (Şimdi)`,
      gelir: currentIncome,
      gider: currentExpense,
      kalan: currentIncome - currentExpense,
    });

    return pastMonths;
  }, [archive, budgetData]);

  // Yıllık rapor
  const annualReport = useMemo(() => {
    const allMonths = [
      ...archive.map(m => ({
        month: MONTHS_TR[m.month - 1],
        monthNum: m.month,
        income: m.data.incomes.reduce((s: number, i: any) => s + (i.actual || 0), 0),
        expense: m.data.expenses.reduce((s: number, e: any) => s + (e.actual || 0), 0),
        savings: m.data.savingsGoals?.reduce((s: number, g: any) => s + (g.currentAmount || 0), 0) || 0,
      })),
    ];

    const currentMonthNum = new Date().getMonth() + 1;
    const currentIncome = budgetData.incomes.reduce((s, i) => s + i.actual, 0);
    const currentExpense = budgetData.expenses.reduce((s, e) => s + e.actual, 0);
    allMonths.push({
      month: MONTHS_TR[currentMonthNum - 1],
      monthNum: currentMonthNum,
      income: currentIncome,
      expense: currentExpense,
      savings: (budgetData.savingsGoals || []).reduce((s, g) => s + (g.currentAmount || 0), 0),
    });

    const totalIncome = allMonths.reduce((s, m) => s + m.income, 0);
    const totalExpense = allMonths.reduce((s, m) => s + m.expense, 0);
    const avgMonthlyExpense = allMonths.length > 0 ? totalExpense / allMonths.length : 0;
    const bestMonth = allMonths.reduce((best, m) => (m.income - m.expense > (best?.income || 0) - (best?.expense || 0) ? m : best), allMonths[0]);
    const worstMonth = allMonths.reduce((worst, m) => (m.income - m.expense < (worst?.income || 0) - (worst?.expense || 0) ? m : worst), allMonths[0]);

    return { allMonths, totalIncome, totalExpense, avgMonthlyExpense, bestMonth, worstMonth };
  }, [archive, budgetData]);

  // Yıllık raporu indir
  const downloadAnnualReport = () => {
    const lines = [
      '=== YILLIK FİNANSAL RAPOR ===',
      `Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`,
      '',
      '--- ÖZET ---',
      `Toplam Gelir: ${formatCurrency(annualReport.totalIncome)}`,
      `Toplam Gider: ${formatCurrency(annualReport.totalExpense)}`,
      `Net Tasarruf: ${formatCurrency(annualReport.totalIncome - annualReport.totalExpense)}`,
      `Aylık Ortalama Gider: ${formatCurrency(annualReport.avgMonthlyExpense)}`,
      `En İyi Ay: ${annualReport.bestMonth?.month || '-'}`,
      `En Zor Ay: ${annualReport.worstMonth?.month || '-'}`,
      '',
      '--- AYLIK DETAY ---',
      ...annualReport.allMonths.map(m =>
        `${m.month}: Gelir ${formatCurrency(m.income)} | Gider ${formatCurrency(m.expense)} | Net ${formatCurrency(m.income - m.expense)}`
      ),
      '',
      '--- KATEGORİ DAĞILIMI ---',
      ...categoryData.map(c => `${c.name}: ${formatCurrency(c.value)}`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yillik-rapor-${new Date().getFullYear()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
    { id: 'trend', label: 'Trend Analizi', icon: TrendingUp },
    { id: 'annual', label: 'Yıllık Rapor', icon: Download },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold">Analitik & Raporlar</h1>
          <p className="text-muted-foreground mt-1">Harcama eğilimlerinizi ve finansal durumunuzu analiz edin</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadAnnualReport} className="gap-2">
          <Download className="w-4 h-4" />
          Yıllık Rapor İndir
        </Button>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-2 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* GENEL BAKIŞ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Filtre */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Göster:</label>
              <Select value={selectedPerson} onValueChange={(v: any) => setSelectedPerson(v)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Giderler</SelectItem>
                  <SelectItem value="Benim">{person1Name}'in Giderleri</SelectItem>
                  <SelectItem value="Esim">{person2Name}'in Giderleri</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Kategori Dağılımı - Pie Chart */}
          <Card className="p-6">
            <h2 className="text-lg font-display font-bold mb-4">Kategori Dağılımı</h2>
            {categoryData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Veri yok</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Kişi Bazlı Karşılaştırma */}
          <Card className="p-6">
            <h2 className="text-lg font-display font-bold mb-4">Kişi Bazlı Gider Karşılaştırması</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={personComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(v as number)} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Gider Tipi Dağılımı */}
          <Card className="p-6">
            <h2 className="text-lg font-display font-bold mb-4">Gider Tipi Dağılımı</h2>
            {typeDistribution.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Veri yok</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={typeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Kategori Detaylı Tablo */}
          <Card className="p-6">
            <h2 className="text-lg font-display font-bold mb-4">Kategori Detayları</h2>
            {categoryData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Veri yok</p>
            ) : (
              <div className="space-y-3">
                {categoryData.map((item, index) => {
                  const total = categoryData.reduce((s, d) => s + d.value, 0);
                  const pct = total > 0 ? (item.value / total) * 100 : 0;
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-medium text-sm">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{pct.toFixed(1)}%</Badge>
                          <span className="font-mono font-bold text-sm">{formatCurrency(item.value)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TREND ANALİZİ */}
      {activeTab === 'trend' && (
        <div className="space-y-6">
          {trendData.length <= 1 ? (
            <Card className="p-12 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Henüz yeterli veri yok</p>
              <p className="text-muted-foreground text-sm">Trend analizi için en az 2 ay veri gerekiyor. Ay arşivleme özelliğini kullanarak geçmiş ayları kaydedin.</p>
            </Card>
          ) : (
            <>
              {/* Gelir vs Gider Trend */}
              <Card className="p-6">
                <h2 className="text-lg font-display font-bold mb-4">Gelir vs Gider Trendi</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gelirGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="giderGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(v as number)} />
                    <Legend />
                    <Area type="monotone" dataKey="gelir" name="Gelir" stroke="#10B981" fill="url(#gelirGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="gider" name="Gider" stroke="#EF4444" fill="url(#giderGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Kalan Para Trendi */}
              <Card className="p-6">
                <h2 className="text-lg font-display font-bold mb-4">Aylık Net Tasarruf Trendi</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(v as number)} />
                    <Line type="monotone" dataKey="kalan" name="Net Kalan" stroke="#3B82F6" strokeWidth={2} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Trend özet kartları */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {trendData.slice(-1).map(m => (
                  <>
                    <Card className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Bu Ay Gelir</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(m.gelir)}</p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Bu Ay Gider</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(m.gider)}</p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Bu Ay Net</p>
                      <p className={`text-xl font-bold ${m.kalan >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(m.kalan)}</p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Arşivlenen Ay</p>
                      <p className="text-xl font-bold text-blue-600">{trendData.length - 1}</p>
                    </Card>
                  </>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* YILLIK RAPOR */}
      {activeTab === 'annual' && (
        <div className="space-y-6">
          {/* Özet kartlar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Toplam Gelir</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(annualReport.totalIncome)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Toplam Gider</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(annualReport.totalExpense)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Net Tasarruf</p>
              <p className={`text-xl font-bold ${annualReport.totalIncome - annualReport.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(annualReport.totalIncome - annualReport.totalExpense)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Ort. Aylık Gider</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(annualReport.avgMonthlyExpense)}</p>
            </Card>
          </div>

          {/* En iyi / en zor ay */}
          {annualReport.allMonths.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="font-medium text-green-800 dark:text-green-200">En İyi Ay</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{annualReport.bestMonth?.month}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Net: {formatCurrency((annualReport.bestMonth?.income || 0) - (annualReport.bestMonth?.expense || 0))}
                </p>
              </Card>
              <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <p className="font-medium text-red-800 dark:text-red-200">En Zor Ay</p>
                </div>
                <p className="text-2xl font-bold text-red-600">{annualReport.worstMonth?.month}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Net: {formatCurrency((annualReport.worstMonth?.income || 0) - (annualReport.worstMonth?.expense || 0))}
                </p>
              </Card>
            </div>
          )}

          {/* Aylık Gelir/Gider Bar Chart */}
          {annualReport.allMonths.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-display font-bold mb-4">Aylık Gelir & Gider Karşılaştırması</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={annualReport.allMonths}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Legend />
                  <Bar dataKey="income" name="Gelir" fill="#10B981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" name="Gider" fill="#EF4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Aylık tablo */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold">Aylık Detay Tablosu</h2>
              <Button variant="outline" size="sm" onClick={downloadAnnualReport} className="gap-2">
                <Download className="w-4 h-4" />
                İndir
              </Button>
            </div>
            {annualReport.allMonths.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Henüz arşivlenmiş ay yok</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Ay</th>
                      <th className="text-right py-2 font-medium text-green-600">Gelir</th>
                      <th className="text-right py-2 font-medium text-red-600">Gider</th>
                      <th className="text-right py-2 font-medium text-blue-600">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annualReport.allMonths.map((m, i) => (
                      <tr key={i} className="border-b hover:bg-secondary/50 transition-colors">
                        <td className="py-2 font-medium">{m.month}</td>
                        <td className="py-2 text-right font-mono text-green-600">{formatCurrency(m.income)}</td>
                        <td className="py-2 text-right font-mono text-red-600">{formatCurrency(m.expense)}</td>
                        <td className={`py-2 text-right font-mono font-bold ${m.income - m.expense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(m.income - m.expense)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2">
                      <td className="py-2">TOPLAM</td>
                      <td className="py-2 text-right font-mono text-green-600">{formatCurrency(annualReport.totalIncome)}</td>
                      <td className="py-2 text-right font-mono text-red-600">{formatCurrency(annualReport.totalExpense)}</td>
                      <td className={`py-2 text-right font-mono ${annualReport.totalIncome - annualReport.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(annualReport.totalIncome - annualReport.totalExpense)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
