export const PORSUK_SPEECH = {
  idle: [
    'Mırnav 😺',
    'Mırrr 💤',
    'Beni özledin mi?',
    'Mama? 🥺',
    'Pencereyi açar mısın?',
    'Tüy döküyorum 😬',
  ],
  click1: [
    'Mırnav! 😺',
    'Beni mi çağırdın?',
    'Selaaaam! 👋',
    'Evet, dinliyorum',
    'Mama mı verdin? 🥺',
    'Buradayım canım',
  ],
  click2: [
    'Tekrar mı? 😅',
    'Buradayım buradayım',
    'Mırrr neyse 😼',
    'Bisi mi var? 🤔',
    'Hâlâ ben mi?',
  ],
  click3: [
    'Yeter ya! 😾',
    'Daha bişey mi?',
    'Bırak biraz! 🙄',
    'Sıkıldım...',
    "Pati'm yoruldu 😤",
  ],
  click4: [
    'TAMAM ARTIK! 😡',
    'BENİ RAHAT BIRAK!',
    'YORDUN BENİ! 🏃💨',
    'GİDİYORUM!',
    'YETER YA, KAÇTIM!',
  ],
  peek: [
    'Sakinleşti mi? 👀',
    'Hâlâ kızgın mıyım...',
    'Pssst... döndüm',
    'Barıştık mı? 🥺',
  ],
  pageContext: {
    ana:     'Genel görünüm iyi 👀',
    gelir:   'Sayıları takip ediyorum 📊',
    borc:    'Borçları bitirelim...',
    birikim: 'Hedeflerin var olmalı 🎯',
    rapor:   'Grafikler güzel 📈',
    ayar:    'Burada uyuyabilir miyim? 😴',
  } as Record<string, string>,
  timeContext: {
    morning: ['Günaydın! ☀️', 'Sabah kahvesi nerede? ☕', 'Erken kalktın 🌅'],
    noon:    ['Öğle yemeği? 🍽️', 'Mama vakti 🐱', 'Güneş güzel bugün'],
    evening: ['İyi akşamlar 🌙', 'Yoruldum, mırrr 😴', 'Film izleyelim mi?'],
    night:   ['Gece yarısı mı? 🌚', 'Uyumalısın...',  'Ben de uyuyacağım 💤'],
  } as Record<string, string[]>,
} as const;

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getTimeContext(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'noon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}
