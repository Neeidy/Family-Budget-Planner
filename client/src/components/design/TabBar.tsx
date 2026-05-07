interface TabBarProps {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--bg-surface)",
        borderRadius: 999,
        padding: 4,
        gap: 2,
        boxShadow: "var(--shadow-card)",
      }}
    >
      {tabs.map(t => {
        const isActive = active === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background: isActive ? "var(--accent-green)" : "transparent",
              color: isActive
                ? "oklch(0.15 0.03 155)"
                : "var(--text-secondary)",
              transition: "all 220ms cubic-bezier(0.2, 0.9, 0.3, 1.4)",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
