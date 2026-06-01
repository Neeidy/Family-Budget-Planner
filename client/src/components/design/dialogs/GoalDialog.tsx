import { parseMoney } from "@/lib/format";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import type { SavingsGoal } from "@/hooks/useBudgetData";
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
  const { t } = useTranslation();
  const { addSavingsGoal, updateSavingsGoal } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const isEdit = !!entity;

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [monthlyAllocation, setMonthlyAllocation] = useState("");
  const [targetDate, setTargetDate] = useState(fourMonthsLaterISO());
  const [owner, setOwner] = useState<"Benim" | "Esim" | "Ev">(
    (currentPerson as "Benim" | "Esim" | null) ?? "Ev"
  );
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
      const remembered = getDefaults<{ owner?: "Benim" | "Esim" | "Ev" }>(
        "goal"
      );
      setOwner(
        remembered.owner ?? (currentPerson as "Benim" | "Esim" | null) ?? "Ev"
      );
      setNotes("");
    }
  }, [open, entity, currentPerson]);

  const numTarget = parseMoney(targetAmount);
  const numCurrent = parseMoney(currentAmount);
  const numMonthly = parseMoney(monthlyAllocation);
  const valid =
    name.trim().length > 0 && Number.isFinite(numTarget) && numTarget > 0;

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
    rememberDefaults<{ owner?: "Benim" | "Esim" | "Ev" }>("goal", {
      owner: payload.owner,
    });
    onClose();
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={isEdit ? t("dialog.goal.title_edit") : t("dialog.goal.title_add")}
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
      <Field label={t("dialog.goal.field.name")}>
        <TextInput
          value={name}
          onChange={setName}
          placeholder={t("dialog.goal.name_placeholder")}
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
        <Field label={t("dialog.goal.field.target_amount")}>
          <TextInput
            value={targetAmount}
            onChange={setTargetAmount}
            prefix="€"
            placeholder="0,00"
            type="number"
            step="0.01"
            min={0}
          />
          <MoneyHint raw={targetAmount} />
        </Field>
        <Field label={t("dialog.goal.field.current_amount")}>
          <TextInput
            value={currentAmount}
            onChange={setCurrentAmount}
            prefix="€"
            placeholder="0,00"
            type="number"
            step="0.01"
            min={0}
          />
          <MoneyHint raw={currentAmount} />
        </Field>
      </div>
      <Field label={t("dialog.goal.field.monthly_allocation")}>
        <TextInput
          value={monthlyAllocation}
          onChange={setMonthlyAllocation}
          prefix="€"
          placeholder="0,00"
          type="number"
          step="0.01"
          min={0}
        />
        <MoneyHint raw={monthlyAllocation} />
      </Field>
      <Field label={t("dialog.goal.field.target_date")}>
        <TextInput value={targetDate} onChange={setTargetDate} type="date" />
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
