import { useTranslation } from "react-i18next";
import { useFormatters } from "@/lib/useFormatters";

interface QuickStatsPillProps {
  mobile: boolean;
  todaySpent: number;
  monthRemaining: number;
  monthBudget: number;
  monthSpent: number;
  tomorrowDue: number;
}

interface StatItem {
  lbl: string;
  val: string;
  hue: string;
  sub: string;
  live?: boolean;
  icon?: string;
  progress?: number;
}

/**
 * Line-by-line port of _design/page-ana.jsx:168-252 (QuickStatsPill).
 * Three-column compact strip: BUGÜN (live dot), BU AY KALAN (progress), YARIN (warn icon).
 */
export function QuickStatsPill({
  mobile,
  todaySpent,
  monthRemaining,
  monthBudget,
  monthSpent,
  tomorrowDue,
}: QuickStatsPillProps) {
  const { t } = useTranslation();
  const { fmShort } = useFormatters();
  const monthPct = Math.max(
    0,
    Math.min(100, monthBudget > 0 ? (monthSpent / monthBudget) * 100 : 0)
  );
  const items: StatItem[] = [
    {
      lbl: t("dashboard.quick_stats.today"),
      val: fmShort(todaySpent),
      live: true,
      hue: "var(--accent-green)",
      sub: t("dashboard.quick_stats.today_subtitle"),
      icon: "●",
    },
    monthBudget === 0
      ? {
          lbl: t("dashboard.quick_stats.month_remaining"),
          val: "—",
          hue: "var(--text-tertiary)",
          sub: t("dashboard.quick_stats.no_budget_limit"),
        }
      : {
          lbl: t("dashboard.quick_stats.month_remaining"),
          val: fmShort(monthRemaining),
          hue:
            monthRemaining < 0 ? "var(--status-danger)" : "var(--text-primary)",
          sub: t("dashboard.quick_stats.month_used", {
            pct: Math.round(monthPct),
          }),
          progress: monthPct,
        },
    {
      lbl: t("dashboard.quick_stats.tomorrow"),
      val: fmShort(tomorrowDue),
      hue: "var(--status-warning)",
      sub: t("dashboard.quick_stats.tomorrow_subtitle"),
      icon: "⚠",
    },
  ];
  return (
    <div
      className="quick-stats-pill lift"
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
            {s.live && (
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--accent-green)",
                  animation: "pulse-soft 1.5s infinite",
                  boxShadow: "0 0 0 2px var(--accent-green-soft)",
                }}
              />
            )}
            {s.icon && !s.live && (
              <span style={{ fontSize: 10, color: s.hue }}>{s.icon}</span>
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
                  background:
                    s.progress > 80
                      ? "var(--status-warning)"
                      : "var(--accent-green)",
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
