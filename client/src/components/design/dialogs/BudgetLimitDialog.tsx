import { useEffect, useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import type { BudgetLimit } from "@/hooks/useBudgetData";
import { DialogShell, Field, TextInput, RadioRow, CancelButton, PrimaryButton } from "./DialogShell";

const CATEGORIES = [
  { key: "Konut",     emoji: "🏠" },
  { key: "Yiyecek",   emoji: "🛒" },
  { key: "Ulasim",    emoji: "🚗" },
  { key: "Saglik",    emoji: "⚕️" },
  { key: "Eglence",   emoji: "🎬" },
  { key: "Abonelik",  emoji: "📺" },
  { key: "Giyim",     emoji: "👕" },
  { key: "Spor",      emoji: "⚽" },
  { key: "Cocuk",     emoji: "👶" },
  { key: "Diger",     emoji: "📦" },
] as const;

interface BudgetLimitDialogProps {
  open: boolean;
  onClose: () => void;
  entity?: BudgetLimit;
}

export function BudgetLimitDialog({ open, onClose, entity }: BudgetLimitDialogProps) {
  const { addBudgetLimit, updateBudgetLimit } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const isEdit = !!entity;

  const [category, setCategory] = useState<string>("Yiyecek");
  const [limit, setLimit] = useState("");
  const [owner, setOwner] = useState<"Benim" | "Esim" | "Ev">((currentPerson as "Benim" | "Esim" | null) ?? "Ev");

  useEffect(() => {
    if (!open) return;
    if (entity) {
      setCategory(entity.category);
      setLimit(String(entity.limit));
      setOwner(entity.owner);
    } else {
      setCategory("Yiyecek");
      setLimit("");
      setOwner((currentPerson as "Benim" | "Esim" | null) ?? "Ev");
    }
  }, [open, entity, currentPerson]);

  const numLimit = parseFloat(limit.replace(",", "."));
  const valid = Number.isFinite(numLimit) && numLimit > 0;

  const handleSave = () => {
    if (!valid) return;
    const payload: Omit<BudgetLimit, "id"> = { category, limit: numLimit, owner };
    if (isEdit && entity) updateBudgetLimit(entity.id, payload);
    else addBudgetLimit(payload);
    onClose();
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={isEdit ? "Bütçe Limitini Düzenle" : "Yeni Bütçe Limiti"}
      footer={<><CancelButton onClick={onClose} /><PrimaryButton onClick={handleSave} disabled={!valid}>Kaydet</PrimaryButton></>}
    >
      <Field label="Kategori">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => {
            const active = category === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 999,
                  fontSize: 12, fontWeight: 600,
                  background: active ? "var(--accent-green)" : "var(--bg-elevated)",
                  color: active ? "oklch(0.15 0.03 155)" : "var(--text-secondary)",
                  border: "1px solid " + (active ? "transparent" : "var(--border-faint)"),
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <span>{c.emoji}</span>
                <span>{c.key}</span>
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Kişi">
        <RadioRow
          value={owner}
          onChange={setOwner}
          options={[
            { value: "Benim", label: person1Name },
            { value: "Esim",  label: person2Name },
            { value: "Ev",    label: "Ev" },
          ]}
        />
      </Field>
      <Field label="Aylık Limit">
        <TextInput value={limit} onChange={setLimit} prefix="€" placeholder="0,00" type="number" step="0.01" min={0} autoFocus />
      </Field>
    </DialogShell>
  );
}
