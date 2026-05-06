import { ReactNode } from 'react';

interface SummaryCardProps {
  label: string;
  amount: string;
  delta?: { value: string; positive?: boolean };
  icon?: ReactNode;
  color?: 'green' | 'red' | 'blue';
}

const COLOR_MAP = {
  green: 'var(--accent-green)',
  red:   'var(--status-danger)',
  blue:  'var(--owner-yigit)',
} as const;

export function SummaryCard({ label, amount, delta, icon, color = 'green' }: SummaryCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="section-label">{label}</span>
        {icon && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `color-mix(in oklch, ${c} 18%, transparent)`,
              color: c,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        {!icon && delta && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `color-mix(in oklch, ${c} 18%, transparent)`,
              color: c,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {delta.value}
          </div>
        )}
      </div>
      <div
        className="hero-num"
        style={{ fontSize: 28, fontWeight: 700, marginTop: 10, color: c }}
      >
        {amount}
      </div>
    </div>
  );
}
