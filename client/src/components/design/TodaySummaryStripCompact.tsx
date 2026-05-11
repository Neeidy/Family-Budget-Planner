import { Avatar, AvatarWho } from "./Avatar";
import { formatMoneyShort } from "@/lib/format";

type FilterKey = "tumu" | "yigit" | "arzu" | "ev";

export interface UpcomingItem {
  name: string;
  amount: number;
  days: number;
  who: AvatarWho;
  emoji: string;
}

interface TodaySummaryStripCompactProps {
  mobile: boolean;
  filter: FilterKey;
  upcoming: UpcomingItem[];
  person1Name?: string;
  person2Name?: string;
}

/**
 * Port of _design/page-ana.jsx:352-416 (TodaySummaryStripCompact).
 * Receives the upcoming list as a prop — caller computes it from real
 * expenses + installments + annualPayments. Falls back to empty state
 * when the filtered profile has nothing upcoming.
 */
export function TodaySummaryStripCompact({
  mobile,
  filter,
  upcoming,
  person1Name = "Yigit",
  person2Name = "Arzu",
}: TodaySummaryStripCompactProps) {
  const totalDue = upcoming.reduce((s, u) => s + u.amount, 0);
  const ownerName: string = {
    yigit: person1Name,
    arzu: person2Name,
    ev: "Ev",
    tumu: "Hepsi",
  }[filter];

  return (
    <div
      className="card lift"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: mobile ? 20 : 24,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background:
            "linear-gradient(90deg, var(--status-warning), var(--status-danger))",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
        >
          <span className="section-label" style={{ margin: 0 }}>
            YARIN ÖDENECEK
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 999,
              background:
                "color-mix(in oklch, var(--status-warning) 18%, transparent)",
              color: "var(--status-warning)",
              flexShrink: 0,
            }}
          >
            {upcoming.length}
          </span>
        </div>
        <span
          className="tnum"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--status-warning)",
            flexShrink: 0,
          }}
        >
          {formatMoneyShort(totalDue)}
        </span>
      </div>
      <div
        style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}
      >
        {ownerName} • önümüzdeki birkaç gün
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginTop: 12,
        }}
      >
        {upcoming.length === 0 && (
          <div
            style={{
              padding: "14px 12px",
              borderRadius: 10,
              background: "var(--bg-elevated)",
              fontSize: 12,
              color: "var(--text-tertiary)",
              textAlign: "center",
            }}
          >
            Bu profilde yaklaşan ödeme yok ✓
          </div>
        )}
        {upcoming.slice(0, 4).map((u, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 10,
              background: "var(--bg-elevated)",
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{u.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {u.name}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
                {u.days} gün sonra
              </div>
            </div>
            <Avatar who={u.who} size={20} />
            <div
              className="tnum"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--status-warning)",
                flexShrink: 0,
              }}
            >
              {formatMoneyShort(u.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
