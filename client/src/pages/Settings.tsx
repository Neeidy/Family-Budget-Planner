import { useState, useRef } from "react";
import { Moon, Sun, LogOut, Check, Download, Upload, KeyRound, Eye, EyeOff, Eye as ViewIcon, RotateCcw, Archive, FileJson, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { usePerson } from "@/contexts/PersonContext";
import { useBudget } from "@/contexts/BudgetContext";
import { trpc } from "@/lib/trpc";
import { Avatar } from "@/components/design";
import { formatMoney } from "@/lib/format";

// ── Section card wrapper ──────────────────────────────────────
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function GhostButton({ onClick, children, danger, accent, disabled, title }: {
  onClick?: () => void;
  children: React.ReactNode;
  danger?: boolean;
  accent?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const color = danger ? "var(--status-danger)" : accent ? "var(--accent-green)" : "var(--text-secondary)";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 16px",
        borderRadius: "var(--r-md)",
        fontSize: 13,
        fontWeight: 600,
        border: `1px solid color-mix(in oklch, ${color} 35%, transparent)`,
        background: `color-mix(in oklch, ${color} 8%, transparent)`,
        color,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 160ms",
      }}
    >
      {children}
    </button>
  );
}

function PasswordInput({ value, onChange, show, onToggle, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      background: "var(--bg-elevated)",
      borderRadius: 12,
      border: "1px solid var(--border-faint)",
    }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, minWidth: 0,
          background: "transparent", border: "none", outline: "none",
          color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit",
        }}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          color: "var(--text-tertiary)", padding: 2,
          display: "flex", alignItems: "center",
        }}
      >
        {show ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
      </button>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────
export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { person1Name, person2Name, setPerson1Name, setPerson2Name, currentPerson, setCurrentPerson } = usePerson();
  const { exportData, importData, saveCurrentMonthToArchive, archive } = useBudget();

  const [name1, setName1] = useState(person1Name);
  const [name2, setName2] = useState(person2Name);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  // History
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);

  const historyQuery = trpc.familyBudget.history.list.useQuery();
  const snapshotQuery = trpc.familyBudget.history.get.useQuery(
    { id: selectedSnapshotId! },
    { enabled: selectedSnapshotId !== null && showSnapshotModal },
  );

  const utils = trpc.useUtils();
  const currentBudgetQuery = trpc.familyBudget.get.useQuery();

  const restoreMutation = trpc.familyBudget.history.restore.useMutation({
    onSuccess: () => {
      toast.success("Yedek başarıyla geri yüklendi!");
      utils.familyBudget.get.invalidate();
      utils.familyBudget.history.list.invalidate();
    },
    onError: (err) => {
      if (err.data?.code === "CONFLICT") {
        toast.error("Veri başka cihazdan değişti, sayfa yenileniyor...");
        utils.familyBudget.get.invalidate();
      } else {
        toast.error(err.message);
      }
    },
  });

  const handleRestore = (id: number) => {
    if (!confirm("Bu yedek geri yüklensin mi? Mevcut veriler otomatik yedeklenir.")) return;
    const expectedUpdatedAt = currentBudgetQuery.data?.updatedAt
      ? new Date(currentBudgetQuery.data.updatedAt).toISOString()
      : null;
    restoreMutation.mutate({ id, expectedUpdatedAt });
  };

  const parseSnapshotSummary = (snapshot: string) => {
    try {
      const data = JSON.parse(snapshot);
      const incomes  = JSON.parse(data.incomes  ?? "[]");
      const expenses = JSON.parse(data.expenses ?? "[]");
      const totalIncome  = incomes.reduce((s: number, i: { amount?: number }) => s + (i.amount ?? 0), 0);
      const totalExpense = expenses.reduce((s: number, i: { amount?: number }) => s + (i.amount ?? 0), 0);
      return { incomes: incomes.length, expenses: expenses.length, totalIncome, totalExpense };
    } catch {
      return null;
    }
  };

  const changePasswordMutation = trpc.familyAuth.changePassword.useMutation({
    onSuccess: () => {
      setPwSaved(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setPwSaved(false), 3000);
      toast.success("Şifre başarıyla değiştirildi!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error("Tüm alanları doldurun");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    if (newPw.length < 4) {
      toast.error("Yeni şifre en az 4 karakter olmalı");
      return;
    }
    changePasswordMutation.mutate({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw });
  };

  const handleSaveNames = () => {
    if (name1.trim()) setPerson1Name(name1.trim());
    if (name2.trim()) setPerson2Name(name2.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      importData(text);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogout = () => {
    if (!confirm("Çıkış yapmak istediğinize emin misiniz?")) return;
    setCurrentPerson(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em", margin: 0, color: "var(--text-primary)" }}>
          Ayarlar
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 6 }}>
          Profil, görünüm ve yedek tercihlerinizi yönetin
        </p>
      </div>

      {/* PROFİL */}
      <Section title="Profil" description="Aile üyelerinin görünen isimleri">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <ProfileCard who="yigit" active={currentPerson === "Benim"} value={name1} onChange={setName1} />
          <ProfileCard who="arzu"  active={currentPerson === "Esim"}  value={name2} onChange={setName2} />
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={handleSaveNames}
            disabled={!name1.trim() || !name2.trim()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 16px", borderRadius: "var(--r-md)",
              fontSize: 13, fontWeight: 600, border: "none",
              background: "var(--accent-green)", color: "oklch(0.15 0.03 155)",
              cursor: "pointer", opacity: !name1.trim() || !name2.trim() ? 0.5 : 1,
            }}
          >
            {saved ? <><Check style={{ width: 14, height: 14 }} /> Kaydedildi</> : "İsimleri Kaydet"}
          </button>
        </div>
      </Section>

      {/* GÖRÜNÜM */}
      <Section title="Görünüm" description="Tema ve dil tercihleri">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Tema
            </div>
            <div style={{ display: "inline-flex", padding: 4, background: "var(--bg-elevated)", borderRadius: 999, gap: 2 }}>
              <ThemeButton label="Açık"     active={theme === "light"} icon={<Sun  style={{ width: 14, height: 14 }} />} onClick={() => theme === "dark" && toggleTheme()} />
              <ThemeButton label="Karanlık" active={theme === "dark"}  icon={<Moon style={{ width: 14, height: 14 }} />} onClick={() => theme === "light" && toggleTheme()} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Dil
            </div>
            <select disabled style={{
              padding: "10px 14px", borderRadius: "var(--r-md)",
              fontSize: 13, fontWeight: 600,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-faint)",
              color: "var(--text-primary)",
              cursor: "not-allowed",
              opacity: 0.7,
            }}>
              <option>Türkçe</option>
            </select>
          </div>
        </div>
      </Section>

      {/* VERİ YÖNETİMİ */}
      <Section title="Veri Yönetimi" description="JSON yedek alma / yükleme">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <GhostButton onClick={exportData} accent>
            <Download style={{ width: 14, height: 14 }} /> Verileri İndir (JSON)
          </GhostButton>
          <GhostButton onClick={() => fileInputRef.current?.click()}>
            <Upload style={{ width: 14, height: 14 }} /> Yedekten Yükle
          </GhostButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </div>
        <div style={{
          marginTop: 14, padding: "10px 14px",
          borderRadius: "var(--r-md)",
          background: "color-mix(in oklch, var(--status-warning) 10%, transparent)",
          border: "1px solid color-mix(in oklch, var(--status-warning) 25%, transparent)",
          fontSize: 12, color: "var(--status-warning)",
        }}>
          ⚠ Yedekten yükleme mevcut verilerin üzerine yazar. İşlem geri alınabilir (Ctrl+Z).
        </div>

        {/* Ay arşivi */}
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border-faint)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Ay Arşivi</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
                {archive.length > 0 ? `${archive.length} ay arşivlendi` : "Henüz arşiv yok"}
              </div>
            </div>
            <GhostButton onClick={saveCurrentMonthToArchive}>
              <Archive style={{ width: 14, height: 14 }} /> Bu Ayı Arşive Kaydet
            </GhostButton>
          </div>
        </div>
      </Section>

      {/* ŞİFRE DEĞİŞTİR */}
      <Section title="Şifre Değiştir" description="Aile giriş şifresini güncelleyin">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Mevcut Şifre
            </div>
            <PasswordInput value={currentPw} onChange={setCurrentPw} show={showCurrentPw} onToggle={() => setShowCurrentPw((v) => !v)} placeholder="Mevcut şifre" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Yeni Şifre
            </div>
            <PasswordInput value={newPw} onChange={setNewPw} show={showNewPw} onToggle={() => setShowNewPw((v) => !v)} placeholder="En az 4 karakter" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Yeni Şifre (Tekrar)
            </div>
            <PasswordInput value={confirmPw} onChange={setConfirmPw} show={showConfirmPw} onToggle={() => setShowConfirmPw((v) => !v)} placeholder="Tekrar girin" />
          </div>
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={changePasswordMutation.isPending || pwSaved}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 16px", borderRadius: "var(--r-md)",
              fontSize: 13, fontWeight: 600, border: "none",
              background: pwSaved ? "var(--accent-green)" : "var(--owner-yigit)",
              color: pwSaved ? "oklch(0.15 0.03 155)" : "oklch(0.99 0 0)",
              cursor: changePasswordMutation.isPending ? "not-allowed" : "pointer",
              opacity: changePasswordMutation.isPending ? 0.7 : 1,
            }}
          >
            {pwSaved ? <><Check style={{ width: 14, height: 14 }} /> Değiştirildi</> :
             changePasswordMutation.isPending ? "Değiştiriliyor..." :
             <><KeyRound style={{ width: 14, height: 14 }} /> Şifreyi Değiştir</>}
          </button>
        </div>
      </Section>

      {/* YEDEK GEÇMİŞİ */}
      <Section title="Yedek Geçmişi" description="Son 30 yedek otomatik tutulur">
        {historyQuery.isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skel" style={{ height: 56, borderRadius: 12 }} />
            ))}
          </div>
        ) : historyQuery.data && historyQuery.data.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {historyQuery.data.map((item) => (
              <BackupRow
                key={item.id}
                item={item}
                onView={() => { setSelectedSnapshotId(item.id); setShowSnapshotModal(true); }}
                onRestore={() => handleRestore(item.id)}
                disabled={restoreMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
            Henüz yedek yok. Veri kaydettiğinizde otomatik yedek oluşur.
          </div>
        )}
      </Section>

      {/* ÇIKIŞ */}
      <Section title="Çıkış">
        <GhostButton onClick={handleLogout} danger>
          <LogOut style={{ width: 14, height: 14 }} /> Çıkış Yap
        </GhostButton>
      </Section>

      {/* Snapshot detail modal */}
      {showSnapshotModal && (
        <div
          onClick={() => setShowSnapshotModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "color-mix(in oklch, var(--bg-base) 60%, transparent)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface)",
              borderRadius: 20,
              boxShadow: "var(--shadow-lg)",
              maxWidth: 480, width: "100%",
              padding: 24,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Yedek Detayı</h3>
            <div style={{ marginTop: 14, fontSize: 13, color: "var(--text-secondary)" }}>
              {snapshotQuery.isLoading ? "Yükleniyor..." : (() => {
                if (!snapshotQuery.data) return "Veri bulunamadı";
                const sum = parseSnapshotSummary(snapshotQuery.data.snapshot);
                if (!sum) return "Veri okunamadı";
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div>Gelir kaydı: <strong>{sum.incomes}</strong></div>
                    <div>Gider kaydı: <strong>{sum.expenses}</strong></div>
                    <div>Toplam Gelir: <strong className="hero-num" style={{ color: "var(--accent-green)" }}>{formatMoney(sum.totalIncome)}</strong></div>
                    <div>Toplam Gider: <strong className="hero-num" style={{ color: "var(--status-danger)" }}>{formatMoney(sum.totalExpense)}</strong></div>
                  </div>
                );
              })()}
            </div>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
              <GhostButton onClick={() => setShowSnapshotModal(false)}>Kapat</GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileCard({ who, active, value, onChange }: { who: "yigit" | "arzu"; active: boolean; value: string; onChange: (v: string) => void }) {
  const ownerColor = `var(--owner-${who})`;
  return (
    <div style={{
      padding: 16,
      borderRadius: "var(--r-lg)",
      background: active ? `color-mix(in oklch, ${ownerColor} 10%, var(--bg-elevated))` : "var(--bg-elevated)",
      border: active ? `2px solid ${ownerColor}` : "2px solid transparent",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <Avatar who={who} size={48} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            background: "transparent", border: "none", outline: "none",
            color: "var(--text-primary)",
            fontSize: 15, fontWeight: 700, fontFamily: "inherit",
          }}
        />
        {active && (
          <div style={{ fontSize: 11, color: ownerColor, fontWeight: 600, marginTop: 2 }}>
            ● Aktif kullanıcı
          </div>
        )}
      </div>
    </div>
  );
}

function ThemeButton({ label, active, icon, onClick }: { label: string; active: boolean; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 999,
        fontSize: 12, fontWeight: 600, border: "none",
        background: active ? "var(--accent-green)" : "transparent",
        color: active ? "oklch(0.15 0.03 155)" : "var(--text-secondary)",
        cursor: "pointer",
      }}
    >
      {icon} {label}
    </button>
  );
}

interface BackupItem {
  id: number;
  createdAt: string | Date;
  savedBy: string | null;
  snapshot?: string;
}

function BackupRow({ item, onView, onRestore, disabled }: { item: BackupItem; onView: () => void; onRestore: () => void; disabled: boolean }) {
  const dt = new Date(item.createdAt);
  const formattedDate = dt.toLocaleString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const who = item.savedBy === "Benim" ? "yigit" : item.savedBy === "Esim" ? "arzu" : "ev";
  const name = item.savedBy ?? "Otomatik";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 16px",
      background: "var(--bg-elevated)",
      borderRadius: 12,
      border: "1px solid var(--border-faint)",
    }}>
      <FileJson style={{ width: 18, height: 18, color: "var(--owner-yigit)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{formattedDate}</div>
        <div style={{ fontSize: 11, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Avatar who={who as "yigit" | "arzu" | "ev"} size={12} />
          {name}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button type="button" onClick={onView} title="Görüntüle"
          style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)" }}>
          <ViewIcon style={{ width: 14, height: 14 }} />
        </button>
        <button type="button" onClick={onRestore} disabled={disabled} title="Geri Yükle"
          style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: disabled ? "not-allowed" : "pointer", color: "var(--status-warning)", opacity: disabled ? 0.5 : 1 }}>
          <RotateCcw style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}
