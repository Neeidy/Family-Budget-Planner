import { useMemo } from "react";
import { useLocation } from "wouter";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { usePersonFilter } from "@/contexts/PersonFilterContext";
import {
  Avatar,
  HeroMetric,
  OwnerCard,
  SummaryCard,
  PersonFilterChips,
  CategoryPill,
} from "@/components/design";
import type { FilterValue } from "@/components/design";
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from "lucide-react";
import { formatMoney, formatPct } from "@/lib/format";
import { FILTER_TO_LOCAL, LOCAL_TO_FILTER, applyPersonFilter } from "@/lib/personFilter";

// ── Bütçe Sağlık Skoru (preserved from original) ──────────────
function calcHealthScore(params: {
  savingsRate: number;
  expenseRatio: number;
  hasOverduePayments: boolean;
  debtToIncomeRatio: number;
  budgetAdherence: number;
}): { score: number; grade: "A" | "B" | "C" | "D" | "F"; label: string; color: string } {
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
  score = Math.max(0, Math.min(100, score));

  if (score >= 85) return { score, grade: "A", label: "Mükemmel", color: "var(--status-success)" };
  if (score >= 70) return { score, grade: "B", label: "İyi",      color: "var(--owner-yigit)" };
  if (score >= 55) return { score, grade: "C", label: "Orta",     color: "var(--status-warning)" };
  if (score >= 40) return { score, grade: "D", label: "Zayıf",    color: "var(--owner-ev)" };
  return            { score, grade: "F", label: "Kritik",   color: "var(--status-danger)" };
}

// ── Top categories per owner ──────────────────────────────────
function topCategoriesForOwner(
  expenses: { category: string; amount: number; owner: string }[],
  owner: "Benim" | "Esim" | "Ev",
): string[] {
  const counts = new Map<string, number>();
  expenses
    .filter((e) => e.owner === owner)
    .forEach((e) => {
      counts.set(e.category, (counts.get(e.category) ?? 0) + e.amount);
    });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);
}

// ── Budget vs Actual rows ─────────────────────────────────────
interface BvARow {
  category: string;
  planned: number;
  actual: number;
  pct: number;
}

function buildBudgetVsActual(
  expenses: { category: string; amount: number }[],
  budgetLimits: { category: string; limit: number }[],
): BvARow[] {
  const rows: BvARow[] = budgetLimits.map((bl) => {
    const actual = expenses
      .filter((e) => e.category === bl.category)
      .reduce((s, e) => s + e.amount, 0);
    return {
      category: bl.category,
      planned: bl.limit,
      actual,
      pct: bl.limit > 0 ? (actual / bl.limit) * 100 : 0,
    };
  });
  return rows.sort((a, b) => b.actual - a.actual).slice(0, 5);
}

// ── Dashboard ─────────────────────────────────────────────────
export function Dashboard() {
  const { budgetData, calculateTotals } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const { filter, setFilter } = usePersonFilter();
  const [, setLocation] = useLocation();

  // Person filter applied to data — drives summary, BvA, health
  const filteredIncomes  = useMemo(() => applyPersonFilter(budgetData.incomes,  filter), [budgetData.incomes,  filter]);
  const filteredExpenses = useMemo(() => applyPersonFilter(budgetData.expenses, filter), [budgetData.expenses, filter]);

  const fullTotals = calculateTotals(); // for owner-bound metrics

  // Filter-aware totals (for summary cards, health score, BvA)
  const filteredTotals = useMemo(() => {
    const totalIncome  = filteredIncomes.reduce((s, i) => s + i.amount, 0);
    const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const remaining    = totalIncome - totalExpense;
    const savingsAmount = filteredExpenses.filter((e) => e.type === "Birikim").reduce((s, e) => s + e.amount, 0);
    const expenseRatio = totalIncome > 0 ? totalExpense / totalIncome : 0;
    const savingsRate  = totalIncome > 0 ? savingsAmount / totalIncome : 0;
    return { totalIncome, totalExpense, remaining, savingsAmount, expenseRatio, savingsRate };
  }, [filteredIncomes, filteredExpenses]);

  const activeName  = currentPerson === "Benim" ? person1Name : person2Name;
  const activeWho   = currentPerson === "Benim" ? "yigit"     : "arzu";
  const activeEmoji = currentPerson === "Benim" ? "👨"        : "👩";

  // Net Değer (always full data — net worth isn't a filter concern)
  const netWorth = useMemo(() => {
    const totalSavings = (budgetData.savingsGoals || []).reduce((s, g) => s + (g.currentAmount || 0), 0);
    const totalDebt    = (budgetData.debts || []).reduce((s, d) => s + (d.totalDebt || 0), 0);
    return { netWorth: totalSavings - totalDebt, totalSavings, totalDebt };
  }, [budgetData.savingsGoals, budgetData.debts]);

  // Health score (filtered — reflects the active scope)
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

  // Top cats per owner (always full data — owner cards are inherently per-owner)
  const yigitCats = useMemo(() => topCategoriesForOwner(budgetData.expenses, "Benim"), [budgetData.expenses]);
  const arzuCats  = useMemo(() => topCategoriesForOwner(budgetData.expenses, "Esim"),  [budgetData.expenses]);
  const evCats    = useMemo(() => topCategoriesForOwner(budgetData.expenses, "Ev"),    [budgetData.expenses]);

  // Budget vs Actual (filtered)
  const bvaRows = useMemo(
    () => buildBudgetVsActual(filteredExpenses, budgetData.budgetLimits ?? []),
    [filteredExpenses, budgetData.budgetLimits],
  );

  // Page-wide emptiness — used for info banner only
  const isEmpty = budgetData.incomes.length === 0 && budgetData.expenses.length === 0;

  // Financial status (net worth based)
  const finStatus = netWorth.netWorth >= 1000
    ? { dot: "🟢", label: "İyi",     desc: "Birikiminiz borçlarınızdan fazla, yolundasınız." }
    : netWorth.netWorth >= 0
    ? { dot: "🟡", label: "Dikkat",  desc: "Birikim ile borç yakın seviyede, dikkatli ilerleyin." }
    : { dot: "🔴", label: "Risk",    desc: "Borçlar birikimi aşıyor, plan revize edilmeli." };

  // Filter values mapped
  const fazBFilter: FilterValue = LOCAL_TO_FILTER[filter];
  const handleFilterChange = (v: FilterValue) => setFilter(FILTER_TO_LOCAL[v]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: 0,
            color: "var(--text-primary)",
          }}>
            Merhaba, {activeName}! <span style={{ display: "inline-block", animation: "wave 1.6s ease-in-out infinite", transformOrigin: "70% 70%" }}>👋</span>
          </h1>
          <div style={{
            fontSize: 13,
            color: "var(--text-tertiary)",
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}>
            <span>{budgetData.month} {budgetData.year}</span>
            <span>•</span>
            <Avatar who={activeWho} size={18} />
            <span>{activeEmoji} {activeName} olarak görüntüleniyor</span>
          </div>
        </div>
      </div>

      {/* Person Filter */}
      <PersonFilterChips value={fazBFilter} onChange={handleFilterChange} labels={{
        yigit: person1Name,
        arzu:  person2Name,
      }} />

      {/* Empty info banner — only when entire DB is empty */}
      {isEmpty && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
          borderRadius: "var(--r-md)",
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
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: "var(--r-md)",
              fontSize: 13,
              fontWeight: 600,
              background: "var(--accent-green)",
              color: "oklch(0.15 0.03 155)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Başla <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {/* HEALTH SCORE — full-width hero band */}
      <div style={{
        background: "var(--bg-surface)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-card)",
        padding: 24,
        borderLeft: `4px solid ${healthScore.color}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="section-label">BÜTÇE SAĞLIK SKORU</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
              {healthScore.label}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="hero-num" style={{
              fontSize: "clamp(2.25rem, 4vw, 3rem)",
              fontWeight: 700,
              color: healthScore.color,
              lineHeight: 1,
            }}>
              {healthScore.score}
            </span>
            <div style={{
              padding: "4px 10px",
              borderRadius: 8,
              background: healthScore.color,
              color: "white",
              fontSize: 14,
              fontWeight: 700,
            }}>
              {healthScore.grade}
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div style={{
          width: "100%",
          height: 10,
          background: "var(--bg-tint)",
          borderRadius: 999,
          overflow: "hidden",
          marginTop: 16,
        }}>
          <div style={{
            width: `${healthScore.score}%`,
            height: "100%",
            background: `linear-gradient(90deg, var(--status-danger), var(--status-warning), var(--status-success))`,
            borderRadius: 999,
            transition: "width 600ms cubic-bezier(0.2, 0, 0, 1)",
          }} />
        </div>

        {/* Mini stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          marginTop: 16,
        }}>
          <MiniStat ok={filteredTotals.savingsRate >= 0.10}
            label={`Tasarruf: ${formatPct(filteredTotals.savingsRate)}`} />
          <MiniStat ok={filteredTotals.expenseRatio <= 0.85}
            label={`Gider/Gelir: ${formatPct(filteredTotals.expenseRatio)}`} />
          <MiniStat ok={!budgetData.expenses.some((e) => e.status === "Gecikti")}
            label={`Gecikmiş: ${budgetData.expenses.filter((e) => e.status === "Gecikti").length} adet`} />
          <MiniStat ok={debtToIncomeRatio <= 0.35}
            label={`Borç/Gelir: ${formatPct(debtToIncomeRatio)}`} />
        </div>
      </div>

      {/* NET DEĞER + FİNANSAL DURUM */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: 16,
      }} className="dashboard-twocol">
        <HeroMetric
          label="NET DEĞER"
          value={
            <span style={{ color: netWorth.netWorth >= 0 ? "var(--accent-green)" : "var(--status-danger)" }}>
              {formatMoney(netWorth.netWorth)}
            </span>
          }
          subtitle={
            <span>
              <span style={{ color: "var(--accent-green)" }}>+{formatMoney(netWorth.totalSavings)} birikim</span>
              {"  •  "}
              <span style={{ color: "var(--status-danger)" }}>−{formatMoney(netWorth.totalDebt)} borç</span>
            </span>
          }
          action={<Wallet style={{ width: 18, height: 18, color: "var(--owner-yigit)" }} />}
        />

        <div style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-card)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 8,
        }}>
          <div className="section-label">FİNANSAL DURUM</div>
          <div className="hero-num" style={{
            fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "var(--text-primary)",
          }}>
            {finStatus.dot} {finStatus.label}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
            {finStatus.desc}
          </div>
        </div>
      </div>

      {/* OWNER CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 16,
      }}>
        <OwnerCard
          who="yigit"
          title={`${person1Name.toLocaleUpperCase("tr-TR")}'İN GİDERLERİ`}
          amount={formatMoney(fullTotals.myExpenses)}
          subtitle={yigitCats.length === 0 ? "Bu ay gider yok" : `Ev payı: ${formatMoney(fullTotals.homeExpenses / 2)}`}
          cats={yigitCats}
        />
        <OwnerCard
          who="arzu"
          title={`${person2Name.toLocaleUpperCase("tr-TR")}'IN GİDERLERİ`}
          amount={formatMoney(fullTotals.spouseExpenses)}
          subtitle={arzuCats.length === 0 ? "Bu ay gider yok" : `Ev payı: ${formatMoney(fullTotals.homeExpenses / 2)}`}
          cats={arzuCats}
        />
        <OwnerCard
          who="ev"
          title="SABİT GİDERLER (ORTAK)"
          amount={formatMoney(fullTotals.homeExpenses)}
          subtitle={evCats.length === 0 ? "Ortak gider yok" : `Her biri: ${formatMoney(fullTotals.homeExpenses / 2)}`}
          cats={evCats}
        />
      </div>

      {/* SUMMARY CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
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

      {/* BÜTÇE VS GERÇEKLEŞEN */}
      <div className="card">
        <div className="section-label" style={{ marginBottom: 16 }}>
          BÜTÇE VS GERÇEKLEŞEN
        </div>
        {bvaRows.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {bvaRows.map((row) => (
              <BvARow key={row.category} row={row} />
            ))}
          </div>
        ) : (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "24px 16px",
            fontSize: 13,
            color: "var(--text-tertiary)",
            textAlign: "center",
          }}>
            <span style={{ fontSize: 22 }}>🎯</span>
            <span>
              Bütçe limiti eklenmemiş.{" "}
              <button
                type="button"
                onClick={() => setLocation("/gelir-gider")}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  color: "var(--accent-green)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Gelir & Gider
              </button>
              {" "}sayfasından ekleyin.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function MiniStat({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
      <span style={{ fontSize: 10 }}>{ok ? "🟢" : "🔴"}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{label}</span>
    </div>
  );
}

function BvARow({ row }: { row: BvARow }) {
  const isOver = row.actual > row.planned;
  const plannedPct = 100;
  const actualPct = Math.min(150, row.pct);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
        <CategoryPill cat={row.category} size="sm" />
        <div className="hero-num" style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          {formatMoney(row.actual)} / {formatMoney(row.planned)}
        </div>
      </div>
      {/* Planned bar (track) */}
      <div style={{
        position: "relative",
        height: 8,
        background: "var(--bg-tint)",
        borderRadius: 999,
        overflow: "hidden",
      }}>
        <div style={{
          width: `${(actualPct / 150) * 100}%`,
          height: "100%",
          background: isOver ? "var(--status-danger)" : row.pct >= 80 ? "var(--status-warning)" : "var(--accent-green)",
          borderRadius: 999,
          transition: "width 600ms cubic-bezier(0.2, 0, 0, 1)",
        }} />
        {/* 100% mark */}
        <div style={{
          position: "absolute",
          top: 0,
          left: `${(plannedPct / 150) * 100}%`,
          width: 1,
          height: "100%",
          background: "var(--text-muted)",
          opacity: 0.5,
        }} />
      </div>
    </div>
  );
}
