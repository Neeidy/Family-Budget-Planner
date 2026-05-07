interface DataPoint {
  x: number;
  y: number;
}

interface Series {
  color: string;
  data: DataPoint[];
  label?: string;
}

interface Annotation {
  x: number;
  y: number;
  label: string;
  color: string;
}

interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface LineAreaChartProps {
  series: Series[];
  width: number;
  height: number;
  padding?: Padding;
  yLabels?: boolean;
  xLabels?: string[];
  annotations?: Annotation[];
  mobile?: boolean;
}

const DEFAULT_PAD: Padding = { top: 24, right: 16, bottom: 32, left: 48 };

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function formatYTick(v: number): string {
  if (v === 0) return "€0";
  if (Math.abs(v) >= 1000) return `€${(v / 1000).toFixed(1)}k`;
  return `€${Math.round(v)}`;
}

export function LineAreaChart({
  series,
  width,
  height,
  padding,
  yLabels = true,
  xLabels,
  annotations,
  mobile = false,
}: LineAreaChartProps) {
  const pad: Padding = {
    ...DEFAULT_PAD,
    ...(padding ?? {}),
    top: mobile ? 56 : (padding?.top ?? DEFAULT_PAD.top),
  };

  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);

  // Compute domain
  const allY = series.flatMap((s) => s.data.map((p) => p.y));
  const allX = series.flatMap((s) => s.data.map((p) => p.x));
  const minY = Math.min(0, ...allY);
  const maxY = Math.max(1, ...allY);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const xSpan = Math.max(1, maxX - minX);
  const ySpan = Math.max(1, maxY - minY);

  const xScale = (x: number) => pad.left + ((x - minX) / xSpan) * innerW;
  const yScale = (y: number) => pad.top + (1 - (y - minY) / ySpan) * innerH;

  // 5 horizontal gridlines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const y = pad.top + t * innerH;
    const valY = maxY - t * ySpan;
    return { y, valY };
  });

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      {/* Gridlines */}
      {gridLines.map((g, i) => (
        <line
          key={i}
          x1={pad.left} y1={g.y}
          x2={pad.left + innerW} y2={g.y}
          stroke="var(--border-faint)"
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.6"
        />
      ))}

      {/* Y labels — port of _design/page-rapor.jsx:247-248 */}
      {yLabels && gridLines.map((g, i) => (
        <text
          key={`yl-${i}`}
          x={pad.left - 10}
          y={g.y + 4}
          fontSize="10"
          fontWeight="500"
          fontFamily="var(--font-mono)"
          textAnchor="end"
          fill="var(--text-muted)"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatYTick(g.valY)}
        </text>
      ))}

      {/* X labels — port of _design/page-rapor.jsx:259-260 */}
      {xLabels && (
        <g>
          {xLabels.map((label, i) => {
            const x = pad.left + (i / Math.max(1, xLabels.length - 1)) * innerW;
            const isLast = i === xLabels.length - 1;
            return (
              <text
                key={`xl-${i}`}
                x={x}
                y={height - pad.bottom + 18}
                fontSize="10"
                fontWeight={isLast ? 700 : 600}
                textAnchor="middle"
                fill={isLast ? "var(--text-secondary)" : "var(--text-muted)"}
              >
                {label}
              </text>
            );
          })}
        </g>
      )}

      {/* Series */}
      {series.map((s, i) => {
        const points = s.data.map((p) => ({ x: xScale(p.x), y: yScale(p.y) }));
        const linePath = smoothPath(points);
        const areaPath = points.length > 0
          ? `${linePath} L ${points[points.length - 1].x} ${pad.top + innerH} L ${points[0].x} ${pad.top + innerH} Z`
          : "";
        const gradId = `lac-grad-${i}`;
        return (
          <g key={i}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={s.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <path
              d={linePath}
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, j) => (
              <circle key={j} cx={p.x} cy={p.y} r="3" fill={s.color} />
            ))}
          </g>
        );
      })}

      {/* Annotations */}
      {annotations?.map((a, i) => {
        const cx = xScale(a.x);
        const cy = yScale(a.y);
        return (
          <g key={`anno-${i}`}>
            <circle cx={cx} cy={cy} r="5" fill={a.color} stroke="var(--bg-surface)" strokeWidth="2" />
            <rect
              x={cx + 8} y={cy - 18}
              width={a.label.length * 6 + 12}
              height="18"
              rx="9"
              fill={a.color}
            />
            <text x={cx + 14} y={cy - 5} fontSize="10" fill="oklch(0.99 0 0)" fontWeight="600">
              {a.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
