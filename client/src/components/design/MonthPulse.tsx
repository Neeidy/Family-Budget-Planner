import { formatMoneyShort } from "@/lib/format";

interface TopCategory {
  name: string;
  emoji: string;
  amount: number;
}

interface MonthPulseProps {
  netMovement: number;
  savingsRate: number;
  topCategory: TopCategory | null;
  mobile: boolean;
}

interface StatItem {
  lbl: string;
  val: string;
  hue: string;
  sub: string;
  icon?: string;
  progress?: number;
}

export function MonthPulse({
  netMovement,
  savingsRate,
  topCategory,
  mobile,
}: MonthPulseProps) {
  const savingsPct = Math.max(0, Math.min(100, savingsRate * 100));
  const savingsHue =
    savingsRate >= 0.2
      ? "var(--accent-green)"
      : savingsRate >= 0.1
        ? "var(--status-warning)"
        : "var(--status-danger)";

  const items: StatItem[] = [
    {
      lbl: "NET HAREKET BU AY",
      val:
        (netMovement >= 0 ? "+" : "−") +
        formatMoneyShort(Math.abs(netMovement)),
      hue:
        netMovement >= 0 ? "var(--accent-green)" : "var(--status-danger)",
      sub: netMovement >= 0 ? "Gelir > Gider" : "Gider > Gelir",
      icon: netMovement >= 0 ? "↑" : "↓",
    },
    {
      lbl: "TASARRUF ORANI",
      val: `%${Math.round(savingsRate * 100)}`,
      hue: savingsHue,
      sub: "Bu ay tasarruf",
      progress: savingsPct,
    },
    {
      lbl: "AKTİF KATEGORİ",
      val: topCategory ? topCategory.name : "—",
      hue: "var(--text-primary)",
      sub: topCategory
        ? formatMoneyShort(topCategory.amount)
        : "Henüz veri yok",
      icon: topCategory?.emoji ?? "",
    },
  ];

  return (
    <div
      className="month-pulse lift"
      style={{
        display: "grid",
        gridTemplateColumns: mobile ? "1fr 1fr 1fr" : "repeat(3, 1fr)",
        gap: 0,
        background: "var(--bg-surface)",
        borderRadius: 16,
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
        border: "1px solid var(--border-faint)",
      }}
    >
      {items.map((s, i) => (
        <div
          key={s.lbl}
          style={{
            padding: mobile ? "12px 10px" : "14px 18px",
            borderRight:
              i < items.length - 1 ? "1px solid var(--border-faint)" : "none",
            position: "relative",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {s.icon && (
              <span style={{ fontSize: 11, color: s.hue }}>{s.icon}</span>
            )}
            <span
              style={{
                fontSize: mobile ? 9 : 10,
                fontWeight: 700,
                color: "var(--text-tertiary)",
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {s.lbl}
            </span>
          </div>
          <div
            className="tnum"
            style={{
              fontSize: mobile ? 18 : 22,
              fontWeight: 700,
              marginTop: 4,
              letterSpacing: "-0.02em",
              color: s.hue,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {s.val}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {s.sub}
          </div>
          {s.progress !== undefined && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 2,
                background: "var(--bg-tint)",
              }}
            >
              <div
                style={{
                  width: `${s.progress}%`,
                  height: "100%",
                  background: s.hue,
                  transition: "width 800ms cubic-bezier(0.2, 0, 0, 1)",
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
