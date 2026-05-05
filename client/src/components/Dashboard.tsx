import { useBudget } from '@/contexts/BudgetContext';
import { usePerson } from '@/contexts/PersonContext';
import { formatCurrency, formatPercentage, getFinancialStatus } from '@/lib/categories';
import { TrendingUp, TrendingDown, AlertCircle, Cloud, Shield, Target, Wallet, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

// Bütçe Sağlık Skoru hesaplama
function calcHealthScore(params: {
  savingsRate: number;
  expenseRatio: number;
  hasOverduePayments: boolean;
  debtToIncomeRatio: number;
  budgetAdherence: number; // planned vs actual uyumu 0-1
}): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F'; label: string; color: string } {
  let score = 100;

  // Tasarruf oranı (max 30 puan)
  if (params.savingsRate >= 0.2) score -= 0;
  else if (params.savingsRate >= 0.1) score -= 10;
  else if (params.savingsRate >= 0.05) score -= 20;
  else score -= 30;

  // Gider/gelir oranı (max 25 puan)
  if (params.expenseRatio <= 0.7) score -= 0;
  else if (params.expenseRatio <= 0.85) score -= 10;
  else if (params.expenseRatio <= 1.0) score -= 20;
  else score -= 25;

  // Gecikmiş ödeme (max 20 puan)
  if (params.hasOverduePayments) score -= 20;

  // Borç/gelir oranı (max 15 puan)
  if (params.debtToIncomeRatio <= 0.2) score -= 0;
  else if (params.debtToIncomeRatio <= 0.35) score -= 8;
  else score -= 15;

  // Bütçe uyumu (max 10 puan)
  score -= Math.round((1 - params.budgetAdherence) * 10);

  score = Math.max(0, Math.min(100, score));

  if (score >= 85) return { score, grade: 'A', label: 'Mükemmel', color: '#10B981' };
  if (score >= 70) return { score, grade: 'B', label: 'İyi', color: '#3B82F6' };
  if (score >= 55) return { score, grade: 'C', label: 'Orta', color: '#F59E0B' };
  if (score >= 40) return { score, grade: 'D', label: 'Zayıf', color: '#F97316' };
  return { score, grade: 'F', label: 'Kritik', color: '#EF4444' };
}

export function Dashboard() {
  const { budgetData, calculateTotals, isSaving } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const activeName = currentPerson === 'Benim' ? person1Name : currentPerson === 'Esim' ? person2Name : null;
  const activeEmoji = currentPerson === 'Benim' ? '👨' : '👩';
  const totals = calculateTotals();
  const status = getFinancialStatus(totals.expenseRatio, totals.remainingActual);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Yıllık ödemeler bu ay
  const annualPaymentsThisMonth = (budgetData.annualPayments || [])
    .filter(p => p.paymentMonth === currentMonth)
    .reduce((sum, p) => sum + p.amount, 0);
  const annualPaymentsThisMonthList = (budgetData.annualPayments || [])
    .filter(p => p.paymentMonth === currentMonth);

  // Bu ay aktif taksitler
  const activeInstallments = (budgetData.installments || []).filter(inst => {
    const totalMonths = inst.startYear * 12 + (inst.startMonth - 1) + (inst.installmentCount - 1);
    const endYear = Math.floor(totalMonths / 12);
    const endMonth = (totalMonths % 12) + 1;
    const afterStart = currentYear > inst.startYear || (currentYear === inst.startYear && currentMonth >= inst.startMonth);
    const beforeEnd = currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth);
    return afterStart && beforeEnd;
  });
  const totalInstallmentsThisMonth = activeInstallments.reduce((sum, i) => sum + i.monthlyAmount, 0);

  // Net Değer hesaplama
  const netWorth = useMemo(() => {
    const totalSavings = (budgetData.savingsGoals || []).reduce((s, g) => s + (g.currentAmount || 0), 0);
    const totalDebt = (budgetData.debts || []).reduce((s, d) => s + (d.totalDebt || 0), 0);
    return totalSavings - totalDebt;
  }, [budgetData]);

  const budgetAdherence = 1;

  // Borç/gelir oranı
  const debtToIncomeRatio = totals.totalActualIncome > 0
    ? (budgetData.debts || []).reduce((s, d) => s + (d.monthlyPayment || 0), 0) / totals.totalActualIncome
    : 0;

  // Sağlık skoru
  const healthScore = useMemo(() => calcHealthScore({
    savingsRate: totals.savingsRate,
    expenseRatio: totals.expenseRatio,
    hasOverduePayments: budgetData.expenses.some(e => e.status === 'Gecikti'),
    debtToIncomeRatio,
    budgetAdherence,
  }), [totals, budgetData, debtToIncomeRatio, budgetAdherence]);

  // Bütçe vs Gerçekleşen kategorileri
  const budgetVsActual = useMemo(() => {
    const categories = ['Sabit', 'Degisken', 'Borc', 'Birikim'];
    return categories.map(type => {
      const planned = budgetData.expenses.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0);
      const actual = budgetData.expenses.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0);
      return { type, planned, actual, diff: actual - planned, pct: planned > 0 ? (actual / planned) * 100 : 0 };
    }).filter(c => c.planned > 0 || c.actual > 0);
  }, [budgetData]);

  // Yaklaşan yıllık ödemeler (sonraki 3 ay)
  const upcomingAnnual = useMemo(() => {
    return (budgetData.annualPayments || []).filter(p => {
      const diff = p.paymentMonth - currentMonth;
      return diff > 0 && diff <= 3;
    });
  }, [budgetData, currentMonth]);

  const MetricCard = ({ label, value, planned, color, trend }: {
    label: string; value: number; planned?: number; color: string; trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card className="card-metric card-metric-hover p-3 md:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">{label}</p>
          <p className="text-lg md:text-2xl font-display font-bold" style={{ color }}>
            {formatCurrency(value)}
          </p>
          {planned !== undefined && (
            <p className="text-xs text-muted-foreground mt-2">Planlanan: {formatCurrency(planned)}</p>
          )}
        </div>
        <div className="ml-4">
          {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
          {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
        </div>
      </div>
    </Card>
  );

  const ProgressBar = ({ label, actual, planned, color }: {
    label: string; actual: number; planned: number; color: string;
  }) => {
    const percentage = planned > 0 ? (actual / planned) * 100 : 0;
    const isOverBudget = actual > planned;
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatCurrency(actual)} / {formatCurrency(planned)}</span>
            <Badge variant={isOverBudget ? 'destructive' : 'secondary'} className="text-xs h-5 px-1.5">
              {percentage.toFixed(0)}%
            </Badge>
          </div>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div className="h-full transition-all duration-300" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: isOverBudget ? '#EF4444' : color }} />
        </div>
        {isOverBudget && <p className="text-xs text-red-600 mt-1">+{formatCurrency(actual - planned)} fazla harcama</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-1 flex items-center gap-2">
              <span role="img" aria-label="panda">🐼</span>
              {activeName ? `Merhaba, ${activeName}!` : 'ÜK Ailesi Bütçe Sistemi'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {budgetData.month} {budgetData.year}
              {activeName && <span className="ml-2">• {activeEmoji} {activeName} olarak görüntüleniyor</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSaving ? (
              <div className="flex items-center gap-1 text-blue-600">
                <Cloud className="w-4 h-4 animate-pulse" />
                <span className="text-xs font-medium">Kaydediliyor...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-green-600">
                <Cloud className="w-4 h-4" />
                <span className="text-xs font-medium">Bulut Senkron</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sağlık Skoru + Net Değer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bütçe Sağlık Skoru */}
        <Card className="p-5 md:col-span-2 border-l-4" style={{ borderLeftColor: healthScore.color }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: healthScore.color }} />
              <p className="font-display font-bold">Bütçe Sağlık Skoru</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-display font-bold" style={{ color: healthScore.color }}>
                {healthScore.score}
              </span>
              <div>
                <Badge style={{ backgroundColor: healthScore.color, color: 'white' }} className="text-sm font-bold">
                  {healthScore.grade}
                </Badge>
                <p className="text-xs text-muted-foreground mt-0.5">{healthScore.label}</p>
              </div>
            </div>
          </div>
          {/* Skor çubuğu */}
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${healthScore.score}%`, backgroundColor: healthScore.color }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Kritik</span>
            <span>Orta</span>
            <span>Mükemmel</span>
          </div>
          {/* Skor faktörleri */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-2 h-2 rounded-full ${totals.savingsRate >= 0.1 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Tasarruf: {formatPercentage(totals.savingsRate)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-2 h-2 rounded-full ${totals.expenseRatio <= 0.85 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Gider/Gelir: {formatPercentage(totals.expenseRatio)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-2 h-2 rounded-full ${!budgetData.expenses.some(e => e.status === 'Gecikti') ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Gecikmiş ödeme: {budgetData.expenses.filter(e => e.status === 'Gecikti').length} adet</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-2 h-2 rounded-full ${budgetAdherence >= 0.8 ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span>Bütçe uyumu: %{(budgetAdherence * 100).toFixed(0)}</span>
            </div>
          </div>
        </Card>

        {/* Net Değer */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <p className="font-display font-bold">Net Değer</p>
          </div>
          <p className={`text-3xl font-display font-bold mb-3 ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netWorth)}
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Toplam Birikim</span>
              <span className="font-mono text-green-600">
                +{formatCurrency((budgetData.savingsGoals || []).reduce((s, g) => s + (g.currentAmount || 0), 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Toplam Borç</span>
              <span className="font-mono text-red-600">
                -{formatCurrency((budgetData.debts || []).reduce((s, d) => s + (d.totalDebt || 0), 0))}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between font-medium">
              <span>Net</span>
              <span className={`font-mono ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netWorth)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Status */}
      <Card className="p-4 border-l-4" style={{ borderLeftColor: status.color }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-0.5">Finansal Durum</p>
            <p className="text-xl font-display font-bold">{status.icon} {status.status}</p>
          </div>
          {status.status === 'Riskli' && <AlertCircle className="w-7 h-7 text-red-500" />}
        </div>
      </Card>

      {/* Kişi Bazlı Özet */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 md:p-5 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <p className="text-xs text-muted-foreground mb-1">{person1Name}'in Giderleri</p>
          <p className="text-2xl font-display font-bold text-blue-600">{formatCurrency(totals.myExpenses)}</p>
          <p className="text-xs text-muted-foreground mt-1">Ev payı: {formatCurrency(totals.homeExpenses / 2)}</p>
        </Card>
        <Card className="p-4 md:p-5 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <p className="text-xs text-muted-foreground mb-1">{person2Name}'in Giderleri</p>
          <p className="text-2xl font-display font-bold text-purple-600">{formatCurrency(totals.spouseExpenses)}</p>
          <p className="text-xs text-muted-foreground mt-1">Ev payı: {formatCurrency(totals.homeExpenses / 2)}</p>
        </Card>
        <Card className="p-4 md:p-5 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <p className="text-xs text-muted-foreground mb-1">Sabit Giderler (Ortak)</p>
          <p className="text-2xl font-display font-bold text-orange-600">{formatCurrency(totals.homeExpenses)}</p>
          <p className="text-xs text-muted-foreground mt-1">Her biri: {formatCurrency(totals.homeExpenses / 2)}</p>
        </Card>
      </div>

      {/* Ana Metrikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Toplam Gelir" value={totals.totalActualIncome} planned={totals.totalPlannedIncome} color="#10B981" trend={totals.totalActualIncome >= totals.totalPlannedIncome ? 'up' : 'down'} />
        <MetricCard label="Toplam Gider" value={totals.totalActualExpense} planned={totals.totalPlannedExpense} color="#EF4444" trend={totals.totalActualExpense <= totals.totalPlannedExpense ? 'down' : 'up'} />
        <MetricCard label="Kalan Para" value={totals.remainingActual} color={totals.remainingActual >= 0 ? '#10B981' : '#EF4444'} trend={totals.remainingActual >= 0 ? 'up' : 'down'} />
        <MetricCard label="Tasarruf" value={totals.savingsAmount} color="#3B82F6" />
      </div>

      {/* Bütçe vs Gerçekleşen */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-display font-bold">Bütçe vs Gerçekleşen</h2>
        </div>
        <div className="space-y-3">
          <ProgressBar label="Sabit Giderler" actual={totals.fixedExpenses} planned={budgetData.expenses.filter(e => e.type === 'Sabit').reduce((s, e) => s + e.amount, 0)} color="#F97316" />
          <ProgressBar label="Değişken Giderler" actual={totals.variableExpenses} planned={budgetData.expenses.filter(e => e.type === 'Degisken').reduce((s, e) => s + e.amount, 0)} color="#EF4444" />
          <ProgressBar label="Borç Ödemeleri" actual={totals.debtPayments} planned={budgetData.expenses.filter(e => e.type === 'Borc').reduce((s, e) => s + e.amount, 0)} color="#F97316" />
          <ProgressBar label="Birikim / Yatırım" actual={totals.savingsAmount} planned={budgetData.expenses.filter(e => e.type === 'Birikim').reduce((s, e) => s + e.amount, 0)} color="#3B82F6" />
        </div>

        {/* Bütçe Uyum Özeti */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3">
          <div className="p-3 bg-secondary rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Gider / Gelir Oranı</p>
            <p className="text-xl font-display font-bold">{formatPercentage(totals.expenseRatio)}</p>
            <p className="text-xs text-muted-foreground mt-1">{totals.expenseRatio > 0.8 ? '⚠️ Bütçe yüksek' : '✅ Bütçe dengede'}</p>
          </div>
          <div className="p-3 bg-secondary rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Tasarruf Oranı</p>
            <p className="text-xl font-display font-bold">{formatPercentage(totals.savingsRate)}</p>
            <p className="text-xs text-muted-foreground mt-1">{totals.savingsRate >= 0.1 ? '✅ Hedef oranında' : '⚠️ Hedefin altında'}</p>
          </div>
        </div>
      </Card>

      {/* Uyarılar */}
      <div className="space-y-3">
        {/* Gecikmiş ödemeler */}
        {budgetData.expenses.some(e => e.status === 'Gecikti') && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-200">Gecikmiş Ödemeler Var</p>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                  {budgetData.expenses.filter(e => e.status === 'Gecikti').length} ödeme gecikmiş durumda. Giderler sayfasını kontrol edin.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {budgetData.expenses.filter(e => e.status === 'Gecikti').map(e => (
                    <span key={e.id} className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full">
                      {e.category}: {formatCurrency(e.amount)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Bu ay taksitler */}
        {totalInstallmentsThisMonth > 0 && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-900 dark:text-blue-200">
                  Bu Ay Taksit Ödemeleri ({activeInstallments.length} ürün)
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  Toplam {formatCurrency(totalInstallmentsThisMonth)} taksit ödemesi bu ay yapılacak.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {activeInstallments.map(inst => (
                    <span key={inst.id} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                      {inst.name}: {formatCurrency(inst.monthlyAmount)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Bu ay yıllık ödemeler */}
        {annualPaymentsThisMonth > 0 && (
          <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-orange-900 dark:text-orange-200">Bu Ay Yıllık Ödemeler Var</p>
                <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                  {formatCurrency(annualPaymentsThisMonth)} tutarında yıllık ödeme bu ay yapılacak.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {annualPaymentsThisMonthList.map(p => (
                    <span key={p.id} className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full">
                      {p.name}: {formatCurrency(p.amount)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Yaklaşan yıllık ödemeler (sonraki 3 ay) */}
        {upcomingAnnual.length > 0 && (
          <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-200">Yaklaşan Yıllık Ödemeler (3 Ay)</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {upcomingAnnual.map(p => (
                    <span key={p.id} className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                      {p.name} ({['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][p.paymentMonth - 1]}): {formatCurrency(p.amount)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Bütçe aşımı uyarısı */}
        {budgetVsActual.some(c => c.pct > 110) && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-200">Bütçe Aşımı Tespit Edildi</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {budgetVsActual.filter(c => c.pct > 110).map(c => (
                    <span key={c.type} className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full">
                      {c.type}: %{c.pct.toFixed(0)} ({formatCurrency(c.diff)} fazla)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
