import type { ReactNode } from "react";

interface HeroDelta {
  value: string;
  positive?: boolean;
}

interface HeroAction {
  label?: string;
  onClick?: () => void;
}

interface HeroMetricProps {
  label: string;
  value: ReactNode;
  subtitle?: ReactNode;
  delta?: HeroDelta;
  /** Either an action button (label+onClick) or a custom node (icon, etc.) */
  action?: HeroAction | ReactNode;
}

function isAction(a: unknown): a is HeroAction {
  return !!a && typeof a === "object" && ("label" in a || "onClick" in a);
}

export function HeroMetric({
  label,
  value,
  subtitle,
  delta,
  action,
}: HeroMetricProps) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-card)",
        padding: "24px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <span className="section-label">{label}</span>
        {action &&
          (isAction(action) ? (
            <button
              type="button"
              onClick={action.onClick}
              style={{
                fontSize: 12,
                color: "var(--text-tertiary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0 2px",
              }}
            >
              {action.label}
            </button>
          ) : (
            (action as ReactNode)
          ))}
      </div>

      <div
        className="hero-num"
        style={{
          fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
          fontWeight: 700,
          marginTop: 8,
          lineHeight: 1.05,
          color: "var(--text-primary)",
        }}
      >
        {value}
      </div>

      {(subtitle || delta) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 6,
          }}
        >
          {delta && (
            <span
              className="pill"
              style={{
                background:
                  delta.positive === false
                    ? "color-mix(in oklch, var(--status-danger) 15%, transparent)"
                    : "var(--accent-green-soft)",
                color:
                  delta.positive === false
                    ? "var(--status-danger)"
                    : "var(--accent-green)",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
              }}
            >
              {delta.value}
            </span>
          )}
          {subtitle && (
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
