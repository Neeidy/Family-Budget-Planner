/**
 * Hardcoded demo data served on demo.aileplan.uk.
 *
 * Story: Kerem (junior software dev, ~25) and Yağmur (master's student,
 * ~25) live in a small 2BR rental in 16. Bezirk, Vienna. Combined net
 * income ~€3600/month, modest middle-class budget with realistic
 * Austrian numbers (rent + utilities + Wiener Linien yıllık + Apple
 * Education installments).
 *
 * Numbers are tuned so savings goal projections match
 * (currentAmount + monthlyAllocation × monthsRemaining ≈ targetAmount,
 * within ±10%). All snapshots dated 2026-05-01.
 *
 * Owner mapping for the existing UI:
 *   Kerem  → Benim
 *   Yağmur → Esim
 *   shared → Ev
 */
import type { FamilyBudget } from "../../drizzle/schema";

const DEMO_DATE = "2026-05-01";

const incomes = [
  { id: "demo-i-1", name: "Kerem Maaşı (junior dev)", amount: 2300, owner: "Benim", date: DEMO_DATE,                notes: "Net maaş, vergi sonrası" },
  { id: "demo-i-2", name: "Yağmur Burs + Asistanlık",  amount: 900,  owner: "Esim",  date: DEMO_DATE,                notes: "TU Wien yüksek lisans tutorship" },
  { id: "demo-i-3", name: "Yağmur Freelance Tasarım",  amount: 400,  owner: "Esim",  date: "2026-05-15",             notes: "Aylık ortalama, değişken" },
];

const expenses = [
  { id: "demo-e-1",  category: "Konut",     subcategory: "Kira",                type: "Sabit",     amount: 950, paymentDay: "1",  status: "Odendi",   owner: "Ev",     notes: "16. Bezirk 2BR, Hausbesorger dahil" },
  { id: "demo-e-2",  category: "Faturalar", subcategory: "Elektrik + Doğalgaz", type: "Sabit",     amount: 120, paymentDay: "15", status: "Bekliyor", owner: "Ev",     notes: "Wien Energie aylık ortalama" },
  { id: "demo-e-3",  category: "Faturalar", subcategory: "İnternet (Magenta)",   type: "Sabit",     amount: 30,  paymentDay: "5",  status: "Odendi",   owner: "Ev",     notes: "100 Mbps fiber" },
  { id: "demo-e-4",  category: "Faturalar", subcategory: "Telefon (2 hat)",      type: "Sabit",     amount: 40,  paymentDay: "10", status: "Odendi",   owner: "Ev",     notes: "Yesss aile paketi" },
  { id: "demo-e-5",  category: "Eglence",   subcategory: "Streaming",            type: "Sabit",     amount: 18,  paymentDay: "12", status: "Odendi",   owner: "Ev",     notes: "Netflix + Spotify Family" },
  { id: "demo-e-6",  category: "Spor",      subcategory: "Spor Üyeliği",         type: "Sabit",     amount: 25,  paymentDay: "1",  status: "Odendi",   owner: "Benim",  notes: "USI Wien öğrenci indirimli" },
  { id: "demo-e-7",  category: "Ulasim",    subcategory: "Wiener Linien",        type: "Sabit",     amount: 33,  paymentDay: "1",  status: "Odendi",   owner: "Ev",     notes: "Yıllık 365€ kart, aylık paylaştırılmış" },
  { id: "demo-e-8",  category: "Yiyecek",   subcategory: "Market (haftalık)",    type: "Degisken",  amount: 380,                  status: "Odendi",   owner: "Ev",     notes: "Hofer + Billa, aylık ortalama" },
  { id: "demo-e-9",  category: "Yiyecek",   subcategory: "Restoran",             type: "Degisken",  amount: 95,                   status: "Odendi",   owner: "Ev",     notes: "Dışarı yemek + kahve" },
  { id: "demo-e-10", category: "Giyim",     subcategory: "Kıyafet",              type: "Degisken",  amount: 60,                   status: "Bekliyor", owner: "Esim",   notes: "Sezon değişimi" },
  { id: "demo-e-11", category: "Eglence",   subcategory: "Sinema + Etkinlik",    type: "Degisken",  amount: 70,                   status: "Odendi",   owner: "Ev",     notes: "Hafta sonu çıkışları" },
  { id: "demo-e-12", category: "Saglik",    subcategory: "Eczane",                type: "Degisken",  amount: 25,                   status: "Odendi",   owner: "Esim",   notes: "Vitamin + reçeteli" },
  { id: "demo-e-13", category: "Diger",     subcategory: "Bağış",                type: "Degisken",  amount: 20,                   status: "Odendi",   owner: "Ev",     notes: "Yardım kuruluşu, aylık" },
];

const debts = [
  { id: "demo-d-1", name: "Kredi Kartı (Erste)",  totalDebt: 280,  monthlyPayment: 100, dueDate: "2026-08-31", status: "Bekliyor", owner: "Benim", notes: "Yıllık %16 faiz, 3 taksit kaldı" },
  { id: "demo-d-2", name: "ÖH Öğrenci Kredisi",   totalDebt: 1800, monthlyPayment: 120, dueDate: "2027-08-01", status: "Bekliyor", owner: "Esim",  notes: "Faizsiz, 15 ay kaldı" },
];

const installments = [
  { id: "demo-t-1", name: "iPhone 13",                totalAmount: 600, installmentCount: 6, monthlyAmount: 100, startYear: 2026, startMonth: 2, owner: "Benim", notes: "Apple PCM, kalan 4 ay" },
  { id: "demo-t-2", name: "MacBook Air M2 (öğrenci)", totalAmount: 900, installmentCount: 9, monthlyAmount: 100, startYear: 2026, startMonth: 1, owner: "Esim",  notes: "Apple Education, kalan 5 ay" },
];

const annualPayments = [
  { id: "demo-y-1", name: "Haushaltversicherung",   amount: 180, paymentMonth: 4, lastPaymentDate: "2026-04-15", notes: "Kira sigortası, Donau Versicherung" },
  { id: "demo-y-2", name: "Adobe Creative Cloud",   amount: 240, paymentMonth: 9, lastPaymentDate: "2025-09-01", notes: "Yağmur öğrenci yıllık" },
];

const budgetLimits = [
  { id: "demo-l-1", category: "Yiyecek", limit: 500, owner: "Ev" },
  { id: "demo-l-2", category: "Eglence", limit: 120, owner: "Ev" },
  { id: "demo-l-3", category: "Ulasim",  limit: 60,  owner: "Ev" },
];

const savingsGoals = [
  // Snapshot 2026-05-01. Math: current + monthly × monthsRemaining ≈ target (±10%).
  { id: "demo-s-1", name: "Ev Peşinatı",          targetAmount: 12000, currentAmount: 1200, monthlyAllocation: 350, targetDate: "2028-12-01", owner: "Ev", notes: "Eigentumswohnung birinci el katkı" },
  { id: "demo-s-2", name: "Yaz Tatili 2027",      targetAmount: 1500,  currentAmount: 450,  monthlyAllocation: 120, targetDate: "2027-02-01", owner: "Ev", notes: "Yunanistan adaları, 10 gün" },
  { id: "demo-s-3", name: "Acil Fon",              targetAmount: 3500,  currentAmount: 1100, monthlyAllocation: 120, targetDate: "2027-12-01", owner: "Ev", notes: "3 aylık gider karşılığı" },
  { id: "demo-s-4", name: "Düğün Masrafları",     targetAmount: 5000,  currentAmount: 800,  monthlyAllocation: 260, targetDate: "2027-09-01", owner: "Ev", notes: "Ankara'da küçük düğün" },
];

export const DEMO_FAMILY_BUDGET: FamilyBudget = {
  id: 0,
  familyId: "demo",
  incomes:        JSON.stringify(incomes),
  expenses:       JSON.stringify(expenses),
  debts:          JSON.stringify(debts),
  annualPayments: JSON.stringify(annualPayments),
  budgetLimits:   JSON.stringify(budgetLimits),
  savingsGoals:   JSON.stringify(savingsGoals),
  installments:   JSON.stringify(installments),
  updatedAt:      new Date(`${DEMO_DATE}T12:00:00.000Z`),
};

export const DEMO_PROFILES = [
  { id: "demo-kerem",  name: "Kerem",  emoji: "👨‍💻", person: "Benim" as const },
  { id: "demo-yagmur", name: "Yağmur", emoji: "👩‍🎓", person: "Esim"  as const },
];

export type DemoProfileId = (typeof DEMO_PROFILES)[number]["id"];
