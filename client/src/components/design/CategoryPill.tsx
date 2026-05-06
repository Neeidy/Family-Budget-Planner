interface CategoryMeta {
  name: string;
  emoji: string;
  colorVar: string;
}

const CATEGORIES: Record<string, CategoryMeta> = {
  konut:    { name: 'Konut',    emoji: '🏠', colorVar: 'var(--cat-konut)' },
  yiyecek:  { name: 'Yiyecek', emoji: '🛒', colorVar: 'var(--cat-yiyecek)' },
  ulasim:   { name: 'Ulaşım',  emoji: '🚗', colorVar: 'var(--cat-ulasim)' },
  saglik:   { name: 'Sağlık',  emoji: '⚕️', colorVar: 'var(--cat-saglik)' },
  eglence:  { name: 'Eğlence', emoji: '🎬', colorVar: 'var(--cat-eglence)' },
  abonelik: { name: 'Abonelik',emoji: '📺', colorVar: 'var(--cat-abonelik)' },
  giyim:    { name: 'Giyim',   emoji: '👕', colorVar: 'var(--cat-giyim)' },
  spor:     { name: 'Spor',    emoji: '⚽', colorVar: 'var(--cat-spor)' },
  cocuk:    { name: 'Çocuk',   emoji: '👶', colorVar: 'var(--cat-cocuk)' },
  porsuk:   { name: 'Porsuk',  emoji: '🐈', colorVar: 'var(--cat-cocuk)' },
  diger:    { name: 'Diğer',   emoji: '📦', colorVar: 'var(--cat-diger)' },
};

export function getCategoryMeta(cat: string): CategoryMeta {
  const key = cat.toLowerCase().replace(/[^a-z]/g, '');
  return CATEGORIES[key] ?? CATEGORIES.diger;
}

interface CategoryPillProps {
  cat: string;
  size?: 'sm' | 'md';
}

export function CategoryPill({ cat, size = 'md' }: CategoryPillProps) {
  const meta = getCategoryMeta(cat);
  const fontSize = size === 'sm' ? 11 : 13;
  return (
    <span
      className="pill"
      style={{
        background: `color-mix(in oklch, ${meta.colorVar} 15%, transparent)`,
        border: `1px solid color-mix(in oklch, ${meta.colorVar} 30%, transparent)`,
        color: meta.colorVar,
        fontSize,
        width: '95px',
      }}
    >
      <span>{meta.emoji}</span>
      <span>{meta.name}</span>
    </span>
  );
}
