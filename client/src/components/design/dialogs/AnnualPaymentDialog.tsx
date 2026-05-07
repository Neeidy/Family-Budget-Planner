import { useEffect, useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import type { AnnualPayment } from "@/hooks/useBudgetData";
import {
  DialogShell,
  Field,
  TextInput,
  TextAreaInput,
  RadioRow,
  CancelButton,
  PrimaryButton,
} from "./DialogShell";

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

interface AnnualPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  entity?: AnnualPayment;
}

export function AnnualPaymentDialog({
  open,
  onClose,
  entity,
}: AnnualPaymentDialogProps) {
  const { addAnnualPayment, updateAnnualPayment } = useBudget();
  const isEdit = !!entity;

  const now = new Date();
  const todayISO = now.toISOString().split("T")[0];
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMonth, setPaymentMonth] = useState(now.getMonth() + 1);
  const [paymentDay, setPaymentDay] = useState("");
  const [lastPaymentDate, setLastPaymentDate] = useState(todayISO);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (entity) {
      setName(entity.name);
      setAmount(String(entity.amount));
      setPaymentMonth(entity.paymentMonth);
      setPaymentDay(entity.paymentDay ? String(entity.paymentDay) : "");
      setLastPaymentDate(entity.lastPaymentDate || todayISO);
      setNotes(entity.notes ?? "");
    } else {
      setName("");
      setAmount("");
      setPaymentMonth(now.getMonth() + 1);
      setPaymentDay("");
      setLastPaymentDate(todayISO);
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entity]);

  const numAmount = parseFloat(amount.replace(",", "."));
  const numPaymentDay =
    paymentDay.trim() === "" ? undefined : parseInt(paymentDay, 10);
  const paymentDayValid =
    numPaymentDay === undefined ||
    (Number.isFinite(numPaymentDay) &&
      numPaymentDay >= 1 &&
      numPaymentDay <= 31);
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(numAmount) &&
    numAmount > 0 &&
    paymentDayValid;

  const handleSave = () => {
    if (!valid) return;
    const payload: Omit<AnnualPayment, "id"> = {
      name: name.trim(),
      amount: numAmount,
      paymentMonth,
      paymentDay: numPaymentDay,
      lastPaymentDate,
      notes,
    };
    if (isEdit && entity) updateAnnualPayment(entity.id, payload);
    else addAnnualPayment(payload);
    onClose();
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={isEdit ? "Yıllık Ödemeyi Düzenle" : "Yeni Yıllık Ödeme"}
      width={520}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <PrimaryButton onClick={handleSave} disabled={!valid}>
            Kaydet
          </PrimaryButton>
        </>
      }
    >
      <Field label="Ödeme Adı">
        <TextInput
          value={name}
          onChange={setName}
          placeholder="Örn. Vergi, Sigorta yenileme"
          autoFocus
        />
      </Field>
      <Field label="Tutar">
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
      <Field label="Ödeme Ayı">
        <RadioRow
          value={paymentMonth}
          onChange={v => setPaymentMonth(v)}
          options={MONTHS_TR.map((label, i) => ({
            value: i + 1,
            label: label.slice(0, 3),
          }))}
        />
      </Field>
      <Field label="Ödeme Günü (opsiyonel)">
        <TextInput
          value={paymentDay}
          onChange={setPaymentDay}
          placeholder="Örn: 15 (1–31)"
          type="number"
          min={1}
          max={31}
        />
      </Field>
      <Field label="Son Ödeme Tarihi">
        <TextInput
          value={lastPaymentDate}
          onChange={setLastPaymentDate}
          type="date"
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
