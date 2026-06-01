import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getStored, setStored } from "@/lib/storage";
import type { Locale } from "@/lib/locale";

import trCommon from "@/locales/tr/common.json";
import enCommon from "@/locales/en/common.json";
import deCommon from "@/locales/de/common.json";

const isDemoHost =
  typeof window !== "undefined" &&
  window.location.hostname === "demo.aileplan.uk";

const defaultLocale: Locale =
  getStored<Locale | null>("locale", null) ?? (isDemoHost ? "en" : "tr");

i18n.use(initReactI18next).init({
  resources: {
    tr: { common: trCommon },
    en: { common: enCommon },
    de: { common: deCommon },
  },
  lng: defaultLocale,
  fallbackLng: "tr",
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export function setLocale(loc: Locale) {
  setStored("locale", loc);
  i18n.changeLanguage(loc);
}

export default i18n;
