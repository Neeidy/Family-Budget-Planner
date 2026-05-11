import { ReactNode, useEffect, useId } from "react";
import { X } from "lucide-react";

interface DialogShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: ReactNode;
  footer?: ReactNode;
}

export function DialogShell({
  open,
  onClose,
  title,
  width = 480,
  children,
  footer,
}: DialogShellProps) {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      onClick={onClose}
      className="dialog-shell-outer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="dialog-shell-inner"
        style={{ ["--dialog-w" as string]: `${width}px` }}
      >
        <div className="dialog-shell-header">
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
            aria-label="Kapat"
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
        <div className="dialog-shell-body">{children}</div>
        {footer && <div className="dialog-shell-footer">{footer}</div>}
      </div>
    </div>
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
      İptal
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
