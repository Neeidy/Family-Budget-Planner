import { createContext, useContext, useState, ReactNode } from 'react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

export type PersonKey = 'Benim' | 'Esim' | null;

interface PersonContextType {
  currentPerson: PersonKey;
  person1Name: string;
  person2Name: string;
  /**
   * Calling setCurrentPerson(null) triggers logout and redirects to /login.
   */
  setCurrentPerson: (person: PersonKey) => void;
  setPerson1Name: (name: string) => void;
  setPerson2Name: (name: string) => void;
  getDisplayName: (owner: 'Benim' | 'Esim' | 'Ev') => string;
  myOwnerKey: 'Benim' | 'Esim' | null;
}

// Display names are stored in localStorage (labels only, not auth)
const NAMES_STORAGE_KEY = 'uk_ailesi_names';
const DEFAULT_PERSON1 = 'Yigit';
const DEFAULT_PERSON2 = 'Arzu';

const PersonContext = createContext<PersonContextType | null>(null);

export function PersonProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // currentPerson is derived from the familyAuth.me query
  const { data: familySession } = trpc.familyAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  const currentPerson: PersonKey = familySession?.person ?? null;

  const [person1Name, setPerson1NameState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(NAMES_STORAGE_KEY);
      if (saved) return JSON.parse(saved).person1 || DEFAULT_PERSON1;
    } catch {}
    return DEFAULT_PERSON1;
  });

  const [person2Name, setPerson2NameState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(NAMES_STORAGE_KEY);
      if (saved) return JSON.parse(saved).person2 || DEFAULT_PERSON2;
    } catch {}
    return DEFAULT_PERSON2;
  });

  const logoutMutation = trpc.familyAuth.logout.useMutation({
    onSuccess: async () => {
      await utils.familyAuth.me.invalidate();
      setLocation('/login');
    },
  });

  /**
   * Calling setCurrentPerson(null) triggers logout.
   * Changing person also requires re-authentication.
   */
  const setCurrentPerson = (person: PersonKey) => {
    if (person === null || person !== currentPerson) {
      logoutMutation.mutate();
    }
  };

  const setPerson1Name = (name: string) => {
    setPerson1NameState(name);
    const current = { person1: name, person2: person2Name };
    localStorage.setItem(NAMES_STORAGE_KEY, JSON.stringify(current));
  };

  const setPerson2Name = (name: string) => {
    setPerson2NameState(name);
    const current = { person1: person1Name, person2: name };
    localStorage.setItem(NAMES_STORAGE_KEY, JSON.stringify(current));
  };

  const getDisplayName = (owner: 'Benim' | 'Esim' | 'Ev'): string => {
    if (owner === 'Benim') return person1Name;
    if (owner === 'Esim') return person2Name;
    return 'Ev (Ortak)';
  };

  const myOwnerKey: 'Benim' | 'Esim' | null = currentPerson;

  return (
    <PersonContext.Provider value={{
      currentPerson,
      person1Name,
      person2Name,
      setCurrentPerson,
      setPerson1Name,
      setPerson2Name,
      getDisplayName,
      myOwnerKey,
    }}>
      {children}
    </PersonContext.Provider>
  );
}

export function usePerson() {
  const ctx = useContext(PersonContext);
  if (!ctx) throw new Error('usePerson must be used within PersonProvider');
  return ctx;
}
