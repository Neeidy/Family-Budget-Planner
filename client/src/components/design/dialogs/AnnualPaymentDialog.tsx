import { parseMoney } from "@/lib/format";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/contexts/BudgetContext";
import { usePerson } from "@/contexts/PersonContext";
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
import { MoneyHint } from "@/components/design/MoneyHint";
import { CATEGORIES, getSubcategories } from "@shared/categories";
import { getDefaults, rememberDefaults } from "@/lib/formDefaults";

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

interface AnnualPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  entity?: AnnualPayment;
}

type AnnualOwner = "Benim" | "Esim" | "Ev";

export function AnnualPaymentDialog({
  open,
  onClose,
  entity,
}: AnnualPaymentDialogProps) {
  const { t } = useTranslation();
  const { addAnnualPayment, updateAnnualPayment } = useBudget();
  const { person1Name, person2Name } = usePerson();
  const isEdit = !!entity;

  const now = new Date();
  const todayISO = now.toISOString().split("T")[0];
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMonth, setPaymentMonth] = useState(now.getMonth() + 1);
  const [paymentDay, setPaymentDay] = useState("");
  const [lastPaymentDate, setLastPaymentDate] = useState(todayISO);
  const [notes, setNotes] = useState("");
  const [owner, setOwner] = useState<AnnualOwner>("Ev");
  const [category, setCategory] = useState<string>("Diger");
  const [subcategoryKey, setSubcategoryKey] = useState<string>("Diger");
  const [customSubcategory, setCustomSubcategory] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    if (entity) {
      setName(entity.name);
      setAmount(String(entity.amount));
      setPaymentMonth(entity.paymentMonth);
      setPaymentDay(entity.paymentDay ? String(entity.paymentDay) : "");
      setLastPaymentDate(entity.lastPaymentDate || todayISO);
      setNotes(entity.notes ?? "");
      setOwner((entity.owner as AnnualOwner) ?? "Ev");
      setCategory(entity.category ?? "Diger");
      setSubcategoryKey(entity.subcategoryKey ?? "Diger");
      setCustomSubcategory(entity.customSubcategory ?? "");
    } else {
      const r = getDefaults<{
        owner?: AnnualOwner;
        category?: string;
        subcategoryKey?: string;
      }>("annual");
      setName("");
      setAmount("");
      setPaymentMonth(now.getMonth() + 1);
      setPaymentDay("");
      setLastPaymentDate(todayISO);
      setNotes("");
      setOwner(r.owner ?? "Ev");
      setCategory(r.category ?? "Diger");
      setSubcategoryKey(r.subcategoryKey ?? "Diger");
      setCustomSubcategory("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entity]);

  const numAmount = parseMoney(amount);
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

  const subcategories = getSubcategories(category);

  const handleSave = () => {
    if (!valid) return;
    const payload: Omit<AnnualPayment, "id"> = {
      name: name.trim(),
      amount: numAmount,
      paymentMonth,
      paymentDay: numPaymentDay,
      lastPaymentDate,
      notes,
      owner,
      category,
      subcategoryKey,
      customSubcategory:
        subcategoryKey === "Diger" ? customSubcategory.trim() : "",
    };
    if (isEdit && entity) updateAnnualPayment(entity.id, payload);
    else addAnnualPayment(payload);
    rememberDefaults<{
      owner?: AnnualOwner;
      category?: string;
      subcategoryKey?: string;
    }>("annual", { owner, category, subcategoryKey });
    onClose();
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "var(--r-md)",
    border: "1px solid var(--border-faint)",
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    fontSize: 14,
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={
        isEdit ? t("dialog.annual.title_edit") : t("dialog.annual.title_add")
      }
      width={520}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <PrimaryButton onClick={handleSave} disabled={!valid}>
            {t("common.save")}
          </PrimaryButton>
        </>
      }
    >
      <Field label={t("dialog.annual.field.name")}>
        <TextInput
          value={name}
          onChange={setName}
          placeholder={t("dialog.annual.name_placeholder")}
          autoFocus
        />
      </Field>
      <Field label={t("dialog.annual.field.amount")}>
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
      <Field label={t("dialog.annual.field.category")}>
        <select
          value={category}
          onChange={e => {
            setCategory(e.target.value);
            setSubcategoryKey("Diger");
            setCustomSubcategory("");
          }}
          style={selectStyle}
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
        <Field label={t("dialog.annual.field.subcategory")}>
          <select
            value={subcategoryKey}
            onChange={e => setSubcategoryKey(e.target.value)}
            style={selectStyle}
          >
            {subcategories.length === 0 ? (
              <option value="Diger">{t("dialog.common.other")}</option>
            ) : (
              subcategories.map(s => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))
            )}
          </select>
        </Field>
        {subcategoryKey === "Diger" && (
          <Field label={t("dialog.common.custom_name")}>
            <TextInput
              value={customSubcategory}
              onChange={setCustomSubcategory}
              placeholder={t("dialog.common.custom_placeholder")}
            />
          </Field>
        )}
      </div>
      <Field
        label={t("dialog.annual.field.payment_month")}
        hint={t("dialog.annual.payment_month_hint")}
      >
        <RadioRow
          value={paymentMonth}
          onChange={v => setPaymentMonth(v)}
          options={MONTH_SHORT_KEYS.map((key, i) => ({
            value: i + 1,
            label: t(`month.short.${key}`),
          }))}
        />
      </Field>
      <Field
        label={`${t("dialog.annual.field.payment_day")} ${t("common.optional")}`}
        hint={t("dialog.annual.payment_day_hint")}
      >
        <TextInput
          value={paymentDay}
          onChange={setPaymentDay}
          placeholder={t("dialog.annual.payment_day_placeholder")}
          type="number"
          min={1}
          max={31}
        />
      </Field>
      <Field
        label={t("dialog.annual.field.last_payment")}
        hint={t("dialog.annual.last_payment_hint")}
      >
        <TextInput
          value={lastPaymentDate}
          onChange={setLastPaymentDate}
          type="date"
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
