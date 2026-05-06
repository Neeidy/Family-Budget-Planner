import { useState, useEffect } from "react";
import { X, Bell } from "lucide-react";

interface Notification {
  id: string;
  emoji: string;
  title: string;
  description: string;
  timeAgo: string;
  type: "info" | "warning" | "success" | "danger";
  read?: boolean;
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    emoji: "💳",
    title: "Kredi kartı vadesi yarın",
    description: "HSBC kredi kartı için €200 ödeme yarın yapılmalı.",
    timeAgo: "2 saat önce",
    type: "warning",
  },
  {
    id: "2",
    emoji: "🌴",
    title: "Tatil hedefi %42 doldu",
    description: "Yaz tatili için €1,250 birikti. Hedefe €1,750 kaldı.",
    timeAgo: "Bugün",
    type: "success",
  },
  {
    id: "3",
    emoji: "🛒",
    title: "Yiyecek limiti yaklaşıyor",
    description: "Bu ay €350 / €400 harcandı. Limit aşımına %12 kaldı.",
    timeAgo: "Dün",
    type: "warning",
  },
  {
    id: "4",
    emoji: "✓",
    title: "Yedek alındı",
    description: "Verileriniz başarıyla yedeklendi.",
    timeAgo: "3 gün önce",
    type: "success",
    read: true,
  },
  {
    id: "5",
    emoji: "📊",
    title: "Aylık özet hazır",
    description: "Mayıs 2026 raporu hazırlandı. Raporlar sayfasından inceleyin.",
    timeAgo: "1 hafta önce",
    type: "info",
    read: true,
  },
];

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  mobile?: boolean;
}

export function NotificationsPanel({ open, onClose, mobile = false }: NotificationsPanelProps) {
  const [items, setItems] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const unreadCount = items.filter((n) => !n.read).length;

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  // Mobile bottom sheet
  if (mobile) {
    return (
      <>
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 90,
            background: "color-mix(in oklch, var(--bg-base) 50%, transparent)",
            backdropFilter: "blur(4px)",
            animation: "fadeIn 200ms",
          }}
        />
        <div style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 91,
          background: "var(--bg-surface)",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: "80vh", display: "flex", flexDirection: "column",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.2)",
        }}>
          <SheetHeader title="Bildirimler" onClose={onClose} unreadCount={unreadCount} onMarkAllRead={markAllRead} />
          <NotificationList items={items} />
        </div>
      </>
    );
  }

  // Desktop dropdown — bell icon altında
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 90, background: "transparent" }}
      />
      <div style={{
        position: "fixed",
        top: 56, right: 16,
        width: 360,
        zIndex: 91,
        background: "var(--bg-surface)",
        borderRadius: "var(--r-lg)",
        boxShadow: "0 16px 48px -8px rgba(0,0,0,0.4), 0 0 0 1px var(--border-faint)",
        maxHeight: "70vh",
        display: "flex", flexDirection: "column",
        animation: "fadeUp 200ms cubic-bezier(0.2, 0, 0, 1)",
      }}>
        <SheetHeader title="Bildirimler" onClose={onClose} unreadCount={unreadCount} onMarkAllRead={markAllRead} />
        <NotificationList items={items} />
      </div>
    </>
  );
}

function SheetHeader({ title, onClose, unreadCount, onMarkAllRead }: { title: string; onClose: () => void; unreadCount: number; onMarkAllRead: () => void }) {
  return (
    <div style={{
      padding: "16px 20px",
      borderBottom: "1px solid var(--border-faint)",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Bell style={{ width: 18, height: 18, color: "var(--text-secondary)" }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
        {unreadCount > 0 && (
          <span style={{
            padding: "2px 8px", borderRadius: 999,
            background: "var(--status-danger)", color: "oklch(0.99 0 0)",
            fontSize: 11, fontWeight: 700,
          }}>
            {unreadCount}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {unreadCount > 0 && (
          <button
            type="button" onClick={onMarkAllRead}
            style={{
              fontSize: 11, fontWeight: 600,
              background: "transparent", border: "none", cursor: "pointer",
              color: "var(--accent-green)", padding: 4,
            }}
          >
            Tümünü Okundu
          </button>
        )}
        <button
          type="button" onClick={onClose}
          style={{
            padding: 6, borderRadius: 6, border: "none",
            background: "var(--bg-elevated)", cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex", alignItems: "center",
          }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}

function NotificationList({ items }: { items: Notification[] }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-tertiary)" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😴</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>Yeni bildirim yok</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Her şey kontrol altında!</div>
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    info:    "var(--owner-yigit)",
    warning: "var(--status-warning)",
    success: "var(--accent-green)",
    danger:  "var(--status-danger)",
  };

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      {items.map((n) => (
        <div key={n.id} style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border-faint)",
          display: "flex", gap: 12,
          background: n.read ? "transparent" : "color-mix(in oklch, var(--owner-yigit) 5%, transparent)",
          cursor: "default",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `color-mix(in oklch, ${colorMap[n.type]} 15%, transparent)`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>
            {n.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{n.title}</div>
              {!n.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: colorMap[n.type], flexShrink: 0 }} />}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2, lineHeight: 1.4 }}>{n.description}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{n.timeAgo}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
