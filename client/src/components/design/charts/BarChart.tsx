interface BarItem {
  color: string;
  value: number;
  max: number;
  label?: string;
}

interface BarGroup {
  label: string;
  bars: BarItem[];
}

interface BarChartProps {
  groups: BarGroup[];
  height: number;
  mobile?: boolean;
  /** Override the y-axis maximum (default: max of all bar values & maxes) */
  domainMax?: number;
}

function formatYTick(v: number): string {
  if (v === 0) return "€0";
  if (Math.abs(v) >= 1000) return `€${(v / 1000).toFixed(1)}k`;
  return `€${Math.round(v)}`;
}

export function BarChart({ groups, height, mobile = false, domainMax }: BarChartProps) {
  const allValues = groups.flatMap((g) => g.bars.flatMap((b) => [b.value, b.max]));
  const max = domainMax ?? Math.max(1, ...allValues);

  const padTop    = mobile ? 24 : 32;
  const padBottom = 28;
  const padLeft   = 44;
  const innerH    = height - padTop - padBottom;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ frac: t, val: max * (1 - t) }));

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <div style={{ position: "relative", height, paddingLeft: padLeft }}>
        {/* Y-axis labels + gridlines */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {ticks.map((t, i) => (
            <div key={i} style={{
              position: "absolute",
              left: 0, right: 0,
              top: padTop + t.frac * innerH,
              borderTop: "1px dashed var(--border-faint)",
              opacity: 0.6,
            }}>
              <span style={{
                position: "absolute", left: 0, top: -7,
                fontSize: 10, fontWeight: 500,
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {formatYTick(t.val)}
              </span>
            </div>
          ))}
        </div>

        {/* Groups */}
        <div style={{
          position: "absolute",
          left: padLeft, right: 0,
          top: padTop, bottom: padBottom,
          display: "flex",
          alignItems: "flex-end",
          gap: mobile ? 6 : 12,
        }}>
          {groups.map((g, gi) => (
            <div key={gi} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, height: "100%", position: "relative" }}>
              {g.bars.map((b, bi) => {
                const h = (b.value / max) * 100;
                return (
                  <div
                    key={bi}
                    style={{
                      flex: 1,
                      maxWidth: mobile ? 12 : 22,
                      height: `${h}%`,
                      background: b.color,
                      borderRadius: "6px 6px 2px 2px",
                      animation: `barGrow 600ms cubic-bezier(0.2, 0, 0, 1) ${gi * 80}ms both`,
                      transformOrigin: "bottom",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div style={{
          position: "absolute",
          left: padLeft, right: 0, bottom: 4,
          display: "flex", gap: mobile ? 6 : 12,
        }}>
          {groups.map((g, gi) => {
            const isLast = gi === groups.length - 1;
            return (
              <div key={gi} style={{
                flex: 1, textAlign: "center",
                fontSize: 10, fontWeight: isLast ? 700 : 600,
                color: isLast ? "var(--text-secondary)" : "var(--text-muted)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {g.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
