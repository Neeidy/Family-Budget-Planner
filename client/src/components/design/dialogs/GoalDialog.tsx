import { useEffect, useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import type { SavingsGoal } from "@/hooks/useBudgetData";
import { DialogShell, Field, TextInput, TextAreaInput, RadioRow, CancelButton, PrimaryButton } from "./DialogShell";

interface GoalDialogProps {
  open: boolean;
  onClose: () => void;
  entity?: SavingsGoal;
}

const fourMonthsLaterISO = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 4);
  return d.toISOString().split("T")[0];
};

export function GoalDialog({ open, onClose, entity }: GoalDialogProps) {
  const { addSavingsGoal, updateSavingsGoal } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const isEdit = !!entity;

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [monthlyAllocation, setMonthlyAllocation] = useState("");
  const [targetDate, setTargetDate] = useState(fourMonthsLaterISO());
  const [owner, setOwner] = useState<"Benim" | "Esim" | "Ev">((currentPerson as "Benim" | "Esim" | null) ?? "Ev");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (entity) {
      setName(entity.name);
      setTargetAmount(String(entity.targetAmount));
      setCurrentAmount(String(entity.currentAmount));
      setMonthlyAllocation(String(entity.monthlyAllocation));
      setTargetDate(entity.targetDate || fourMonthsLaterISO());
      setOwner(entity.owner);
      setNotes(entity.notes ?? "");
    } else {
      setName("");
      setTargetAmount("");
      setCurrentAmount("0");
      setMonthlyAllocation("");
      setTargetDate(fourMonthsLaterISO());
      setOwner((currentPerson as "Benim" | "Esim" | null) ?? "Ev");
      setNotes("");
    }
  }, [open, entity, currentPerson]);

  const numTarget = parseFloat(targetAmount.replace(",", "."));
  const numCurrent = parseFloat(currentAmount.replace(",", "."));
  const numMonthly = parseFloat(monthlyAllocation.replace(",", "."));
  const valid = name.trim().length > 0 && Number.isFinite(numTarget) && numTarget > 0;

  const handleSave = () => {
    if (!valid) return;
    const payload: Omit<SavingsGoal, "id"> = {
      name: name.trim(),
      targetAmount: numTarget,
      currentAmount: Number.isFinite(numCurrent) ? numCurrent : 0,
      monthlyAllocation: Number.isFinite(numMonthly) ? numMonthly : 0,
      targetDate,
      owner,
      notes,
    };
    if (isEdit && entity) updateSavingsGoal(entity.id, payload);
    else addSavingsGoal(payload);
    onClose();
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={isEdit ? "Hedefi Düzenle" : "Yeni Hedef Ekle"}
      width={540}
      footer={<><CancelButton onClick={onClose} /><PrimaryButton onClick={handleSave} disabled={!valid}>Kaydet</PrimaryButton></>}
    >
      <Field label="Hedef Adı">
        <TextInput value={name} onChange={setName} placeholder="Örn. Tatil, Yeni Araç" autoFocus />
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Hedef Tutar">
          <TextInput value={targetAmount} onChange={setTargetAmount} prefix="€" placeholder="0,00" type="number" step="0.01" min={0} />
        </Field>
        <Field label="Mevcut Tutar">
          <TextInput value={currentAmount} onChange={setCurrentAmount} prefix="€" placeholder="0,00" type="number" step="0.01" min={0} />
        </Field>
      </div>
      <Field label="Aylık Eklenecek">
        <TextInput value={monthlyAllocation} onChange={setMonthlyAllocation} prefix="€" placeholder="0,00" type="number" step="0.01" min={0} />
      </Field>
      <Field label="Hedef Tarih">
        <TextInput value={targetDate} onChange={setTargetDate} type="date" />
      </Field>
      <Field label="Notlar (opsiyonel)">
        <TextAreaInput value={notes} onChange={setNotes} placeholder="Ek bilgi…" />
      </Field>
    </DialogShell>
  );
}
