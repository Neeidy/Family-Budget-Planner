interface HealthBubbleProps {
  score: number;
  mobile: boolean;
  onClick?: () => void;
}

/**
 * Line-by-line port of _design/page-ana.jsx:257-300 (HealthBubble).
 * Floating circular health badge with SVG progress ring.
 * Designed to be placed inside a parent with `position: relative` (e.g. NET DEĞER card).
 */
export function HealthBubble({ score, mobile, onClick }: HealthBubbleProps) {
  const size = mobile ? 64 : 78;
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const pct = score / 100;
  const grade = score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D";
  const color = score >= 80 ? "var(--accent-green)" : score >= 60 ? "var(--status-warning)" : "var(--status-danger)";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Bütçe Sağlık Skoru detayları"
      style={{
        position: "absolute",
        top: mobile ? 12 : 16,
        right: mobile ? 12 : 16,
        width: size, height: size,
        background: "var(--bg-elevated)",
        border: "none",
        borderRadius: "50%",
        cursor: "pointer",
        padding: 0,
        boxShadow: `0 8px 22px -6px ${color === "var(--accent-green)" ? "oklch(0.7 0.18 155 / 0.4)" : "rgba(0,0,0,0.3)"}, 0 0 0 1px var(--border-faint)`,
        transition: "transform 200ms cubic-bezier(0.2, 0, 0, 1), box-shadow 200ms",
        animation: "bubble-float 4s ease-in-out infinite",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.06) translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-tint)" strokeWidth="4" />
        <circle
          cx={size/2}
          cy={size/2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.2, 0, 0, 1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
      }}>
        <div className="tnum" style={{ fontSize: mobile ? 18 : 20, fontWeight: 700, lineHeight: 1, color: "var(--text-primary)" }}>{score}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color, marginTop: 2, letterSpacing: "0.05em" }}>SKOR · {grade}</div>
      </div>
    </button>
  );
}
