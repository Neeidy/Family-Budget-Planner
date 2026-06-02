import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "lucide-react";
import { setLocale } from "@/i18n";
import { LOCALES, LOCALE_FLAGS, type Locale } from "@/lib/locale";

/**
 * Compact language switcher: a single active-flag button that opens a
 * downward popover listing the three locales. Replaces the previous
 * always-expanded 3-flag row so it takes less space and stays consistent
 * across the sidebar footer, mobile top bar, Settings, and Login.
 *
 * Accessibility: listbox/option roles, aria-expanded/-selected, closes on
 * Escape and on outside click; active row is a no-op, others switch locale.
 */
export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const current = (i18n.language.split("-")[0] as Locale) || "tr";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (loc: Locale) => {
    if (loc !== current) setLocale(loc);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={t("language_toggle.label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          height: 34,
          padding: "0 8px",
          borderRadius: 8,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-faint)",
          color: "var(--text-secondary)",
          cursor: "pointer",
          fontSize: 14,
          fontFamily: "inherit",
          lineHeight: 1,
        }}
      >
        <span aria-hidden="true">{LOCALE_FLAGS[current]}</span>
        <ChevronDownIcon
          size={14}
          style={{
            opacity: 0.6,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("language_toggle.label")}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: 100,
            maxWidth: 140,
            zIndex: 50,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-faint)",
            borderRadius: 8,
            padding: 4,
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {LOCALES.map(loc => {
            const active = loc === current;
            return (
              <button
                key={loc}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => choose(loc)}
                onMouseEnter={e => {
                  if (!active)
                    e.currentTarget.style.background = "var(--bg-tint)";
                }}
                onMouseLeave={e => {
                  if (!active)
                    e.currentTarget.style.background = "transparent";
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 6,
                  background: active ? "var(--accent-green)" : "transparent",
                  color: active
                    ? "oklch(0.15 0.03 155)"
                    : "var(--text-secondary)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "inherit",
                  fontWeight: active ? 600 : 500,
                  lineHeight: 1,
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 15 }} aria-hidden="true">
                  {LOCALE_FLAGS[loc]}
                </span>
                <span>{loc.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
