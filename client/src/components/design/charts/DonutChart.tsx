import type { ReactNode } from "react";

interface Slice {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  slices: Slice[];
  size: number;
  strokeWidth?: number;
  centerText?: ReactNode;
}

export function DonutChart({ slices, size, strokeWidth = 18, centerText }: DonutChartProps) {
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = Math.max(1, slices.reduce((s, x) => s + x.value, 0));

  let cumulative = 0;
  const segments = slices.map((s) => {
    const fraction = s.value / total;
    const dashArray = `${fraction * circ} ${circ}`;
    const dashOffset = -cumulative * circ;
    cumulative += fraction;
    return { ...s, dashArray, dashOffset };
  });

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-block" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-tint)" strokeWidth={strokeWidth} />
        {/* Slices */}
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={seg.dashArray}
            strokeDashoffset={seg.dashOffset}
            style={{ transition: "stroke-dasharray 600ms cubic-bezier(0.2, 0, 0, 1)" }}
          />
        ))}
      </svg>
      {centerText && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center",
        }}>
          {centerText}
        </div>
      )}
    </div>
  );
}
