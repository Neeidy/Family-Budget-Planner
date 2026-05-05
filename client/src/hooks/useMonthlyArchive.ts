import { useState, useEffect, useCallback } from 'react';
import { BudgetData } from './useBudgetData';

export interface MonthKey {
  year: number;
  month: number; // 1-12
}

export interface ArchivedMonth {
  key: string; // "2026-05" format
  year: number;
  month: number;
  monthName: string;
  data: BudgetData;
  savedAt: string; // ISO timestamp
}

const ARCHIVE_KEY = 'viyana_month_archive';
const TEMPLATES_KEY = 'viyana_recurring_templates';
const UNDO_KEY = 'viyana_undo_stack';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export function monthKeyString(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function useMonthlyArchive() {
  const [archive, setArchive] = useState<ArchivedMonth[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(ARCHIVE_KEY);
    if (stored) {
      try {
        setArchive(JSON.parse(stored));
      } catch {
        setArchive([]);
      }
    }
  }, []);

  const saveToArchive = useCallback((data: BudgetData, year: number, month: number) => {
    const key = monthKeyString(year, month);
    const entry: ArchivedMonth = {
      key,
      year,
      month,
      monthName: MONTH_NAMES[month - 1],
      data,
      savedAt: new Date().toISOString(),
    };

    setArchive(prev => {
      const filtered = prev.filter(a => a.key !== key);
      const updated = [...filtered, entry].sort((a, b) => b.key.localeCompare(a.key));
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getMonthData = useCallback((year: number, month: number): ArchivedMonth | null => {
    const key = monthKeyString(year, month);
    return archive.find(a => a.key === key) ?? null;
  }, [archive]);

  const deleteMonthArchive = useCallback((year: number, month: number) => {
    const key = monthKeyString(year, month);
    setArchive(prev => {
      const updated = prev.filter(a => a.key !== key);
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { archive, saveToArchive, getMonthData, deleteMonthArchive };
}

// ─── Recurring Templates ───────────────────────────────────────────────────

export interface RecurringTemplate {
  id: string;
  type: 'income' | 'expense';
  name: string;
  amount: number;
  category?: string;
  subcategory?: string;
  owner: 'Benim' | 'Esim' | 'Ev';
  notes?: string;
  enabled: boolean;
}

export function useRecurringTemplates() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch {
        setTemplates([]);
      }
    }
  }, []);

  const save = useCallback((updated: RecurringTemplate[]) => {
    setTemplates(updated);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
  }, []);

  const addTemplate = useCallback((t: Omit<RecurringTemplate, 'id'>) => {
    const newT: RecurringTemplate = { ...t, id: Date.now().toString() };
    setTemplates(prev => {
      const updated = [...prev, newT];
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateTemplate = useCallback((id: string, changes: Partial<RecurringTemplate>) => {
    setTemplates(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...changes } : t);
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { templates, addTemplate, updateTemplate, deleteTemplate, save };
}

// ─── Undo Stack ────────────────────────────────────────────────────────────

const MAX_UNDO = 10;

export interface UndoEntry {
  timestamp: number;
  description: string;
  snapshot: BudgetData;
}

export function useUndoStack() {
  const [stack, setStack] = useState<UndoEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(UNDO_KEY);
    if (stored) {
      try {
        setStack(JSON.parse(stored));
      } catch {
        setStack([]);
      }
    }
  }, []);

  const pushUndo = useCallback((description: string, snapshot: BudgetData) => {
    setStack(prev => {
      const entry: UndoEntry = { timestamp: Date.now(), description, snapshot };
      const updated = [entry, ...prev].slice(0, MAX_UNDO);
      localStorage.setItem(UNDO_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const popUndo = useCallback((): UndoEntry | null => {
    let popped: UndoEntry | null = null;
    setStack(prev => {
      if (prev.length === 0) return prev;
      popped = prev[0];
      const updated = prev.slice(1);
      localStorage.setItem(UNDO_KEY, JSON.stringify(updated));
      return updated;
    });
    return popped;
  }, []);

  const clearUndo = useCallback(() => {
    setStack([]);
    localStorage.removeItem(UNDO_KEY);
  }, []);

  return { stack, pushUndo, popUndo, clearUndo };
}
