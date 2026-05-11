import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import { getStored, setStored } from "@/lib/storage";

export type PersonFilter = "Tümü" | "Benim" | "Esim" | "Ev";

interface PersonFilterContextType {
  filter: PersonFilter;
  setFilter: (f: PersonFilter) => void;
}

const PersonFilterContext = createContext<PersonFilterContextType | null>(null);

const STORAGE_KEY = "person-filter";

function loadInitial(): PersonFilter {
  const v = getStored<PersonFilter>(STORAGE_KEY, "Tümü");
  return v === "Tümü" || v === "Benim" || v === "Esim" || v === "Ev"
    ? v
    : "Tümü";
}

export function PersonFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilterState] = useState<PersonFilter>(loadInitial);
  const setFilter = useCallback((f: PersonFilter) => {
    setFilterState(f);
    setStored(STORAGE_KEY, f);
  }, []);
  return (
    <PersonFilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </PersonFilterContext.Provider>
  );
}

export function usePersonFilter() {
  const ctx = useContext(PersonFilterContext);
  if (!ctx)
    throw new Error("usePersonFilter must be used within PersonFilterProvider");
  return ctx;
}
