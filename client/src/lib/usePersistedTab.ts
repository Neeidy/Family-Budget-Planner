import { useState } from "react";
import { getStored, setStored } from "./storage";

/**
 * Tab state persistor — sayfa bazlı localStorage anahtarı.
 *
 * useState API'ını birebir taklit eder: tuple `[value, setValue]`
 * döner. İlk render'da localStorage'tan değer okur ve `validValues`
 * listesinde varsa onu, yoksa `defaultValue`'yu seçer. setValue
 * çağrısı hem state hem localStorage'ı senkron günceller.
 *
 * Storage failure (Safari ITP / private window) durumunda silent
 * fallback — sadece in-memory state çalışır.
 */
export function usePersistedTab<T extends string>(
  storageKey: string,
  defaultValue: T,
  validValues: readonly T[]
): [T, (next: T) => void] {
  const [tab, setTab] = useState<T>(() => {
    const stored = getStored<string | null>(storageKey, null);
    if (stored && (validValues as readonly string[]).includes(stored)) {
      return stored as T;
    }
    return defaultValue;
  });

  const setTabPersisted = (next: T) => {
    setTab(next);
    setStored(storageKey, next);
  };

  return [tab, setTabPersisted];
}
