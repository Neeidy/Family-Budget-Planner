import { useEffect, useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import type { Income } from "@/hooks/useBudgetData";
import { DialogShell, Field, TextInput, RadioRow, CancelButton, PrimaryButton } from "./DialogShell";

interface IncomeDialogProps {
  open: boolean;
  onClose: () => void;
  entity?: Income;
}

const todayISO = () => new Date().toISOString().split("T")[0];

export function IncomeDialog({ open, onClose, entity }: IncomeDialogProps) {
  const { addIncome, updateIncome } = useBudget();
  const { currentPerson, person1Name, person2Name } = usePerson();
  const isEdit = !!entity;

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [owner, setOwner] = useState<"Benim" | "Esim">(currentPerson ?? "Benim");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (entity) {
      setName(entity.name);
      setAmount(String(entity.amount));
      setOwner(entity.owner);
      setDate(entity.date || todayISO());
      setNotes(entity.notes ?? "");
    } else {
      setName("");
      setAmount("");
      setOwner(currentPerson ?? "Benim");
      setDate(todayISO());
      setNotes("");
    }
  }, [open, entity, currentPerson]);

  const numAmount = parseFloat(amount.replace(",", "."));
  const valid = name.trim().length > 0 && Number.isFinite(numAmount) && numAmount > 0;

  const handleSave = () => {
    if (!valid) return;
    const payload = { name: name.trim(), amount: numAmount, owner, date, notes };
    if (isEdit && entity) updateIncome(entity.id, payload);
    else addIncome(payload);
    onClose();
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={isEdit ? "Geliri Düzenle" : "Yeni Gelir Ekle"}
      footer={<><CancelButton onClick={onClose} /><PrimaryButton onClick={handleSave} disabled={!valid}>Kaydet</PrimaryButton></>}
    >
      <Field label="Kişi">
        <RadioRow
          value={owner}
          onChange={setOwner}
          options={[
            { value: "Benim", label: person1Name },
            { value: "Esim",  label: person2Name },
          ]}
        />
      </Field>
      <Field label="Gelir Adı">
        <TextInput value={name} onChange={setName} placeholder="Örn. Maaş, Yan Gelir" autoFocus />
      </Field>
      <Field label="Miktar">
        <TextInput value={amount} onChange={setAmount} prefix="€" placeholder="0,00" type="number" step="0.01" min={0} />
      </Field>
      <Field label="Tarih">
        <TextInput value={date} onChange={setDate} type="date" />
      </Field>
    </DialogShell>
  );
}
