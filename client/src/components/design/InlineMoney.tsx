import { useEffect, useRef, useState } from "react";
import { formatMoney, parseMoney } from "@/lib/format";

interface InlineMoneyProps {
  value: number;
  onSave: (newValue: number) => void;
  disabled?: boolean;
  className?: string;
  /** Optional inline style overrides applied to the display span. */
  style?: React.CSSProperties;
}

/**
 * Click-to-edit money cell. Display mode renders formatMoney(value)
 * with a dashed underline on hover; click flips to a text input
 * pre-filled with the raw number string. Enter or blur commits the
 * parsed value via `onSave`; Escape cancels.
 *
 * When `disabled` is true the cell renders display-only (no underline,
 * no click handler). Used in demo mode where writes are blocked.
 */
export function InlineMoney({
  value,
  onSave,
  disabled,
  className,
  style,
}: InlineMoneyProps) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState<string>(() => String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Keep raw in sync when external `value` changes while NOT editing.
  useEffect(() => {
    if (!editing) setRaw(String(value));
  }, [value, editing]);

  const commit = () => {
    const next = parseMoney(raw);
    if (Number.isFinite(next) && next >= 0 && next !== value) {
      onSave(next);
    }
    setEditing(false);
  };

  if (disabled || !editing) {
    return (
      <span
        className={className}
        onClick={disabled ? undefined : () => setEditing(true)}
        title={disabled ? undefined : "Düzenlemek için tıkla"}
        style={{
          cursor: disabled ? "default" : "pointer",
          borderBottom: disabled
            ? "none"
            : "1px dashed transparent",
          transition: "border-color 120ms",
          ...style,
        }}
        onMouseEnter={e => {
          if (!disabled) {
            (e.currentTarget as HTMLElement).style.borderBottomColor =
              "var(--text-tertiary)";
          }
        }}
        onMouseLeave={e => {
          if (!disabled) {
            (e.currentTarget as HTMLElement).style.borderBottomColor =
              "transparent";
          }
        }}
      >
        {formatMoney(value)}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={raw}
      onChange={e => setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === "Enter") commit();
        else if (e.key === "Escape") {
          setRaw(String(value));
          setEditing(false);
        }
      }}
      style={{
        width: "100%",
        padding: "4px 8px",
        borderRadius: 6,
        border: "1px solid var(--accent-green)",
        background: "var(--bg-elevated)",
        color: "var(--text-primary)",
        fontFamily: "inherit",
        fontSize: 14,
        fontFeatureSettings: '"tnum"',
      }}
    />
  );
}
