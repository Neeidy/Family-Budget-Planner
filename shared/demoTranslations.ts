/**
 * Locale overlay for demo.aileplan.uk content.
 *
 * Maps each demo item `id` → translated display label (+ notes) in the three
 * supported UI locales. Applied ONLY on the demo READ path (see
 * client/src/contexts/BudgetContext.tsx, isDemoMode gate). Production
 * (butce.aileplan.uk) family data is NEVER overlaid.
 *
 * Field mapping by entity:
 *   - incomes / debts / savingsGoals / installments / annualPayments → `name`
 *   - expenses → `subcategory` (expenses have no `name`; the list renders
 *     `expense.subcategory`), so the visible expense label lives there
 *   - `notes` is overlaid wherever a translated note is provided
 *   - budgetLimits are category-only (no free text) → intentionally absent
 *
 * Brand / proper nouns stay fixed across locales (Wien Energie, Netflix,
 * Billa, XXXLutz, Schönbrunn, Radwelt …); only descriptive words translate.
 */

// Mirror of client/src/lib/locale.ts `Locale` — inlined so this module stays
// dependency-free and importable from both client and server without relying
// on the `@/` path alias resolving in every runtime.
export type Locale = "tr" | "en" | "de";

export type DemoTranslation = {
  name?: Record<Locale, string>;
  notes?: Record<Locale, string>;
  subcategory?: Record<Locale, string>;
};

export const DEMO_TRANSLATIONS: Record<string, DemoTranslation> = {
  // ─── Incomes (3) ──────────────────────────────────────────────────────────
  "demo-i-1": {
    name: { tr: "Lukas Maaş", en: "Lukas Salary", de: "Lukas Gehalt" },
    notes: {
      tr: "Net, vergiden sonra",
      en: "Net, after tax",
      de: "Netto, nach Steuern",
    },
  },
  "demo-i-2": {
    name: { tr: "Anna Burs", en: "Anna Scholarship", de: "Anna Stipendium" },
    notes: {
      tr: "Burs + özel ders",
      en: "Grant + tutoring",
      de: "Studienbeihilfe + Nachhilfe",
    },
  },
  "demo-i-3": {
    name: { tr: "Anna Freelance", en: "Anna Freelance", de: "Anna Freelance" },
    notes: {
      tr: "Aylık ortalama, değişken",
      en: "Monthly average, variable",
      de: "Monatlicher Durchschnitt, variabel",
    },
  },

  // ─── Savings (5) ──────────────────────────────────────────────────────────
  "demo-s-1": {
    name: {
      tr: "İtalya Tatili 2026",
      en: "Italy Vacation 2026",
      de: "Urlaub 2026 (Italien)",
    },
    notes: {
      tr: "Toskana yol gezisi, 2 hafta",
      en: "Tuscany road trip, 2 weeks",
      de: "Toskana-Roadtrip, 2 Wochen",
    },
  },
  "demo-s-2": {
    name: { tr: "İkinci El Araç", en: "Used Car", de: "Neuer Gebrauchtwagen" },
    notes: {
      tr: "Station wagon, en fazla 3 yaşında",
      en: "Wagon, max 3 years old",
      de: "Kombi, max. 3 Jahre alt",
    },
  },
  "demo-s-3": {
    name: { tr: "Acil Durum Fonu", en: "Emergency Fund", de: "Notfallfonds" },
    notes: {
      tr: "3 aylık masraf rezervi",
      en: "3 months of expenses",
      de: "3 Monatsausgaben Rücklage",
    },
  },
  "demo-s-4": {
    name: { tr: "Düğün Fonu", en: "Wedding Fund", de: "Hochzeitsfonds" },
    notes: {
      tr: "Nikah + düğün",
      en: "Registry + celebration",
      de: "Standesamt + Feier",
    },
  },
  "demo-s-5": {
    name: {
      tr: "Daire Tadilatı",
      en: "Apartment Renovation",
      de: "Wohnung Renovierung",
    },
    notes: {
      tr: "Mutfak + banyo",
      en: "Kitchen + bathroom",
      de: "Küche + Bad",
    },
  },

  // ─── Installments (5) — brand fixed, descriptor translated ─────────────────
  "demo-t-1": {
    name: {
      tr: "iPhone 13 (Drei Plan)",
      en: "iPhone 13 (Drei Plan)",
      de: "iPhone 13 (Drei Plan)",
    },
    notes: {
      tr: "Drei üzerinden cihaz kredisi",
      en: "Device loan via Drei",
      de: "Gerätekredit über Drei",
    },
  },
  "demo-t-2": {
    name: {
      tr: "MacBook Air M2 (Apple Education)",
      en: "MacBook Air M2 (Apple Education)",
      de: "MacBook Air M2 (Apple Education)",
    },
    notes: {
      tr: "Apple Education finansmanı",
      en: "Apple Education financing",
      de: "Apple Education Finanzierung",
    },
  },
  "demo-t-3": {
    name: {
      tr: "Bulaşık Makinesi (Saturn 0%)",
      en: "Dishwasher (Saturn 0%)",
      de: "Geschirrspüler (Saturn 0%)",
    },
    notes: {
      tr: "%0 finansman",
      en: "0% financing",
      de: "0% Finanzierung",
    },
  },
  "demo-t-4": {
    name: {
      tr: "Kanepe (XXXLutz)",
      en: "Sofa (XXXLutz)",
      de: "Sofa (XXXLutz)",
    },
    notes: {
      tr: "18 taksit, %0 kampanya",
      en: "18 installments, 0% deal",
      de: "18 Raten, 0% Aktion",
    },
  },
  "demo-t-5": {
    name: {
      tr: "E-Bisiklet (Radwelt)",
      en: "E-Bike (Radwelt)",
      de: "E-Bike (Radwelt)",
    },
    notes: {
      tr: "24 aylık taksit",
      en: "24 monthly installments",
      de: "24 Monatsraten",
    },
  },

  // ─── Annuals (7) ──────────────────────────────────────────────────────────
  "demo-y-1": {
    name: {
      tr: "Araç Sigortası",
      en: "Car Insurance",
      de: "Autoversicherung",
    },
    notes: {
      tr: "Donau Sigorta — Kasko + Trafik",
      en: "Donau Insurance — comprehensive + liability",
      de: "Donau Versicherung — Kasko + Haftpflicht",
    },
  },
  "demo-y-2": {
    name: { tr: "Otoyol Vignette", en: "Motorway Vignette", de: "Vignette" },
    notes: {
      tr: "Otoban yıllık vignette",
      en: "Annual motorway vignette",
      de: "Autobahn-Jahresvignette",
    },
  },
  "demo-y-3": {
    name: {
      tr: "ÖAMTC Yıllık Üyelik",
      en: "ÖAMTC Annual Membership",
      de: "ÖAMTC Jahresgebühr",
    },
    notes: {
      tr: "Yol yardım üyeliği",
      en: "Roadside assistance membership",
      de: "Pannenhilfe-Mitgliedschaft",
    },
  },
  "demo-y-4": {
    name: {
      tr: "Parkpickerl 7. Bölge",
      en: "Parkpickerl 7th District",
      de: "Parkpickerl 7. Bezirk",
    },
    notes: {
      tr: "Neubau sakin park izni",
      en: "Neubau resident parking",
      de: "Anwohnerparken Neubau",
    },
  },
  "demo-y-5": {
    name: {
      tr: "Cleo Veteriner Yıllık",
      en: "Cleo Vet Annual",
      de: "Cleo Tierarzt jährlich",
    },
    notes: {
      tr: "Aşı + kontrol",
      en: "Vaccination + check-up",
      de: "Impfung + Kontrolle",
    },
  },
  "demo-y-6": {
    name: {
      tr: "Ev Eşya Sigortası",
      en: "Home Contents Insurance",
      de: "Hausratversicherung",
    },
    notes: {
      tr: "Konut + ev eşyası sigortası",
      en: "Home + contents insurance",
      de: "Wohnungs- + Haushaltsversicherung",
    },
  },
  "demo-y-7": {
    name: {
      tr: "Fitness Stüdyo Yıllık",
      en: "Fitness Studio Annual",
      de: "Fitness-Studio Jahresabo",
    },
    notes: {
      tr: "Yıllık fitness aboneliği",
      en: "Annual gym membership",
      de: "Jahresabo Fitnessstudio",
    },
  },

  // ─── Debts (2) ────────────────────────────────────────────────────────────
  "demo-d-1": {
    name: {
      tr: "HSBC Kredi Kartı",
      en: "HSBC Credit Card",
      de: "HSBC Kreditkarte",
    },
    notes: {
      tr: "Sabit aylık taksit yok",
      en: "No fixed monthly rate",
      de: "Keine feste Monatsrate",
    },
  },
  "demo-d-2": {
    name: {
      tr: "Möbelix Mobilya Kredisi",
      en: "Möbelix Furniture Loan",
      de: "Möbelix Möbelkredit",
    },
    notes: {
      tr: "6 taksit, 3'ü ödendi",
      en: "6 installments, 3 paid",
      de: "6 Raten, 3 bereits bezahlt",
    },
  },

  // ─── Expenses (24) — `subcategory` is the visible label ───────────────────
  "demo-e-1": {
    subcategory: {
      tr: "Kira (2 Oda, Neubau)",
      en: "Rent (2BR, Neubau)",
      de: "Miete (2BR Neubau)",
    },
    notes: {
      tr: "7. Bölge, işletme masrafları dahil",
      en: "7th district, incl. operating costs",
      de: "7. Bezirk, inkl. Betriebskosten",
    },
  },
  "demo-e-2": {
    subcategory: {
      tr: "Wien Energie",
      en: "Wien Energie",
      de: "Wien Energie",
    },
    notes: {
      tr: "Elektrik + gaz, aylık ortalama",
      en: "Electricity + gas, monthly average",
      de: "Strom + Gas, Monatsdurchschnitt",
    },
  },
  "demo-e-3": {
    subcategory: {
      tr: "Magenta Fiber",
      en: "Magenta Fiber",
      de: "Magenta Glasfaser",
    },
    notes: {
      tr: "300 Mbit fiber",
      en: "300 Mbit fiber",
      de: "300 Mbit Glasfaser",
    },
  },
  "demo-e-4": {
    subcategory: {
      tr: "Drei Aile Tarifi",
      en: "Drei Family Plan",
      de: "Drei Familientarif",
    },
    notes: {
      tr: "2 SIM kart",
      en: "2 SIM cards",
      de: "2 SIM-Karten",
    },
  },
  "demo-e-5": {
    subcategory: { tr: "ORF Harcı", en: "ORF Fee", de: "ORF Beitrag" },
    notes: {
      tr: "ORF harcı (eski GIS)",
      en: "ORF fee (formerly GIS)",
      de: "ORF-Beitrag (ehem. GIS)",
    },
  },
  "demo-e-6": {
    subcategory: {
      tr: "Netflix Standart",
      en: "Netflix Standard",
      de: "Netflix Standard",
    },
    notes: {
      tr: "Reklamlı Standart",
      en: "Standard with ads",
      de: "Standard mit Werbung",
    },
  },
  "demo-e-7": {
    subcategory: {
      tr: "Spotify Aile",
      en: "Spotify Family",
      de: "Spotify Familie",
    },
    notes: {
      tr: "Aile aboneliği",
      en: "Family plan",
      de: "Family-Abo",
    },
  },
  "demo-e-8": {
    subcategory: {
      tr: "YouTube Premium",
      en: "YouTube Premium",
      de: "YouTube Premium",
    },
  },
  "demo-e-9": {
    subcategory: {
      tr: "Wiener Linien Yıllık Kart",
      en: "Wiener Linien Annual Pass",
      de: "Wiener Linien Jahreskarte",
    },
    notes: {
      tr: "365€/yıl, aylığa bölünmüş",
      en: "€365/year, split monthly",
      de: "365€/Jahr, monatlich aufgeteilt",
    },
  },
  "demo-e-10": {
    subcategory: {
      tr: "Billa Haftalık Alışveriş",
      en: "Billa Weekly Groceries",
      de: "Billa Wocheneinkauf",
    },
    notes: {
      tr: "Haftalık, aylık ortalama",
      en: "Weekly, monthly average",
      de: "Wöchentlich, Monatsdurchschnitt",
    },
  },
  "demo-e-11": {
    subcategory: {
      tr: "Sosisçi (Naschmarkt)",
      en: "Sausage Stand (Naschmarkt)",
      de: "Würstelstand am Naschmarkt",
    },
  },
  "demo-e-12": {
    subcategory: { tr: "Café Sperl", en: "Café Sperl", de: "Café Sperl" },
    notes: {
      tr: "Viyana kahvehanesi",
      en: "Viennese coffee house",
      de: "Wiener Kaffeehaus",
    },
  },
  "demo-e-13": {
    subcategory: { tr: "Claude Pro", en: "Claude Pro", de: "Claude Pro" },
    notes: {
      tr: "Pro aboneliği",
      en: "Pro plan",
      de: "Pro-Abo",
    },
  },
  "demo-e-14": {
    subcategory: {
      tr: "GitHub Copilot",
      en: "GitHub Copilot",
      de: "GitHub Copilot",
    },
  },
  "demo-e-15": {
    subcategory: {
      tr: "Berber Müller",
      en: "Hairdresser Müller",
      de: "Friseur Müller",
    },
  },
  "demo-e-16": {
    subcategory: {
      tr: "Snus Poşet",
      en: "Snus Pouches",
      de: "Snus Pouches",
    },
  },
  "demo-e-17": {
    subcategory: {
      tr: "OMV Benzin İstasyonu",
      en: "OMV Gas Station",
      de: "OMV Tankstelle",
    },
    notes: {
      tr: "Aylık ortalama",
      en: "Monthly average",
      de: "Monatsdurchschnitt",
    },
  },
  "demo-e-18": {
    subcategory: {
      tr: "Schönbrunn Aile Kartı",
      en: "Schönbrunn Family Card",
      de: "Schönbrunn Familienkarte",
    },
    notes: {
      tr: "Hayvanat bahçesi yıllık kart",
      en: "Zoo annual pass",
      de: "Jahreskarte Tiergarten",
    },
  },
  "demo-e-19": {
    subcategory: { tr: "Loto Wien", en: "Lotto Wien", de: "Lotto Wien" },
  },
  "demo-e-20": {
    subcategory: {
      tr: "Eczane Burggasse",
      en: "Pharmacy Burggasse",
      de: "Apotheke Burggasse",
    },
    notes: {
      tr: "Reçete ücreti + vitaminler",
      en: "Prescription fee + vitamins",
      de: "Rezeptgebühr + Vitamine",
    },
  },
  "demo-e-21": {
    subcategory: {
      tr: "dm Drogeri",
      en: "dm Drugstore",
      de: "dm Drogerie",
    },
  },
  "demo-e-22": {
    subcategory: {
      tr: "Eni Benzin İstasyonu",
      en: "Eni Gas Station",
      de: "Eni Tankstelle",
    },
    notes: {
      tr: "Değişken ek dolum",
      en: "Variable top-up fill",
      de: "Variable Zweittankung",
    },
  },
  "demo-e-23": {
    subcategory: {
      tr: "Wiener Linien Tek Bilet",
      en: "Wiener Linien Single Ticket",
      de: "Wiener Linien Einzelfahrt",
    },
    notes: {
      tr: "Tekli biletler",
      en: "Single tickets",
      de: "Einzeltickets",
    },
  },
  "demo-e-24": {
    subcategory: {
      tr: "Sinema Gartenbaukino",
      en: "Cinema Gartenbaukino",
      de: "Kino Gartenbaukino",
    },
  },
};
