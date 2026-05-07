import { useEffect, useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import type { Installment } from "@/hooks/useBudgetData";
import {
  DialogShell,
  Field,
  TextInput,
  TextAreaInput,
  RadioRow,
  CancelButton,
  PrimaryButton,
} from "./DialogShell";

interface InstallmentDialogProps {
  open: boolean;
  onClose: () => void;
  entity?: Installment;
}

const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export function InstallmentDialog({
  open,
  onClose,
  entity,
}: InstallmentDialogProps) {
  const { addInstallment, updateInstallment } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const isEdit = !!entity;

  const now = new Date();
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState("12");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [startYear, setStartYear] = useState(String(now.getFullYear()));
  const [startMonth, setStartMonth] = useState(String(now.getMonth() + 1));
  const [owner, setOwner] = useState<"Ev" | "Benim" | "Esim">(
    (currentPerson as "Benim" | "Esim" | null) ?? "Ev"
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (entity) {
      setName(entity.name);
      setTotalAmount(String(entity.totalAmount));
      setInstallmentCount(String(entity.installmentCount));
      setMonthlyAmount(String(entity.monthlyAmount));
      setStartYear(String(entity.startYear));
      setStartMonth(String(entity.startMonth));
      setOwner(entity.owner);
      setNotes(entity.notes ?? "");
    } else {
      setName("");
      setTotalAmount("");
      setInstallmentCount("12");
      setMonthlyAmount("");
      setStartYear(String(now.getFullYear()));
      setStartMonth(String(now.getMonth() + 1));
      setOwner((currentPerson as "Benim" | "Esim" | null) ?? "Ev");
      setNotes("");
    }
  }, [open, entity, currentPerson]);

  const numTotal = parseFloat(totalAmount.replace(",", "."));
  const numCount = parseInt(installmentCount, 10);
  const numMonthly = parseFloat(monthlyAmount.replace(",", "."));
  const numYear = parseInt(startYear, 10);
  const numMonth = parseInt(startMonth, 10);
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(numTotal) &&
    numTotal > 0 &&
    Number.isFinite(numCount) &&
    numCount > 0 &&
    Number.isFinite(numMonthly) &&
    numMonthly > 0 &&
    Number.isFinite(numYear) &&
    numYear >= 2000 &&
    Number.isFinite(numMonth) &&
    numMonth >= 1 &&
    numMonth <= 12;

  const handleSave = () => {
    if (!valid) return;
    const payload: Omit<Installment, "id"> = {
      name: name.trim(),
      totalAmount: numTotal,
      installmentCount: numCount,
      monthlyAmount: numMonthly,
      startYear: numYear,
      startMonth: numMonth,
      owner,
      notes,
    };
    if (isEdit && entity) updateInstallment(entity.id, payload);
    else addInstallment(payload);
    onClose();
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={isEdit ? "Taksiti Düzenle" : "Yeni Taksit Ekle"}
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
      <Field label="Taksit Adı">
        <TextInput
          value={name}
          onChange={setName}
          placeholder="Örn. Yeni Telefon"
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
            value={totalAmount}
            onChange={setTotalAmount}
            prefix="€"
            placeholder="0,00"
            type="number"
            step="0.01"
            min={0}
          />
        </Field>
        <Field label="Taksit Sayısı">
          <TextInput
            value={installmentCount}
            onChange={setInstallmentCount}
            placeholder="12"
            type="number"
            min={1}
          />
        </Field>
      </div>
      <Field label="Aylık Tutar">
        <TextInput
          value={monthlyAmount}
          onChange={setMonthlyAmount}
          prefix="€"
          placeholder="0,00"
          type="number"
          step="0.01"
          min={0}
        />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Başlangıç Ayı">
          <RadioRow
            value={numMonth}
            onChange={v => setStartMonth(String(v))}
            options={MONTHS_TR.map((label, i) => ({
              value: i + 1,
              label: label.slice(0, 3),
            }))}
          />
        </Field>
        <Field label="Yıl">
          <TextInput
            value={startYear}
            onChange={setStartYear}
            type="number"
            min={2000}
            max={2100}
          />
        </Field>
      </div>
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
