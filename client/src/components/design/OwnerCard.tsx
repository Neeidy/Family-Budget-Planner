import { Avatar, AvatarWho } from "./Avatar";
import { CategoryPill } from "./CategoryPill";

interface OwnerCardProps {
  who: AvatarWho;
  title: string;
  amount: string;
  subtitle?: string;
  cats?: string[];
}

export function OwnerCard({
  who,
  title,
  amount,
  subtitle,
  cats = [],
}: OwnerCardProps) {
  const ownerColor = `var(--owner-${who})`;
  return (
    <div
      style={{
        background: `linear-gradient(180deg, color-mix(in oklch, ${ownerColor} 12%, var(--bg-surface)), var(--bg-surface) 60%)`,
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-card)",
        padding: "20px 24px",
        borderTop: `2px solid ${ownerColor}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar who={who} size={28} />
        <span className="section-label" style={{ fontSize: 10 }}>
          {title}
        </span>
      </div>
      <div
        className="hero-num"
        style={{
          fontSize: 38,
          fontWeight: 700,
          marginTop: 12,
          letterSpacing: "-0.025em",
        }}
      >
        {amount}
      </div>
      {subtitle && (
        <div
          style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}
        >
          {subtitle}
        </div>
      )}
      {cats.length > 0 && (
        <div
          style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}
        >
          {cats.map(c => (
            <CategoryPill key={c} cat={c} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}
