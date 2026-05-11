/**
 * Namespaced localStorage helper.
 *
 * All keys are prefixed with "viyana:" to avoid clashing with other
 * apps on the same domain (mainly for users running multiple tabs
 * or sharing a profile).
 *
 * Silent failure mode: localStorage can throw in private windows,
 * Safari ITP, or quota-exceeded situations. We swallow those so the
 * UI never crashes on persistence — worst case, settings just don't
 * round-trip.
 */

const NAMESPACE = "viyana:";

export function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NAMESPACE + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(NAMESPACE + key, JSON.stringify(value));
  } catch {
    /* localStorage may be unavailable; silent fail */
  }
}

export function removeStored(key: string): void {
  try {
    localStorage.removeItem(NAMESPACE + key);
  } catch {
    /* */
  }
}
