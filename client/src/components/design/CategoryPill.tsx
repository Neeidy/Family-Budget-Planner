interface CategoryMeta {
  name: string;
  emoji: string;
  colorVar: string;
}

/** Build a stable lookup key — strip diacritics + non-letter chars + lowercase.
 * NOTE: Uses plain toLowerCase, NOT toLocaleLowerCase("tr-TR"). Turkish locale
 * maps "I" → "ı" (dotless), which then gets stripped by [^a-z], collapsing
 * "AI" to "a" and triggering false substring matches (e.g. "kira"). */
function normalizeKey(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
}

const C_KONUT = "var(--cat-konut)";
const C_YIYECEK = "var(--cat-yiyecek)";
const C_ULASIM = "var(--cat-ulasim)";
const C_ARABA = "var(--cat-araba)";
const C_SAGLIK = "var(--cat-saglik)";
const C_EGLENCE = "var(--cat-eglence)";
const C_ABONELIK = "var(--cat-abonelik)";
const C_GIYIM = "var(--cat-giyim)";
const C_SPOR = "var(--cat-spor)";
const C_PORSUK = "var(--cat-porsuk)";
const C_AI = "var(--cat-ai)";
const C_KISISELBAKIM = "var(--cat-kisiselbakim)";
const C_TATIL = "var(--cat-tatil)";
const C_LOTO = "var(--cat-loto)";
const C_TABAK = "var(--cat-tabak)";
const C_DIGER = "var(--cat-diger)";

/**
 * Direct lookup map. Keys are pre-normalized (lowercase, diacritics removed, non-letters stripped).
 * Each entry maps to display name + emoji + colour variable.
 */
const CATEGORIES: Record<string, CategoryMeta> = {
  // Konut & faturalar
  konut: { name: "Konut", emoji: "🏠", colorVar: C_KONUT },
  konutveev: { name: "Konut", emoji: "🏠", colorVar: C_KONUT },
  ev: { name: "Konut", emoji: "🏠", colorVar: C_KONUT },
  kira: { name: "Kira", emoji: "🏠", colorVar: C_KONUT },
  fatura: { name: "Faturalar", emoji: "⚡", colorVar: C_KONUT },
  faturalar: { name: "Faturalar", emoji: "⚡", colorVar: C_KONUT },
  elektrik: { name: "Elektrik", emoji: "⚡", colorVar: C_KONUT },
  internet: { name: "İnternet", emoji: "🌐", colorVar: C_KONUT },

  // Yiyecek
  yiyecek: { name: "Yiyecek", emoji: "🛒", colorVar: C_YIYECEK },
  gida: { name: "Gıda", emoji: "🛒", colorVar: C_YIYECEK },
  market: { name: "Market", emoji: "🛒", colorVar: C_YIYECEK },
  marketveyasam: { name: "Market", emoji: "🛒", colorVar: C_YIYECEK },
  kahve: { name: "Kahve", emoji: "☕", colorVar: C_YIYECEK },

  // Yemek/Eğlence
  yemekvedisari: { name: "Restoran", emoji: "🍽️", colorVar: C_EGLENCE },
  restoran: { name: "Restoran", emoji: "🍽️", colorVar: C_EGLENCE },
  eglence: { name: "Eğlence", emoji: "🎬", colorVar: C_EGLENCE },
  eglencevesosyal: { name: "Eğlence", emoji: "🎬", colorVar: C_EGLENCE },

  // Ulaşım (toplu taşıma, taksi, tren, uçak)
  ulasim: { name: "Ulaşım", emoji: "🚌", colorVar: C_ULASIM },
  ulasimvearac: { name: "Ulaşım", emoji: "🚌", colorVar: C_ULASIM },
  toplutasima: { name: "Toplu Taşıma", emoji: "🚌", colorVar: C_ULASIM },
  wienerlinien: { name: "Wiener Linien", emoji: "🚌", colorVar: C_ULASIM },
  obb: { name: "ÖBB", emoji: "🚆", colorVar: C_ULASIM },
  taksi: { name: "Taksi", emoji: "🚕", colorVar: C_ULASIM },
  ucak: { name: "Uçak", emoji: "✈️", colorVar: C_ULASIM },

  // Araba (kendi aracı: sigorta, yakıt, park, vignette, servis)
  araba: { name: "Araba", emoji: "🚙", colorVar: C_ARABA },
  yakit: { name: "Yakıt", emoji: "⛽", colorVar: C_ARABA },
  parkpickerl: { name: "Parkpickerl", emoji: "🅿️", colorVar: C_ARABA },
  pickerl: { name: "Pickerl", emoji: "🚙", colorVar: C_ARABA },
  tamirservis: { name: "Servis", emoji: "🔧", colorVar: C_ARABA },
  yikama: { name: "Yıkama", emoji: "🧽", colorVar: C_ARABA },
  oamtc: { name: "ÖAMTC", emoji: "🆘", colorVar: C_ARABA },
  vignette: { name: "Vignette", emoji: "🛣️", colorVar: C_ARABA },
  otopark: { name: "Otopark", emoji: "🅿️", colorVar: C_ARABA },
  ceza: { name: "Ceza", emoji: "🚓", colorVar: C_ARABA },

  // Sağlık & sigorta
  saglik: { name: "Sağlık", emoji: "⚕️", colorVar: C_SAGLIK },
  saglikvespor: { name: "Sağlık", emoji: "⚕️", colorVar: C_SAGLIK },
  sigorta: { name: "Sigorta", emoji: "🛡️", colorVar: C_SAGLIK },

  // Abonelik
  abonelik: { name: "Abonelik", emoji: "📺", colorVar: C_ABONELIK },
  dijitalabonelikler: { name: "Abonelik", emoji: "📺", colorVar: C_ABONELIK },
  streaming: { name: "Streaming", emoji: "📺", colorVar: C_ABONELIK },

  // Giyim & spor & porsuk
  giyim: { name: "Giyim", emoji: "👕", colorVar: C_GIYIM },
  kiyafet: { name: "Kıyafet", emoji: "👕", colorVar: C_GIYIM },
  spor: { name: "Spor", emoji: "⚽", colorVar: C_SPOR },
  porsuk: { name: "Porsuk", emoji: "🐈", colorVar: C_PORSUK },

  // AI
  ai: { name: "AI", emoji: "🤖", colorVar: C_AI },
  chatgpt: { name: "ChatGPT", emoji: "🤖", colorVar: C_AI },
  claude: { name: "Claude", emoji: "🤖", colorVar: C_AI },
  grok: { name: "Grok", emoji: "🤖", colorVar: C_AI },
  github: { name: "GitHub", emoji: "🐙", colorVar: C_AI },

  // Kişisel Bakım
  kisiselbakim: {
    name: "Kişisel Bakım",
    emoji: "💇",
    colorVar: C_KISISELBAKIM,
  },
  kuafor: { name: "Kuaför", emoji: "💇", colorVar: C_KISISELBAKIM },
  kozmetik: { name: "Kozmetik", emoji: "💄", colorVar: C_KISISELBAKIM },
  krem: { name: "Krem", emoji: "🧴", colorVar: C_KISISELBAKIM },
  serum: { name: "Serum", emoji: "🧪", colorVar: C_KISISELBAKIM },
  parfum: { name: "Parfüm", emoji: "🌸", colorVar: C_KISISELBAKIM },

  // Tatil
  tatil: { name: "Tatil", emoji: "✈️", colorVar: C_TATIL },
  bilet: { name: "Bilet", emoji: "🎫", colorVar: C_TATIL },
  otel: { name: "Otel", emoji: "🏨", colorVar: C_TATIL },
  aktivite: { name: "Aktivite", emoji: "🎢", colorVar: C_TATIL },

  // Loto
  loto: { name: "Loto", emoji: "🍀", colorVar: C_LOTO },
  lottoplus: { name: "LottoPlus", emoji: "🍀", colorVar: C_LOTO },
  euromillion: { name: "EuroMillion", emoji: "🍀", colorVar: C_LOTO },

  // Tabak
  tabak: { name: "Tabak", emoji: "🚬", colorVar: C_TABAK },
  snuss: { name: "Snuss", emoji: "🚬", colorVar: C_TABAK },
  sigara: { name: "Sigara", emoji: "🚬", colorVar: C_TABAK },
  veev: { name: "Veev", emoji: "💨", colorVar: C_TABAK },
  okul: { name: "Okul", emoji: "📚", colorVar: C_PORSUK },
  egitim: { name: "Eğitim", emoji: "📚", colorVar: C_PORSUK },
  egitimvegelisim: { name: "Eğitim", emoji: "📚", colorVar: C_PORSUK },

  // Borç / birikim
  borc: { name: "Borç", emoji: "💳", colorVar: C_DIGER },
  borclar: { name: "Borçlar", emoji: "💳", colorVar: C_DIGER },
  birikim: { name: "Birikim", emoji: "💰", colorVar: C_DIGER },
  birikimveyatirim: { name: "Birikim", emoji: "💰", colorVar: C_DIGER },

  // Other
  hediye: { name: "Hediye", emoji: "🎁", colorVar: C_DIGER },
  beklenmeyen: { name: "Beklenmeyen", emoji: "⚠️", colorVar: C_DIGER },
  beklenmeyengiderler: { name: "Beklenmeyen", emoji: "⚠️", colorVar: C_DIGER },
  diger: { name: "Diğer", emoji: "📦", colorVar: C_DIGER },
};

const FALLBACK: CategoryMeta = CATEGORIES.diger;

/** Resolve a category string to display metadata. Falls back to "Diğer". */
export function getCategoryMeta(cat: string | undefined | null): CategoryMeta {
  if (!cat) return FALLBACK;
  const key = normalizeKey(cat);
  if (CATEGORIES[key]) return CATEGORIES[key];

  // Substring fallback — try each registered key against the normalised input.
  // Require key length >= 4 on both sides to prevent short-key false matches
  // (e.g. "ai" sneaking into "araba", "ev" into "konutveev").
  if (key.length >= 4) {
    for (const k of Object.keys(CATEGORIES)) {
      if (k.length < 4) continue;
      if (key.includes(k) || k.includes(key)) return CATEGORIES[k];
    }
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

export function CategoryPill({
  cat,
  size = "md",
  className,
  showEmoji = true,
  displayName,
}: CategoryPillProps) {
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
