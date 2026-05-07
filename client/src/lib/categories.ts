export const INCOME_CATEGORIES = [
  "Ana Maaş",
  "Ek Mesai / Prim",
  "Serbest Gelir",
  "Trinkgeld / Bahşiş",
  "Devlet Desteği",
  "Vergi İadesi",
  "Diğer Gelir",
];

export const EXPENSE_CATEGORIES = {
  "Konut ve Ev": {
    color: "#F97316",
    subcategories: [
      "Kira",
      "Betriebskosten / Aidat",
      "Elektrik",
      "Gaz / Isıtma",
      "Su",
      "Ev İnterneti",
      "Haushaltsversicherung",
      "ORF / TV Ücreti",
      "Ev Bakım / Tamirat",
      "Ev Eşyası",
    ],
  },
  "Dijital Abonelikler": {
    color: "#8B5CF6",
    subcategories: [
      "Telefon Faturası",
      "Mobil İnternet",
      "Netflix",
      "Disney+",
      "Spotify",
      "YouTube Premium",
      "iCloud / Google Drive",
      "Yazılım / AI Abonelikleri",
      "Diğer Dijital Abonelikler",
    ],
  },
  "Ulaşım ve Araç": {
    color: "#EF4444",
    subcategories: [
      "Yakıt",
      "Wiener Linien / Toplu Taşıma",
      "Araç Sigortası",
      "Motorbezogene Versicherungssteuer",
      "Park Ücreti",
      "Garaj / Stellplatz",
      "Araç Bakım / Servis",
      "Lastik",
      "Araç Yıkama",
      "Vignette",
      "Otoyol / Geçiş Ücretleri",
      "Araç Kredi / Leasing",
      "ÖAMTC / Yol Yardımı",
      "Ceza / Trafik Ödemesi",
    ],
  },
  "Market ve Yaşam": {
    color: "#6B7280",
    subcategories: [
      "Market",
      "Temizlik Ürünleri",
      "Kişisel Bakım Ürünleri",
      "Ev İhtiyaçları",
      "Su / İçecek",
      "Evcil Hayvan Giderleri",
      "Mama / Kum",
      "Günlük Temel İhtiyaçlar",
    ],
  },
  "Yemek ve Dışarı": {
    color: "#EF4444",
    subcategories: [
      "Restoran",
      "Kahve",
      "Paket Servis",
      "İşte Yemek",
      "Atıştırmalık",
      "Arkadaşlarla Dışarı Çıkma",
    ],
  },
  "Sağlık ve Spor": {
    color: "#6B7280",
    subcategories: [
      "İlaç",
      "Doktor / Muayene",
      "Diş",
      "Gözlük / Lens",
      "Spor / Fitness",
      "Kuaför / Berber",
      "Kozmetik",
      "Terapi / Danışmanlık",
      "Sağlık Sigortası Ek Ödemeleri",
    ],
  },
  Borçlar: {
    color: "#F97316",
    subcategories: [
      "Kredi Kartı Ödemesi",
      "Banka Kredisi",
      "Taksitler",
      "Vergi Ödemesi",
      "Ceza / Resmi Ödeme",
      "Arkadaşa / Aileye Borç",
      "Mahkeme / Avukat Ödemeleri",
      "Diğer Borçlar",
    ],
  },
  "Birikim ve Yatırım": {
    color: "#3B82F6",
    subcategories: [
      "Acil Durum Fonu",
      "Kısa Vadeli Birikim",
      "Araç Hedefi",
      "Tatil Hedefi",
      "Taşınma Hedefi",
      "Vergi / Beklenmeyen Ödeme Rezervi",
      "Yatırım",
      "Emeklilik / Uzun Vadeli Birikim",
    ],
  },
  "Eğitim ve Gelişim": {
    color: "#6B7280",
    subcategories: [
      "Kurs",
      "Kitap",
      "Sınav Ücreti",
      "Sertifika",
      "Yazılım Araçları",
      "AI Araçları",
      "İş Başvurusu Masrafları",
      "CV / Portfolio Masrafları",
    ],
  },
  "Eğlence ve Sosyal": {
    color: "#EF4444",
    subcategories: [
      "Sinema / Etkinlik",
      "Hobi",
      "Oyun",
      "Teknoloji",
      "Giyim",
      "Alışveriş",
      "Hediye",
      "Tatil / Gezi",
      "Sosyal Etkinlik",
    ],
  },
  "Beklenmeyen Giderler": {
    color: "#F59E0B",
    subcategories: [
      "Acil Harcama",
      "Tamir",
      "Unutulan Ödeme",
      "Kayıp / Ekstra Masraf",
      "Resmi Belge",
      "Diğer",
    ],
  },
};

export const EXPENSE_TYPES = ["Sabit", "Değişken", "Borç", "Birikim"] as const;
export const PAYMENT_STATUSES = ["Ödendi", "Bekliyor", "Gecikti"] as const;
export const URGENCY_LEVELS = ["Zorunlu", "Esnek", "Gereksiz"] as const;

export function getCategoryColor(category: string): string {
  const cat = EXPENSE_CATEGORIES[category as keyof typeof EXPENSE_CATEGORIES];
  return cat?.color || "#6B7280";
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("de-AT", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function getFinancialStatus(
  expenseRatio: number,
  remainingActual: number
): {
  status: "İyi" | "Dikkat" | "Riskli";
  color: string;
  icon: string;
} {
  if (remainingActual < 0) {
    return { status: "Riskli", color: "#EF4444", icon: "🔴" };
  }
  if (expenseRatio > 0.8) {
    return { status: "Dikkat", color: "#F59E0B", icon: "🟠" };
  }
  return { status: "İyi", color: "#10B981", icon: "🟢" };
}
