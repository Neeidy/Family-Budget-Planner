import { parseMoney } from "@/lib/format";
import { useEffect, useMemo, useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import type { Expense } from "@/hooks/useBudgetData";
import { CATEGORIES, getSubcategories } from "@shared/categories";
import {
  DialogShell,
  Field,
  TextInput,
  TextAreaInput,
  RadioRow,
  CancelButton,
  PrimaryButton,
} from "./DialogShell";
import { MoneyHint } from "@/components/design/MoneyHint";
import { getDefaults, rememberDefaults } from "@/lib/formDefaults";

interface ExpenseFormDefaults {
  owner?: "Benim" | "Esim" | "Ev";
  category?: string;
  subcategoryKey?: string;
  type?: "Sabit" | "Degisken" | "Borc" | "Birikim";
  status?: "Odendi" | "Bekliyor" | "Gecikti";
}

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  entity?: Expense;
}

export function ExpenseDialog({ open, onClose, entity }: ExpenseDialogProps) {
  const { addExpense, updateExpense } = useBudget();
  const { currentPerson, person1Name, person2Name } = usePerson();
  const isEdit = !!entity;

  const [category, setCategory] = useState("Yiyecek");
  const [subcategoryKey, setSubcategoryKey] = useState("Diger");
  const [customSubcategory, setCustomSubcategory] = useState("");
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

  // Available subcategories for the currently selected main category.
  const subcategories = useMemo(() => getSubcategories(category), [category]);

  useEffect(() => {
    if (!open) return;
    if (entity) {
      const subs = getSubcategories(entity.category);
      // Find an exact label match in the predefined list; otherwise
      // treat the legacy free-form subcategory as a custom "Diğer".
      const match = subs.find(
        s => s.label === entity.subcategory || s.key === entity.subcategory
      );
      setCategory(entity.category);
      if (match) {
        setSubcategoryKey(match.key);
        setCustomSubcategory("");
      } else {
        setSubcategoryKey("Diger");
        setCustomSubcategory(entity.subcategory || "");
      }
      setAmount(String(entity.amount));
      setType(entity.type);
      setStatus(entity.status);
      setOwner(entity.owner);
      setPaymentDay(entity.paymentDay ?? "");
      setNotes(entity.notes ?? "");
    } else {
      // Smart defaults: remember last add (owner/category/sub/type/status)
      const remembered = getDefaults<ExpenseFormDefaults>("expense");
      setCategory(remembered.category ?? "Yiyecek");
      setSubcategoryKey(remembered.subcategoryKey ?? "Market");
      setCustomSubcategory("");
      setAmount("");
      setType(remembered.type ?? "Degisken");
      setStatus(remembered.status ?? "Bekliyor");
      setOwner(
        remembered.owner ?? (currentPerson as "Benim" | "Esim" | null) ?? "Ev"
      );
      setPaymentDay("");
      setNotes("");
    }
  }, [open, entity, currentPerson]);

  // When category changes, reset subcategory to that category's first entry.
  useEffect(() => {
    if (!open) return;
    const subs = getSubcategories(category);
    if (subs.length === 0) return;
    if (!subs.some(s => s.key === subcategoryKey)) {
      setSubcategoryKey(subs[0].key);
      setCustomSubcategory("");
    }
  }, [category, open, subcategoryKey]);

  const resolvedSubcategoryLabel =
    subcategoryKey === "Diger" && customSubcategory.trim()
      ? customSubcategory.trim()
      : (subcategories.find(s => s.key === subcategoryKey)?.label ?? "Diğer");

  const numAmount = parseMoney(amount);
  const valid =
    Number.isFinite(numAmount) &&
    numAmount > 0 &&
    resolvedSubcategoryLabel.trim().length > 0;

  const handleSave = () => {
    if (!valid) return;
    const payload: Omit<Expense, "id"> = {
      category,
      subcategory: resolvedSubcategoryLabel,
      amount: numAmount,
      type,
      status,
      owner,
      paymentDay,
      notes,
    };
    if (isEdit && entity) updateExpense(entity.id, payload);
    else addExpense(payload);
    rememberDefaults<ExpenseFormDefaults>("expense", {
      owner: payload.owner,
      category: payload.category,
      subcategoryKey,
      type: payload.type,
      status: payload.status,
    });
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
        <select
          value={category}
          onChange={e => {
            setCategory(e.target.value);
            setSubcategoryKey("Diger");
            setCustomSubcategory("");
          }}
          style={{
            width: "100%",
            padding: "12px 14px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-faint)",
            borderRadius: 10,
            color: "var(--text-primary)",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        >
          {CATEGORIES.map(c => (
            <option key={c.key} value={c.key}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </Field>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: subcategoryKey === "Diger" ? "1fr 1fr" : "1fr",
          gap: 14,
        }}
      >
        <Field label="Alt Kategori">
          <select
            value={subcategoryKey}
            onChange={e => setSubcategoryKey(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border-faint)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          >
            {subcategories.map(s => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        {subcategoryKey === "Diger" && (
          <Field label="Özel isim">
            <TextInput
              value={customSubcategory}
              onChange={setCustomSubcategory}
              placeholder="Örn. Bisiklet bakımı"
              autoFocus
            />
          </Field>
        )}
      </div>
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
          <MoneyHint raw={amount} />
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
