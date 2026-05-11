import { createContext, useCallback, useContext, useState } from "react";

export type FabAction =
  | "expense"
  | "income"
  | "limit"
  | "debt"
  | "installment"
  | "annual"
  | "goal"
  | null;

interface FabContextType {
  requestedAction: FabAction;
  requestAction: (action: FabAction) => void;
  clearAction: () => void;
}

const FabContext = createContext<FabContextType | undefined>(undefined);

export function FabProvider({ children }: { children: React.ReactNode }) {
  const [requestedAction, setRequestedAction] = useState<FabAction>(null);

  const requestAction = useCallback((action: FabAction) => {
    setRequestedAction(action);
  }, []);

  const clearAction = useCallback(() => {
    setRequestedAction(null);
  }, []);

  return (
    <FabContext.Provider
      value={{ requestedAction, requestAction, clearAction }}
    >
      {children}
    </FabContext.Provider>
  );
}

export function useFab(): FabContextType {
  const ctx = useContext(FabContext);
  if (!ctx) throw new Error("useFab must be used within FabProvider");
  return ctx;
}
