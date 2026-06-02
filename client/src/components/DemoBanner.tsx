/**
 * Sticky demo banner. Mounted by DashboardLayout when isDemoMode() is true.
 * Renders above the sidebar/header layout, visible on every page.
 *
 * Tokens: --status-warning + --bg-elevated tint, mockup-aligned typography.
 */
import { useTranslation } from "react-i18next";

export function DemoBanner() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t("demo_banner.title")}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        width: "100%",
        padding: "8px 16px",
        background:
          "color-mix(in oklch, var(--status-warning) 16%, var(--bg-elevated))",
        borderBottom:
          "1px solid color-mix(in oklch, var(--status-warning) 50%, transparent)",
        color: "var(--text-primary)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "-0.005em",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: 999,
          background: "var(--status-warning)",
          color: "oklch(0.15 0.02 80)",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        i
      </span>
      <span>{t("demo_banner.title")}</span>
      <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>
        · {t("demo_banner.subtitle")}
      </span>
    </div>
  );
}
