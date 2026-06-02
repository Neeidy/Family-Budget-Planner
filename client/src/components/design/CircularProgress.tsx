import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormatters } from "@/lib/useFormatters";

interface CircularProgressProps {
  /** Spent value */
  value: number;
  /** Limit value (denominator) */
  max: number;
  size?: number;
  strokeWidth?: number;
  emoji: string;
  label: string;
  /** Override the centre percentage display */
  centerText?: string;
}

function deriveColor(progress: number): string {
  if (progress > 1) return "var(--status-danger)";
  if (progress >= 0.95) return "var(--status-danger)";
  if (progress >= 0.7) return "var(--status-warning)";
  return "var(--status-success)";
}

export function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  emoji,
  label,
  centerText,
}: CircularProgressProps) {
  const { t } = useTranslation();
  const { fm } = useFormatters();
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const progress = max > 0 ? value / max : 0;
  const visualProgress = Math.min(1.2, progress);
  const remaining = max - value;
  const isOver = progress > 1;
  const stroke = deriveColor(progress);

  // Animate dashoffset on mount
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setAnimated(visualProgress), 50);
    return () => window.clearTimeout(t);
  }, [visualProgress]);

  const dashOffset = circ - Math.min(1, animated) * circ;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="var(--bg-tint)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            style={{
              transition:
                "stroke-dashoffset 800ms cubic-bezier(0.2, 0, 0, 1), stroke 300ms",
            }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: Math.round(size * 0.32), lineHeight: 1 }}>
            {emoji}
          </div>
          <div
            className="hero-num"
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginTop: 4,
              color: "var(--text-primary)",
            }}
          >
            {centerText ?? `${Math.round(progress * 100)}%`}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", maxWidth: size + 40 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {label}
        </div>
        <div
          className="hero-num"
          style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}
        >
          {fm(value)} / {fm(max)}
        </div>
        <div
          className="hero-num"
          style={{
            fontSize: 11,
            fontWeight: 600,
            marginTop: 2,
            color: isOver
              ? "var(--status-danger)"
              : progress >= 0.95
                ? "var(--status-warning)"
                : "var(--accent-green)",
          }}
        >
          {isOver
            ? t("components.circular_progress.over", {
                amount: fm(value - max),
              })
            : t("components.circular_progress.remaining", {
                amount: fm(remaining),
              })}
        </div>
      </div>
    </div>
  );
}
