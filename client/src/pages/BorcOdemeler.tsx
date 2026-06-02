import { useState, useMemo, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Pencil, Calendar, Check } from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { usePersonFilter, PersonFilter } from "@/contexts/PersonFilterContext";
import {
  TabBar,
  Avatar,
  CategoryPill,
  StatusBadge,
  EmptyState,
  LenderIcon,
  DebtDialog,
  InstallmentDialog,
  AnnualPaymentDialog,
} from "@/components/design";
import { InlineMoney } from "@/components/design/InlineMoney";
import { deleteWithUndo } from "@/lib/undoToast";
import { usePersistedTab } from "@/lib/usePersistedTab";
import { useFab } from "@/contexts/FabContext";
import type { AvatarWho, BadgeStatus } from "@/components/design";
import { useFormatters } from "@/lib/useFormatters";
import { applyPersonFilter } from "@/lib/personFilter";
import { isDemoMode, demoDisabledProps } from "@/lib/demoMode";
import type { Debt, Installment, AnnualPayment } from "@/hooks/useBudgetData";

const TABS = ["Borçlar", "Taksitler", "Yıllık Ödemeler"] as const;
type Tab = (typeof TABS)[number];

function ownerToWho(o: string): AvatarWho {
  if (o === "Benim") return "yigit";
  if (o === "Esim") return "arzu";
  return "ev";
}

function statusToBadge(s: string): BadgeStatus {
  if (s === "Odendi" || s === "Ödendi") return "Odendi";
  if (s === "Gecikti" || s === "Geçikti") return "Gecikti";
  return "Bekliyor";
}

// ── PageHeader ────────────────────────────────────────────────
function PageHeader({ tab, onAdd }: { tab: Tab; onAdd: () => void }) {
  const { t } = useTranslation();
  const ctaLabel =
    tab === "Borçlar"
      ? t("borc.add_debt")
      : tab === "Taksitler"
        ? t("borc.add_installment")
        : t("borc.add_annual");
  const dp = demoDisabledProps();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: 0,
            color: "var(--text-primary)",
          }}
        >
          {t("borc.title")}
        </h1>
        <p
          style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 6 }}
        >
          {t("borc.subtitle")}
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={dp.disabled}
        title={dp.title}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 16px",
          borderRadius: "var(--r-md)",
          fontSize: 13,
          fontWeight: 600,
          border: "none",
          background: "var(--accent-green)",
          color: "oklch(0.15 0.03 155)",
          cursor: "pointer",
          ...dp.style,
        }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        {ctaLabel}
      </button>
    </div>
  );
}

// ── Hero card — port of _design/page-borc.jsx:38-57 ─────────────
function HeroCard({
  label,
  value,
  accent,
  subInfo,
}: {
  label: string;
  value: string;
  accent?: string;
  subInfo?: React.ReactNode;
}) {
  const a = accent ?? "var(--accent-green)";
  return (
    <div
      className="card"
      style={{
        position: "relative",
        background: `linear-gradient(135deg, color-mix(in oklch, ${a} 18%, var(--bg-surface)), var(--bg-surface) 70%)`,
        padding: 32,
        borderTop: `2px solid ${a}`,
      }}
    >
      <div className="section-label">{label}</div>
      <div
        className="tnum"
        style={{
          fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
          fontWeight: 700,
          marginTop: 8,
          letterSpacing: "-0.04em",
          lineHeight: 1.0,
          color: "var(--text-primary)",
        }}
      >
        {value}
      </div>
      {subInfo && (
        <div
          style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 6 }}
        >
          {subInfo}
        </div>
      )}
    </div>
  );
}

function MiniStatCard({
  label,
  amount,
  color,
}: {
  label: string;
  amount: number;
  color?: string;
}) {
  const { fm } = useFormatters();
  return (
    <div className="card lift" style={{ padding: "16px 20px" }}>
      <div className="section-label">{label}</div>
      <div
        className="tnum"
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginTop: 8,
          color: color ?? "var(--text-primary)",
        }}
      >
        {fm(amount)}
      </div>
    </div>
  );
}

// ── BORÇLAR TAB ───────────────────────────────────────────────
function DebtsTab({
  globalFilter,
  onEdit,
  onDelete,
}: {
  globalFilter: PersonFilter;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
}) {
  const { t } = useTranslation();
  const { fm } = useFormatters();
  const { budgetData, updateDebt } = useBudget();

  const filtered = useMemo(
    () => applyPersonFilter(budgetData.debts, globalFilter),
    [budgetData.debts, globalFilter]
  );

  const totalDebt = filtered.reduce((s, d) => s + d.totalDebt, 0);
  const totalMonthly = filtered.reduce((s, d) => s + d.monthlyPayment, 0);
  const remaining = filtered.reduce(
    (s, d) => s + Math.max(0, d.totalDebt - d.monthlyPayment),
    0
  );
  const activeCount = filtered.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <HeroCard
        label={t("borc.total_debt").toUpperCase()}
        value={fm(remaining)}
        accent="var(--status-danger)"
        subInfo={
          <>
            {activeCount} • {t("borc.monthly_payment")}:{" "}
            <span
              className="tnum"
              style={{ color: "var(--text-secondary)", fontWeight: 600 }}
            >
              {fm(totalMonthly)}
            </span>
          </>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <MiniStatCard
          label={t("borc.total_debt")}
          amount={totalDebt}
          color="var(--status-danger)"
        />
        <MiniStatCard
          label={t("borc.monthly_payment")}
          amount={totalMonthly}
          color="var(--status-warning)"
        />
        <MiniStatCard
          label={t("borc.remaining")}
          amount={remaining}
          color="var(--owner-yigit)"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="💳"
          title={t("borc.no_debts")}
          description={t("empty.add_first")}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map(d => (
            <DebtCard
              key={d.id}
              debt={d}
              onEdit={() => onEdit(d)}
              onDelete={() => onDelete(d)}
              onMarkPaid={() => updateDebt(d.id, { status: "Odendi" })}
              onChangeStatus={s => updateDebt(d.id, { status: s })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DebtCard({
  debt,
  onEdit,
  onDelete,
  onMarkPaid,
  onChangeStatus,
}: {
  debt: Debt;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid?: () => void;
  onChangeStatus?: (next: "Odendi" | "Bekliyor" | "Gecikti") => void;
}) {
  const { t } = useTranslation();
  const { fm } = useFormatters();
  const { updateDebt } = useBudget();
  const { person1Name, person2Name } = usePerson();
  // monthlyPayment is "this month's payment" — rough progress placeholder
  const paid = Math.min(debt.totalDebt, debt.monthlyPayment);
  const paidProgress =
    debt.totalDebt > 0 ? Math.min(1, paid / debt.totalDebt) : 0;
  const pctPaid = Math.round(paidProgress * 100);
  const remaining = Math.max(0, debt.totalDebt - paid);
  const monthsLeft =
    debt.monthlyPayment > 0 ? Math.ceil(remaining / debt.monthlyPayment) : 0;
  const ownerLabel =
    debt.owner === "Benim"
      ? person1Name
      : debt.owner === "Esim"
        ? person2Name
        : t("filter.home");

  return (
    <div className="card lift" style={{ position: "relative", padding: 24 }}>
      {/* Header — page-borc.jsx:92-112 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <LenderIcon lender={debt.name} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {debt.name}
            </div>
            <Avatar who={ownerToWho(debt.owner ?? "Ev")} size={20} />
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {ownerLabel}
            </span>
          </div>
          <div
            className="tnum"
            style={{
              fontSize: 32,
              fontWeight: 700,
              marginTop: 4,
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
            }}
          >
            <InlineMoney
              value={debt.totalDebt}
              onSave={v => updateDebt(debt.id, { totalDebt: v })}
              disabled={isDemoMode()}
            />
          </div>
        </div>
        {debt.dueDate && (
          <div
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              background: "var(--bg-elevated)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            <Calendar
              style={{
                width: 11,
                height: 11,
                display: "inline",
                marginRight: 4,
                verticalAlign: "-1px",
              }}
            />
            {debt.dueDate}
          </div>
        )}
      </div>

      {/* Progress + Ödenen/Kalan — hidden when monthlyPayment is 0 */}
      {debt.monthlyPayment > 0 && (
        <>
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                height: 10,
                background: "var(--bg-tint)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${paidProgress * 100}%`,
                  height: "100%",
                  background:
                    "linear-gradient(90deg, var(--accent-green), color-mix(in oklch, var(--accent-green) 70%, var(--owner-yigit)))",
                  borderRadius: 999,
                  transition: "width 600ms cubic-bezier(0.2, 0, 0, 1)",
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
            }}
          >
            <span className="tnum" style={{ color: "var(--accent-green)" }}>
              {t("borc.paid_label")}: {fm(paid)} (%{pctPaid})
            </span>
            <span
              className="tnum"
              style={{ color: "var(--status-danger)", fontWeight: 600 }}
            >
              {t("borc.remaining")}: {fm(remaining)}
            </span>
          </div>
        </>
      )}

      {/* Bottom metric row — page-borc.jsx:125-145 */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid var(--border-faint)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("borc.monthly_short")}
            </div>
            <div
              className="tnum"
              style={{
                fontSize: 14,
                fontWeight: 700,
                marginTop: 2,
                color: "var(--text-primary)",
              }}
            >
              {debt.monthlyPayment > 0 ? (
                <InlineMoney
                  value={debt.monthlyPayment}
                  onSave={v => updateDebt(debt.id, { monthlyPayment: v })}
                  disabled={isDemoMode()}
                />
              ) : (
                "—"
              )}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("borc.end_label")}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginTop: 2,
                color: "var(--text-primary)",
              }}
            >
              {monthsLeft > 0
                ? t("borc.months_remaining", { count: monthsLeft })
                : "—"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <StatusBadge
            status={statusToBadge(debt.status)}
            disabled={isDemoMode() || !onChangeStatus}
            onChange={s => onChangeStatus?.(s)}
          />
          {debt.status !== "Odendi" && onMarkPaid && (
            <button
              type="button"
              disabled={isDemoMode()}
              title={
                isDemoMode()
                  ? t("common.demo_disabled")
                  : t("borc.mark_paid_title")
              }
              onClick={onMarkPaid}
              style={{
                ...iconBtn("var(--status-success)"),
                background:
                  "color-mix(in oklch, var(--status-success) 12%, transparent)",
              }}
            >
              <Check style={{ width: 14, height: 14 }} />
            </button>
          )}
          <button
            type="button"
            disabled={isDemoMode()}
            title={isDemoMode() ? t("common.demo_disabled") : t("common.edit")}
            onClick={onEdit}
            style={iconBtn("var(--text-tertiary)")}
          >
            <Pencil style={{ width: 14, height: 14 }} />
          </button>
          <button
            type="button"
            disabled={isDemoMode()}
            title={
              isDemoMode() ? t("common.demo_disabled") : t("common.delete")
            }
            onClick={onDelete}
            style={iconBtn("var(--status-danger)")}
          >
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function iconBtn(color: string): React.CSSProperties {
  const dp = demoDisabledProps();
  return {
    padding: 6,
    borderRadius: 6,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color,
    ...dp.style,
  };
}

// ── TAKSİTLER TAB ─────────────────────────────────────────────
function InstallmentsTab({
  globalFilter,
  onEdit,
  onDelete,
}: {
  globalFilter: PersonFilter;
  onEdit: (inst: Installment) => void;
  onDelete: (inst: Installment) => void;
}) {
  const { t } = useTranslation();
  const { budgetData } = useBudget();

  const filtered = useMemo(
    () => applyPersonFilter(budgetData.installments ?? [], globalFilter),
    [budgetData.installments, globalFilter]
  );

  const totalActive = filtered.length;
  const totalMonthly = filtered.reduce((s, i) => s + i.monthlyAmount, 0);
  const totalRemaining = filtered.reduce(
    (s, i) => s + Math.max(0, i.totalAmount - i.monthlyAmount * paidCount(i)),
    0
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <HeroCard
        label={t("borc.active_installments_count")}
        value={`${totalActive}`}
        accent="var(--owner-yigit)"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <MiniStatCard
          label={t("borc.this_month_total")}
          amount={totalMonthly}
          color="var(--status-warning)"
        />
        <MiniStatCard
          label={t("borc.remaining_total")}
          amount={totalRemaining}
          color="var(--status-danger)"
        />
        <MiniStatCard
          label={t("borc.active_installments")}
          amount={totalActive}
          color="var(--accent-green)"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="🛍"
          title={t("borc.no_installments")}
          description={t("empty.add_first")}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map(i => (
            <InstallmentCard
              key={i.id}
              inst={i}
              onEdit={() => onEdit(i)}
              onDelete={() => onDelete(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function paidCount(i: Installment): number {
  const now = new Date();
  const months =
    (now.getFullYear() - i.startYear) * 12 +
    (now.getMonth() + 1 - i.startMonth);
  return Math.max(0, Math.min(i.installmentCount, months + 1));
}

function InstallmentCard({
  inst,
  onEdit,
  onDelete,
}: {
  inst: Installment;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { fm } = useFormatters();
  const { updateInstallment } = useBudget();
  const { person1Name, person2Name } = usePerson();
  const paid = paidCount(inst);
  const progress = inst.installmentCount > 0 ? paid / inst.installmentCount : 0;
  const remainingCount = inst.installmentCount - paid;

  return (
    <div
      className="card lift"
      style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {inst.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              marginTop: 2,
            }}
          >
            <Avatar who={ownerToWho(inst.owner)} size={12} />{" "}
            {inst.owner === "Benim"
              ? person1Name
              : inst.owner === "Esim"
                ? person2Name
                : t("filter.home")}
          </div>
        </div>
        <span
          className="pill"
          style={{
            background:
              "color-mix(in oklch, var(--owner-yigit) 18%, transparent)",
            color: "var(--owner-yigit)",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
          }}
        >
          {paid}/{inst.installmentCount}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div
          className="hero-num"
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          <InlineMoney
            value={inst.monthlyAmount}
            onSave={v => updateInstallment(inst.id, { monthlyAmount: v })}
            disabled={isDemoMode()}
          />
        </div>
        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
          {t("borc.monthly_label")}
        </div>
      </div>

      <div>
        <div
          style={{
            height: 8,
            background: "var(--bg-tint)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              background:
                progress >= 1 ? "var(--accent-green)" : "var(--owner-yigit)",
              borderRadius: 999,
              transition: "width 600ms cubic-bezier(0.2, 0, 0, 1)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 6,
            fontSize: 11,
            color: "var(--text-tertiary)",
          }}
        >
          <span className="hero-num">{Math.round(progress * 100)}%</span>
          <span>{t("borc.installments_left", { count: remainingCount })}</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 8,
          borderTop: "1px solid var(--border-faint)",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
          {t("borc.total_label")}:{" "}
          <span className="hero-num">{fm(inst.totalAmount)}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            disabled={isDemoMode()}
            title={isDemoMode() ? t("common.demo_disabled") : t("common.edit")}
            onClick={onEdit}
            style={iconBtn("var(--text-tertiary)")}
          >
            <Pencil style={{ width: 14, height: 14 }} />
          </button>
          <button
            type="button"
            disabled={isDemoMode()}
            title={
              isDemoMode() ? t("common.demo_disabled") : t("common.delete")
            }
            onClick={onDelete}
            style={iconBtn("var(--status-danger)")}
          >
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── YILLIK ÖDEMELER TAB ───────────────────────────────────────
function AnnualPaymentsTab({
  onEdit,
  onDelete,
}: {
  onEdit: (p: AnnualPayment) => void;
  onDelete: (p: AnnualPayment) => void;
}) {
  const { t } = useTranslation();
  const { fm, fMonthShort } = useFormatters();
  const { budgetData, updateAnnualPayment } = useBudget();
  const { person1Name, person2Name } = usePerson();
  const list = budgetData.annualPayments ?? [];

  // Group by month
  const byMonth: Record<number, AnnualPayment[]> = {};
  list.forEach(p => {
    if (!byMonth[p.paymentMonth]) byMonth[p.paymentMonth] = [];
    byMonth[p.paymentMonth].push(p);
  });

  const totalAnnual = list.reduce((s, p) => s + p.amount, 0);
  const monthlyAvg = totalAnnual / 12;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <MiniStatCard
          label={t("borc.annual_total")}
          amount={totalAnnual}
          color="var(--owner-ev)"
        />
        <MiniStatCard
          label={t("borc.monthly_average")}
          amount={monthlyAvg}
          color="var(--owner-yigit)"
        />
      </div>

      {/* 12-month calendar */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-label" style={{ marginBottom: 14 }}>
          {t("borc.year_calendar_title").toUpperCase()}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
            gap: 8,
          }}
        >
          {Array.from({ length: 12 }, (_, idx) => {
            const monthIdx = idx + 1;
            const m = fMonthShort(idx);
            const items = byMonth[monthIdx] ?? [];
            const monthTotal = items.reduce((s, p) => s + p.amount, 0);
            const hasItems = items.length > 0;
            return (
              <div
                key={idx}
                style={{
                  padding: "10px 8px",
                  borderRadius: 12,
                  background: hasItems
                    ? "color-mix(in oklch, var(--owner-ev) 14%, transparent)"
                    : "var(--bg-elevated)",
                  border: hasItems
                    ? "1px solid color-mix(in oklch, var(--owner-ev) 30%, transparent)"
                    : "1px solid var(--border-faint)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: hasItems
                      ? "var(--owner-ev)"
                      : "var(--text-tertiary)",
                  }}
                >
                  {m}
                </div>
                {hasItems && (
                  <>
                    <div
                      className="hero-num"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        marginTop: 4,
                        color: "var(--text-primary)",
                      }}
                    >
                      {fm(monthTotal)}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 3,
                        marginTop: 4,
                      }}
                    >
                      {items.slice(0, 3).map((_, i) => (
                        <span
                          key={i}
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: "var(--owner-ev)",
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          emoji="📅"
          title={t("borc.no_annual")}
          description={t("empty.add_first")}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {list.map(p => (
            <div
              key={p.id}
              style={{
                background: "var(--bg-surface)",
                borderRadius: "var(--r-lg)",
                boxShadow: "var(--shadow-card)",
                padding: 18,
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
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {p.name}
                </div>
                <span
                  className="pill"
                  style={{
                    background:
                      "color-mix(in oklch, var(--owner-ev) 18%, transparent)",
                    color: "var(--owner-ev)",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 9px",
                  }}
                >
                  {fMonthShort(p.paymentMonth - 1)}
                </span>
              </div>
              <div
                className="hero-num"
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                <InlineMoney
                  value={p.amount}
                  onSave={v => updateAnnualPayment(p.id, { amount: v })}
                  disabled={isDemoMode()}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Avatar who={ownerToWho(p.owner ?? "Ev")} size={18} />
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {p.owner === "Benim"
                      ? person1Name
                      : p.owner === "Esim"
                        ? person2Name
                        : t("filter.home")}
                  </span>
                </div>
                {p.category && <CategoryPill cat={p.category} size="sm" />}
              </div>
              {p.lastPaymentDate && (
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  {t("borc.last_payment_label")}: {p.lastPaymentDate}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 4,
                  paddingTop: 8,
                  borderTop: "1px solid var(--border-faint)",
                }}
              >
                <button
                  type="button"
                  disabled={isDemoMode()}
                  title={
                    isDemoMode() ? t("common.demo_disabled") : t("common.edit")
                  }
                  onClick={() => onEdit(p)}
                  style={iconBtn("var(--text-tertiary)")}
                >
                  <Pencil style={{ width: 14, height: 14 }} />
                </button>
                <button
                  type="button"
                  disabled={isDemoMode()}
                  title={
                    isDemoMode()
                      ? t("common.demo_disabled")
                      : t("common.delete")
                  }
                  onClick={() => onDelete(p)}
                  style={iconBtn("var(--status-danger)")}
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page entry ────────────────────────────────────────────────
type DialogState<T> = { open: boolean; entity?: T };

export default function BorcOdemeler() {
  const { t } = useTranslation();
  const [tab, setTab] = usePersistedTab<Tab>(
    "tab:borc-odemeler",
    "Borçlar",
    TABS
  );
  const tabLabels = [
    t("borc.tab.debts"),
    t("borc.tab.installments"),
    t("borc.tab.annual"),
  ];
  const { filter } = usePersonFilter();
  const {
    addDebt,
    deleteDebt,
    addInstallment,
    deleteInstallment,
    addAnnualPayment,
    deleteAnnualPayment,
  } = useBudget();

  const [debtDialog, setDebtDialog] = useState<DialogState<Debt>>({
    open: false,
  });
  const [instDialog, setInstDialog] = useState<DialogState<Installment>>({
    open: false,
  });
  const [annualDialog, setAnnualDialog] = useState<DialogState<AnnualPayment>>({
    open: false,
  });

  const handleDeleteDebt = (d: Debt) =>
    deleteWithUndo({
      item: d,
      description: d.name,
      getId: x => x.id,
      deleteFn: deleteDebt,
      restoreFn: ({ id: _id, ...rest }) => addDebt(rest),
    });

  const handleDeleteInst = (i: Installment) =>
    deleteWithUndo({
      item: i,
      description: i.name,
      getId: x => x.id,
      deleteFn: deleteInstallment,
      restoreFn: ({ id: _id, ...rest }) => addInstallment(rest),
    });

  const handleDeleteAnnual = (p: AnnualPayment) =>
    deleteWithUndo({
      item: p,
      description: p.name,
      getId: x => x.id,
      deleteFn: deleteAnnualPayment,
      restoreFn: ({ id: _id, ...rest }) => addAnnualPayment(rest),
    });

  // Context-aware FAB
  const { requestedAction, clearAction } = useFab();
  useEffect(() => {
    if (requestedAction === "debt") {
      setDebtDialog({ open: true });
      clearAction();
    } else if (requestedAction === "installment") {
      setInstDialog({ open: true });
      clearAction();
    } else if (requestedAction === "annual") {
      setAnnualDialog({ open: true });
      clearAction();
    }
  }, [requestedAction, clearAction]);

  // Open dialog from MobileFAB QuickAdd via ?action= query param
  const search = useSearch();
  const [, setLocation] = useLocation();
  useEffect(() => {
    const action = new URLSearchParams(search).get("action");
    if (action === "add-debt") {
      setTab("Borçlar");
      setDebtDialog({ open: true });
      setLocation("/borc-odemeler", { replace: true });
    } else if (action === "add-installment") {
      setTab("Taksitler");
      setInstDialog({ open: true });
      setLocation("/borc-odemeler", { replace: true });
    } else if (action === "add-annual") {
      setTab("Yıllık Ödemeler");
      setAnnualDialog({ open: true });
      setLocation("/borc-odemeler", { replace: true });
    }
  }, [search, setLocation]);

  const handleAdd = () => {
    if (tab === "Borçlar") setDebtDialog({ open: true });
    else if (tab === "Taksitler") setInstDialog({ open: true });
    else setAnnualDialog({ open: true });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader tab={tab} onAdd={handleAdd} />
      <TabBar
        tabs={[...TABS]}
        labels={tabLabels}
        active={tab}
        onChange={nextTab => setTab(nextTab as Tab)}
      />

      {tab === "Borçlar" && (
        <DebtsTab
          globalFilter={filter}
          onEdit={d => setDebtDialog({ open: true, entity: d })}
          onDelete={handleDeleteDebt}
        />
      )}
      {tab === "Taksitler" && (
        <InstallmentsTab
          globalFilter={filter}
          onEdit={i => setInstDialog({ open: true, entity: i })}
          onDelete={handleDeleteInst}
        />
      )}
      {tab === "Yıllık Ödemeler" && (
        <AnnualPaymentsTab
          onEdit={p => setAnnualDialog({ open: true, entity: p })}
          onDelete={handleDeleteAnnual}
        />
      )}

      <DebtDialog
        open={debtDialog.open}
        onClose={() => setDebtDialog({ open: false })}
        entity={debtDialog.entity}
      />
      <InstallmentDialog
        open={instDialog.open}
        onClose={() => setInstDialog({ open: false })}
        entity={instDialog.entity}
      />
      <AnnualPaymentDialog
        open={annualDialog.open}
        onClose={() => setAnnualDialog({ open: false })}
        entity={annualDialog.entity}
      />

      {/* Delete confirm dialogs replaced by deleteWithUndo toast (FAZ 3). */}
    </div>
  );
}
