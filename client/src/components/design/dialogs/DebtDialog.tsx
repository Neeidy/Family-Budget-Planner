import { useEffect, useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import type { Debt } from "@/hooks/useBudgetData";
import {
  DialogShell,
  Field,
  TextInput,
  TextAreaInput,
  RadioRow,
  CancelButton,
  PrimaryButton,
} from "./DialogShell";

interface DebtDialogProps {
  open: boolean;
  onClose: () => void;
  entity?: Debt;
}

const todayPlusYearISO = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
};

export function DebtDialog({ open, onClose, entity }: DebtDialogProps) {
  const { addDebt, updateDebt } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const isEdit = !!entity;

  const [name, setName] = useState("");
  const [totalDebt, setTotalDebt] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [dueDate, setDueDate] = useState(todayPlusYearISO());
  const [status, setStatus] = useState<"Odendi" | "Bekliyor" | "Gecikti">(
    "Bekliyor"
  );
  const [owner, setOwner] = useState<"Benim" | "Esim" | "Ev">(
    (currentPerson as "Benim" | "Esim" | null) ?? "Ev"
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (entity) {
      setName(entity.name);
      setTotalDebt(String(entity.totalDebt));
      setMonthlyPayment(String(entity.monthlyPayment));
      setDueDate(entity.dueDate || todayPlusYearISO());
      setStatus(entity.status);
      setOwner(entity.owner);
      setNotes(entity.notes ?? "");
    } else {
      setName("");
      setTotalDebt("");
      setMonthlyPayment("");
      setDueDate(todayPlusYearISO());
      setStatus("Bekliyor");
      setOwner((currentPerson as "Benim" | "Esim" | null) ?? "Ev");
      setNotes("");
    }
  }, [open, entity, currentPerson]);

  const numTotal = parseFloat(totalDebt.replace(",", "."));
  const numMonthly = parseFloat(monthlyPayment.replace(",", "."));
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(numTotal) &&
    numTotal > 0 &&
    Number.isFinite(numMonthly) &&
    numMonthly > 0;

  const handleSave = () => {
    if (!valid) return;
    const payload: Omit<Debt, "id"> = {
      name: name.trim(),
      totalDebt: numTotal,
      monthlyPayment: numMonthly,
      dueDate,
      status,
      owner,
      notes,
    };
    if (isEdit && entity) updateDebt(entity.id, payload);
    else addDebt(payload);
    onClose();
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={isEdit ? "Borcu Düzenle" : "Yeni Borç Ekle"}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <PrimaryButton onClick={handleSave} disabled={!valid}>
            Kaydet
          </PrimaryButton>
        </>
      }
    >
      <Field label="Borç Adı">
        <TextInput
          value={name}
          onChange={setName}
          placeholder="Örn. Kredi Kartı"
          autoFocus
        />
      </Field>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Toplam Tutar">
          <TextInput
            value={totalDebt}
            onChange={setTotalDebt}
            prefix="€"
            placeholder="0,00"
            type="number"
            step="0.01"
            min={0}
          />
        </Field>
        <Field label="Aylık Ödeme">
          <TextInput
            value={monthlyPayment}
            onChange={setMonthlyPayment}
            prefix="€"
            placeholder="0,00"
            type="number"
            step="0.01"
            min={0}
          />
        </Field>
      </div>
      <Field label="Vade">
        <TextInput value={dueDate} onChange={setDueDate} type="date" />
      </Field>
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
