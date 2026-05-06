interface CategoryMeta {
  name: string;
  emoji: string;
  colorVar: string;
}

/** Build a stable lookup key — strip diacritics + non-letter chars + lowercase */
function normalizeKey(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
}

const C_KONUT    = "var(--cat-konut)";
const C_YIYECEK  = "var(--cat-yiyecek)";
const C_ULASIM   = "var(--cat-ulasim)";
const C_SAGLIK   = "var(--cat-saglik)";
const C_EGLENCE  = "var(--cat-eglence)";
const C_ABONELIK = "var(--cat-abonelik)";
const C_GIYIM    = "var(--cat-giyim)";
const C_SPOR     = "var(--cat-spor)";
const C_COCUK    = "var(--cat-cocuk)";
const C_DIGER    = "var(--cat-diger)";

/**
 * Direct lookup map. Keys are pre-normalized (lowercase, diacritics removed, non-letters stripped).
 * Each entry maps to display name + emoji + colour variable.
 */
const CATEGORIES: Record<string, CategoryMeta> = {
  // Konut & faturalar
  konut:        { name: "Konut",       emoji: "🏠", colorVar: C_KONUT },
  konutveev:    { name: "Konut",       emoji: "🏠", colorVar: C_KONUT },
  ev:           { name: "Konut",       emoji: "🏠", colorVar: C_KONUT },
  kira:         { name: "Kira",        emoji: "🏠", colorVar: C_KONUT },
  fatura:       { name: "Faturalar",   emoji: "⚡", colorVar: C_KONUT },
  faturalar:    { name: "Faturalar",   emoji: "⚡", colorVar: C_KONUT },
  elektrik:     { name: "Elektrik",    emoji: "⚡", colorVar: C_KONUT },
  internet:     { name: "İnternet",    emoji: "🌐", colorVar: C_KONUT },

  // Yiyecek
  yiyecek:      { name: "Yiyecek",     emoji: "🛒", colorVar: C_YIYECEK },
  gida:         { name: "Gıda",        emoji: "🛒", colorVar: C_YIYECEK },
  market:       { name: "Market",      emoji: "🛒", colorVar: C_YIYECEK },
  marketveyasam: { name: "Market",     emoji: "🛒", colorVar: C_YIYECEK },
  kahve:        { name: "Kahve",       emoji: "☕", colorVar: C_YIYECEK },

  // Yemek/Eğlence
  yemekvedisari: { name: "Restoran",   emoji: "🍽️", colorVar: C_EGLENCE },
  restoran:     { name: "Restoran",    emoji: "🍽️", colorVar: C_EGLENCE },
  eglence:      { name: "Eğlence",     emoji: "🎬", colorVar: C_EGLENCE },
  eglencevesosyal: { name: "Eğlence",  emoji: "🎬", colorVar: C_EGLENCE },

  // Ulaşım
  ulasim:       { name: "Ulaşım",      emoji: "🚗", colorVar: C_ULASIM },
  ulasimvearac: { name: "Ulaşım",      emoji: "🚗", colorVar: C_ULASIM },
  yakit:        { name: "Yakıt",       emoji: "⛽", colorVar: C_ULASIM },
  toplutasima:  { name: "Toplu Taşıma", emoji: "🚌", colorVar: C_ULASIM },

  // Sağlık & sigorta
  saglik:       { name: "Sağlık",      emoji: "⚕️", colorVar: C_SAGLIK },
  saglikvespor: { name: "Sağlık",      emoji: "⚕️", colorVar: C_SAGLIK },
  sigorta:      { name: "Sigorta",     emoji: "🛡️", colorVar: C_SAGLIK },

  // Abonelik
  abonelik:     { name: "Abonelik",    emoji: "📺", colorVar: C_ABONELIK },
  dijitalabonelikler: { name: "Abonelik", emoji: "📺", colorVar: C_ABONELIK },
  streaming:    { name: "Streaming",   emoji: "📺", colorVar: C_ABONELIK },

  // Giyim & spor & çocuk
  giyim:        { name: "Giyim",       emoji: "👕", colorVar: C_GIYIM },
  spor:         { name: "Spor",        emoji: "⚽", colorVar: C_SPOR },
  cocuk:        { name: "Çocuk",       emoji: "👶", colorVar: C_COCUK },
  okul:         { name: "Okul",        emoji: "📚", colorVar: C_COCUK },
  egitim:       { name: "Eğitim",      emoji: "📚", colorVar: C_COCUK },
  egitimvegelisim: { name: "Eğitim",   emoji: "📚", colorVar: C_COCUK },
  porsuk:       { name: "Porsuk",      emoji: "🐈", colorVar: C_COCUK },

  // Borç / birikim
  borc:         { name: "Borç",        emoji: "💳", colorVar: C_DIGER },
  borclar:      { name: "Borçlar",     emoji: "💳", colorVar: C_DIGER },
  birikim:      { name: "Birikim",     emoji: "💰", colorVar: C_DIGER },
  birikimveyatirim: { name: "Birikim", emoji: "💰", colorVar: C_DIGER },

  // Other
  hediye:       { name: "Hediye",      emoji: "🎁", colorVar: C_DIGER },
  beklenmeyen:  { name: "Beklenmeyen", emoji: "⚠️", colorVar: C_DIGER },
  beklenmeyengiderler: { name: "Beklenmeyen", emoji: "⚠️", colorVar: C_DIGER },
  diger:        { name: "Diğer",       emoji: "📦", colorVar: C_DIGER },
};

const FALLBACK: CategoryMeta = CATEGORIES.diger;

/** Resolve a category string to display metadata. Falls back to "Diğer". */
export function getCategoryMeta(cat: string | undefined | null): CategoryMeta {
  if (!cat) return FALLBACK;
  const key = normalizeKey(cat);
  if (CATEGORIES[key]) return CATEGORIES[key];

  // Substring fallback — try each registered key against the normalised input
  for (const k of Object.keys(CATEGORIES)) {
    if (key.includes(k) || k.includes(key)) return CATEGORIES[k];
  }
  return FALLBACK;
}

interface CategoryPillProps {
  cat: string;
  size?: "sm" | "md";
  className?: string;
  showEmoji?: boolean;
  /** Override the rendered name (e.g. show original input string instead of mapped display name) */
  displayName?: string;
}

export function CategoryPill({ cat, size = "md", className, showEmoji = true, displayName }: CategoryPillProps) {
  const meta = getCategoryMeta(cat);
  const fontSize = size === "sm" ? 11 : 13;
  return (
    <span
      className={`pill${className ? ` ${className}` : ""}`}
      style={{
        background: `color-mix(in oklch, ${meta.colorVar} 15%, transparent)`,
        border: `1px solid color-mix(in oklch, ${meta.colorVar} 30%, transparent)`,
        color: meta.colorVar,
        fontSize,
      }}
    >
      {showEmoji && <span>{meta.emoji}</span>}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {displayName ?? meta.name}
      </span>
    </span>
  );
}
