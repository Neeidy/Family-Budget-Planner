interface SpeechBubbleProps {
  text: string | null;
  mobile?: boolean;
  anger?: number;
}

export function SpeechBubble({ text, mobile, anger = 0 }: SpeechBubbleProps) {
  if (!text) return null;
  const isAngry = anger >= 4;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%) translateY(-8px)',
        background: isAngry ? 'oklch(0.65 0.22 25)' : 'var(--bg-surface)',
        color: isAngry ? 'oklch(0.99 0 0)' : 'var(--text-primary)',
        padding: mobile ? '6px 10px' : '8px 14px',
        borderRadius: 14,
        fontSize: mobile ? 11 : 12,
        fontWeight: 600,
        boxShadow: '0 8px 20px -6px rgba(0,0,0,0.4), 0 0 0 1.5px var(--border-faint)',
        whiteSpace: 'nowrap',
        maxWidth: mobile ? 160 : 200,
        animation: isAngry
          ? 'porsuk-shake 0.5s ease-in-out, fadeUp 0.3s'
          : 'fadeUp 0.3s',
        pointerEvents: 'none',
        border: isAngry ? '1.5px solid oklch(0.55 0.25 25)' : 'none',
        zIndex: 1,
      }}
    >
      {text}
      <div
        style={{
          position: 'absolute',
          bottom: -5,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 10,
          height: 10,
          background: isAngry ? 'oklch(0.65 0.22 25)' : 'var(--bg-surface)',
        }}
      />
    </div>
  );
}
