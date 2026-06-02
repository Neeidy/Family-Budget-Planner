import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type BadgeStatus = "Odendi" | "Bekliyor" | "Gecikti";

interface StatusBadgeProps {
  status: BadgeStatus;
  /** When provided, the badge becomes click-toggleable via popover. */
  onChange?: (next: BadgeStatus) => void;
  disabled?: boolean;
}

const STATUS_DOT: Record<BadgeStatus, string> = {
  Odendi: "✓",
  Bekliyor: "⏳",
  Gecikti: "⚠",
};

const STATUS_KEY: Record<BadgeStatus, string> = {
  Odendi: "status.paid",
  Bekliyor: "status.pending",
  Gecikti: "status.overdue",
};

const STATUS_COLOR: Record<BadgeStatus, string> = {
  Odendi: "var(--status-success)",
  Bekliyor: "var(--status-warning)",
  Gecikti: "var(--status-danger)",
};

const ALL_STATUSES: BadgeStatus[] = ["Odendi", "Bekliyor", "Gecikti"];

export function StatusBadge({ status, onChange, disabled }: StatusBadgeProps) {
  const { t } = useTranslation();
  const color = STATUS_COLOR[status];
  const dot = STATUS_DOT[status];
  const label = t(STATUS_KEY[status]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const interactive = !!onChange && !disabled;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <span
        className="pill"
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? () => setOpen(o => !o) : undefined}
        onKeyDown={
          interactive
            ? e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(o => !o);
                }
              }
            : undefined
        }
        style={{
          background: `color-mix(in oklch, ${color} 18%, transparent)`,
          color,
          fontSize: 12,
          fontWeight: 600,
          cursor: interactive ? "pointer" : "default",
          userSelect: "none",
          ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
        }}
      >
        <span>{dot}</span>
        {label}
      </span>
      {open && interactive && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: 4,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-faint)",
            borderRadius: 10,
            boxShadow: "0 12px 28px -12px rgba(0,0,0,0.55)",
            minWidth: 140,
          }}
        >
          {ALL_STATUSES.map(s => {
            const c = STATUS_COLOR[s];
            const active = s === status;
            return (
              <button
                key={s}
                type="button"
                role="menuitem"
                onClick={() => {
                  onChange?.(s);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: active
                    ? `color-mix(in oklch, ${c} 18%, transparent)`
                    : "transparent",
                  color: active ? c : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <span style={{ color: c }}>{STATUS_DOT[s]}</span>
                {t(STATUS_KEY[s])}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}
