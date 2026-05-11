import { useState, useMemo, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { Plus, Trash2, Pencil, RotateCw } from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { usePersonFilter, PersonFilter } from "@/contexts/PersonFilterContext";
import {
  TabBar,
  Avatar,
  CategoryPill,
  StatusBadge,
  EmptyState,
  CircularProgress,
  IncomeDialog,
  ExpenseDialog,
  BudgetLimitDialog,
} from "@/components/design";
import { deleteWithUndo } from "@/lib/undoToast";
import { usePersistedTab } from "@/lib/usePersistedTab";
import { useFab } from "@/contexts/FabContext";
import type { AvatarWho } from "@/components/design";
import { formatMoney } from "@/lib/format";
import { applyPersonFilter } from "@/lib/personFilter";
import { isDemoMode, demoDisabledProps } from "@/lib/demoMode";
import { InlineMoney } from "@/components/design/InlineMoney";
import { getCategoryMeta } from "@/components/design/CategoryPill";
import type { Income, Expense, BudgetLimit } from "@/hooks/useBudgetData";

const TABS = ["Gelirler", "Giderler", "Bütçe Limitleri"] as const;
type Tab = (typeof TABS)[number];

// ── Local sub-filter chip group (e.g. by owner with counts) ──
interface SubFilterChipsProps<T extends string> {
  options: Array<{ key: T; label: string; count?: number; colorVar?: string }>;
  value: T;
  onChange: (v: T) => void;
}

function SubFilterChips<T extends string>({
  options,
  value,
  onChange,
}: SubFilterChipsProps<T>) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map(o => {
        const active = value === o.key;
        const colorVar = o.colorVar ?? "var(--text-secondary)";
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              border: active ? "none" : "1px solid var(--border-subtle)",
              background: active ? colorVar : "var(--bg-elevated)",
              color: active ? "oklch(0.99 0 0)" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 160ms",
            }}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span
                style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Page header w/ "+ Ekle" button ──
function PageHeader({ tab, onAdd }: { tab: Tab; onAdd: () => void }) {
  const ctaLabel =
    tab === "Gelirler"
      ? "+ Gelir Ekle"
      : tab === "Giderler"
        ? "+ Gider Ekle"
        : "+ Limit Ekle";
  const demoProps = demoDisabledProps(ctaLabel);
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
          Gelir & Gider
        </h1>
        <p
          style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 6 }}
        >
          Aylık gelir ve giderlerinizi yönetin
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={demoProps.disabled}
        title={demoProps.title}
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
          ...demoProps.style,
        }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        {ctaLabel.replace("+ ", "")}
      </button>
    </div>
  );
}

// ── Owner badge in row ──
function OwnerBadge({
  owner,
  person1Name,
  person2Name,
}: {
  owner: string;
  person1Name: string;
  person2Name: string;
}) {
  const who: AvatarWho =
    owner === "Benim" ? "yigit" : owner === "Esim" ? "arzu" : "ev";
  const name =
    owner === "Benim" ? person1Name : owner === "Esim" ? person2Name : "Ev";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <Avatar who={who} size={20} />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
    </span>
  );
}

// ── INCOMES TAB ───────────────────────────────────────────────
function IncomesTab({
  globalFilter,
  onEdit,
  onDelete,
}: {
  globalFilter: PersonFilter;
  onEdit: (income: Income) => void;
  onDelete: (income: Income) => void;
}) {
  const { budgetData, updateIncome } = useBudget();
  const { person1Name, person2Name } = usePerson();

  const yigitTotal = budgetData.incomes
    .filter(i => i.owner === "Benim")
    .reduce((s, i) => s + i.amount, 0);
  const arzuTotal = budgetData.incomes
    .filter(i => i.owner === "Esim")
    .reduce((s, i) => s + i.amount, 0);
  const grandTotal = yigitTotal + arzuTotal;

  const afterGlobal = useMemo(
    () => applyPersonFilter(budgetData.incomes, globalFilter),
    [budgetData.incomes, globalFilter]
  );
  const sortedIncomes = useMemo(
    () =>
      [...afterGlobal].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [afterGlobal]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary tri-card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <MiniSummaryCard
          label={`${person1Name}'in Geliri`}
          amount={yigitTotal}
          accent="var(--owner-yigit)"
        />
        <MiniSummaryCard
          label={`${person2Name}'in Geliri`}
          amount={arzuTotal}
          accent="var(--owner-arzu)"
        />
        <MiniSummaryCard
          label="Toplam Gelir"
          amount={grandTotal}
          accent="var(--accent-green)"
        />
      </div>

      {/* List grouped by month */}
      {sortedIncomes.length === 0 ? (
        <EmptyState
          emoji="💰"
          title="Henüz gelir eklenmemiş"
          description="Maaş, yan gelir veya kira gelirinizi ekleyerek aylık bütçenizi takip etmeye başlayın."
        />
      ) : (
        groupByMonth(sortedIncomes, i => i.date).map(group => (
          <div
            key={group.key}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "8px 4px",
                borderBottom: "1px solid var(--border-faint)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "var(--text-primary)",
                }}
              >
                {group.label} — {group.items.length} kayıt ·{" "}
                {formatMoney(group.total)} ↑
              </h3>
            </div>
            <DataTable
              columns={[
                { header: "Kişi", width: "auto" },
                { header: "Gelir Adı", width: "auto" },
                { header: "Miktar", width: 120, align: "right" },
                { header: "Tarih", width: 110, hideOnMobile: true },
                { header: "İşlem", width: 90, align: "center" },
              ]}
              rows={group.items.map(income => ({
                key: income.id,
                cells: [
                  <OwnerBadge
                    owner={income.owner}
                    person1Name={person1Name}
                    person2Name={person2Name}
                  />,
                  <span style={{ fontWeight: 500 }}>{income.name}</span>,
                  <InlineMoney
                    value={income.amount}
                    disabled={isDemoMode()}
                    onSave={v => updateIncome(income.id, { amount: v })}
                    className="hero-num"
                    style={{ fontWeight: 700, color: "var(--accent-green)" }}
                  />,
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                    {new Date(income.date).toLocaleDateString("tr-TR")}
                  </span>,
                  <RowActions
                    onEdit={() => onEdit(income)}
                    onDelete={() => onDelete(income)}
                  />,
                ],
              }))}
            />
          </div>
        ))
      )}
      {sortedIncomes.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 4px",
            fontSize: 12,
            color: "var(--text-tertiary)",
          }}
        >
          <span>{sortedIncomes.length} kayıt</span>
          <span
            className="tnum"
            style={{ fontWeight: 700, color: "var(--text-secondary)" }}
          >
            Görüntülenen toplam:{" "}
            {formatMoney(sortedIncomes.reduce((s, i) => s + i.amount, 0))}
          </span>
        </div>
      )}
    </div>
  );
}

// ── EXPENSES TAB ──────────────────────────────────────────────
type ExpenseStatus = "tumu" | "Bekliyor" | "Odendi" | "Gecikti";

function ExpensesTab({
  globalFilter,
  onEdit,
  onDelete,
}: {
  globalFilter: PersonFilter;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}) {
  const { budgetData, updateExpense } = useBudget();
  const { person1Name, person2Name } = usePerson();
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus>("tumu");

  const afterGlobal = useMemo(
    () => applyPersonFilter(budgetData.expenses, globalFilter),
    [budgetData.expenses, globalFilter]
  );

  const filtered = useMemo(() => {
    if (statusFilter === "tumu") return afterGlobal;
    return afterGlobal.filter(e => e.status === statusFilter);
  }, [afterGlobal, statusFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Status filter */}
      <SubFilterChips<ExpenseStatus>
        options={[
          { key: "tumu", label: "Tümü" },
          {
            key: "Bekliyor",
            label: "⏳ Bekliyor",
            colorVar: "var(--status-warning)",
          },
          {
            key: "Odendi",
            label: "✓ Ödendi",
            colorVar: "var(--status-success)",
          },
          {
            key: "Gecikti",
            label: "⚠ Gecikti",
            colorVar: "var(--status-danger)",
          },
        ]}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState
          emoji="🛒"
          title="Henüz gider eklenmemiş"
          description="Kira, market, fatura — tüm aylık giderlerinizi tek yerden takip edin."
        />
      ) : (
        groupExpensesByMonth(filtered).map(group => (
          <div
            key={group.key}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "8px 4px",
                borderBottom: "1px solid var(--border-faint)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "var(--text-primary)",
                }}
              >
                {group.label}
              </h3>
              <span
                className="tnum"
                style={{
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  fontWeight: 600,
                }}
              >
                {group.items.length} kalem · {formatMoney(group.total)}
              </span>
            </div>
            <DataTable
              columns={[
                { header: "Kişi", width: "auto" },
                { header: "Kategori", width: "auto" },
                { header: "Gider Adı", width: "auto" },
                { header: "Tipi", width: 100, hideOnMobile: true },
                { header: "Miktar", width: 120, align: "right" },
                { header: "Durum", width: 110, hideOnMobile: true },
                { header: "İşlem", width: 130, align: "center" },
              ]}
              rows={group.items.map(expense => ({
                key: expense.id,
                cells: [
                  <OwnerBadge
                    owner={expense.owner}
                    person1Name={person1Name}
                    person2Name={person2Name}
                  />,
                  <CategoryPill cat={expense.category} size="sm" />,
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {expense.subcategory || expense.category}
                    </div>
                    {expense.notes && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-tertiary)",
                          marginTop: 2,
                        }}
                      >
                        {expense.notes}
                      </div>
                    )}
                  </div>,
                  <TypeBadge type={expense.type} />,
                  <InlineMoney
                    value={expense.amount}
                    disabled={isDemoMode()}
                    onSave={v => updateExpense(expense.id, { amount: v })}
                    className="hero-num"
                    style={{ fontWeight: 700, color: "var(--status-danger)" }}
                  />,
                  <StatusBadge
                    status={statusToBadge(expense.status)}
                    disabled={isDemoMode()}
                    onChange={s => updateExpense(expense.id, { status: s })}
                  />,
                  <ExpenseRowActions
                    expense={expense}
                    onMakeOnce={() =>
                      updateExpense(expense.id, { type: "Degisken" })
                    }
                    onEdit={() => onEdit(expense)}
                    onDelete={() => onDelete(expense)}
                  />,
                ],
              }))}
            />
          </div>
        ))
      )}
      {filtered.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 4px",
            fontSize: 12,
            color: "var(--text-tertiary)",
          }}
        >
          <span>{filtered.length} kalem</span>
          <span
            className="tnum"
            style={{ fontWeight: 700, color: "var(--text-secondary)" }}
          >
            Görüntülenen toplam:{" "}
            {formatMoney(filtered.reduce((s, e) => s + e.amount, 0))}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Month grouping helper ─────────────────────────────────────
const TR_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function groupByMonth<T extends { amount: number }>(
  items: T[],
  getDate: (i: T) => string
): Array<{ key: string; label: string; total: number; items: T[] }> {
  const buckets = new Map<string, T[]>();
  for (const it of items) {
    const day = getDate(it) || "";
    let key: string;
    const m = /^\d{4}-\d{2}/.exec(day);
    if (m) {
      key = day.slice(0, 7);
    } else if (day === "") {
      key = "0000-00";
    } else {
      const now = new Date();
      key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    const arr = buckets.get(key) ?? [];
    arr.push(it);
    buckets.set(key, arr);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [yy, mm] = key.split("-").map(Number);
      const label =
        key === "0000-00" ? "Tarihsiz" : `${TR_MONTHS[mm - 1]} ${yy}`;
      return {
        key,
        label,
        total: items.reduce((s, i) => s + i.amount, 0),
        items,
      };
    });
}

function groupExpensesByMonth(expenses: Expense[]) {
  return groupByMonth(expenses, e => e.paymentDay);
}

function statusToBadge(s: string): "Odendi" | "Bekliyor" | "Gecikti" {
  if (s === "Odendi" || s === "Ödendi") return "Odendi";
  if (s === "Gecikti" || s === "Geçikti") return "Gecikti";
  return "Bekliyor";
}

// ── BUDGET LIMITS TAB ─────────────────────────────────────────
function BudgetLimitsTab({
  globalFilter,
  onAdd,
  onEdit,
  onDelete,
}: {
  globalFilter: PersonFilter;
  onAdd: () => void;
  onEdit: (limit: BudgetLimit) => void;
  onDelete: (limit: BudgetLimit) => void;
}) {
  const { budgetData } = useBudget();

  // Filter budget limits by owner, but keep all if no owner field is set
  const filtered = useMemo(() => {
    if (globalFilter === "Tümü") return budgetData.budgetLimits ?? [];
    return (budgetData.budgetLimits ?? []).filter(
      bl => !bl.owner || bl.owner === globalFilter
    );
  }, [budgetData.budgetLimits, globalFilter]);

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    budgetData.expenses.forEach(e => {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    });
    return map;
  }, [budgetData.expenses]);

  if (filtered.length === 0) {
    return (
      <EmptyState
        emoji="🎯"
        title="Henüz limit yok"
        description="Kategori başına aylık harcama limiti belirleyerek bütçenizi disiplin altına alın."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>
        Kategori başına aylık harcama limiti belirleyin
      </p>

      <div
        className="bvgauges-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map(bl => (
          <BudgetGaugeCard
            key={bl.id}
            limit={bl}
            spent={spentByCategory.get(bl.category) ?? 0}
            onEdit={() => onEdit(bl)}
            onDelete={() => onDelete(bl)}
          />
        ))}

        {/* Add card */}
        <button
          type="button"
          title="Yeni limit"
          onClick={onAdd}
          style={{
            background: "var(--bg-elevated)",
            border: "2px dashed var(--border-subtle)",
            borderRadius: "var(--r-lg)",
            padding: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
            color: "var(--text-tertiary)",
            fontSize: 13,
            fontWeight: 600,
            minHeight: 220,
          }}
        >
          <Plus style={{ width: 28, height: 28 }} />
          Limit Ekle
        </button>
      </div>
    </div>
  );
}

function BudgetGaugeCard({
  limit,
  spent,
  onEdit,
  onDelete,
}: {
  limit: BudgetLimit;
  spent: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = getCategoryMeta(limit.category);
  return (
    <div
      className="card lift"
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          gap: 2,
        }}
      >
        <button
          type="button"
          onClick={onEdit}
          title="Düzenle"
          style={{
            padding: 6,
            borderRadius: 999,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-tertiary)",
            opacity: 0.7,
          }}
        >
          <Pencil style={{ width: 14, height: 14 }} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Sil"
          style={{
            padding: 6,
            borderRadius: 999,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--status-danger)",
            opacity: 0.6,
          }}
        >
          <Trash2 style={{ width: 14, height: 14 }} />
        </button>
      </div>
      <CircularProgress
        value={spent}
        max={limit.limit}
        size={120}
        emoji={meta.emoji}
        label={limit.category}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────
function MiniSummaryCard({
  label,
  amount,
  accent,
}: {
  label: string;
  amount: number;
  accent: string;
}) {
  return (
    <div className="card lift" style={{ padding: "16px 20px" }}>
      <div className="section-label">{label}</div>
      <div
        className="tnum"
        style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: accent }}
      >
        {formatMoney(amount)}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const labels: Record<string, { color: string; bg: string }> = {
    Sabit: {
      color: "var(--owner-ev)",
      bg: "color-mix(in oklch, var(--owner-ev) 15%, transparent)",
    },
    Degisken: {
      color: "var(--owner-arzu)",
      bg: "color-mix(in oklch, var(--owner-arzu) 15%, transparent)",
    },
    Borc: {
      color: "var(--status-danger)",
      bg: "color-mix(in oklch, var(--status-danger) 15%, transparent)",
    },
    Birikim: {
      color: "var(--accent-green)",
      bg: "color-mix(in oklch, var(--accent-green) 15%, transparent)",
    },
  };
  const m = labels[type] ?? labels.Degisken;
  return (
    <span
      className="pill"
      style={{
        background: m.bg,
        color: m.color,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
      }}
    >
      {type === "Degisken" ? "Değişken" : type}
    </span>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete: () => void;
}) {
  const demo = isDemoMode();
  const dp = demoDisabledProps();
  return (
    <div style={{ display: "inline-flex", gap: 4, justifyContent: "center" }}>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          disabled={demo}
          title={demo ? dp.title : "Düzenle (yakında)"}
          style={{
            padding: 6,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-tertiary)",
            opacity: 0.7,
            ...dp.style,
          }}
        >
          <Pencil style={{ width: 14, height: 14 }} />
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={demo}
        title={demo ? dp.title : "Sil"}
        style={{
          padding: 6,
          borderRadius: 6,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "var(--status-danger)",
          ...dp.style,
        }}
      >
        <Trash2 style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

function ExpenseRowActions({
  expense,
  onMakeOnce,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onMakeOnce: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const demo = isDemoMode();
  const dp = demoDisabledProps();
  return (
    <div style={{ display: "inline-flex", gap: 4, justifyContent: "center" }}>
      {expense.type === "Sabit" && (
        <button
          type="button"
          onClick={onMakeOnce}
          disabled={demo}
          title={demo ? dp.title : "Tek seferlik yap (Sabit → Değişken)"}
          style={{
            padding: 6,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--status-warning)",
            ...dp.style,
          }}
        >
          <RotateCw style={{ width: 14, height: 14 }} />
        </button>
      )}
      <button
        type="button"
        onClick={onEdit}
        disabled={demo}
        title={demo ? dp.title : "Düzenle"}
        style={{
          padding: 6,
          borderRadius: 6,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "var(--text-tertiary)",
          opacity: 0.7,
          ...dp.style,
        }}
      >
        <Pencil style={{ width: 14, height: 14 }} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={demo}
        title={demo ? dp.title : "Sil"}
        style={{
          padding: 6,
          borderRadius: 6,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "var(--status-danger)",
          ...dp.style,
        }}
      >
        <Trash2 style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

// ── DataTable ─────────────────────────────────────────────────
interface Column {
  header: string;
  width?: number | "auto";
  align?: "left" | "right" | "center";
  hideOnMobile?: boolean;
}

interface Row {
  key: string | number;
  cells: React.ReactNode[];
}

function DataTable({ columns, rows }: { columns: Column[]; rows: Row[] }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border-faint)",
                background: "var(--bg-elevated)",
              }}
            >
              {columns.map((c, i) => (
                <th
                  key={i}
                  style={{
                    padding: "12px 16px",
                    textAlign: c.align ?? "left",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                    width: c.width === "auto" ? undefined : c.width,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.key}
                style={{ borderBottom: "1px solid var(--border-faint)" }}
              >
                {row.cells.map((cell, i) => (
                  <td
                    key={i}
                    style={{
                      padding: "14px 16px",
                      textAlign: columns[i]?.align ?? "left",
                      verticalAlign: "middle",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page entry ────────────────────────────────────────────────
type DialogState<T> = { open: boolean; entity?: T };

export default function GelirGider() {
  const [tab, setTab] = usePersistedTab<Tab>(
    "tab:gelir-gider",
    "Gelirler",
    TABS
  );
  const { filter } = usePersonFilter();
  const {
    addIncome,
    deleteIncome,
    addExpense,
    deleteExpense,
    addBudgetLimit,
    deleteBudgetLimit,
  } = useBudget();

  const [incomeDialog, setIncomeDialog] = useState<DialogState<Income>>({
    open: false,
  });
  const [expenseDialog, setExpenseDialog] = useState<DialogState<Expense>>({
    open: false,
  });
  const [limitDialog, setLimitDialog] = useState<DialogState<BudgetLimit>>({
    open: false,
  });

  const handleDeleteIncome = (i: Income) =>
    deleteWithUndo({
      item: i,
      description: i.name,
      getId: x => x.id,
      deleteFn: deleteIncome,
      restoreFn: ({ id: _id, ...rest }) => addIncome(rest),
    });

  const handleDeleteExpense = (e: Expense) =>
    deleteWithUndo({
      item: e,
      description: e.subcategory || e.category,
      getId: x => x.id,
      deleteFn: deleteExpense,
      restoreFn: ({ id: _id, ...rest }) => addExpense(rest),
    });

  const handleDeleteLimit = (l: BudgetLimit) =>
    deleteWithUndo({
      item: l,
      description: `${l.category} limiti`,
      getId: x => x.id,
      deleteFn: deleteBudgetLimit,
      restoreFn: ({ id: _id, ...rest }) => addBudgetLimit(rest),
    });

  // Context-aware FAB
  const { requestedAction, clearAction } = useFab();
  useEffect(() => {
    if (requestedAction === "income") {
      setIncomeDialog({ open: true });
      clearAction();
    } else if (requestedAction === "expense") {
      setExpenseDialog({ open: true });
      clearAction();
    } else if (requestedAction === "limit") {
      setLimitDialog({ open: true });
      clearAction();
    }
  }, [requestedAction, clearAction]);

  // Open dialog from MobileFAB QuickAdd via ?action= query param
  const search = useSearch();
  const [, setLocation] = useLocation();
  useEffect(() => {
    const action = new URLSearchParams(search).get("action");
    if (action === "add-income") {
      setTab("Gelirler");
      setIncomeDialog({ open: true });
      setLocation("/gelir-gider", { replace: true });
    } else if (action === "add-expense") {
      setTab("Giderler");
      setExpenseDialog({ open: true });
      setLocation("/gelir-gider", { replace: true });
    } else if (action === "add-limit") {
      setTab("Bütçe Limitleri");
      setLimitDialog({ open: true });
      setLocation("/gelir-gider", { replace: true });
    }
  }, [search, setLocation]);

  const handleAdd = () => {
    if (tab === "Gelirler") setIncomeDialog({ open: true });
    else if (tab === "Giderler") setExpenseDialog({ open: true });
    else setLimitDialog({ open: true });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader tab={tab} onAdd={handleAdd} />

      <TabBar tabs={[...TABS]} active={tab} onChange={t => setTab(t as Tab)} />

      {tab === "Gelirler" && (
        <IncomesTab
          globalFilter={filter}
          onEdit={i => setIncomeDialog({ open: true, entity: i })}
          onDelete={handleDeleteIncome}
        />
      )}
      {tab === "Giderler" && (
        <ExpensesTab
          globalFilter={filter}
          onEdit={e => setExpenseDialog({ open: true, entity: e })}
          onDelete={handleDeleteExpense}
        />
      )}
      {tab === "Bütçe Limitleri" && (
        <BudgetLimitsTab
          globalFilter={filter}
          onAdd={() => setLimitDialog({ open: true })}
          onEdit={l => setLimitDialog({ open: true, entity: l })}
          onDelete={handleDeleteLimit}
        />
      )}

      <IncomeDialog
        open={incomeDialog.open}
        onClose={() => setIncomeDialog({ open: false })}
        entity={incomeDialog.entity}
      />
      <ExpenseDialog
        open={expenseDialog.open}
        onClose={() => setExpenseDialog({ open: false })}
        entity={expenseDialog.entity}
      />
      <BudgetLimitDialog
        open={limitDialog.open}
        onClose={() => setLimitDialog({ open: false })}
        entity={limitDialog.entity}
      />

      {/* Delete confirm dialogs removed in favour of deleteWithUndo toast (FAZ 3). */}
    </div>
  );
}
