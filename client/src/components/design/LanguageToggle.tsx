import { useTranslation } from "react-i18next";
import { setLocale } from "@/i18n";
import { LOCALES, LOCALE_FLAGS, type Locale } from "@/lib/locale";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = (i18n.language as Locale) || "tr";

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "var(--bg-elevated)",
        borderRadius: 8,
        padding: 2,
        border: "1px solid var(--border-faint)",
      }}
    >
      {LOCALES.map(loc => {
        const active = current === loc;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            aria-label={loc.toUpperCase()}
            aria-pressed={active}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              background: active ? "var(--accent-green)" : "transparent",
              color: active ? "oklch(0.15 0.03 155)" : "var(--text-secondary)",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "inherit",
              lineHeight: 1,
            }}
          >
            {LOCALE_FLAGS[loc]}
          </button>
        );
      })}
    </div>
  );
}
