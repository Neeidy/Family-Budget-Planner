import { parseMoney } from "@/lib/format";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { getDefaults, rememberDefaults } from "@/lib/formDefaults";
import { MoneyHint } from "@/components/design/MoneyHint";

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
  const { t } = useTranslation();
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
      setMonthlyPayment(
        entity.monthlyPayment > 0 ? String(entity.monthlyPayment) : ""
      );
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
      const remembered = getDefaults<{ owner?: "Benim" | "Esim" | "Ev" }>(
        "debt"
      );
      setOwner(
        remembered.owner ?? (currentPerson as "Benim" | "Esim" | null) ?? "Ev"
      );
      setNotes("");
    }
  }, [open, entity, currentPerson]);

  const numTotal = parseMoney(totalDebt);
  const numMonthly = parseMoney(monthlyPayment);
  const valid =
    name.trim().length > 0 && Number.isFinite(numTotal) && numTotal > 0;

  const monthlyPaymentForSave =
    Number.isFinite(numMonthly) && numMonthly >= 0 ? numMonthly : 0;

  const handleSave = () => {
    if (!valid) return;
    const payload: Omit<Debt, "id"> = {
      name: name.trim(),
      totalDebt: numTotal,
      monthlyPayment: monthlyPaymentForSave,
      dueDate,
      status,
      owner,
      notes,
    };
    if (isEdit && entity) updateDebt(entity.id, payload);
    else addDebt(payload);
    rememberDefaults<{ owner?: "Benim" | "Esim" | "Ev" }>("debt", {
      owner: payload.owner,
    });
    onClose();
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={isEdit ? t("dialog.debt.title_edit") : t("dialog.debt.title_add")}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <PrimaryButton onClick={handleSave} disabled={!valid}>
            {t("common.save")}
          </PrimaryButton>
        </>
      }
    >
      <Field label={t("dialog.debt.field.name")}>
        <TextInput
          value={name}
          onChange={setName}
          placeholder={t("dialog.debt.name_placeholder")}
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
        <Field label={t("dialog.debt.field.total_debt")}>
          <TextInput
            value={totalDebt}
            onChange={setTotalDebt}
            prefix="€"
            placeholder="0,00"
            type="number"
            step="0.01"
            min={0}
          />
          <MoneyHint raw={totalDebt} />
        </Field>
        <Field
          label={`${t("dialog.debt.field.monthly_payment")} ${t("common.optional")}`}
        >
          <TextInput
            value={monthlyPayment}
            onChange={setMonthlyPayment}
            prefix="€"
            placeholder="0,00"
            type="number"
            step="0.01"
            min={0}
          />
          <MoneyHint raw={monthlyPayment} />
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            {t("dialog.debt.monthly_hint")}
          </div>
        </Field>
      </div>
      <Field label={t("dialog.debt.field.due_date")}>
        <TextInput value={dueDate} onChange={setDueDate} type="date" />
      </Field>
      <Field label={t("dialog.debt.field.status")}>
        <RadioRow
          value={status}
          onChange={setStatus}
          options={[
            { value: "Odendi", label: t("status.paid") },
            { value: "Bekliyor", label: t("status.pending") },
            { value: "Gecikti", label: t("status.overdue") },
          ]}
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
