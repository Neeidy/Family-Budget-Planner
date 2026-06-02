import i18n from "@/i18n";
import { LOCALE_INTL, type Locale } from "@/lib/locale";

function currentIntl(): string {
  const lng = (i18n.language || "tr") as Locale;
  return LOCALE_INTL[lng] ?? "tr-TR";
}

/**
 * EUR currency formatter — locale-aware, 2 decimals.
 */
export function formatMoney(amount: number, intl?: string): string {
  return new Intl.NumberFormat(intl ?? currentIntl(), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Split a formatted EUR amount into a "main" part (currency symbol +
 * integer + grouping) and a "fraction" part (decimal separator + decimals),
 * locale-aware via Intl.formatToParts. Used by hero cards that render the
 * decimals smaller. Avoids regex assumptions about which separator is decimal.
 */
export function formatMoneyParts(
  amount: number,
  intl?: string
): { main: string; fraction: string } {
  const locale = intl ?? currentIntl();
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(amount);

  let main = "";
  let fraction = "";
  let inFraction = false;
  for (const p of parts) {
    if (p.type === "decimal" || p.type === "fraction") {
      inFraction = true;
      fraction += p.value;
    } else if (!inFraction) {
      main += p.value;
    } else {
      // trailing literal (e.g. currency suffix after decimals) → keep with main
      main += p.value;
    }
  }
  return { main, fraction };
}

/** Compact short form — locale-aware compact currency notation. */
export function formatMoneyShort(amount: number, intl?: string): string {
  const locale = intl ?? currentIntl();
  const abs = Math.abs(amount);
  if (abs >= 1000) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return formatMoney(amount, locale);
}

/**
 * Locale-tolerant currency parser. Accepts Avusturya / Türkçe input:
 *   "1500", "1500.50", "1.500", "1.500,50", "1500,50"
 * Returns NaN for empty / invalid input. The euro sign and whitespace
 * are stripped before parsing.
 *
 * Strategy:
 *   - When both `.` and `,` appear, the right-most one is the decimal
 *     separator and the left one is the thousand grouper.
 *   - When only `,` appears, treat it as decimal (default Turkish).
 *   - When only `.` appears, parseFloat handles it natively.
 */
export function parseMoney(input: string): number {
  if (!input || typeof input !== "string") return NaN;
  const trimmed = input.trim().replace(/[€\s]/g, "");
  if (!trimmed) return NaN;

  const lastDot = trimmed.lastIndexOf(".");
  const lastComma = trimmed.lastIndexOf(",");
  let normalized = trimmed;

  if (lastDot >= 0 && lastComma >= 0) {
    const decimalChar = lastDot > lastComma ? "." : ",";
    const thousandChar = decimalChar === "." ? "," : ".";
    normalized = trimmed.split(thousandChar).join("").replace(decimalChar, ".");
  } else if (lastComma >= 0) {
    normalized = trimmed.replace(",", ".");
  }

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : NaN;
}

/** Percentage formatter — 1 decimal, locale-aware */
export function formatPct(value: number, intl?: string): string {
  return new Intl.NumberFormat(intl ?? currentIntl(), {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/** Locale-aware short date (e.g. 5 May 2026 / May 5, 2026 / 5. Mai 2026) */
export function formatDate(iso: string, intl?: string): string {
  try {
    return new Intl.DateTimeFormat(intl ?? currentIntl(), {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Locale-aware "long month + year" (e.g. Haziran 2026 / June 2026 / Juni 2026). month0 is 0-based. */
export function formatMonthYear(
  year: number,
  month0: number,
  intl?: string
): string {
  try {
    return new Intl.DateTimeFormat(intl ?? currentIntl(), {
      year: "numeric",
      month: "long",
    }).format(new Date(year, month0, 1));
  } catch {
    return `${month0 + 1}/${year}`;
  }
}

/** Locale-aware short month label by 0-based index (e.g. Oca / Jan / Jän). */
export function formatMonthShort(month0: number, intl?: string): string {
  try {
    return new Intl.DateTimeFormat(intl ?? currentIntl(), {
      month: "short",
    }).format(new Date(2000, month0, 1));
  } catch {
    return String(month0 + 1);
  }
}
