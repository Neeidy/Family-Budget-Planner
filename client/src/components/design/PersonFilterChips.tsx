import { AvatarWho } from './Avatar';

export type FilterValue = 'tumu' | 'yigit' | 'arzu' | 'ev';

interface PersonFilterChipsProps {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  /** Labels for each owner — defaults to design reference names */
  labels?: Partial<Record<FilterValue, string>>;
}

const DEFAULT_LABELS: Record<FilterValue, string> = {
  tumu: 'Tümü',
  yigit: 'Yigit',
  arzu: 'Arzu',
  ev: 'Ev',
};

const ITEMS: FilterValue[] = ['tumu', 'yigit', 'arzu', 'ev'];

export function PersonFilterChips({ value, onChange, labels }: PersonFilterChipsProps) {
  const resolved = { ...DEFAULT_LABELS, ...labels };
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {ITEMS.map((key) => {
        const active = value === key;
        const colorVar = `var(--owner-${key})`;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 160ms',
              border: active ? 'none' : `1px solid color-mix(in oklch, ${colorVar} 35%, transparent)`,
              background: active ? colorVar : 'transparent',
              color: active ? 'oklch(0.99 0 0)' : colorVar,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                flexShrink: 0,
                background: active ? 'oklch(0.99 0 0)' : colorVar,
              }}
            />
            {resolved[key]}
          </button>
        );
      })}
    </div>
  );
}
