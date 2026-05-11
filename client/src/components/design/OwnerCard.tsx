import { type ReactNode } from "react";
import { Avatar, AvatarWho } from "./Avatar";
import { CategoryPill } from "./CategoryPill";

interface OwnerCardProps {
  who: AvatarWho;
  title: string;
  amount: string;
  subtitle?: string;
  cats?: string[];
  /** When true, clicking the card toggles `isExpanded` via `onToggle`. */
  expandable?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  /** Content rendered below the card when expanded. */
  expandedContent?: ReactNode;
}

export function OwnerCard({
  who,
  title,
  amount,
  subtitle,
  cats = [],
  expandable = false,
  isExpanded = false,
  onToggle,
  expandedContent,
}: OwnerCardProps) {
  const ownerColor = `var(--owner-${who})`;
  return (
    <div
      role={expandable ? "button" : undefined}
      tabIndex={expandable ? 0 : undefined}
      onClick={expandable ? onToggle : undefined}
      onKeyDown={
        expandable
          ? e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle?.();
              }
            }
          : undefined
      }
      style={{
        background: `linear-gradient(180deg, color-mix(in oklch, ${ownerColor} 12%, var(--bg-surface)), var(--bg-surface) 60%)`,
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-card)",
        padding: "20px 24px",
        borderTop: `2px solid ${ownerColor}`,
        cursor: expandable ? "pointer" : "default",
        transition: "box-shadow 200ms",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar who={who} size={28} />
        <span
          className="section-label"
          style={{ fontSize: 10, flex: 1, minWidth: 0 }}
        >
          {title}
        </span>
        {expandable && (
          <span
            aria-hidden
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              transition: "transform 200ms",
              transform: isExpanded ? "rotate(180deg)" : "none",
              userSelect: "none",
            }}
          >
            ▾
          </span>
        )}
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
      {expandable && isExpanded && expandedContent && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid var(--border-faint)",
            cursor: "default",
          }}
        >
          {expandedContent}
        </div>
      )}
    </div>
  );
}
