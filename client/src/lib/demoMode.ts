import type { CSSProperties } from "react";

/**
 * demo.aileplan.uk detection. Used to:
 *  - render the showcase login (fake profiles, no password)
 *  - mount the DemoBanner across all pages
 *  - disable Add/Edit/Delete buttons (server already FORBIDs writes)
 */
export const isDemoMode = (): boolean =>
  typeof window !== "undefined" &&
  window.location.hostname === "demo.aileplan.uk";

export const DEMO_DISABLED_TITLE = "Demo modunda düzenleme yapılamaz";

/**
 * Spread on any write-action button to render it disabled in demo mode.
 * In normal mode returns `{}`, leaving the button untouched.
 */
export function demoDisabledProps(_originalTitle?: string): {
  disabled?: boolean;
  title?: string;
  style?: CSSProperties;
} {
  if (!isDemoMode()) return {};
  return {
    disabled: true,
    title: DEMO_DISABLED_TITLE,
    style: { cursor: "not-allowed", opacity: 0.5 },
  };
  // originalTitle param accepted but ignored — explicit signature kept so
  // callers can `<Btn {...demoDisabledProps('Düzenle')} title="Düzenle"/>`
  // and override title in non-demo branch.
}
