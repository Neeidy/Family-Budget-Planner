export type BadgeStatus = "Odendi" | "Bekliyor" | "Gecikti";

interface StatusBadgeProps {
  status: BadgeStatus;
}

const STATUS_MAP: Record<BadgeStatus, { dot: string; label: string }> = {
  Odendi: { dot: "✓", label: "Ödendi" },
  Bekliyor: { dot: "⏳", label: "Bekliyor" },
  Gecikti: { dot: "⚠", label: "Gecikti" },
};

const STATUS_COLOR: Record<BadgeStatus, string> = {
  Odendi: "var(--status-success)",
  Bekliyor: "var(--status-warning)",
  Gecikti: "var(--status-danger)",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLOR[status];
  const { dot, label } = STATUS_MAP[status];
  return (
    <span
      className="pill"
      style={{
        background: `color-mix(in oklch, ${color} 18%, transparent)`,
        color,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span>{dot}</span>
      {label}
    </span>
  );
}
