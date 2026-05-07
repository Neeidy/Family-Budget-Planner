import { useState, useMemo, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { Plus, Trash2, Pencil, Calendar } from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import { usePersonFilter, PersonFilter } from "@/contexts/PersonFilterContext";
import {
  TabBar,
  Avatar,
  StatusBadge,
  EmptyState,
  LenderIcon,
  DebtDialog,
  InstallmentDialog,
  AnnualPaymentDialog,
  DeleteConfirmDialog,
} from "@/components/design";
import type { AvatarWho, BadgeStatus } from "@/components/design";
import { formatMoney } from "@/lib/format";
import { applyPersonFilter } from "@/lib/personFilter";
import type { Debt, Installment, AnnualPayment } from "@/hooks/useBudgetData";

const TABS = ["Borçlar", "Taksitler", "Yıllık Ödemeler"] as const;
type Tab = (typeof TABS)[number];

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function ownerToWho(o: string): AvatarWho {
  if (o === "Benim") return "yigit";
  if (o === "Esim")  return "arzu";
  return "ev";
}

function statusToBadge(s: string): BadgeStatus {
  if (s === "Odendi" || s === "Ödendi") return "Odendi";
  if (s === "Gecikti" || s === "Geçikti") return "Gecikti";
  return "Bekliyor";
}

// ── PageHeader ────────────────────────────────────────────────
function PageHeader({ tab, onAdd }: { tab: Tab; onAdd: () => void }) {
  const ctaLabel = tab === "Borçlar" ? "Borç Ekle" : tab === "Taksitler" ? "Taksit Ekle" : "Yıllık Ödeme Ekle";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em", margin: 0, color: "var(--text-primary)" }}>
          Borç & Ödemeler
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 6 }}>
          Borç, taksit ve yıllık ödemelerinizi takip edin
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "10px 16px", borderRadius: "var(--r-md)",
          fontSize: 13, fontWeight: 600, border: "none",
          background: "var(--accent-green)", color: "oklch(0.15 0.03 155)", cursor: "pointer",
        }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        {ctaLabel}
      </button>
    </div>
  );
}

// ── Hero card ─────────────────────────────────────────────────
function HeroCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{
      background: "var(--bg-surface)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-card)",
      padding: 28, borderLeft: `4px solid ${accent ?? "var(--accent-green)"}`,
    }}>
      <div className="section-label">{label}</div>
      <div className="hero-num" style={{
        fontSize: "clamp(2.25rem, 4.5vw, 3rem)", fontWeight: 700, marginTop: 10,
        lineHeight: 1.05, color: accent ?? "var(--text-primary)",
      }}>{value}</div>
    </div>
  );
}

function MiniStatCard({ label, amount, color }: { label: string; amount: number; color?: string }) {
  return (
    <div style={{ background: "var(--bg-surface)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-card)", padding: "16px 20px" }}>
      <div className="section-label">{label}</div>
      <div className="hero-num" style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: color ?? "var(--text-primary)" }}>
        {formatMoney(amount)}
      </div>
    </div>
  );
}

// ── BORÇLAR TAB ───────────────────────────────────────────────
function DebtsTab({ globalFilter, onEdit, onDelete }: {
  globalFilter: PersonFilter;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
}) {
  const { budgetData } = useBudget();

  const filtered = useMemo(() => applyPersonFilter(budgetData.debts, globalFilter), [budgetData.debts, globalFilter]);

  const totalDebt    = filtered.reduce((s, d) => s + d.totalDebt, 0);
  const totalMonthly = filtered.reduce((s, d) => s + d.monthlyPayment, 0);
  const remaining    = filtered.reduce((s, d) => s + Math.max(0, d.totalDebt - d.monthlyPayment), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <HeroCard label="TOPLAM KALAN BORÇ" value={formatMoney(remaining)} accent="var(--status-danger)" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <MiniStatCard label="Toplam Borç"     amount={totalDebt}    color="var(--status-danger)" />
        <MiniStatCard label="Bu Ay Ödenecek"  amount={totalMonthly} color="var(--status-warning)" />
        <MiniStatCard label="Kalan Borç"      amount={remaining}    color="var(--owner-yigit)" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState emoji="💳" title="Borç listesi boş" description="Kredi kartı, banka kredisi veya kişisel borçlarınızı ekleyerek takip edin." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((d) => <DebtCard key={d.id} debt={d} onEdit={() => onEdit(d)} onDelete={() => onDelete(d)} />)}
        </div>
      )}
    </div>
  );
}

function DebtCard({ debt, onEdit, onDelete }: { debt: Debt; onEdit: () => void; onDelete: () => void }) {
  const paid = Math.max(0, debt.totalDebt - (debt.totalDebt - debt.monthlyPayment));
  // monthlyPayment is "this month's payment" — rough progress placeholder
  const paidProgress = debt.totalDebt > 0 ? Math.min(1, debt.monthlyPayment / debt.totalDebt) : 0;
  const remaining = Math.max(0, debt.totalDebt - debt.monthlyPayment);

  return (
    <div style={{
      background: "var(--bg-surface)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-card)",
      padding: 20, display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LenderIcon lender={debt.name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {debt.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            <Avatar who={ownerToWho(debt.owner ?? "Ev")} size={12} /> {debt.owner ?? "Ortak"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" title="Düzenle" onClick={onEdit} style={iconBtn("var(--text-tertiary)")}>
            <Pencil style={{ width: 14, height: 14 }} />
          </button>
          <button type="button" title="Sil" onClick={onDelete} style={iconBtn("var(--status-danger)")}>
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      <div className="hero-num" style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
        {formatMoney(debt.totalDebt)}
      </div>

      <div>
        <div style={{ height: 8, background: "var(--bg-tint)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            width: `${paidProgress * 100}%`, height: "100%",
            background: "var(--accent-green)", borderRadius: 999,
            transition: "width 600ms cubic-bezier(0.2, 0, 0, 1)",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--text-tertiary)" }}>
          <span>Ödenen: <span className="hero-num" style={{ color: "var(--accent-green)" }}>{formatMoney(paid)}</span></span>
          <span>Kalan: <span className="hero-num" style={{ color: "var(--status-danger)" }}>{formatMoney(remaining)}</span></span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--border-faint)" }}>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          {debt.dueDate && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Calendar style={{ width: 12, height: 12 }} />
              {debt.dueDate}
            </span>
          )}
        </div>
        <StatusBadge status={statusToBadge(debt.status)} />
      </div>
    </div>
  );
}

function iconBtn(color: string): React.CSSProperties {
  return { padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color };
}

// ── TAKSİTLER TAB ─────────────────────────────────────────────
function InstallmentsTab({ globalFilter, onEdit, onDelete }: {
  globalFilter: PersonFilter;
  onEdit: (inst: Installment) => void;
  onDelete: (inst: Installment) => void;
}) {
  const { budgetData } = useBudget();

  const filtered = useMemo(() => applyPersonFilter(budgetData.installments ?? [], globalFilter), [budgetData.installments, globalFilter]);

  const totalActive  = filtered.length;
  const totalMonthly = filtered.reduce((s, i) => s + i.monthlyAmount, 0);
  const totalRemaining = filtered.reduce((s, i) => s + Math.max(0, i.totalAmount - i.monthlyAmount * paidCount(i)), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <HeroCard label="AKTİF TAKSİT SAYISI" value={`${totalActive}`} accent="var(--owner-yigit)" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <MiniStatCard label="Bu Ay Toplam"  amount={totalMonthly}   color="var(--status-warning)" />
        <MiniStatCard label="Kalan Toplam"  amount={totalRemaining} color="var(--status-danger)" />
        <MiniStatCard label="Aktif Taksit"  amount={totalActive}    color="var(--accent-green)" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState emoji="🛍" title="Taksit listesi boş" description="Telefon, beyaz eşya veya başka taksitli alışverişlerinizi takip edin." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((i) => <InstallmentCard key={i.id} inst={i} onEdit={() => onEdit(i)} onDelete={() => onDelete(i)} />)}
        </div>
      )}
    </div>
  );
}

function paidCount(i: Installment): number {
  const now = new Date();
  const months = (now.getFullYear() - i.startYear) * 12 + (now.getMonth() + 1 - i.startMonth);
  return Math.max(0, Math.min(i.installmentCount, months + 1));
}

function InstallmentCard({ inst, onEdit, onDelete }: { inst: Installment; onEdit: () => void; onDelete: () => void }) {
  const paid = paidCount(inst);
  const progress = inst.installmentCount > 0 ? paid / inst.installmentCount : 0;
  const remainingCount = inst.installmentCount - paid;

  return (
    <div style={{
      background: "var(--bg-surface)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-card)",
      padding: 20, display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{inst.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
            <Avatar who={ownerToWho(inst.owner)} size={12} /> {inst.owner === "Benim" ? "Benim" : inst.owner === "Esim" ? "Eşim" : "Ortak"}
          </div>
        </div>
        <span className="pill" style={{
          background: "color-mix(in oklch, var(--owner-yigit) 18%, transparent)",
          color: "var(--owner-yigit)", fontSize: 11, fontWeight: 700, padding: "3px 8px",
        }}>
          {paid}/{inst.installmentCount}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="hero-num" style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
          {formatMoney(inst.monthlyAmount)}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>aylık</div>
      </div>

      <div>
        <div style={{ height: 8, background: "var(--bg-tint)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            width: `${progress * 100}%`, height: "100%",
            background: progress >= 1 ? "var(--accent-green)" : "var(--owner-yigit)", borderRadius: 999,
            transition: "width 600ms cubic-bezier(0.2, 0, 0, 1)",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--text-tertiary)" }}>
          <span className="hero-num">{Math.round(progress * 100)}%</span>
          <span>{remainingCount} taksit kaldı</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--border-faint)" }}>
        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
          Toplam: <span className="hero-num">{formatMoney(inst.totalAmount)}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" title="Düzenle" onClick={onEdit} style={iconBtn("var(--text-tertiary)")}>
            <Pencil style={{ width: 14, height: 14 }} />
          </button>
          <button type="button" title="Sil" onClick={onDelete} style={iconBtn("var(--status-danger)")}>
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── YILLIK ÖDEMELER TAB ───────────────────────────────────────
function AnnualPaymentsTab({ onEdit, onDelete }: {
  onEdit: (p: AnnualPayment) => void;
  onDelete: (p: AnnualPayment) => void;
}) {
  const { budgetData } = useBudget();
  const list = budgetData.annualPayments ?? [];

  // Group by month
  const byMonth: Record<number, AnnualPayment[]> = {};
  list.forEach((p) => {
    if (!byMonth[p.paymentMonth]) byMonth[p.paymentMonth] = [];
    byMonth[p.paymentMonth].push(p);
  });

  const totalAnnual = list.reduce((s, p) => s + p.amount, 0);
  const monthlyAvg  = totalAnnual / 12;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <MiniStatCard label="Toplam Yıllık" amount={totalAnnual} color="var(--owner-ev)" />
        <MiniStatCard label="Aylık Ortalama" amount={monthlyAvg} color="var(--owner-yigit)" />
      </div>

      {/* 12-month calendar */}
      <div style={{
        background: "var(--bg-surface)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-card)",
        padding: 20,
      }}>
        <div className="section-label" style={{ marginBottom: 14 }}>YIL TAKVİMİ</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))", gap: 8 }}>
          {MONTHS.map((m, idx) => {
            const monthIdx = idx + 1;
            const items = byMonth[monthIdx] ?? [];
            const monthTotal = items.reduce((s, p) => s + p.amount, 0);
            const hasItems = items.length > 0;
            return (
              <div key={m} style={{
                padding: "10px 8px", borderRadius: 12,
                background: hasItems ? "color-mix(in oklch, var(--owner-ev) 14%, transparent)" : "var(--bg-elevated)",
                border: hasItems ? "1px solid color-mix(in oklch, var(--owner-ev) 30%, transparent)" : "1px solid var(--border-faint)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: hasItems ? "var(--owner-ev)" : "var(--text-tertiary)" }}>{m}</div>
                {hasItems && (
                  <>
                    <div className="hero-num" style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: "var(--text-primary)" }}>
                      {formatMoney(monthTotal)}
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 4 }}>
                      {items.slice(0, 3).map((_, i) => (
                        <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--owner-ev)" }} />
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
        <EmptyState emoji="📅" title="Yıllık ödeme yok" description="Vergi, sigorta veya yıllık abonelik gibi düzenli yıllık ödemelerinizi ekleyin." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {list.map((p) => (
            <div key={p.id} style={{
              background: "var(--bg-surface)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-card)",
              padding: 18, display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</div>
                <span className="pill" style={{
                  background: "color-mix(in oklch, var(--owner-ev) 18%, transparent)",
                  color: "var(--owner-ev)", fontSize: 11, fontWeight: 700, padding: "3px 9px",
                }}>
                  {MONTHS[p.paymentMonth - 1]}
                </span>
              </div>
              <div className="hero-num" style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
                {formatMoney(p.amount)}
              </div>
              {p.lastPaymentDate && (
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  Son ödeme: {p.lastPaymentDate}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, paddingTop: 8, borderTop: "1px solid var(--border-faint)" }}>
                <button type="button" title="Düzenle" onClick={() => onEdit(p)} style={iconBtn("var(--text-tertiary)")}>
                  <Pencil style={{ width: 14, height: 14 }} />
                </button>
                <button type="button" title="Sil" onClick={() => onDelete(p)} style={iconBtn("var(--status-danger)")}>
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
  const [tab, setTab] = useState<Tab>("Borçlar");
  const { filter } = usePersonFilter();
  const { deleteDebt, deleteInstallment, deleteAnnualPayment } = useBudget();

  const [debtDialog, setDebtDialog]                 = useState<DialogState<Debt>>({ open: false });
  const [instDialog, setInstDialog]                 = useState<DialogState<Installment>>({ open: false });
  const [annualDialog, setAnnualDialog]             = useState<DialogState<AnnualPayment>>({ open: false });
  const [debtDelete, setDebtDelete]                 = useState<Debt | null>(null);
  const [instDelete, setInstDelete]                 = useState<Installment | null>(null);
  const [annualDelete, setAnnualDelete]             = useState<AnnualPayment | null>(null);

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
    if (tab === "Borçlar")              setDebtDialog({ open: true });
    else if (tab === "Taksitler")       setInstDialog({ open: true });
    else                                 setAnnualDialog({ open: true });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader tab={tab} onAdd={handleAdd} />
      <TabBar tabs={[...TABS]} active={tab} onChange={(t) => setTab(t as Tab)} />

      {tab === "Borçlar" && (
        <DebtsTab
          globalFilter={filter}
          onEdit={(d) => setDebtDialog({ open: true, entity: d })}
          onDelete={(d) => setDebtDelete(d)}
        />
      )}
      {tab === "Taksitler" && (
        <InstallmentsTab
          globalFilter={filter}
          onEdit={(i) => setInstDialog({ open: true, entity: i })}
          onDelete={(i) => setInstDelete(i)}
        />
      )}
      {tab === "Yıllık Ödemeler" && (
        <AnnualPaymentsTab
          onEdit={(p) => setAnnualDialog({ open: true, entity: p })}
          onDelete={(p) => setAnnualDelete(p)}
        />
      )}

      <DebtDialog          open={debtDialog.open}   onClose={() => setDebtDialog({ open: false })}   entity={debtDialog.entity} />
      <InstallmentDialog   open={instDialog.open}   onClose={() => setInstDialog({ open: false })}   entity={instDialog.entity} />
      <AnnualPaymentDialog open={annualDialog.open} onClose={() => setAnnualDialog({ open: false })} entity={annualDialog.entity} />

      <DeleteConfirmDialog
        open={!!debtDelete}
        onClose={() => setDebtDelete(null)}
        onConfirm={() => debtDelete && deleteDebt(debtDelete.id)}
        label={debtDelete ? `"${debtDelete.name}"` : ""}
        description="Bu borç kaydı kaldırılacak."
      />
      <DeleteConfirmDialog
        open={!!instDelete}
        onClose={() => setInstDelete(null)}
        onConfirm={() => instDelete && deleteInstallment(instDelete.id)}
        label={instDelete ? `"${instDelete.name}"` : ""}
        description="Bu taksit planı kaldırılacak."
      />
      <DeleteConfirmDialog
        open={!!annualDelete}
        onClose={() => setAnnualDelete(null)}
        onConfirm={() => annualDelete && deleteAnnualPayment(annualDelete.id)}
        label={annualDelete ? `"${annualDelete.name}"` : ""}
        description="Bu yıllık ödeme kaldırılacak."
      />
    </div>
  );
}
