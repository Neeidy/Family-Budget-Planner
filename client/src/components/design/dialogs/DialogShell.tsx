import { ReactNode, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface DialogShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: ReactNode;
  footer?: ReactNode;
}

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export function DialogShell({
  open,
  onClose,
  title,
  width = 480,
  children,
  footer,
}: DialogShellProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobileViewport();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const supportsDvh =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("height", "100dvh");

  const outerStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 200,
        padding: 0,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "stretch",
        background: "var(--bg-base)",
        overflow: "hidden",
      }
    : {
        position: "fixed",
        inset: 0,
        zIndex: 200,
        overflowY: "auto",
        padding: "32px 16px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "color-mix(in oklch, var(--bg-base) 75%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      };

  const innerStyle: React.CSSProperties = isMobile
    ? {
        width: "100%",
        maxWidth: "none",
        height: supportsDvh ? "100dvh" : "100vh",
        maxHeight: supportsDvh ? "100dvh" : "100vh",
        background: "var(--bg-surface)",
        borderRadius: 0,
        boxShadow: "none",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }
    : {
        width: "100%",
        maxWidth: width,
        background: "var(--bg-surface)",
        borderRadius: 24,
        boxShadow:
          "0 24px 64px -12px rgba(0,0,0,0.7), 0 0 0 1px var(--border-faint)",
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
      };

  const headerStyle: React.CSSProperties = isMobile
    ? {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderBottom: "1px solid var(--border-faint)",
        position: "sticky",
        top: 0,
        background: "var(--bg-surface)",
        zIndex: 1,
      }
    : {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderBottom: "1px solid var(--border-faint)",
      };

  const bodyStyle: React.CSSProperties = isMobile
    ? {
        flex: "1 1 auto",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        minHeight: 0,
        padding: "20px 16px",
      }
    : {
        padding: 24,
      };

  const footerStyle: React.CSSProperties = isMobile
    ? {
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        paddingTop: 16,
        paddingRight: 24,
        paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        paddingLeft: 24,
        borderTop: "1px solid var(--border-faint)",
        background: "var(--bg-surface)",
        position: "sticky",
        bottom: 0,
      }
    : {
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        padding: "16px 24px",
        borderTop: "1px solid var(--border-faint)",
        background: "var(--bg-base)",
      };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      onClick={onClose}
      style={outerStyle}
    >
      <div onClick={e => e.stopPropagation()} style={innerStyle}>
        <div style={headerStyle}>
          <div
            id="dialog-title"
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
            }}
          >
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("dialog.common.close_aria")}
            style={{
              background: "var(--bg-elevated)",
              border: "none",
              padding: 8,
              borderRadius: 10,
              cursor: "pointer",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div style={bodyStyle}>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

// ─── Field ─────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginBottom: 14,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{hint}</span>
      )}
    </label>
  );
}

// ─── TextInput ─────────────────────────────────────────────────

interface TextInputProps {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  type?: "text" | "number" | "date";
  step?: string;
  min?: number;
  max?: number;
  autoFocus?: boolean;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  prefix,
  type = "text",
  step,
  min,
  max,
  autoFocus,
}: TextInputProps) {
  const id = useId();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        background: "var(--bg-elevated)",
        borderRadius: 12,
        border: "1px solid var(--border-faint)",
      }}
    >
      {prefix && (
        <span style={{ color: "var(--text-tertiary)", fontWeight: 600 }}>
          {prefix}
        </span>
      )}
      <input
        id={id}
        type={type}
        step={step}
        min={min}
        max={max}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1,
          minWidth: 0,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-primary)",
          fontSize: 14,
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

// ─── TextArea ──────────────────────────────────────────────────

export function TextAreaInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%",
        minHeight: 70,
        resize: "vertical",
        padding: "10px 12px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-faint)",
        borderRadius: 12,
        color: "var(--text-primary)",
        fontFamily: "inherit",
        fontSize: 14,
        outline: "none",
      }}
    />
  );
}

// ─── RadioRow ──────────────────────────────────────────────────

export interface RadioOption<T extends string | number> {
  value: T;
  label: string;
}

export function RadioRow<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: RadioOption<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: active ? "var(--accent-green)" : "var(--bg-elevated)",
              color: active ? "oklch(0.15 0.03 155)" : "var(--text-secondary)",
              border:
                "1px solid " + (active ? "transparent" : "var(--border-faint)"),
              fontFamily: "inherit",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Footer buttons ────────────────────────────────────────────

export function CancelButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 12,
        border: "1px solid var(--border-faint)",
        background: "transparent",
        color: "var(--text-secondary)",
        fontWeight: 600,
        fontFamily: "inherit",
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {t("dialog.common.cancel")}
    </button>
  );
}

export function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 16px",
        borderRadius: 12,
        border: "none",
        background: disabled ? "var(--bg-elevated)" : "var(--accent-green)",
        color: disabled ? "var(--text-tertiary)" : "oklch(0.15 0.03 155)",
        fontWeight: 600,
        fontFamily: "inherit",
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function DangerButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 12,
        border: "none",
        background: "var(--status-danger)",
        color: "oklch(0.99 0 0)",
        fontWeight: 600,
        fontFamily: "inherit",
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
