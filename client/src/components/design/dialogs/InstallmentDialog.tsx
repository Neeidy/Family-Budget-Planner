import { parseMoney } from "@/lib/format";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { getDefaults, rememberDefaults } from "@/lib/formDefaults";
import { MoneyHint } from "@/components/design/MoneyHint";

interface InstallmentDialogProps {
  open: boolean;
  onClose: () => void;
  entity?: Installment;
}

const MONTH_SHORT_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

export function InstallmentDialog({
  open,
  onClose,
  entity,
}: InstallmentDialogProps) {
  const { t } = useTranslation();
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
  const [paymentDay, setPaymentDay] = useState("");
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
      setPaymentDay(entity.paymentDay ? String(entity.paymentDay) : "");
      setOwner(entity.owner);
      setNotes(entity.notes ?? "");
    } else {
      setName("");
      setTotalAmount("");
      setInstallmentCount("12");
      setMonthlyAmount("");
      setStartYear(String(now.getFullYear()));
      setStartMonth(String(now.getMonth() + 1));
      setPaymentDay("");
      const remembered = getDefaults<{ owner?: "Ev" | "Benim" | "Esim" }>(
        "installment"
      );
      setOwner(
        remembered.owner ?? (currentPerson as "Benim" | "Esim" | null) ?? "Ev"
      );
      setNotes("");
    }
  }, [open, entity, currentPerson]);

  const numTotal = parseMoney(totalAmount);
  const numCount = parseInt(installmentCount, 10);
  const numMonthly = parseMoney(monthlyAmount);
  const numYear = parseInt(startYear, 10);
  const numMonth = parseInt(startMonth, 10);
  const numPaymentDay =
    paymentDay.trim() === "" ? undefined : parseInt(paymentDay, 10);
  const paymentDayValid =
    numPaymentDay === undefined ||
    (Number.isFinite(numPaymentDay) &&
      numPaymentDay >= 1 &&
      numPaymentDay <= 31);
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
    numMonth <= 12 &&
    paymentDayValid;

  const handleSave = () => {
    if (!valid) return;
    const payload: Omit<Installment, "id"> = {
      name: name.trim(),
      totalAmount: numTotal,
      installmentCount: numCount,
      monthlyAmount: numMonthly,
      startYear: numYear,
      startMonth: numMonth,
      paymentDay: numPaymentDay,
      owner,
      notes,
    };
    if (isEdit && entity) updateInstallment(entity.id, payload);
    else addInstallment(payload);
    rememberDefaults<{ owner?: "Ev" | "Benim" | "Esim" }>("installment", {
      owner: payload.owner,
    });
    onClose();
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? t("dialog.installment.title_edit")
          : t("dialog.installment.title_add")
      }
      width={540}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <PrimaryButton onClick={handleSave} disabled={!valid}>
            {t("common.save")}
          </PrimaryButton>
        </>
      }
    >
      <Field label={t("dialog.installment.field.name")}>
        <TextInput
          value={name}
          onChange={setName}
          placeholder={t("dialog.installment.name_placeholder")}
          autoFocus
        />
      </Field>
      <Field label={t("dialog.common.person")}>
        <RadioRow
          value={owner}
          onChange={setOwner}
          options={[
            { value: "Benim", label: person1Name },
            { value: "Esim", label: person2Name },
            { value: "Ev", label: t("dialog.common.home") },
          ]}
        />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label={t("dialog.installment.field.total_amount")}>
          <TextInput
            value={totalAmount}
            onChange={setTotalAmount}
            prefix="€"
            placeholder="0,00"
            type="number"
            step="0.01"
            min={0}
          />
          <MoneyHint raw={totalAmount} />
        </Field>
        <Field label={t("dialog.installment.field.count")}>
          <TextInput
            value={installmentCount}
            onChange={setInstallmentCount}
            placeholder={t("dialog.installment.count_placeholder")}
            type="number"
            min={1}
          />
        </Field>
      </div>
      <Field label={t("dialog.installment.field.monthly_amount")}>
        <TextInput
          value={monthlyAmount}
          onChange={setMonthlyAmount}
          prefix="€"
          placeholder="0,00"
          type="number"
          step="0.01"
          min={0}
        />
        <MoneyHint raw={monthlyAmount} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label={t("dialog.installment.field.start_month")}>
          <RadioRow
            value={numMonth}
            onChange={v => setStartMonth(String(v))}
            options={MONTH_SHORT_KEYS.map((key, i) => ({
              value: i + 1,
              label: t(`month.short.${key}`),
            }))}
          />
        </Field>
        <Field label={t("dialog.installment.field.start_year")}>
          <TextInput
            value={startYear}
            onChange={setStartYear}
            type="number"
            min={2000}
            max={2100}
          />
        </Field>
      </div>
      <Field
        label={`${t("dialog.installment.field.payment_day")} ${t("common.optional")}`}
      >
        <TextInput
          value={paymentDay}
          onChange={setPaymentDay}
          placeholder={t("dialog.installment.payment_day_placeholder")}
          type="number"
          min={1}
          max={31}
        />
      </Field>
      <Field label={t("dialog.common.notes_optional")}>
        <TextAreaInput
          value={notes}
          onChange={setNotes}
          placeholder={t("dialog.common.notes_placeholder")}
        />
      </Field>
    </DialogShell>
  );
}
