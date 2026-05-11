import { parseMoney } from "@/lib/format";
import { useEffect, useState } from "react";
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

type AnnualOwner = "Benim" | "Esim" | "Ev";

export function AnnualPaymentDialog({
  open,
  onClose,
  entity,
}: AnnualPaymentDialogProps) {
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
        <MoneyHint raw={amount} />
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
      <Field label="Kategori">
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
          gridTemplateColumns:
            subcategoryKey === "Diger" ? "1fr 1fr" : "1fr",
          gap: 14,
        }}
      >
        <Field label="Alt Kategori">
          <select
            value={subcategoryKey}
            onChange={e => setSubcategoryKey(e.target.value)}
            style={selectStyle}
          >
            {subcategories.length === 0 ? (
              <option value="Diger">Diğer</option>
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
          <Field label="Özel isim">
            <TextInput
              value={customSubcategory}
              onChange={setCustomSubcategory}
              placeholder="Örn. Bisiklet bakımı"
            />
          </Field>
        )}
      </div>
      <Field
        label="Her Yıl Ödeme Ayı"
        hint="Bu kalem her yıl bu ayda ödenmeye devam eder (örn. araba sigortası Mart)."
      >
        <RadioRow
          value={paymentMonth}
          onChange={v => setPaymentMonth(v)}
          options={MONTHS_TR.map((label, i) => ({
            value: i + 1,
            label: label.slice(0, 3),
          }))}
        />
      </Field>
      <Field
        label="Her Yıl Ödeme Günü (opsiyonel)"
        hint="Ay içinde sabit bir gün varsa yaz; yoksa ayın 15'i kabul edilir."
      >
        <TextInput
          value={paymentDay}
          onChange={setPaymentDay}
          placeholder="Örn: 15 (1–31)"
          type="number"
          min={1}
          max={31}
        />
      </Field>
      <Field
        label="Son Fiili Ödeme Tarihi"
        hint="En son ne zaman ödedin? Boş bırakılabilir."
      >
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
