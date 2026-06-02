import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "lucide-react";
import { setLocale } from "@/i18n";
import { LOCALES, LOCALE_FLAGS, type Locale } from "@/lib/locale";

/**
 * Compact language switcher: a single active-flag button that opens a popover
 * listing the three locales.
 *
 * The popover is portaled to <body> with position:fixed and re-positioned
 * from the button's getBoundingClientRect on every open/scroll/resize. This
 * escapes ancestor containing-block / overflow traps (sidebar footer, mobile
 * bars) that a position:absolute popover would inherit. Auto-flips above the
 * button when there isn't room below, and shifts horizontally to stay inside
 * the viewport.
 *
 * Accessibility: listbox/option roles, aria-expanded/-selected; closes on
 * Escape and outside click. Active row is a no-op, others switch locale.
 */
const POPOVER_W = 120; // fixed width
const POPOVER_H_EST = 130; // 3 rows × ~34px + padding
const GAP = 4;
const VIEWPORT_PAD = 8;

export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const current = (i18n.language.split("-")[0] as Locale) || "tr";
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    flipUp: boolean;
  }>({ top: 0, left: 0, flipUp: false });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const btn = btnRef.current;
    if (!btn) return;
    // Fall back to the document element when innerWidth/Height are unavailable
    // (e.g. a mid-flight resize reporting 0) so we never compute an
    // off-screen position from a zero viewport.
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (!vw || !vh) return;
    const r = btn.getBoundingClientRect();
    const spaceBelow = vh - r.bottom;
    const flipUp = spaceBelow < POPOVER_H_EST + GAP + VIEWPORT_PAD;
    const top = flipUp
      ? Math.max(VIEWPORT_PAD, r.top - POPOVER_H_EST - GAP)
      : r.bottom + GAP;
    // Align to the button's right edge, but never overflow the viewport.
    let left = r.right - POPOVER_W;
    if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;
    if (left + POPOVER_W > vw - VIEWPORT_PAD)
      left = vw - POPOVER_W - VIEWPORT_PAD;
    setPos({ top, left, flipUp });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (popRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // capture:true → also catch scroll inside nested scroll containers
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (loc: Locale) => {
    if (loc !== current) setLocale(loc);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
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

      {open &&
        createPortal(
          <div
            ref={popRef}
            role="listbox"
            aria-label={t("language_toggle.label")}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: POPOVER_W,
              zIndex: 9999,
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
          </div>,
          document.body
        )}
    </>
  );
}
