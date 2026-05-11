/**
 * EUR currency formatter — Turkish locale, 2 decimals.
 * All money displays in the new design layer should use this.
 * Pair with `className="hero-num"` (Faz B utility) for tabular figures.
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Compact short form: €1.2k / €350 */
export function formatMoneyShort(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1000) {
    return `€${(amount / 1000).toFixed(1)}k`;
  }
  return formatMoney(amount);
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
    normalized = trimmed
      .split(thousandChar)
      .join("")
      .replace(decimalChar, ".");
  } else if (lastComma >= 0) {
    // Comma-only → treat as decimal (Turkish/German default).
    normalized = trimmed.replace(",", ".");
  }

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : NaN;
}

/** Percentage formatter — 1 decimal */
export function formatPct(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
