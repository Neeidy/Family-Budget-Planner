import type { PersonFilter } from "@/contexts/PersonFilterContext";
import type { FilterValue } from "@/components/design";

// ── Filter ↔ FilterValue bridges ──
export const FILTER_TO_LOCAL: Record<FilterValue, PersonFilter> = {
  tumu: "Tümü",
  yigit: "Benim",
  arzu: "Esim",
  ev: "Ev",
};
export const LOCAL_TO_FILTER: Record<PersonFilter, FilterValue> = {
  Tümü: "tumu",
  Benim: "yigit",
  Esim: "arzu",
  Ev: "ev",
};

/**
 * Apply person filter to a list of items keyed by `owner`.
 * - "Tümü" → all items
 * - "Benim" / "Esim" / "Ev" → owner-matched items
 */
export function applyPersonFilter<T extends { owner?: string }>(
  items: T[],
  filter: PersonFilter
): T[] {
  if (filter === "Tümü") return items;
  return items.filter(i => i.owner === filter);
}
