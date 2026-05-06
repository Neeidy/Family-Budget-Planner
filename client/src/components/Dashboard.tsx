import { useMemo } from "react";
import { useLocation } from "wouter";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { usePersonFilter } from "@/contexts/PersonFilterContext";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Avatar,
  OwnerCard,
  SummaryCard,
  PersonFilterChips,
  CategoryPill,
  QuickStatsPill,
  HealthBubble,
  TodaySummaryStripCompact,
} from "@/components/design";
import type { AvatarWho, FilterValue } from "@/components/design";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { formatMoney, formatMoneyShort } from "@/lib/format";
import { FILTER_TO_LOCAL, LOCAL_TO_FILTER, applyPersonFilter } from "@/lib/personFilter";

// ── Bütçe Sağlık Skoru (preserved scoring logic, used by HealthBubble) ──
function calcHealthScore(params: {
  savingsRate: number;
  expenseRatio: number;
  hasOverduePayments: boolean;
  debtToIncomeRatio: number;
  budgetAdherence: number;
}): number {
  let score = 100;
  if      (params.savingsRate >= 0.20) score -= 0;
  else if (params.savingsRate >= 0.10) score -= 10;
  else if (params.savingsRate >= 0.05) score -= 20;
  else                                  score -= 30;
  if      (params.expenseRatio <= 0.70) score -= 0;
  else if (params.expenseRatio <= 0.85) score -= 10;
  else if (params.expenseRatio <= 1.00) score -= 20;
  else                                   score -= 25;
  if (params.hasOverduePayments) score -= 20;
  if      (params.debtToIncomeRatio <= 0.20) score -= 0;
  else if (params.debtToIncomeRatio <= 0.35) score -= 8;
  else                                        score -= 15;
  score -= Math.round((1 - params.budgetAdherence) * 10);
  return Math.max(0, Math.min(100, score));
}

// ── Top categories per owner ──
function topCategoriesForOwner(
  expenses: { category: string; amount: number; owner: string }[],
  owner: "Benim" | "Esim" | "Ev",
): string[] {
  const counts = new Map<string, number>();
  expenses
    .filter((e) => e.owner === owner)
    .forEach((e) => counts.set(e.category, (counts.get(e.category) ?? 0) + e.amount));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);
}

// ── Map local filter (Tümü/Benim/Esim/Ev) to design-ref filter (tumu/yigit/arzu/ev) ──
type DesignFilter = "tumu" | "yigit" | "arzu" | "ev";
const DESIGN_FILTER: Record<string, DesignFilter> = {
  "Tümü": "tumu",
  "Benim": "yigit",
  "Esim":  "arzu",
  "Ev":    "ev",
};

// ── Dashboard ─────────────────────────────────────────────────
export function Dashboard() {
  const { budgetData, calculateTotals } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const { filter, setFilter } = usePersonFilter();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const mobile = !!isMobile;

  // Person filter applied to data
  const filteredIncomes  = useMemo(() => applyPersonFilter(budgetData.incomes,  filter), [budgetData.incomes,  filter]);
  const filteredExpenses = useMemo(() => applyPersonFilter(budgetData.expenses, filter), [budgetData.expenses, filter]);

  const fullTotals = calculateTotals();

  const filteredTotals = useMemo(() => {
    const totalIncome  = filteredIncomes.reduce((s, i) => s + i.amount, 0);
    const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const remaining    = totalIncome - totalExpense;
    const savingsAmount = filteredExpenses.filter((e) => e.type === "Birikim").reduce((s, e) => s + e.amount, 0);
    const expenseRatio = totalIncome > 0 ? totalExpense / totalIncome : 0;
    const savingsRate  = totalIncome > 0 ? savingsAmount / totalIncome : 0;
    return { totalIncome, totalExpense, remaining, savingsAmount, expenseRatio, savingsRate };
  }, [filteredIncomes, filteredExpenses]);

  const activeName = currentPerson === "Benim" ? person1Name : person2Name;
  const activeWho: AvatarWho = currentPerson === "Benim" ? "yigit" : "arzu";

  // Net Değer (always full data)
  const netWorth = useMemo(() => {
    const totalSavings = (budgetData.savingsGoals || []).reduce((s, g) => s + (g.currentAmount || 0), 0);
    const totalDebt    = (budgetData.debts || []).reduce((s, d) => s + (d.totalDebt || 0), 0);
    const monthDelta   = filteredTotals.savingsAmount; // rough proxy "↑ this month"
    return { netWorth: totalSavings - totalDebt, totalSavings, totalDebt, monthDelta };
  }, [budgetData.savingsGoals, budgetData.debts, filteredTotals.savingsAmount]);

  const debtToIncomeRatio = filteredTotals.totalIncome > 0
    ? (budgetData.debts || []).reduce((s, d) => s + (d.monthlyPayment || 0), 0) / filteredTotals.totalIncome
    : 0;
  const healthScore = useMemo(
    () => calcHealthScore({
      savingsRate: filteredTotals.savingsRate,
      expenseRatio: filteredTotals.expenseRatio,
      hasOverduePayments: filteredExpenses.some((e) => e.status === "Gecikti"),
      debtToIncomeRatio,
      budgetAdherence: 1,
    }),
    [filteredTotals.savingsRate, filteredTotals.expenseRatio, filteredExpenses, debtToIncomeRatio],
  );

  // Top cats per owner
  const yigitCats = useMemo(() => topCategoriesForOwner(budgetData.expenses, "Benim"), [budgetData.expenses]);
  const arzuCats  = useMemo(() => topCategoriesForOwner(budgetData.expenses, "Esim"),  [budgetData.expenses]);
  const evCats    = useMemo(() => topCategoriesForOwner(budgetData.expenses, "Ev"),    [budgetData.expenses]);

  // QuickStats values (today / month / tomorrow)
  const todayKey = new Date().toISOString().split("T")[0];
  const todaySpent = filteredExpenses
    .filter((e) => e.paymentDay === todayKey)
    .reduce((s, e) => s + e.amount, 0);
  const monthBudget = (budgetData.budgetLimits || []).reduce((s, b) => s + b.limit, 0) || 3500;
  const monthSpent = filteredTotals.totalExpense;
  const monthRemaining = monthBudget - monthSpent;
  const tomorrowDue = filteredExpenses
    .filter((e) => e.status === "Bekliyor")
    .reduce((s, e) => s + e.amount, 0);

  // Bütçe vs Gerçekleşen — sample categories from design ref + actual data fallback
  const bvaSamples = useMemo(() => {
    const sample = [
      { cat: "konut",   plan: 1500, real: 1380 },
      { cat: "yiyecek", plan:  600, real:  565 },
      { cat: "ulasim",  plan:  250, real:  255 },
      { cat: "eglence", plan:  300, real:  240 },
      { cat: "saglik",  plan:  320, real:  320 },
    ];
    if ((budgetData.budgetLimits ?? []).length === 0) return sample;
    // Use real data when budget limits exist
    return (budgetData.budgetLimits ?? []).slice(0, 5).map((bl) => ({
      cat: bl.category,
      plan: bl.limit,
      real: filteredExpenses
        .filter((e) => e.category === bl.category)
        .reduce((s, e) => s + e.amount, 0),
    }));
  }, [budgetData.budgetLimits, filteredExpenses]);

  const isEmpty = budgetData.incomes.length === 0 && budgetData.expenses.length === 0;

  // Map filter values for design-ref components
  const fazBFilter: FilterValue = LOCAL_TO_FILTER[filter];
  const handleFilterChange = (v: FilterValue) => setFilter(FILTER_TO_LOCAL[v]);
  const designFilter: DesignFilter = DESIGN_FILTER[filter] ?? "tumu";

  const goRapor = () => setLocation("/raporlar");

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: mobile ? 16 : 20 }}>
      {/* Greeting — line-by-line: page-ana.jsx:46-54 */}
      <div>
        <h1 style={{
          fontSize: mobile ? 24 : 28, margin: 0,
          fontWeight: 700, letterSpacing: "-0.02em",
        }}>
          Merhaba, {activeName}! <span style={{ display: "inline-block", animation: "wave 1.6s ease-in-out infinite", transformOrigin: "70% 70%" }}>👋</span>
        </h1>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 6 }}>
          {budgetData.month} {budgetData.year} • <Avatar who={activeWho} size={16}/>
          <span style={{ verticalAlign: "middle", marginLeft: 4 }}>{activeName} olarak görüntüleniyor</span>
        </div>
      </div>

      {/* Person filter (preserved — controls all derived data) */}
      <PersonFilterChips value={fazBFilter} onChange={handleFilterChange} labels={{
        yigit: person1Name,
        arzu:  person2Name,
      }} />

      {/* QUICK STATS PILL — page-ana.jsx:57-62 */}
      <QuickStatsPill
        mobile={mobile}
        todaySpent={todaySpent}
        monthRemaining={monthRemaining}
        monthBudget={monthBudget}
        monthSpent={monthSpent}
        tomorrowDue={tomorrowDue}
      />

      {/* Empty info banner — only when entire DB is empty */}
      {isEmpty && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, padding: "12px 16px", borderRadius: "var(--r-md)",
          background: "color-mix(in oklch, var(--owner-yigit) 12%, var(--bg-surface))",
          border: "1px solid color-mix(in oklch, var(--owner-yigit) 25%, transparent)",
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-secondary)" }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <span><strong style={{ color: "var(--text-primary)" }}>Henüz veri yok.</strong> Gelir & Gider sayfasından eklemeye başlayın.</span>
          </div>
          <button
            type="button"
            onClick={() => setLocation("/gelir-gider")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: "var(--r-md)",
              fontSize: 13, fontWeight: 600,
              background: "var(--accent-green)", color: "oklch(0.15 0.03 155)",
              border: "none", cursor: "pointer",
            }}
          >
            Başla <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {/* HERO 2-col: Net Değer (with HealthBubble inside) + YARIN ÖDENECEK — page-ana.jsx:65-92 */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 12 : 16, position: "relative" }}>
        <div className="card lift" style={{ position: "relative", overflow: mobile ? "visible" : "hidden" }}>
          <div className="section-label">NET DEĞER</div>
          <div className="tnum" style={{ fontSize: mobile ? 44 : 52, fontWeight: 700, marginTop: 8, letterSpacing: "-0.035em", lineHeight: 1.05 }}>
            {formatMoney(netWorth.netWorth).replace(/,\d{2}/, "")}
            <span style={{ color: "var(--text-tertiary)", fontSize: "0.5em" }}>{formatMoney(netWorth.netWorth).match(/,\d{2}/)?.[0] ?? ",00"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <span className="pill" style={{
              background: "var(--accent-green-soft)", color: "var(--accent-green)",
              fontSize: 11, fontWeight: 700, padding: "3px 8px",
            }}>↑ {formatMoney(netWorth.monthDelta)} bu ay</span>
          </div>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Toplam Birikim</div>
              <div className="tnum" style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-green)", flexShrink: 0, whiteSpace: "nowrap" }}>+{formatMoney(netWorth.totalSavings)} ↑</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Toplam Borç</div>
              <div className="tnum" style={{ fontSize: 15, fontWeight: 700, color: "var(--status-danger)", flexShrink: 0, whiteSpace: "nowrap" }}>−{formatMoney(netWorth.totalDebt)} ↓</div>
            </div>
          </div>
          {/* Floating HealthBubble inside card */}
          <HealthBubble score={healthScore} mobile={mobile} onClick={goRapor} />
        </div>

        <TodaySummaryStripCompact mobile={mobile} filter={designFilter} />
      </div>

      {/* OWNER CARDS (3-col) — page-ana.jsx:95-103 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)",
        gap: mobile ? 12 : 16,
      }}>
        <OwnerCard
          who="yigit"
          title={`${person1Name.toLocaleUpperCase("tr-TR")}'İN GİDERLERİ`}
          amount={formatMoney(fullTotals.myExpenses)}
          subtitle={`Ev payı: ${formatMoney(fullTotals.homeExpenses / 2)}`}
          cats={yigitCats.length > 0 ? yigitCats : ["yiyecek", "ulasim", "spor"]}
        />
        <OwnerCard
          who="arzu"
          title={`${person2Name.toLocaleUpperCase("tr-TR")}'IN GİDERLERİ`}
          amount={formatMoney(fullTotals.spouseExpenses)}
          subtitle={`Ev payı: ${formatMoney(fullTotals.homeExpenses / 2)}`}
          cats={arzuCats.length > 0 ? arzuCats : ["eglence", "abonelik", "yiyecek"]}
        />
        <OwnerCard
          who="ev"
          title="ORTAK GİDERLER"
          amount={formatMoney(fullTotals.homeExpenses)}
          subtitle={`Her biri: ${formatMoney(fullTotals.homeExpenses / 2)}`}
          cats={evCats.length > 0 ? evCats : ["konut", "saglik", "yiyecek"]}
        />
      </div>

      {/* SUMMARY CARDS — page-ana.jsx:106-115 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: mobile ? 10 : 14,
      }}>
        <SummaryCard
          label="Toplam Gelir"
          amount={formatMoney(filteredTotals.totalIncome)}
          color="green"
          icon={<TrendingUp style={{ width: 14, height: 14 }} />}
        />
        <SummaryCard
          label="Toplam Gider"
          amount={formatMoney(filteredTotals.totalExpense)}
          color="red"
          icon={<TrendingDown style={{ width: 14, height: 14 }} />}
        />
        <SummaryCard
          label="Kalan Para"
          amount={formatMoney(filteredTotals.remaining)}
          color={filteredTotals.remaining >= 0 ? "green" : "red"}
          delta={{ value: filteredTotals.remaining >= 0 ? "↗" : "↘", positive: filteredTotals.remaining >= 0 }}
        />
        <SummaryCard
          label="Tasarruf"
          amount={formatMoney(filteredTotals.savingsAmount)}
          color="blue"
          delta={{ value: "↗", positive: true }}
        />
      </div>

      {/* BÜTÇE VS GERÇEKLEŞEN — page-ana.jsx:118-159 */}
      <div className="card" style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div className="section-label">BÜTÇE VS GERÇEKLEŞEN</div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>
              {budgetData.month} ayı kategori karşılaştırması
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-tertiary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--bg-tint)" }}/>Plan
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--accent-green)" }}/>Gerçek
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {bvaSamples.map((b) => {
            const max = Math.max(b.plan, b.real, 1);
            const overBudget = b.real > b.plan;
            return (
              <div key={b.cat} style={{
                display: "grid",
                gridTemplateColumns: mobile ? "90px 1fr 60px" : "120px 1fr 80px",
                gap: 12, alignItems: "center",
              }}>
                <CategoryPill cat={b.cat} size="sm" />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ height: 6, background: "var(--bg-tint)", borderRadius: 999, position: "relative", overflow: "hidden" }}>
                    <div style={{ width: `${(b.plan / max) * 100}%`, height: "100%", background: "var(--bg-tint)", filter: "brightness(1.4)" }}/>
                  </div>
                  <div style={{ height: 8, background: "var(--bg-tint)", borderRadius: 999, position: "relative", overflow: "hidden" }}>
                    <div style={{
                      width: `${(b.real / max) * 100}%`,
                      height: "100%",
                      background: overBudget ? "var(--status-danger)" : "var(--accent-green)",
                      transition: "width 800ms ease-out",
                    }}/>
                  </div>
                </div>
                <div className="tnum" style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "right" }}>
                  {formatMoneyShort(b.real)}<span style={{ color: "var(--text-muted)" }}>/{formatMoneyShort(b.plan)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
