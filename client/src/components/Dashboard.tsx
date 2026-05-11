import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { usePersonFilter } from "@/contexts/PersonFilterContext";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Avatar,
  OwnerCard,
  SummaryCard,
  CategoryPill,
  QuickStatsPill,
  HealthBubble,
  TodaySummaryStripCompact,
} from "@/components/design";
import type { AvatarWho } from "@/components/design";
import type { UpcomingItem } from "@/components/design/TodaySummaryStripCompact";
import { getCategoryMeta } from "@/components/design/CategoryPill";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { formatMoney, formatMoneyShort } from "@/lib/format";
import { applyPersonFilter } from "@/lib/personFilter";

// ── Upcoming-bill helpers ─────────────────────────────────────
const ownerToWho = (o: "Benim" | "Esim" | "Ev"): AvatarWho =>
  o === "Benim" ? "yigit" : o === "Esim" ? "arzu" : "ev";

/**
 * Days until the given day-of-month falls next, relative to `today`.
 * If `dayStr` is empty / non-numeric / out-of-range, returns null.
 */
function daysUntilDayOfMonth(dayStr: string, today: Date): number | null {
  const day = parseInt(dayStr, 10);
  if (!Number.isFinite(day) || day < 1 || day > 31) return null;
  const todayDay = today.getDate();
  if (day >= todayDay) return day - todayDay;
  const next = new Date(today.getFullYear(), today.getMonth() + 1, day);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Days until the given day in `month` (1-12). When `day` is undefined or
 * out of range, the 15th is used as a fallback. Rolls forward to next
 * year if the target has already passed this year.
 */
function daysUntilMonth(
  month: number,
  day: number | undefined,
  today: Date
): number {
  const year = today.getFullYear();
  const safeDay = day !== undefined && day >= 1 && day <= 31 ? day : 15;
  let target = new Date(year, month - 1, safeDay);
  if (target.getTime() < today.getTime()) {
    target = new Date(year + 1, month - 1, safeDay);
  }
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

// ── Bütçe Sağlık Skoru (preserved scoring logic, used by HealthBubble) ──
function calcHealthScore(params: {
  savingsRate: number;
  expenseRatio: number;
  hasOverduePayments: boolean;
  debtToIncomeRatio: number;
  budgetAdherence: number;
}): number {
  let score = 100;
  if (params.savingsRate >= 0.2) score -= 0;
  else if (params.savingsRate >= 0.1) score -= 10;
  else if (params.savingsRate >= 0.05) score -= 20;
  else score -= 30;
  if (params.expenseRatio <= 0.7) score -= 0;
  else if (params.expenseRatio <= 0.85) score -= 10;
  else if (params.expenseRatio <= 1.0) score -= 20;
  else score -= 25;
  if (params.hasOverduePayments) score -= 20;
  if (params.debtToIncomeRatio <= 0.2) score -= 0;
  else if (params.debtToIncomeRatio <= 0.35) score -= 8;
  else score -= 15;
  score -= Math.round((1 - params.budgetAdherence) * 10);
  return Math.max(0, Math.min(100, score));
}

// ── Top categories per owner ──
function topCategoriesForOwner(
  expenses: { category: string; amount: number; owner: string }[],
  owner: "Benim" | "Esim" | "Ev"
): string[] {
  const counts = new Map<string, number>();
  expenses
    .filter(e => e.owner === owner)
    .forEach(e =>
      counts.set(e.category, (counts.get(e.category) ?? 0) + e.amount)
    );
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);
}

// ── Map local filter (Tümü/Benim/Esim/Ev) to design-ref filter (tumu/yigit/arzu/ev) ──
type DesignFilter = "tumu" | "yigit" | "arzu" | "ev";
const DESIGN_FILTER: Record<string, DesignFilter> = {
  Tümü: "tumu",
  Benim: "yigit",
  Esim: "arzu",
  Ev: "ev",
};

// ── Dashboard ─────────────────────────────────────────────────
export function Dashboard() {
  const { budgetData, calculateTotals } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const { filter } = usePersonFilter();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const mobile = !!isMobile;

  // Person filter applied to data
  const filteredIncomes = useMemo(
    () => applyPersonFilter(budgetData.incomes, filter),
    [budgetData.incomes, filter]
  );
  const filteredExpenses = useMemo(
    () => applyPersonFilter(budgetData.expenses, filter),
    [budgetData.expenses, filter]
  );

  const fullTotals = calculateTotals();

  const filteredTotals = useMemo(() => {
    const totalIncome = filteredIncomes.reduce((s, i) => s + i.amount, 0);
    const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const remaining = totalIncome - totalExpense;
    const savingsAmount = filteredExpenses
      .filter(e => e.type === "Birikim")
      .reduce((s, e) => s + e.amount, 0);
    const expenseRatio = totalIncome > 0 ? totalExpense / totalIncome : 0;
    const savingsRate = totalIncome > 0 ? savingsAmount / totalIncome : 0;
    return {
      totalIncome,
      totalExpense,
      remaining,
      savingsAmount,
      expenseRatio,
      savingsRate,
    };
  }, [filteredIncomes, filteredExpenses]);

  const activeName = currentPerson === "Benim" ? person1Name : person2Name;
  const activeWho: AvatarWho = currentPerson === "Benim" ? "yigit" : "arzu";

  // Net Değer (always full data)
  const netWorth = useMemo(() => {
    const totalSavings = (budgetData.savingsGoals || []).reduce(
      (s, g) => s + (g.currentAmount || 0),
      0
    );
    const totalDebt = (budgetData.debts || []).reduce(
      (s, d) => s + (d.totalDebt || 0),
      0
    );
    const monthDelta = filteredTotals.savingsAmount; // rough proxy "↑ this month"
    return {
      netWorth: totalSavings - totalDebt,
      totalSavings,
      totalDebt,
      monthDelta,
    };
  }, [budgetData.savingsGoals, budgetData.debts, filteredTotals.savingsAmount]);

  const debtToIncomeRatio =
    filteredTotals.totalIncome > 0
      ? (budgetData.debts || []).reduce(
          (s, d) => s + (d.monthlyPayment || 0),
          0
        ) / filteredTotals.totalIncome
      : 0;
  const healthScore = useMemo(
    () =>
      calcHealthScore({
        savingsRate: filteredTotals.savingsRate,
        expenseRatio: filteredTotals.expenseRatio,
        hasOverduePayments: filteredExpenses.some(e => e.status === "Gecikti"),
        debtToIncomeRatio,
        budgetAdherence: 1,
      }),
    [
      filteredTotals.savingsRate,
      filteredTotals.expenseRatio,
      filteredExpenses,
      debtToIncomeRatio,
    ]
  );

  // Top cats per owner
  const yigitCats = useMemo(
    () => topCategoriesForOwner(budgetData.expenses, "Benim"),
    [budgetData.expenses]
  );
  const arzuCats = useMemo(
    () => topCategoriesForOwner(budgetData.expenses, "Esim"),
    [budgetData.expenses]
  );
  const evCats = useMemo(
    () => topCategoriesForOwner(budgetData.expenses, "Ev"),
    [budgetData.expenses]
  );

  // QuickStats values (today / month / tomorrow)
  const todayKey = new Date().toISOString().split("T")[0];
  const todaySpent = filteredExpenses
    .filter(e => e.paymentDay === todayKey)
    .reduce((s, e) => s + e.amount, 0);
  const monthBudget = (budgetData.budgetLimits || []).reduce(
    (s, b) => s + b.limit,
    0
  );
  const monthSpent = filteredTotals.totalExpense;
  const monthRemaining = monthBudget - monthSpent;
  const tomorrowDue = filteredExpenses
    .filter(e => e.status === "Bekliyor")
    .reduce((s, e) => s + e.amount, 0);

  // Bütçe vs Gerçekleşen — derived from real budgetLimits.
  // Empty when the user hasn't configured any limits yet.
  const bvaSamples = useMemo(() => {
    return (budgetData.budgetLimits ?? []).slice(0, 5).map(bl => ({
      cat: bl.category,
      plan: bl.limit,
      real: filteredExpenses
        .filter(e => e.category === bl.category)
        .reduce((s, e) => s + e.amount, 0),
    }));
  }, [budgetData.budgetLimits, filteredExpenses]);

  const isEmpty =
    budgetData.incomes.length === 0 && budgetData.expenses.length === 0;

  // Map filter value for design-ref components (controlled by global PersonFilterChips in DashboardLayout)
  const designFilter: DesignFilter = DESIGN_FILTER[filter] ?? "tumu";

  // Real "Yarın Ödenecek" list — pulled from filtered expenses,
  // installments, and annual payments. Owner filter already applied
  // to expenses/installments via the global PersonFilter; annual
  // payments are family-wide so they're shown only on Tümü/Ev.
  const upcomingItems: UpcomingItem[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items: UpcomingItem[] = [];

    // Expenses with status "Bekliyor" — paymentDay is the day-of-month
    for (const e of filteredExpenses) {
      if (e.status !== "Bekliyor") continue;
      const days = daysUntilDayOfMonth(e.paymentDay, today);
      if (days === null) continue;
      const meta = getCategoryMeta(e.category);
      items.push({
        name: e.subcategory || e.category,
        amount: e.amount,
        days,
        who: ownerToWho(e.owner),
        emoji: meta.emoji,
      });
    }

    // Installments — recurring monthly payment; paymentDay (1-31)
    // when set, otherwise day 1 fallback.
    const filteredInstallments = applyPersonFilter(
      budgetData.installments ?? [],
      filter
    );
    for (const inst of filteredInstallments) {
      const dayStr = inst.paymentDay ? String(inst.paymentDay) : "1";
      const days = daysUntilDayOfMonth(dayStr, today);
      if (days === null) continue;
      items.push({
        name: inst.name,
        amount: inst.monthlyAmount,
        days,
        who: ownerToWho(inst.owner),
        emoji: "📱",
      });
    }

    // Annual payments — show only when filter is Tümü or Ev (family-wide).
    // paymentDay (1-31) when set, otherwise 15th of paymentMonth fallback.
    if (filter === "Tümü" || filter === "Ev") {
      for (const ap of budgetData.annualPayments ?? []) {
        if (!ap.paymentMonth) continue;
        const days = daysUntilMonth(ap.paymentMonth, ap.paymentDay, today);
        // Only surface annual payments due in the next ~60 days
        if (days > 60) continue;
        items.push({
          name: ap.name,
          amount: ap.amount,
          days,
          who: "ev",
          emoji: "📅",
        });
      }
    }

    return items.sort((a, b) => a.days - b.days).slice(0, 10);
  }, [
    filteredExpenses,
    budgetData.installments,
    budgetData.annualPayments,
    filter,
  ]);

  const goRapor = () => setLocation("/raporlar");

  // Owner-card drilldown — one open at a time
  const [expandedOwner, setExpandedOwner] = useState<
    "Benim" | "Esim" | "Ev" | null
  >(null);

  const ownerExpenses = useMemo(() => {
    const byOwner: Record<"Benim" | "Esim" | "Ev", typeof budgetData.expenses> =
      { Benim: [], Esim: [], Ev: [] };
    for (const e of budgetData.expenses) {
      if (e.owner === "Benim" || e.owner === "Esim" || e.owner === "Ev") {
        byOwner[e.owner].push(e);
      }
    }
    return byOwner;
  }, [budgetData.expenses]);

  const renderOwnerDrilldown = (ownerKey: "Benim" | "Esim" | "Ev") => {
    const list = [...ownerExpenses[ownerKey]]
      .sort((a, b) => {
        if (b.amount !== a.amount) return b.amount - a.amount;
        return (a.paymentDay || "").localeCompare(b.paymentDay || "");
      })
      .slice(0, 8);
    const hasMore = ownerExpenses[ownerKey].length > 8;
    if (list.length === 0) {
      return (
        <div
          style={{
            padding: "12px 4px",
            fontSize: 12,
            color: "var(--text-tertiary)",
            textAlign: "center",
          }}
        >
          Henüz gider yok
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {list.map(e => {
          const meta = getCategoryMeta(e.category);
          const statusColor =
            e.status === "Odendi"
              ? "var(--status-success)"
              : e.status === "Gecikti"
                ? "var(--status-danger)"
                : "var(--status-warning)";
          return (
            <div
              key={e.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 10,
                background: "var(--bg-elevated)",
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{meta.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {e.subcategory || e.category}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: statusColor,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {e.status === "Odendi"
                    ? "Ödendi"
                    : e.status === "Gecikti"
                      ? "Gecikti"
                      : "Bekliyor"}
                </div>
              </div>
              <span
                className="tnum"
                style={{ fontSize: 13, fontWeight: 700, flexShrink: 0 }}
              >
                {formatMoneyShort(e.amount)}
              </span>
            </div>
          );
        })}
        {hasMore && (
          <button
            type="button"
            onClick={() => setLocation("/gelir-gider")}
            style={{
              marginTop: 4,
              padding: "8px 0",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--accent-green)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            Hepsini gör →
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className="fade-up"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: mobile ? 16 : 20,
      }}
    >
      {/* Greeting — line-by-line: page-ana.jsx:46-54 */}
      <div>
        <h1
          style={{
            fontSize: mobile ? 24 : 28,
            margin: 0,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Merhaba, {activeName}!{" "}
          <span
            style={{
              display: "inline-block",
              animation: "wave 1.6s ease-in-out infinite",
              transformOrigin: "70% 70%",
            }}
          >
            👋
          </span>
        </h1>
        <div
          style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 6 }}
        >
          {budgetData.month} {budgetData.year} •{" "}
          <Avatar who={activeWho} size={16} />
          <span style={{ verticalAlign: "middle", marginLeft: 4 }}>
            {activeName} olarak görüntüleniyor
          </span>
        </div>
      </div>

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 16px",
            borderRadius: "var(--r-md)",
            background:
              "color-mix(in oklch, var(--owner-yigit) 12%, var(--bg-surface))",
            border:
              "1px solid color-mix(in oklch, var(--owner-yigit) 25%, transparent)",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ fontSize: 18 }}>📊</span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>
                Henüz veri yok.
              </strong>{" "}
              Gelir & Gider sayfasından eklemeye başlayın.
            </span>
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

      {/* HERO 2-col: Net Değer (with HealthBubble inside) + YARIN ÖDENECEK — page-ana.jsx:65-92 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
          gap: mobile ? 12 : 16,
          position: "relative",
          alignItems: "stretch",
        }}
      >
        <div
          className="card lift"
          style={{
            position: "relative",
            overflow: mobile ? "visible" : "hidden",
          }}
        >
          <div className="section-label">NET DEĞER</div>
          <div
            className="tnum"
            style={{
              fontSize: mobile ? 44 : 52,
              fontWeight: 700,
              marginTop: 8,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
            }}
          >
            {formatMoney(netWorth.netWorth).replace(/,\d{2}/, "")}
            <span style={{ color: "var(--text-tertiary)", fontSize: "0.5em" }}>
              {formatMoney(netWorth.netWorth).match(/,\d{2}/)?.[0] ?? ",00"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 6,
            }}
          >
            <span
              className="pill"
              style={{
                background: "var(--accent-green-soft)",
                color: "var(--accent-green)",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
              }}
            >
              ↑ {formatMoney(netWorth.monthDelta)} bu ay
            </span>
          </div>
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                Toplam Gelir
              </div>
              <div
                className="tnum"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--accent-green)",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {formatMoney(filteredTotals.totalIncome)} ↑
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                Toplam Gider
              </div>
              <div
                className="tnum"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--status-danger)",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {formatMoney(filteredTotals.totalExpense)} ↓
              </div>
            </div>
          </div>
          {/* Floating HealthBubble inside card */}
          <div
            title={`Tasarruf oranı %${Math.round(filteredTotals.savingsRate * 100)} · Gider oranı %${Math.round(filteredTotals.expenseRatio * 100)} → ${
              healthScore >= 90
                ? "A"
                : healthScore >= 75
                  ? "B"
                  : healthScore >= 60
                    ? "C"
                    : healthScore >= 40
                      ? "D"
                      : "E"
            }`}
          >
            <HealthBubble
              score={healthScore}
              mobile={mobile}
              onClick={goRapor}
            />
          </div>
        </div>

        <TodaySummaryStripCompact
          mobile={mobile}
          filter={designFilter}
          upcoming={upcomingItems}
        />
      </div>

      {/* OWNER CARDS (3-col) — page-ana.jsx:95-103 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)",
          gap: mobile ? 12 : 16,
        }}
      >
        <OwnerCard
          who="yigit"
          title={`${person1Name.toLocaleUpperCase("tr-TR")}'İN GİDERLERİ`}
          amount={formatMoney(
            fullTotals.myExpensesOwn + fullTotals.myHomeShare
          )}
          subtitle={`Kendi: ${formatMoney(fullTotals.myExpensesOwn)} · Ev payı: ${formatMoney(fullTotals.myHomeShare)}`}
          cats={yigitCats}
          expandable
          isExpanded={expandedOwner === "Benim"}
          onToggle={() =>
            setExpandedOwner(expandedOwner === "Benim" ? null : "Benim")
          }
          expandedContent={renderOwnerDrilldown("Benim")}
        />
        <OwnerCard
          who="arzu"
          title={`${person2Name.toLocaleUpperCase("tr-TR")}'IN GİDERLERİ`}
          amount={formatMoney(
            fullTotals.spouseExpensesOwn + fullTotals.spouseHomeShare
          )}
          subtitle={`Kendi: ${formatMoney(fullTotals.spouseExpensesOwn)} · Ev payı: ${formatMoney(fullTotals.spouseHomeShare)}`}
          cats={arzuCats}
          expandable
          isExpanded={expandedOwner === "Esim"}
          onToggle={() =>
            setExpandedOwner(expandedOwner === "Esim" ? null : "Esim")
          }
          expandedContent={renderOwnerDrilldown("Esim")}
        />
        <OwnerCard
          who="ev"
          title="ORTAK GİDERLER"
          amount={formatMoney(fullTotals.homeExpenses)}
          subtitle={`Her biri: ${formatMoney(fullTotals.homeExpenses / 2)}`}
          cats={evCats}
          expandable
          isExpanded={expandedOwner === "Ev"}
          onToggle={() =>
            setExpandedOwner(expandedOwner === "Ev" ? null : "Ev")
          }
          expandedContent={renderOwnerDrilldown("Ev")}
        />
      </div>

      {/* SUMMARY CARDS — page-ana.jsx:106-115 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: mobile ? 10 : 14,
        }}
      >
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
          delta={{
            value: filteredTotals.remaining >= 0 ? "↗" : "↘",
            positive: filteredTotals.remaining >= 0,
          }}
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <div className="section-label">BÜTÇE VS GERÇEKLEŞEN</div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-tertiary)",
                marginTop: 4,
              }}
            >
              {budgetData.month} ayı kategori karşılaştırması
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              fontSize: 11,
              color: "var(--text-tertiary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: "var(--bg-tint)",
                }}
              />
              Plan
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: "var(--accent-green)",
                }}
              />
              Gerçek
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {bvaSamples.length === 0 && (
            <div
              style={{
                padding: "20px 12px",
                textAlign: "center",
                fontSize: 13,
                color: "var(--text-tertiary)",
                lineHeight: 1.5,
              }}
            >
              Henüz bütçe limiti yok. Gelir &amp; Gider sayfasında
              "Bütçe Limitleri" sekmesinden ekleyebilirsiniz.
            </div>
          )}
          {bvaSamples.map(b => {
            const max = Math.max(b.plan, b.real, 1);
            const overBudget = b.real > b.plan;
            return (
              <div
                key={b.cat}
                style={{
                  display: "grid",
                  gridTemplateColumns: mobile
                    ? "90px 1fr 60px"
                    : "120px 1fr 80px",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <CategoryPill cat={b.cat} size="sm" />
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <div
                    style={{
                      height: 6,
                      background: "var(--bg-tint)",
                      borderRadius: 999,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(b.plan / max) * 100}%`,
                        height: "100%",
                        background: "var(--bg-tint)",
                        filter: "brightness(1.4)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "var(--bg-tint)",
                      borderRadius: 999,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(b.real / max) * 100}%`,
                        height: "100%",
                        background: overBudget
                          ? "var(--status-danger)"
                          : "var(--accent-green)",
                        transition: "width 800ms ease-out",
                      }}
                    />
                  </div>
                </div>
                <div
                  className="tnum"
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    textAlign: "right",
                  }}
                >
                  {formatMoneyShort(b.real)}
                  <span style={{ color: "var(--text-muted)" }}>
                    /{formatMoneyShort(b.plan)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
