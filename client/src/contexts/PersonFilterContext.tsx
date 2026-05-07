import { createContext, useContext, useState, ReactNode } from "react";

export type PersonFilter = "Tümü" | "Benim" | "Esim" | "Ev";

interface PersonFilterContextType {
  filter: PersonFilter;
  setFilter: (f: PersonFilter) => void;
}

const PersonFilterContext = createContext<PersonFilterContextType | null>(null);

export function PersonFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<PersonFilter>("Tümü");
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
