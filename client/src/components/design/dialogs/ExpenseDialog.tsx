import { useEffect, useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import type { Expense } from "@/hooks/useBudgetData";
import {
  DialogShell,
  Field,
  TextInput,
  TextAreaInput,
  RadioRow,
  CancelButton,
  PrimaryButton,
} from "./DialogShell";

const CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: "Konut", label: "Konut", emoji: "🏠" },
  { key: "Yiyecek", label: "Yiyecek", emoji: "🛒" },
  { key: "Ulasim", label: "Ulaşım", emoji: "🚗" },
  { key: "Saglik", label: "Sağlık", emoji: "⚕️" },
  { key: "Eglence", label: "Eğlence", emoji: "🎬" },
  { key: "Abonelik", label: "Abonelik", emoji: "📺" },
  { key: "Giyim", label: "Giyim", emoji: "👕" },
  { key: "Spor", label: "Spor", emoji: "⚽" },
  { key: "Porsuk", label: "Porsuk", emoji: "🐈" },
  { key: "Diger", label: "Diğer", emoji: "📦" },
];

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  entity?: Expense;
}

export function ExpenseDialog({ open, onClose, entity }: ExpenseDialogProps) {
  const { addExpense, updateExpense } = useBudget();
  const { currentPerson, person1Name, person2Name } = usePerson();
  const isEdit = !!entity;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Yiyecek");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"Sabit" | "Degisken" | "Borc" | "Birikim">(
    "Degisken"
  );
  const [status, setStatus] = useState<"Odendi" | "Bekliyor" | "Gecikti">(
    "Bekliyor"
  );
  const [owner, setOwner] = useState<"Ev" | "Benim" | "Esim">(
    (currentPerson as "Benim" | "Esim" | null) ?? "Ev"
  );
  const [paymentDay, setPaymentDay] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (entity) {
      setName(entity.subcategory || entity.category);
      setCategory(entity.category);
      setAmount(String(entity.amount));
      setType(entity.type);
      setStatus(entity.status);
      setOwner(entity.owner);
      setPaymentDay(entity.paymentDay ?? "");
      setNotes(entity.notes ?? "");
    } else {
      setName("");
      setCategory("Yiyecek");
      setAmount("");
      setType("Degisken");
      setStatus("Bekliyor");
      setOwner((currentPerson as "Benim" | "Esim" | null) ?? "Ev");
      setPaymentDay("");
      setNotes("");
    }
  }, [open, entity, currentPerson]);

  const numAmount = parseFloat(amount.replace(",", "."));
  const valid =
    name.trim().length > 0 && Number.isFinite(numAmount) && numAmount > 0;

  const handleSave = () => {
    if (!valid) return;
    const payload: Omit<Expense, "id"> = {
      category,
      subcategory: name.trim(),
      amount: numAmount,
      type,
      status,
      owner,
      paymentDay,
      notes,
    };
    if (isEdit && entity) updateExpense(entity.id, payload);
    else addExpense(payload);
    onClose();
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={isEdit ? "Gideri Düzenle" : "Yeni Gider Ekle"}
      width={540}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <PrimaryButton onClick={handleSave} disabled={!valid}>
            Kaydet
          </PrimaryButton>
        </>
      }
    >
      <Field label="Kişi">
        <RadioRow
          value={owner}
          onChange={setOwner}
          options={[
            { value: "Benim", label: person1Name },
            { value: "Esim", label: person2Name },
            { value: "Ev", label: "Ev" },
          ]}
        />
      </Field>
      <Field label="Kategori">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => {
            const active = category === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  background: active
                    ? "var(--accent-green)"
                    : "var(--bg-elevated)",
                  color: active
                    ? "oklch(0.15 0.03 155)"
                    : "var(--text-secondary)",
                  border:
                    "1px solid " +
                    (active ? "transparent" : "var(--border-faint)"),
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <span>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Gider Adı">
        <TextInput
          value={name}
          onChange={setName}
          placeholder="Örn. Market"
          autoFocus
        />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Tip">
          <RadioRow
            value={type}
            onChange={setType}
            options={[
              { value: "Sabit", label: "Sabit" },
              { value: "Degisken", label: "Değişken" },
            ]}
          />
        </Field>
        <Field label="Miktar">
          <TextInput
            value={amount}
            onChange={setAmount}
            prefix="€"
            placeholder="0,00"
            type="number"
            step="0.01"
            min={0}
          />
        </Field>
      </div>
      <Field label="Durum">
        <RadioRow
          value={status}
          onChange={setStatus}
          options={[
            { value: "Odendi", label: "Ödendi" },
            { value: "Bekliyor", label: "Bekliyor" },
            { value: "Gecikti", label: "Gecikti" },
          ]}
        />
      </Field>
      <Field label="Ödeme Günü (opsiyonel)">
        <TextInput
          value={paymentDay}
          onChange={setPaymentDay}
          placeholder="Örn. 15"
        />
      </Field>
      <Field label="Notlar (opsiyonel)">
        <TextAreaInput
          value={notes}
          onChange={setNotes}
          placeholder="Ek bilgi…"
        />
      </Field>
    </DialogShell>
  );
}
