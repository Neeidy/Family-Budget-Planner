interface EmptyStateCta {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  cta?: EmptyStateCta;
}

export function EmptyState({
  emoji,
  title,
  description,
  cta,
}: EmptyStateProps) {
  return (
    <div
      style={{
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        textAlign: "center",
        background: "var(--bg-surface)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-card)",
        border: "1.5px dashed var(--border-subtle)",
      }}
    >
      <div
        style={{
          fontSize: 64,
          lineHeight: 1,
          filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))",
        }}
      >
        {emoji}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.015em" }}>
        {title}
      </div>
      {description && (
        <div
          style={{
            fontSize: 13,
            color: "var(--text-tertiary)",
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      )}
      {cta && (
        <button
          type="button"
          onClick={cta.onClick}
          style={{
            marginTop: 6,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: "var(--r-md)",
            fontWeight: 600,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            background: "var(--accent-green)",
            color: "oklch(0.15 0.03 155)",
            transition: "filter 160ms",
          }}
        >
          {cta.label} <span>→</span>
        </button>
      )}
    </div>
  );
}
