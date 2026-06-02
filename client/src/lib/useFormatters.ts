import { useTranslation } from "react-i18next";
import { LOCALE_INTL, type Locale } from "./locale";
import * as fmt from "./format";

/**
 * Locale-reactive formatter hook. Consuming `useTranslation` ties the
 * component to i18n.language so it re-renders on locale change, and the
 * resolved Intl locale is passed explicitly into each format helper —
 * guaranteeing money/date/percent always reflect the active language.
 */
export function useFormatters() {
  const { i18n } = useTranslation();
  const intl = LOCALE_INTL[(i18n.language as Locale) || "tr"] ?? "tr-TR";
  return {
    fm: (n: number) => fmt.formatMoney(n, intl),
    fmShort: (n: number) => fmt.formatMoneyShort(n, intl),
    fmParts: (n: number) => fmt.formatMoneyParts(n, intl),
    fp: (n: number) => fmt.formatPct(n, intl),
    fd: (iso: string) => fmt.formatDate(iso, intl),
  };
}
