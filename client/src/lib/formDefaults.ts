/**
 * Remembers the last submitted values for each dialog so the next
 * "+ Ekle" open is pre-filled with sensible defaults. Field-specific
 * fields (name, amount) are NOT remembered — only the structural
 * pickers (owner, category, type, status).
 *
 * Backed by localStorage via storage.ts (silent failure-safe).
 */
import { getStored, setStored } from "./storage";

const KEY_PREFIX = "form-defaults:";

export function getDefaults<T>(form: string): Partial<T> {
  return getStored<Partial<T>>(KEY_PREFIX + form, {} as Partial<T>);
}

export function rememberDefaults<T>(form: string, values: Partial<T>): void {
  setStored(KEY_PREFIX + form, values);
}
