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

/** Percentage formatter — 1 decimal */
export function formatPct(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
