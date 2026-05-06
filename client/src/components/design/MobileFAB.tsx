import { useState } from "react";
import { useLocation } from "wouter";
import { Home, ArrowLeftRight, Plus, BarChart3, Menu, ClipboardList, Target, Settings as SettingsIcon, LogOut, RotateCw, Sun, Moon, X, Bell } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { usePerson } from "@/contexts/PersonContext";

interface NavItem {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string;
  path: string;
}

const PRIMARY_NAV: NavItem[] = [
  { icon: Home,           label: "Ana",          path: "/" },
  { icon: ArrowLeftRight, label: "Gelir-Gider",  path: "/gelir-gider" },
  { icon: ClipboardList,  label: "Borç",         path: "/borc-odemeler" },
  { icon: BarChart3,      label: "Raporlar",     path: "/raporlar" },
];

interface MobileFABProps {
  onNotifications?: () => void;
}

export function MobileFAB({ onNotifications }: MobileFABProps) {
  const [location, setLocation] = useLocation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [dahaOpen, setDahaOpen] = useState(false);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          height: 70,
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-faint)",
          boxShadow: "0 -8px 24px -8px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "stretch",
          zIndex: 30,
        }}
      >
        {/* Left 2 nav items */}
        {PRIMARY_NAV.slice(0, 2).map((it) => (
          <NavItemButton key={it.path} item={it} active={location === it.path} onClick={() => setLocation(it.path)} />
        ))}

        {/* Center FAB */}
        <div style={{ position: "relative", width: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            aria-label="Hızlı ekle"
            style={{
              position: "absolute",
              top: -22,
              width: 56, height: 56,
              borderRadius: "50%",
              background: "var(--accent-green)",
              color: "oklch(0.15 0.03 155)",
              border: "none",
              boxShadow: "0 8px 24px -4px var(--accent-green-soft), 0 4px 12px rgba(0,0,0,0.2)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 200ms",
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)"; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          >
            <Plus style={{ width: 28, height: 28 }} />
          </button>
        </div>

        {/* Right 2 nav items */}
        {PRIMARY_NAV.slice(2, 4).map((it) => (
          <NavItemButton key={it.path} item={it} active={location === it.path} onClick={() => setLocation(it.path)} />
        ))}

        {/* Daha */}
        <button
          type="button"
          onClick={() => setDahaOpen(true)}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 2,
            background: "transparent", border: "none",
            color: "var(--text-tertiary)", cursor: "pointer",
            fontSize: 10, fontWeight: 600, paddingTop: 8,
          }}
        >
          <Menu style={{ width: 18, height: 18 }} />
          <span>Daha</span>
        </button>
      </nav>

      {/* Bottom sheets */}
      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <DahaSheet open={dahaOpen} onClose={() => setDahaOpen(false)} onNotifications={onNotifications} />
    </>
  );
}

function NavItemButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button" onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2,
        background: "transparent", border: "none",
        color: active ? "var(--accent-green)" : "var(--text-tertiary)",
        cursor: "pointer", fontSize: 10, fontWeight: 600, paddingTop: 8,
      }}
    >
      <Icon style={{ width: 18, height: 18 }} />
      <span>{item.label}</span>
    </button>
  );
}

// ── QuickAddSheet ─────────────────────────────────────────────
function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, setLocation] = useLocation();
  if (!open) return null;
  const items: Array<{ emoji: string; label: string; color: string; path: string }> = [
    { emoji: "💰", label: "Gelir Ekle",  color: "var(--accent-green)",  path: "/gelir-gider?action=add-income"  },
    { emoji: "🛒", label: "Gider Ekle",  color: "var(--status-danger)", path: "/gelir-gider?action=add-expense" },
    { emoji: "💳", label: "Borç Ekle",   color: "var(--owner-ev)",      path: "/borc-odemeler?action=add-debt"  },
    { emoji: "🎯", label: "Hedef Ekle",  color: "var(--owner-yigit)",   path: "/hedef?action=add-goal"          },
  ];

  return (
    <BottomSheet onClose={onClose} title="Hızlı Ekle">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 20 }}>
        {items.map((it) => (
          <button
            key={it.label} type="button"
            onClick={() => { setLocation(it.path); onClose(); }}
            style={{
              padding: 18,
              borderRadius: "var(--r-lg)",
              background: `color-mix(in oklch, ${it.color} 12%, var(--bg-elevated))`,
              border: `1px solid color-mix(in oklch, ${it.color} 30%, transparent)`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 32 }}>{it.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: it.color }}>{it.label}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

// ── DahaSheet ─────────────────────────────────────────────────
function DahaSheet({ open, onClose, onNotifications }: { open: boolean; onClose: () => void; onNotifications?: () => void }) {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { setCurrentPerson } = usePerson();

  if (!open) return null;

  const go = (path: string) => { setLocation(path); onClose(); };

  return (
    <BottomSheet onClose={onClose} title="Daha">
      <div style={{ padding: "8px 0" }}>
        <SheetItem icon={<Target style={{ width: 18, height: 18 }} />}     label="Birikim & Hedef" onClick={() => go("/hedef")}    chevron />
        <SheetItem icon={<BarChart3 style={{ width: 18, height: 18 }} />}  label="Raporlar"        onClick={() => go("/raporlar")} chevron />
        <SheetItem icon={<SettingsIcon style={{ width: 18, height: 18 }} />} label="Ayarlar"      onClick={() => go("/ayarlar")} chevron />
        {onNotifications && (
          <SheetItem icon={<Bell style={{ width: 18, height: 18 }} />} label="Bildirimler" onClick={() => { onNotifications(); onClose(); }} chevron />
        )}

        <Divider />

        <SheetItem
          icon={theme === "dark" ? <Sun style={{ width: 18, height: 18, color: "#FBBF24" }} /> : <Moon style={{ width: 18, height: 18, color: "#4B5563" }} />}
          label={theme === "dark" ? "Açık Tema" : "Karanlık Tema"}
          onClick={toggleTheme}
        />
        <SheetItem
          icon={<RotateCw style={{ width: 18, height: 18 }} />}
          label="Senkronize Et"
          onClick={() => alert("Senkronizasyon otomatik — bulutla canlı bağlantı aktif")}
        />

        <Divider />

        <SheetItem
          icon={<LogOut style={{ width: 18, height: 18 }} />}
          label="Çıkış Yap"
          danger
          onClick={() => { onClose(); if (confirm("Çıkış yapılsın mı?")) setCurrentPerson(null); }}
        />
      </div>
    </BottomSheet>
  );
}

function SheetItem({ icon, label, onClick, danger, chevron }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; chevron?: boolean }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        width: "100%",
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 14,
        background: "transparent", border: "none",
        color: danger ? "var(--status-danger)" : "var(--text-primary)",
        cursor: "pointer", fontSize: 14, fontWeight: 500,
      }}
    >
      <span style={{ display: "flex", color: danger ? "var(--status-danger)" : "var(--text-secondary)" }}>{icon}</span>
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {chevron && <span style={{ color: "var(--text-tertiary)" }}>›</span>}
    </button>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--border-faint)", margin: "4px 16px" }} />;
}

function BottomSheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 95,
        background: "color-mix(in oklch, var(--bg-base) 50%, transparent)",
        backdropFilter: "blur(4px)",
      }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        zIndex: 96,
        background: "var(--bg-surface)",
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: "80vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.3)",
        animation: "slideUp 250ms cubic-bezier(0.2, 0, 0, 1)",
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-faint)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
          <button type="button" onClick={onClose}
            style={{ padding: 6, borderRadius: 6, border: "none", background: "var(--bg-elevated)", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div style={{ overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </>
  );
}
