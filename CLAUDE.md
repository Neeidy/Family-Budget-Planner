# Family Budget Planner — Production Project

Family budget app deployed at butce.aileplan.uk (Cloudflare Access protected, real family use) and demo.aileplan.uk (public showcase, hardcoded sample data). Single master branch, direct deploys via launchd.

## Stack

- React 19 + Vite 7 + Tailwind v4 (`@theme inline`)
- Express + tRPC v11
- Drizzle ORM + MySQL 8
- pnpm 10
- Cookie-based family auth (single shared password, no per-user accounts)
- Cloudflare Tunnel ingress

## Hard Rules

1. **butce.aileplan.uk = production.** Master commits deploy directly via `launchctl kickstart -k gui/$(id -u)/com.viyana.budget`. Pre-flight + tests + build green required before any push.
2. **demo.aileplan.uk public**, parolasız erişim, hardcoded sample data only. Real family data ASLA demo'ya sızmaz.
3. **Drizzle schema değişikliği için** `pnpm exec drizzle-kit generate` ile yeni migration üret. Mevcut migration dosyalarını editleme.
4. **Currency:** EUR only. **UI:** Turkish.
5. **Aile parolası** `.env` içindeki `FAMILY_PASSWORD_HASH`'te tutulur (repo'da plaintext yok; sadece butce). Demo'da parola yok, profile pick → direct dashboard.
6. **Production restart komutu:** `launchctl kickstart -k gui/$(id -u)/com.viyana.budget`. Kısa downtime kabul.
7. **Tests baseline 93/93.** Yeni feature için test ekle, mevcut 93'ten düşürme.
8. **tsconfig.json'da `noUnusedLocals` + `noUnusedParameters` açık.** Her import gerçekten kullanılmalı, build kırar.
9. **Commit mesajlarında Claude/Anthropic atfı YASAK.** `Co-Authored-By: Claude …` trailer'ı veya herhangi bir Claude/Anthropic imzası/atfı commit'e ASLA eklenmez. (Bu yalnızca *atıf* içindir; `CLAUDE.md` dosya adı, `.claude/` yolu veya demo verisindeki `Claude Pro` gibi gerçek içerik referansları muaftır.)

## How to Run Locally

```bash
# 1. MySQL 8 (port 3306) çalışır olmalı
mysql -u root -e "CREATE DATABASE IF NOT EXISTS viyana_budget CHARACTER SET utf8mb4;"

# 2. .env dosyası (.env.example'ı referans al)
# Aile şifre hash'i:
pnpm tsx scripts/hash-family-password.ts <password>
# Cookie secret:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Dependencies + migrate + start
pnpm install
pnpm exec drizzle-kit migrate
pnpm dev
```

## Verification

```bash
pnpm test              # 93/93 yeşil
pnpm exec tsc --noEmit # 0 hata
pnpm build             # success
```

## Design Reference

`_design/claude-design-v4/` klasörü mockup referans, salt-okunur. Build edilmez. Yeni UI değişikliği yapılırken bu klasördeki `.jsx` dosyalarına bak, Tailwind utility class + TS component olarak port et.

## Demo Mode

`server/demo/demoBudget.ts` içinde `DEMO_FAMILY_BUDGET` + `DEMO_PROFILES` (Kerem + Yağmur, sahte aile). `server/_core/context.ts`'te `isGuest` flag (request hostname === `demo.aileplan.uk`). Demo modunda mutations `FORBIDDEN`, sadece read.

## Çıktı Formatı (CC için — HER ZAMAN UYGULA)

Kullanıcı çıktıyı kopyalayıp paylaşıyor; mouse ile satır satır seçmek zorunda kalmasın diye RAPOR ve ÖZETLER tek bir kopyalanabilir code block içinde verilir.

### Kural

- **Final raporlar, faz özetleri, durum tabloları, sonuç bildirimleri → TEK CODE BLOCK** (üçlü backtick içinde, dil etiketsiz)
- **Komut çıktıları, log özetleri, hata listeleri → TEK CODE BLOCK**
- **Çoklu dosya path / screenshot listesi → TEK CODE BLOCK**
- Block içinde markdown render etme — başlıkları `===` veya `---` ile ayır, listeleri `-` veya `1.` ile yaz, tablo gerekirse pipe `|` formatında

### İstisna

- Tek satırlık ara durum bildirimi code block dışı
- Inline kod referansları (`pnpm test`) normal markdown
- Karşılıklı sohbet, soru-cevap normal markdown
