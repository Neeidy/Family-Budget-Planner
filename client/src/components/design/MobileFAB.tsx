import { useState } from "react";
import { useLocation } from "wouter";
import { Home, ArrowLeftRight, Plus, ClipboardList, Target, X } from "lucide-react";

interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  path: string;
  fab?: boolean;
}

/**
 * Line-by-line port of _design/nav.jsx:167-219 (MobileBottomNav).
 * 5-item layout with center FAB that lifts above the nav line via marginTop:-28
 * + 4px ring (border solid bg-surface).
 */

const NAV_ITEMS: NavItem[] = [
  { key: "ana",     label: "Ana Sayfa", icon: Home,           path: "/" },
  { key: "gelir",   label: "Gelir",     icon: ArrowLeftRight, path: "/gelir-gider" },
  { key: "fab",     label: "",          icon: Plus,           path: "",                fab: true },
  { key: "borc",    label: "Borç",      icon: ClipboardList,  path: "/borc-odemeler" },
  { key: "birikim", label: "Hedef",     icon: Target,         path: "/hedef" },
];

interface MobileFABProps {
  /** kept for backward compat with DashboardLayout — not used in new 5-item layout */
  onNotifications?: () => void;
}

export function MobileFAB(_props: MobileFABProps) {
  const [location, setLocation] = useLocation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleFab = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "fabPress 280ms cubic-bezier(0.2, 0, 0, 1)";
    setQuickAddOpen(true);
  };

  return (
    <>
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "color-mix(in oklch, var(--bg-surface) 88%, transparent)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-faint)",
        padding: "8px 8px calc(env(safe-area-inset-bottom, 0px) + 12px)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 30,
        overflow: "visible",
      }}>
        {NAV_ITEMS.map((it) => {
          if (it.fab) {
            return (
              <button
                key="fab"
                type="button"
                onClick={handleFab}
                aria-label="Hızlı ekle"
                style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "var(--accent-green)",
                  color: "oklch(0.15 0.03 155)",
                  border: "4px solid var(--bg-surface)",
                  cursor: "pointer",
                  marginTop: -28,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 24px -4px var(--accent-green-soft), 0 0 0 0 var(--accent-green-soft)",
                  transition: "transform 100ms",
                }}
              >
                <Plus style={{ width: 24, height: 24 }} />
              </button>
            );
          }
          const active = location === it.path;
          const Icon = it.icon;
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => setLocation(it.path)}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "6px 8px",
                color: active ? "var(--accent-green)" : "var(--text-tertiary)",
                fontWeight: active ? 700 : 500,
                fontSize: 10, minWidth: 56,
              }}
            >
              <Icon style={{ width: 20, height: 20 }} />
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>

      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
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
            key={it.label}
            type="button"
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
