import { useMemo } from "react";
import { useLocation } from "wouter";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { usePersonFilter, PersonFilter } from "@/contexts/PersonFilterContext";
import {
  Avatar,
  HeroMetric,
  OwnerCard,
  SummaryCard,
  PersonFilterChips,
  EmptyState,
  CategoryPill,
} from "@/components/design";
import type { FilterValue } from "@/components/design";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatMoney, formatPct } from "@/lib/format";

// ── PersonFilter ↔ FilterValue bridge ─────────────────────────
const FILTER_TO_LOCAL: Record<FilterValue, PersonFilter> = {
  tumu:  "Tümü",
  yigit: "Benim",
  arzu:  "Esim",
  ev:    "Ev",
};
const LOCAL_TO_FILTER: Record<PersonFilter, FilterValue> = {
  "Tümü":  "tumu",
  "Benim": "yigit",
  "Esim":  "arzu",
  "Ev":    "ev",
};

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

  const totals = calculateTotals();

  const activeName  = currentPerson === "Benim" ? person1Name : person2Name;
  const activeWho   = currentPerson === "Benim" ? "yigit"     : "arzu";
  const activeEmoji = currentPerson === "Benim" ? "👨"        : "👩";

  // Net Değer
  const netWorth = useMemo(() => {
    const totalSavings = (budgetData.savingsGoals || []).reduce((s, g) => s + (g.currentAmount || 0), 0);
    const totalDebt    = (budgetData.debts || []).reduce((s, d) => s + (d.totalDebt || 0), 0);
    return { netWorth: totalSavings - totalDebt, totalSavings, totalDebt };
  }, [budgetData.savingsGoals, budgetData.debts]);

  // Health score
  const debtToIncomeRatio = totals.totalActualIncome > 0
    ? (budgetData.debts || []).reduce((s, d) => s + (d.monthlyPayment || 0), 0) / totals.totalActualIncome
    : 0;

  const healthScore = useMemo(
    () => calcHealthScore({
      savingsRate: totals.savingsRate,
      expenseRatio: totals.expenseRatio,
      hasOverduePayments: budgetData.expenses.some((e) => e.status === "Gecikti"),
      debtToIncomeRatio,
      budgetAdherence: 1,
    }),
    [totals.savingsRate, totals.expenseRatio, budgetData.expenses, debtToIncomeRatio],
  );

  // Top cats per owner
  const yigitCats = useMemo(() => topCategoriesForOwner(budgetData.expenses, "Benim"), [budgetData.expenses]);
  const arzuCats  = useMemo(() => topCategoriesForOwner(budgetData.expenses, "Esim"),  [budgetData.expenses]);
  const evCats    = useMemo(() => topCategoriesForOwner(budgetData.expenses, "Ev"),    [budgetData.expenses]);

  // Budget vs Actual
  const bvaRows = useMemo(
    () => buildBudgetVsActual(budgetData.expenses, budgetData.budgetLimits ?? []),
    [budgetData.expenses, budgetData.budgetLimits],
  );

  // Empty state
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

  if (isEmpty) {
    return (
      <div style={{ padding: "32px 16px" }}>
        <EmptyState
          emoji="📊"
          title="Henüz veri yok"
          description="İlk gelir veya giderinizi ekleyerek bütçenizi takip etmeye başlayın."
          cta={{ label: "Başla", onClick: () => setLocation("/gelir-gider") }}
        />
      </div>
    );
  }

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
            Merhaba, {activeName}! <span style={{ display: "inline-block" }}>👋</span>
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
          <MiniStat ok={totals.savingsRate >= 0.10}
            label={`Tasarruf: ${formatPct(totals.savingsRate)}`} />
          <MiniStat ok={totals.expenseRatio <= 0.85}
            label={`Gider/Gelir: ${formatPct(totals.expenseRatio)}`} />
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
          amount={formatMoney(totals.myExpenses)}
          subtitle={`Ev payı: ${formatMoney(totals.homeExpenses / 2)}`}
          cats={yigitCats}
        />
        <OwnerCard
          who="arzu"
          title={`${person2Name.toLocaleUpperCase("tr-TR")}'IN GİDERLERİ`}
          amount={formatMoney(totals.spouseExpenses)}
          subtitle={`Ev payı: ${formatMoney(totals.homeExpenses / 2)}`}
          cats={arzuCats}
        />
        <OwnerCard
          who="ev"
          title="SABİT GİDERLER (ORTAK)"
          amount={formatMoney(totals.homeExpenses)}
          subtitle={`Her biri: ${formatMoney(totals.homeExpenses / 2)}`}
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
          amount={formatMoney(totals.totalActualIncome)}
          color="green"
          icon={<TrendingUp style={{ width: 14, height: 14 }} />}
        />
        <SummaryCard
          label="Toplam Gider"
          amount={formatMoney(totals.totalActualExpense)}
          color="red"
          icon={<TrendingDown style={{ width: 14, height: 14 }} />}
        />
        <SummaryCard
          label="Kalan Para"
          amount={formatMoney(totals.remainingActual)}
          color={totals.remainingActual >= 0 ? "green" : "red"}
          delta={{ value: totals.remainingActual >= 0 ? "↗" : "↘", positive: totals.remainingActual >= 0 }}
        />
        <SummaryCard
          label="Tasarruf"
          amount={formatMoney(totals.savingsAmount)}
          color="blue"
          delta={{ value: "↗", positive: true }}
        />
      </div>

      {/* BÜTÇE VS GERÇEKLEŞEN */}
      {bvaRows.length > 0 && (
        <div style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-card)",
          padding: 24,
        }}>
          <div className="section-label" style={{ marginBottom: 16 }}>
            BÜTÇE VS GERÇEKLEŞEN
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {bvaRows.map((row) => (
              <BvARow key={row.category} row={row} />
            ))}
          </div>
        </div>
      )}
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
