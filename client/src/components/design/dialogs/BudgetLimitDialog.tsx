import { parseMoney } from "@/lib/format";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
import type { BudgetLimit } from "@/hooks/useBudgetData";
import { CATEGORIES } from "@shared/categories";
import {
  DialogShell,
  Field,
  TextInput,
  RadioRow,
  CancelButton,
  PrimaryButton,
} from "./DialogShell";
import { getDefaults, rememberDefaults } from "@/lib/formDefaults";
import { MoneyHint } from "@/components/design/MoneyHint";

interface BudgetLimitDialogProps {
  open: boolean;
  onClose: () => void;
  entity?: BudgetLimit;
}

export function BudgetLimitDialog({
  open,
  onClose,
  entity,
}: BudgetLimitDialogProps) {
  const { t } = useTranslation();
  const { addBudgetLimit, updateBudgetLimit } = useBudget();
  const { person1Name, person2Name, currentPerson } = usePerson();
  const isEdit = !!entity;

  const [category, setCategory] = useState<string>("Yiyecek");
  const [limit, setLimit] = useState("");
  const [owner, setOwner] = useState<"Benim" | "Esim" | "Ev">(
    (currentPerson as "Benim" | "Esim" | null) ?? "Ev"
  );

  useEffect(() => {
    if (!open) return;
    if (entity) {
      setCategory(entity.category);
      setLimit(String(entity.limit));
      setOwner(entity.owner);
    } else {
      setCategory("Yiyecek");
      setLimit("");
      const remembered = getDefaults<{
        owner?: "Benim" | "Esim" | "Ev";
        category?: string;
      }>("budgetLimit");
      setOwner(
        remembered.owner ?? (currentPerson as "Benim" | "Esim" | null) ?? "Ev"
      );
      if (remembered.category) setCategory(remembered.category);
    }
  }, [open, entity, currentPerson]);

  const numLimit = parseMoney(limit);
  const valid = Number.isFinite(numLimit) && numLimit > 0;

  const handleSave = () => {
    if (!valid) return;
    const payload: Omit<BudgetLimit, "id"> = {
      category,
      limit: numLimit,
      owner,
    };
    if (isEdit && entity) updateBudgetLimit(entity.id, payload);
    else addBudgetLimit(payload);
    rememberDefaults<{ owner?: "Benim" | "Esim" | "Ev"; category?: string }>(
      "budgetLimit",
      { owner: payload.owner, category: payload.category }
    );
    onClose();
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? t("dialog.budget_limit.title_edit")
          : t("dialog.budget_limit.title_add")
      }
      footer={
        <>
          <CancelButton onClick={onClose} />
          <PrimaryButton onClick={handleSave} disabled={!valid}>
            {t("common.save")}
          </PrimaryButton>
        </>
      }
    >
      <Field label={t("dialog.budget_limit.field.category")}>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
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
      <Field label={t("dialog.budget_limit.field.person")}>
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
      <Field label={t("dialog.budget_limit.field.limit")}>
        <TextInput
          value={limit}
          onChange={setLimit}
          prefix="€"
          placeholder="0,00"
          type="number"
          step="0.01"
          min={0}
          autoFocus
        />
        <MoneyHint raw={limit} />
      </Field>
    </DialogShell>
  );
}
