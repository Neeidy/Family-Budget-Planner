import { useState, useMemo, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { usePersonFilter } from "@/contexts/PersonFilterContext";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Avatar,
  EmptyState,
  GoalDialog,
} from "@/components/design";
import { deleteWithUndo } from "@/lib/undoToast";
import type { AvatarWho } from "@/components/design";
import { formatMoney, formatMoneyShort } from "@/lib/format";
import { applyPersonFilter } from "@/lib/personFilter";
import { isDemoMode, demoDisabledProps } from "@/lib/demoMode";
import type { SavingsGoal } from "@/hooks/useBudgetData";

type StatusFilter = "Aktif" | "Tamamlanan" | "Tümü";

function ownerToWho(o: string): AvatarWho {
  if (o === "Benim") return "yigit";
  if (o === "Esim") return "arzu";
  return "ev";
}

function ownerLabel(o: string): string {
  if (o === "Benim") return "Yigit";
  if (o === "Esim") return "Arzu";
  return "Ortak";
}

function pickEmoji(name: string): string {
  const lower = name.toLocaleLowerCase("tr-TR");
  if (
    lower.includes("tatil") ||
    lower.includes("seyahat") ||
    lower.includes("gez")
  )
    return "🌴";
  if (lower.includes("acil") || lower.includes("fon")) return "🏥";
  if (lower.includes("tele") || lower.includes("phone")) return "📱";
  if (lower.includes("ev") || lower.includes("daire") || lower.includes("kira"))
    return "🏠";
  if (
    lower.includes("araç") ||
    lower.includes("arac") ||
    lower.includes("oto") ||
    lower.includes("car")
  )
    return "🚗";
  if (
    lower.includes("eğit") ||
    lower.includes("egit") ||
    lower.includes("okul")
  )
    return "🎓";
  if (
    lower.includes("düğün") ||
    lower.includes("dugun") ||
    lower.includes("evlilik")
  )
    return "💍";
  if (lower.includes("mobil") || lower.includes("eşya")) return "🛋️";
  return "🎯";
}

function pickColor(owner: string): string {
  if (owner === "Benim") return "var(--owner-yigit)";
  if (owner === "Esim") return "var(--owner-arzu)";
  return "var(--accent-green)";
}

// ── Header ────────────────────────────────────────────────────
function PageHeader({ onAdd }: { onAdd: () => void }) {
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
          Birikim & Hedef
        </h1>
        <p
          style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 6 }}
        >
          Tasarruf hedeflerinizi takip edin ve birlikte ulaşın
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
        Hedef Ekle
      </button>
    </div>
  );
}

// ── StatusFilter chips ────────────────────────────────────────
function StatusChips({
  value,
  onChange,
  counts,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
}) {
  const items: Array<{ key: StatusFilter; label: string }> = [
    { key: "Aktif", label: "Aktif" },
    { key: "Tamamlanan", label: "Tamamlanan" },
    { key: "Tümü", label: "Tümü" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map(it => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              border: active ? "none" : "1px solid var(--border-subtle)",
              background: active ? "var(--accent-green)" : "var(--bg-elevated)",
              color: active ? "oklch(0.15 0.03 155)" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 160ms",
            }}
          >
            {it.label}
            <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>
              {counts[it.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── HeroCard — page-birikim.jsx:30-58 ─────────────────────────
function HeroCard({
  totalSaved,
  monthDelta,
  totalTarget,
  activeCount,
  avgPct,
  mobile,
}: {
  totalSaved: number;
  monthDelta: number;
  totalTarget: number;
  activeCount: number;
  avgPct: number;
  mobile: boolean;
}) {
  const totalStr = formatMoney(totalSaved);
  const decMatch = totalStr.match(/,\d{2}$/);
  const totalMain = decMatch ? totalStr.replace(/,\d{2}$/, "") : totalStr;
  const totalDecimals = decMatch?.[0] ?? ",00";

  return (
    <div
      className="card"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklch, var(--accent-green) 16%, var(--bg-surface)), var(--bg-surface) 70%)`,
        padding: mobile ? 24 : 32,
        borderTop: "2px solid var(--accent-green)",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: mobile ? "flex-start" : "center",
          flexDirection: mobile ? "column" : "row",
          gap: mobile ? 12 : 0,
        }}
      >
        <div>
          <div className="section-label">TOPLAM BİRİKİM</div>
          <div
            className="tnum"
            style={{
              fontSize: mobile ? 48 : 60,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              marginTop: 8,
              lineHeight: 1,
            }}
          >
            {totalMain}
            <span style={{ color: "var(--text-tertiary)", fontSize: "0.45em" }}>
              {totalDecimals}
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-tertiary)",
              marginTop: 8,
            }}
          >
            {activeCount} aktif hedef •{" "}
            <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>
              %{avgPct}
            </span>{" "}
            ortalama tamamlanma
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              padding: 16,
              background: "var(--bg-elevated)",
              borderRadius: 14,
              minWidth: 110,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Bu Ay
            </div>
            <div
              className="tnum"
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginTop: 4,
                color: "var(--accent-green)",
              }}
            >
              +{formatMoneyShort(monthDelta)}
            </div>
          </div>
          <div
            style={{
              padding: 16,
              background: "var(--bg-elevated)",
              borderRadius: 14,
              minWidth: 110,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Hedef
            </div>
            <div
              className="tnum"
              style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}
            >
              {formatMoneyShort(totalTarget)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── GoalCard — page-birikim.jsx:73-144 ────────────────────────
function GoalCard({
  goal,
  mobile,
  onEdit,
  onDelete,
  onContribute,
}: {
  goal: SavingsGoal;
  mobile: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onContribute: (amount: number) => void;
}) {
  const pct =
    goal.targetAmount > 0
      ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
      : 0;
  const color = pickColor(goal.owner);
  const emoji = pickEmoji(goal.name);
  const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
  const days = targetDate
    ? Math.max(
        0,
        Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : null;

  // Projected completion vs target date
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthsUntilTarget = targetDate
    ? Math.max(
        0,
        (targetDate.getFullYear() - new Date().getFullYear()) * 12 +
          (targetDate.getMonth() - new Date().getMonth())
      )
    : null;

  let projectionStatus: {
    label: string;
    color: string;
    bg: string;
  } | null = null;
  if (remainingAmount <= 0) {
    projectionStatus = {
      label: "✓ Hedef tamamlandı",
      color: "var(--status-success)",
      bg: "color-mix(in oklch, var(--status-success) 14%, transparent)",
    };
  } else if (goal.monthlyAllocation <= 0) {
    projectionStatus = {
      label: "⚠ Aylık katkı belirtilmemiş",
      color: "var(--status-warning)",
      bg: "color-mix(in oklch, var(--status-warning) 14%, transparent)",
    };
  } else if (monthsUntilTarget !== null && targetDate !== null) {
    const monthsNeeded = Math.ceil(remainingAmount / goal.monthlyAllocation);
    if (monthsUntilTarget <= 0) {
      projectionStatus = {
        label: "⚠ Hedef tarihi geçti, güncelle",
        color: "var(--status-danger)",
        bg: "color-mix(in oklch, var(--status-danger) 14%, transparent)",
      };
    } else if (monthsNeeded <= monthsUntilTarget) {
      projectionStatus = {
        label: "✓ Hedef tarihine yetişiyor",
        color: "var(--status-success)",
        bg: "color-mix(in oklch, var(--status-success) 14%, transparent)",
      };
    } else {
      const delayMonths = monthsNeeded - monthsUntilTarget;
      const neededMonthly = Math.ceil(remainingAmount / monthsUntilTarget);
      projectionStatus = {
        label: `⚠ ${delayMonths} ay gecikme — aylık €${neededMonthly} gerekli`,
        color: "var(--status-warning)",
        bg: "color-mix(in oklch, var(--status-warning) 14%, transparent)",
      };
    }
  }

  return (
    <div
      className="card lift"
      style={{
        position: "relative",
        padding: mobile ? 20 : 24,
        borderLeft: `3px solid ${color}`,
        overflow: "hidden",
      }}
    >
      {/* Soft halo */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}, transparent 70%)`,
          opacity: 0.15,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: `color-mix(in oklch, ${color} 18%, var(--bg-elevated))`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            {emoji}
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {goal.name}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 4,
              }}
            >
              <Avatar who={ownerToWho(goal.owner)} size={18} />
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                {ownerLabel(goal.owner)}
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            className="tnum"
            style={{
              fontSize: mobile ? 22 : 26,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
            }}
          >
            {formatMoneyShort(goal.targetAmount)}
          </div>
          <div
            className="tnum"
            style={{ fontSize: 12, color: "var(--text-tertiary)" }}
          >
            {formatMoneyShort(goal.currentAmount)} biriktirildi
          </div>
        </div>
      </div>

      {projectionStatus && (
        <div
          style={{
            marginTop: 14,
            padding: "8px 12px",
            borderRadius: 10,
            background: projectionStatus.bg,
            color: projectionStatus.color,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {projectionStatus.label}
        </div>
      )}
      <div style={{ marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              fontWeight: 600,
            }}
          >
            İLERLEME
          </span>
          <span
            className="tnum"
            style={{ fontSize: 13, fontWeight: 700, color }}
          >
            %{pct}
          </span>
        </div>
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
              width: `${Math.min(100, pct)}%`,
              height: "100%",
              background: `linear-gradient(90deg, color-mix(in oklch, ${color} 50%, var(--accent-green)), ${color})`,
              borderRadius: 999,
              transition: "width 700ms cubic-bezier(0.2, 0, 0, 1)",
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid var(--border-faint)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 12,
            color: "var(--text-tertiary)",
            flexWrap: "wrap",
          }}
        >
          {days !== null && days > 0 && (
            <span>
              📅{" "}
              <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                {days}
              </span>{" "}
              gün kaldı
            </span>
          )}
          {(days === null || days === 0) && <span>♾️ Sürekli</span>}
          {goal.monthlyAllocation > 0 && (
            <span>
              💰{" "}
              <span
                className="tnum"
                style={{ color: "var(--text-secondary)", fontWeight: 600 }}
              >
                {formatMoneyShort(goal.monthlyAllocation)}
              </span>
              /ay
            </span>
          )}
          {/* Quick contribution chips */}
          {[50, 100, 500].map(v => (
            <button
              key={v}
              type="button"
              disabled={isDemoMode()}
              onClick={() => onContribute(v)}
              title={
                isDemoMode()
                  ? "Demo modunda düzenleme yapılamaz"
                  : `+€${v} ekle`
              }
              style={{
                padding: "3px 8px",
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 999,
                border: `1px solid color-mix(in oklch, ${color} 35%, transparent)`,
                background: `color-mix(in oklch, ${color} 12%, transparent)`,
                color: color,
                cursor: isDemoMode() ? "not-allowed" : "pointer",
                ...demoDisabledProps().style,
              }}
            >
              +€{v}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            disabled={isDemoMode()}
            title={
              isDemoMode() ? "Demo modunda düzenleme yapılamaz" : "Düzenle"
            }
            onClick={onEdit}
            style={{
              padding: 6,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-tertiary)",
              ...demoDisabledProps().style,
            }}
          >
            <Pencil style={{ width: 14, height: 14 }} />
          </button>
          <button
            type="button"
            disabled={isDemoMode()}
            title={isDemoMode() ? "Demo modunda düzenleme yapılamaz" : "Sil"}
            onClick={onDelete}
            style={{
              padding: 6,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--status-danger)",
              ...demoDisabledProps().style,
            }}
          >
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NewGoalCard — page-birikim.jsx:146-183 ────────────────────
function NewGoalCard({
  onClick,
  mobile,
}: {
  onClick: () => void;
  mobile: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "1.5px dashed var(--border-subtle)",
        background: "transparent",
        borderRadius: "var(--r-lg)",
        padding: mobile ? 24 : 36,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        color: "var(--text-tertiary)",
        fontFamily: "inherit",
        transition: "all 200ms",
        minHeight: 180,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = "var(--accent-green)";
        el.style.color = "var(--accent-green)";
        el.style.background = "var(--accent-green-soft)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = "var(--border-subtle)";
        el.style.color = "var(--text-tertiary)";
        el.style.background = "transparent";
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Plus style={{ width: 22, height: 22 }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Yeni Hedef Ekle</div>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          textAlign: "center",
          maxWidth: 220,
        }}
      >
        Tatil, ev, eğitim — birlikte planlayın
      </div>
    </button>
  );
}

// ── Page entry ────────────────────────────────────────────────
export default function Hedef() {
  const { budgetData, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } =
    useBudget();
  const { filter } = usePersonFilter();
  const isMobile = useIsMobile();
  const mobile = !!isMobile;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Aktif");
  const [goalDialog, setGoalDialog] = useState<{
    open: boolean;
    entity?: SavingsGoal;
  }>({ open: false });

  const handleDeleteGoal = (g: SavingsGoal) =>
    deleteWithUndo({
      item: g,
      description: `${g.name} hedefi`,
      getId: x => x.id,
      deleteFn: deleteSavingsGoal,
      restoreFn: ({ id: _id, ...rest }) => addSavingsGoal(rest),
    });

  // Open dialog from MobileFAB QuickAdd via ?action= query param
  const search = useSearch();
  const [, setLocation] = useLocation();
  useEffect(() => {
    const action = new URLSearchParams(search).get("action");
    if (action === "add-goal") {
      setGoalDialog({ open: true });
      setLocation("/hedef", { replace: true });
    }
  }, [search, setLocation]);

  const afterGlobal = useMemo(
    () => applyPersonFilter(budgetData.savingsGoals ?? [], filter),
    [budgetData.savingsGoals, filter]
  );

  const partition = useMemo(() => {
    const aktif = afterGlobal.filter(g => g.currentAmount < g.targetAmount);
    const tamam = afterGlobal.filter(g => g.currentAmount >= g.targetAmount);
    return { aktif, tamam };
  }, [afterGlobal]);

  const counts: Record<StatusFilter, number> = {
    Aktif: partition.aktif.length,
    Tamamlanan: partition.tamam.length,
    Tümü: afterGlobal.length,
  };

  const visible = useMemo(() => {
    if (statusFilter === "Aktif") return partition.aktif;
    if (statusFilter === "Tamamlanan") return partition.tamam;
    return afterGlobal;
  }, [statusFilter, partition, afterGlobal]);

  // Hero stats
  const totalSaved = afterGlobal.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = afterGlobal.reduce((s, g) => s + g.targetAmount, 0);
  const monthDelta = afterGlobal.reduce(
    (s, g) => s + (g.monthlyAllocation || 0),
    0
  );
  const activeCount = partition.aktif.length;
  const avgPct =
    afterGlobal.length === 0
      ? 0
      : Math.round(
          afterGlobal.reduce(
            (s, g) =>
              s +
              (g.targetAmount > 0
                ? Math.min(100, (g.currentAmount / g.targetAmount) * 100)
                : 0),
            0
          ) / afterGlobal.length
        );

  const openAdd = () => setGoalDialog({ open: true });

  return (
    <div
      className="fade-up"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: mobile ? 16 : 20,
      }}
    >
      <PageHeader onAdd={openAdd} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <StatusChips
          value={statusFilter}
          onChange={setStatusFilter}
          counts={counts}
        />
      </div>

      {/* Hero card — TOPLAM BİRİKİM */}
      <HeroCard
        totalSaved={totalSaved}
        monthDelta={monthDelta}
        totalTarget={totalTarget}
        activeCount={activeCount}
        avgPct={avgPct}
        mobile={mobile}
      />

      {/* Goals grid */}
      {visible.length === 0 && counts.Tümü === 0 ? (
        <EmptyState
          emoji="🎯"
          title="Henüz hedef yok"
          description="Yaz tatili, yeni telefon, acil fon — finansal hedef belirleyerek birikim yapmaya başlayın."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="Bu filtrede hedef yok"
          description="Filtreyi değiştirerek diğer hedefleri görebilirsiniz."
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "repeat(2, 1fr)",
            gap: 16,
          }}
        >
          {visible.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              mobile={mobile}
              onEdit={() => setGoalDialog({ open: true, entity: g })}
              onDelete={() => handleDeleteGoal(g)}
              onContribute={amount =>
                updateSavingsGoal(g.id, {
                  currentAmount: Math.min(
                    g.targetAmount,
                    g.currentAmount + amount
                  ),
                })
              }
            />
          ))}
          <NewGoalCard onClick={openAdd} mobile={mobile} />
        </div>
      )}

      <GoalDialog
        open={goalDialog.open}
        onClose={() => setGoalDialog({ open: false })}
        entity={goalDialog.entity}
      />
      {/* Delete confirm dialog replaced by deleteWithUndo toast (FAZ 3). */}
    </div>
  );
}
