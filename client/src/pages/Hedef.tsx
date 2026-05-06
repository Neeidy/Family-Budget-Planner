import { useState, useMemo } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { usePersonFilter } from "@/contexts/PersonFilterContext";
import { Avatar, EmptyState, GoalDialog, DeleteConfirmDialog } from "@/components/design";
import type { AvatarWho } from "@/components/design";
import { formatMoney } from "@/lib/format";
import { applyPersonFilter } from "@/lib/personFilter";
import type { SavingsGoal } from "@/hooks/useBudgetData";

type StatusFilter = "Aktif" | "Tamamlanan" | "Tümü";

function ownerToWho(o: string): AvatarWho {
  if (o === "Benim") return "yigit";
  if (o === "Esim")  return "arzu";
  return "ev";
}

// ── Header ────────────────────────────────────────────────────
function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em", margin: 0, color: "var(--text-primary)" }}>
          Birikim & Hedef
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 6 }}>
          Finansal hedeflerinizi belirleyin ve ilerlemeyi takip edin
        </p>
      </div>
      <button
        type="button" onClick={onAdd}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "10px 16px", borderRadius: "var(--r-md)",
          fontSize: 13, fontWeight: 600, border: "none",
          background: "var(--accent-green)", color: "oklch(0.15 0.03 155)", cursor: "pointer",
        }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        Hedef Ekle
      </button>
    </div>
  );
}

// ── StatusFilter chips ────────────────────────────────────────
function StatusChips({ value, onChange, counts }: { value: StatusFilter; onChange: (v: StatusFilter) => void; counts: Record<StatusFilter, number> }) {
  const items: Array<{ key: StatusFilter; label: string }> = [
    { key: "Aktif",      label: "Aktif" },
    { key: "Tamamlanan", label: "Tamamlanan" },
    { key: "Tümü",       label: "Tümü" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key} type="button" onClick={() => onChange(it.key)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 999,
              fontSize: 12, fontWeight: 600,
              border: active ? "none" : "1px solid var(--border-subtle)",
              background: active ? "var(--accent-green)" : "var(--bg-elevated)",
              color: active ? "oklch(0.15 0.03 155)" : "var(--text-secondary)",
              cursor: "pointer", transition: "all 160ms",
            }}
          >
            {it.label}
            <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{counts[it.key]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── GoalCard ──────────────────────────────────────────────────
function GoalCard({ goal, onEdit, onDelete }: { goal: SavingsGoal; onEdit: () => void; onDelete: () => void }) {
  const pct = goal.targetAmount > 0 ? Math.min(1, goal.currentAmount / goal.targetAmount) : 0;
  const done = goal.currentAmount >= goal.targetAmount;
  const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
  const daysLeft = targetDate ? Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const accent = "var(--accent-green)";
  const emoji = pickEmoji(goal.name);

  return (
    <div style={{
      background: "var(--bg-surface)",
      borderRadius: "var(--r-lg)",
      boxShadow: "var(--shadow-card)",
      padding: 20,
      borderLeft: `3px solid ${done ? "var(--accent-green)" : "var(--owner-yigit)"}`,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      opacity: done ? 0.85 : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 32, lineHeight: 1 }}>{emoji}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{goal.name}</div>
            {done && (
              <span className="pill" style={{
                background: "color-mix(in oklch, var(--accent-green) 18%, transparent)",
                color: "var(--accent-green)", fontSize: 10, fontWeight: 700, padding: "2px 7px", marginTop: 4,
              }}>
                ✓ Tamamlandı
              </span>
            )}
          </div>
        </div>
        <div className="hero-num" style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", textAlign: "right" }}>
          {formatMoney(goal.targetAmount)}
        </div>
      </div>

      <div>
        <div style={{ height: 10, background: "var(--bg-tint)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            width: `${pct * 100}%`, height: "100%",
            background: `linear-gradient(90deg, var(--owner-yigit), ${done ? "var(--accent-green)" : accent})`,
            borderRadius: 999,
            transition: "width 700ms cubic-bezier(0.2, 0, 0, 1)",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--text-tertiary)" }}>
          <span>
            <span className="hero-num" style={{ color: "var(--accent-green)", fontWeight: 600 }}>{formatMoney(goal.currentAmount)}</span>
            {" "}/{" "}
            <span className="hero-num">{formatMoney(goal.targetAmount)}</span>
          </span>
          <span className="hero-num" style={{ fontWeight: 700 }}>{Math.round(pct * 100)}%</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 12, color: "var(--text-tertiary)" }}>
        {daysLeft !== null && (<span>{daysLeft} gün kaldı</span>)}
        {goal.monthlyAllocation > 0 && (
          <span>Aylık <span className="hero-num" style={{ color: "var(--text-primary)" }}>{formatMoney(goal.monthlyAllocation)}</span></span>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--border-faint)" }}>
        <Avatar who={ownerToWho(goal.owner)} size={20} />
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" title="Düzenle" onClick={onEdit}
            style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)" }}>
            <Pencil style={{ width: 14, height: 14 }} />
          </button>
          <button type="button" title="Sil" onClick={onDelete}
            style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--status-danger)" }}>
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function NewGoalCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick} title="Yeni hedef"
      style={{
        background: "var(--bg-elevated)",
        border: "2px dashed var(--border-subtle)",
        borderRadius: "var(--r-lg)",
        padding: 32, minHeight: 220,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
        cursor: "pointer", color: "var(--text-tertiary)", fontSize: 14, fontWeight: 600,
      }}
    >
      <Plus style={{ width: 28, height: 28 }} />
      Yeni Hedef
    </button>
  );
}

function pickEmoji(name: string): string {
  const lower = name.toLocaleLowerCase("tr-TR");
  if (lower.includes("tatil") || lower.includes("seyahat") || lower.includes("gez")) return "🌴";
  if (lower.includes("acil")  || lower.includes("fon")) return "🏥";
  if (lower.includes("tele")  || lower.includes("phone")) return "📱";
  if (lower.includes("ev")    || lower.includes("daire") || lower.includes("kira")) return "🏠";
  if (lower.includes("araç")  || lower.includes("arac") || lower.includes("oto") || lower.includes("car")) return "🚗";
  if (lower.includes("eğit")  || lower.includes("egit") || lower.includes("okul")) return "🎓";
  if (lower.includes("düğün") || lower.includes("dugun") || lower.includes("evlilik")) return "💍";
  if (lower.includes("mobil") || lower.includes("eşya")) return "🛋️";
  return "🎯";
}

// ── Page entry ────────────────────────────────────────────────
export default function Hedef() {
  const { budgetData, deleteSavingsGoal } = useBudget();
  const { filter } = usePersonFilter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Aktif");
  const [goalDialog, setGoalDialog] = useState<{ open: boolean; entity?: SavingsGoal }>({ open: false });
  const [goalDelete, setGoalDelete] = useState<SavingsGoal | null>(null);

  const afterGlobal = useMemo(() => applyPersonFilter(budgetData.savingsGoals ?? [], filter), [budgetData.savingsGoals, filter]);

  const partition = useMemo(() => {
    const aktif = afterGlobal.filter((g) => g.currentAmount < g.targetAmount);
    const tamam = afterGlobal.filter((g) => g.currentAmount >= g.targetAmount);
    return { aktif, tamam };
  }, [afterGlobal]);

  const counts: Record<StatusFilter, number> = {
    Aktif:      partition.aktif.length,
    Tamamlanan: partition.tamam.length,
    Tümü:       afterGlobal.length,
  };

  const visible = useMemo(() => {
    if (statusFilter === "Aktif")      return partition.aktif;
    if (statusFilter === "Tamamlanan") return partition.tamam;
    return afterGlobal;
  }, [statusFilter, partition, afterGlobal]);

  const openAdd = () => setGoalDialog({ open: true });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader onAdd={openAdd} />

      <StatusChips value={statusFilter} onChange={setStatusFilter} counts={counts} />

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
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {visible.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => setGoalDialog({ open: true, entity: g })}
              onDelete={() => setGoalDelete(g)}
            />
          ))}
          <NewGoalCard onClick={openAdd} />
        </div>
      )}

      <GoalDialog
        open={goalDialog.open}
        onClose={() => setGoalDialog({ open: false })}
        entity={goalDialog.entity}
      />
      <DeleteConfirmDialog
        open={!!goalDelete}
        onClose={() => setGoalDelete(null)}
        onConfirm={() => goalDelete && deleteSavingsGoal(goalDelete.id)}
        label={goalDelete ? `"${goalDelete.name}" hedefi` : ""}
        description="Bu birikim hedefi listenizden kaldırılacak."
      />
    </div>
  );
}
