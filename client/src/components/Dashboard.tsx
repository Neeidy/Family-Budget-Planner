import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { usePersonFilter } from "@/contexts/PersonFilterContext";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Avatar,
  OwnerCard,
  SummaryCard,
  CategoryPill,
  MonthPulse,
  HealthBubble,
  TodaySummaryStripCompact,
} from "@/components/design";
import type { AvatarWho } from "@/components/design";
import type { UpcomingItem } from "@/components/design/TodaySummaryStripCompact";
import {
  getCategoryMeta,
  getLocalizedCategoryName,
  getLocalizedSubcategoryName,
} from "@/components/design/CategoryPill";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useFormatters } from "@/lib/useFormatters";
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
  const { t, i18n } = useTranslation();
  const { fm, fmShort, fmParts } = useFormatters();
  const { budgetData, calculateTotals } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const { filter } = usePersonFilter();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const mobile = !!isMobile;

  // Person filter applied to expenses (still needed for upcoming/topCategory/health)
  const filteredExpenses = useMemo(
    () => applyPersonFilter(budgetData.expenses, filter),
    [budgetData.expenses, filter]
  );

  const fullTotals = calculateTotals();

  // Filter-aware totals: gerçek total yük (own + ev payı). Owner card
  // büyük rakam ile NET DEĞER kart ve Summary card aynı rakamı gösterir.
  const filteredTotals = useMemo(() => {
    let totalIncome: number;
    let totalExpense: number;

    if (filter === "Tümü") {
      totalIncome = fullTotals.totalActualIncome;
      totalExpense = fullTotals.totalActualExpense;
    } else if (filter === "Benim") {
      totalIncome = fullTotals.myIncome;
      totalExpense = fullTotals.myExpensesOwn + fullTotals.myHomeShare;
    } else if (filter === "Esim") {
      totalIncome = fullTotals.spouseIncome;
      totalExpense = fullTotals.spouseExpensesOwn + fullTotals.spouseHomeShare;
    } else {
      // Ev
      totalIncome = 0;
      totalExpense = fullTotals.homeExpenses;
    }

    const remaining = totalIncome - totalExpense;
    // Birikim type'lı direct expenses filtered — owner-based; ev payı
    // tarafı already aggregate, savings rate filtered subset üzerinden.
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
  }, [filter, fullTotals, filteredExpenses]);

  const activeName = currentPerson === "Benim" ? person1Name : person2Name;
  const activeWho: AvatarWho = currentPerson === "Benim" ? "yigit" : "arzu";

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

  // MonthPulse — top category by spend (filtered)
  const topCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e =>
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    );
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    const [cat, amount] = sorted[0];
    const meta = getCategoryMeta(cat);
    return { name: getLocalizedCategoryName(cat, t), emoji: meta.emoji, amount };
  }, [filteredExpenses, i18n.language]);

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
        name: getLocalizedSubcategoryName(e.category, e.subcategory, t),
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

    return items
      .filter(item => item.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, 10);
  }, [
    filteredExpenses,
    budgetData.installments,
    budgetData.annualPayments,
    filter,
    i18n.language,
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
                  {getLocalizedSubcategoryName(e.category, e.subcategory, t)}
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
                    ? t("status.paid")
                    : e.status === "Gecikti"
                      ? t("status.overdue")
                      : t("status.pending")}
                </div>
              </div>
              <span
                className="tnum"
                style={{ fontSize: 13, fontWeight: 700, flexShrink: 0 }}
              >
                {fmShort(e.amount)}
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
            {t("dashboard.see_all")} →
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
          {t("dashboard.greeting", { name: activeName })}{" "}
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
            {t("dashboard.view_as", { name: activeName })}
          </span>
        </div>
      </div>

      {/* MONTH PULSE — net movement / savings rate / top category */}
      <MonthPulse
        mobile={mobile}
        netMovement={filteredTotals.totalIncome - filteredTotals.totalExpense}
        savingsRate={filteredTotals.savingsRate}
        topCategory={topCategory}
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
          <div className="section-label">{t("dashboard.this_month_net")}</div>
          <div
            className="tnum"
            style={{
              fontSize: mobile ? 44 : 52,
              fontWeight: 700,
              marginTop: 8,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              color:
                filteredTotals.remaining >= 0
                  ? "var(--accent-green)"
                  : "var(--status-danger)",
            }}
          >
            {fmParts(filteredTotals.remaining).main}
            <span style={{ color: "var(--text-tertiary)", fontSize: "0.5em" }}>
              {fmParts(filteredTotals.remaining).fraction}
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
                {t("dashboard.summary.total_income")}
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
                {fm(filteredTotals.totalIncome)} ↑
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
                {t("dashboard.summary.total_expense")}
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
                {fm(filteredTotals.totalExpense)} ↓
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
          person1Name={person1Name}
          person2Name={person2Name}
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
          title={t("dashboard.owner_card.title.person1", {
            name: person1Name.toLocaleUpperCase("tr-TR"),
          })}
          amount={fm(fullTotals.myExpensesOwn + fullTotals.myHomeShare)}
          subtitle={`${t("dashboard.owner_card.own_label")}: ${fm(fullTotals.myExpensesOwn)} · ${t("dashboard.owner_card.home_share_label")}: ${fm(fullTotals.myHomeShare)}`}
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
          title={t("dashboard.owner_card.title.person2", {
            name: person2Name.toLocaleUpperCase("tr-TR"),
          })}
          amount={fm(fullTotals.spouseExpensesOwn + fullTotals.spouseHomeShare)}
          subtitle={`${t("dashboard.owner_card.own_label")}: ${fm(fullTotals.spouseExpensesOwn)} · ${t("dashboard.owner_card.home_share_label")}: ${fm(fullTotals.spouseHomeShare)}`}
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
          title={t("dashboard.owner_card.title.home")}
          amount={fm(fullTotals.homeExpenses)}
          subtitle={`${t("dashboard.owner_card.each_label")}: ${fm(fullTotals.homeExpenses / 2)}`}
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
          label={t("dashboard.summary.total_income")}
          amount={fm(filteredTotals.totalIncome)}
          color="green"
          icon={<TrendingUp style={{ width: 14, height: 14 }} />}
        />
        <SummaryCard
          label={t("dashboard.summary.total_expense")}
          amount={fm(filteredTotals.totalExpense)}
          color="red"
          icon={<TrendingDown style={{ width: 14, height: 14 }} />}
        />
        <SummaryCard
          label={t("dashboard.summary.remaining")}
          amount={fm(filteredTotals.remaining)}
          color={filteredTotals.remaining >= 0 ? "green" : "red"}
          delta={{
            value: filteredTotals.remaining >= 0 ? "↗" : "↘",
            positive: filteredTotals.remaining >= 0,
          }}
        />
        <SummaryCard
          label={t("dashboard.summary.savings")}
          amount={fm(filteredTotals.savingsAmount)}
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
            <div className="section-label">
              {t("dashboard.budget_vs_actual.title")}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-tertiary)",
                marginTop: 4,
              }}
            >
              {t("dashboard.budget_vs_actual.subtitle", {
                month: budgetData.month,
              })}
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
              {t("dashboard.budget_vs_actual.plan")}
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
              {t("dashboard.budget_vs_actual.actual")}
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
              {t("dashboard.budget_vs_actual.no_limit_hint")}
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
                  {fmShort(b.real)}
                  <span style={{ color: "var(--text-muted)" }}>
                    /{fmShort(b.plan)}
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
