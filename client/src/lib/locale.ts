export type Locale = "tr" | "en" | "de";
export const LOCALES: Locale[] = ["tr", "en", "de"];
export const LOCALE_LABELS: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
};
export const LOCALE_FLAGS: Record<Locale, string> = {
  tr: "🇹🇷",
  en: "🇬🇧",
  de: "🇦🇹",
};
export const LOCALE_INTL: Record<Locale, string> = {
  tr: "tr-TR",
  en: "en-GB",
  de: "de-AT",
};
