/**
 * Single source of truth for expense categories + Vienna-specific
 * subcategories.
 *
 * Used by:
 *   - ExpenseDialog (kategori + subcategory dropdown)
 *   - BudgetLimitDialog (ana kategori only)
 *   - CategoryPill (rendering + colors, soft fallback to substring match)
 *   - Demo data + future shared validators
 */

export interface SubCategory {
  key: string;
  label: string;
}

export interface MainCategory {
  key: string;
  label: string;
  emoji: string;
  subcategories: SubCategory[];
}

export const CATEGORIES: MainCategory[] = [
  {
    key: "Konut",
    label: "Konut",
    emoji: "🏠",
    subcategories: [
      { key: "Kira", label: "Kira" },
      { key: "Strom", label: "Elektrik (Strom)" },
      { key: "Gas", label: "Doğalgaz (Gas)" },
      { key: "Fernwarme", label: "Fernwärme" },
      { key: "Internet", label: "İnternet" },
      { key: "ORF", label: "ORF Gebühr" },
      { key: "Hausbesorger", label: "Hausbesorger" },
      { key: "Versicherung", label: "Konut Sigortası" },
      { key: "Aidat", label: "Aidat" },
      { key: "Diger", label: "Diğer" },
    ],
  },
  {
    key: "Yiyecek",
    label: "Yiyecek",
    emoji: "🛒",
    subcategories: [
      { key: "Market", label: "Market (Hofer/Billa/Spar)" },
      { key: "Restoran", label: "Restoran" },
      { key: "Cafe", label: "Cafe" },
      { key: "Lieferando", label: "Lieferando/Sipariş" },
      { key: "Diger", label: "Diğer" },
    ],
  },
  {
    key: "Araba",
    label: "Araba",
    emoji: "🚙",
    subcategories: [
      { key: "Sigorta", label: "Sigorta" },
      { key: "Yakit", label: "Yakıt" },
      { key: "Parkpickerl", label: "Parkpickerl" },
      { key: "Pickerl", label: "Pickerl (§57a)" },
      { key: "TamirServis", label: "Tamir / Servis" },
      { key: "Yikama", label: "Yıkama" },
      { key: "OAMTC", label: "ÖAMTC Jahresgebühr" },
      { key: "Vignette", label: "Vignette" },
      { key: "Otopark", label: "Otopark" },
      { key: "Ceza", label: "Park / Hız Cezası" },
      { key: "Diger", label: "Diğer" },
    ],
  },
  {
    key: "Ulasim",
    label: "Ulaşım",
    emoji: "🚌",
    subcategories: [
      { key: "WienerLinien", label: "Wiener Linien" },
      { key: "OBB", label: "ÖBB" },
      { key: "Taksi", label: "Taksi / Uber / Bolt" },
      { key: "Ucak", label: "Uçak" },
      { key: "Diger", label: "Diğer" },
    ],
  },
  {
    key: "Saglik",
    label: "Sağlık",
    emoji: "⚕️",
    subcategories: [
      { key: "Apotheke", label: "Apotheke" },
      { key: "Doktor", label: "Doktor" },
      { key: "Sigorta", label: "Özel Sağlık Sigortası" },
      { key: "Dental", label: "Diş Hekimi" },
      { key: "Optik", label: "Optik" },
      { key: "Diger", label: "Diğer" },
    ],
  },
  {
    key: "Eglence",
    label: "Eğlence",
    emoji: "🎬",
    subcategories: [
      { key: "Sinema", label: "Sinema" },
      { key: "Konser", label: "Konser" },
      { key: "Muze", label: "Müze / Sergi" },
      { key: "Gezi", label: "Gezi" },
      { key: "Aktivite", label: "Aktivite" },
      { key: "Diger", label: "Diğer" },
    ],
  },
  {
    key: "Abonelik",
    label: "Abonelik",
    emoji: "📺",
    subcategories: [
      { key: "Netflix", label: "Netflix" },
      { key: "Spotify", label: "Spotify" },
      { key: "Disney", label: "Disney+" },
      { key: "YouTube", label: "YouTube Premium" },
      { key: "Mobil", label: "Mobil Hat" },
      { key: "Cloud", label: "iCloud / Google" },
      { key: "Diger", label: "Diğer" },
    ],
  },
  {
    key: "Giyim",
    label: "Giyim",
    emoji: "👕",
    subcategories: [
      { key: "Gunluk", label: "Günlük" },
      { key: "Spor", label: "Spor" },
      { key: "Is", label: "İş" },
      { key: "Ayakkabi", label: "Ayakkabı" },
      { key: "Aksesuar", label: "Aksesuar" },
      { key: "Diger", label: "Diğer" },
    ],
  },
  {
    key: "Spor",
    label: "Spor",
    emoji: "⚽",
    subcategories: [
      { key: "Salon", label: "Spor Salonu" },
      { key: "Uyelik", label: "Üyelik" },
      { key: "Ekipman", label: "Ekipman" },
      { key: "Diger", label: "Diğer" },
    ],
  },
  {
    key: "Porsuk",
    label: "Porsuk",
    emoji: "🐈",
    subcategories: [
      { key: "Mama", label: "Mama" },
      { key: "Veteriner", label: "Veteriner" },
      { key: "Bakim", label: "Bakım" },
      { key: "Aksesuar", label: "Kum / Aksesuar" },
      { key: "Sigorta", label: "Pet Sigortası" },
      { key: "Diger", label: "Diğer" },
    ],
  },
  {
    key: "Diger",
    label: "Diğer",
    emoji: "📦",
    subcategories: [{ key: "Diger", label: "Diğer (serbest)" }],
  },
];

export function getMainCategory(key: string): MainCategory | undefined {
  return CATEGORIES.find(c => c.key === key);
}

export function getSubcategories(categoryKey: string): SubCategory[] {
  return getMainCategory(categoryKey)?.subcategories ?? [];
}

export function getCategoryEmoji(key: string): string {
  return getMainCategory(key)?.emoji ?? "📦";
}
