# Viyana Budget Planner — Recovery & Refactor Project

You are picking up a TypeScript family budget application that was previously hosted on Manus Cloud (which banned the user twice). This export contains the security and data-integrity work but **lost the UI/IA refactor**. Your job is to make this run cleanly on the user's local machine and finish the lost UX work.

Read this file fully, then read `FIXES.md`, then start with **Phase 0**. Work in order. Do not skip phases.

## Stack

- React 19 + Vite 7 (frontend)
- Express + tRPC v11 (backend)
- Drizzle ORM + MySQL 8 (data)
- pnpm 10 (package manager)
- Cookie-based family auth, no per-user accounts (intentional — 2-user household app)

## What is already done (DO NOT REIMPLEMENT — only verify it works)

| Wave | What | Where to find it |
|---|---|---|
| **Wave 1** — Auth | Family password + httpOnly JWT cookie + person selection at login. HMAC-SHA256 password hash. Login UI. Bootstrap exits if env missing. | `server/auth/familyAuth.ts`, `server/familyAuthRouter.ts`, `server/_core/context.ts`, `server/_core/trpc.ts` (`familyProtectedProcedure`), `client/src/pages/Login.tsx`, `scripts/hash-family-password.ts`, `server/familyAuth.test.ts` |
| **Wave 2** — DoS + integrity | helmet, rate limit (200/min general + 10/min on login), `app.set("trust proxy", 1)`, body limit 200KB, `jsonArrayString` zod helper (max 100KB + JSON refine), optimistic locking via `expectedUpdatedAt` returning CONFLICT | `server/_core/index.ts`, `server/routers.ts`, `server/db.ts`, `server/familyBudget.test.ts` |
| **Wave 3** — Backup history | `familyBudgetHistory` table (max 30 snapshots, oldest auto-pruned), automatic snapshot on every save, list/get/restore tRPC endpoints, "Yedek Geçmişi" UI in Settings | `drizzle/schema.ts` (familyBudgetHistory), `drizzle/0001_lethal_jackpot.sql`, `server/db.ts` (`snapshotFamilyBudget`, `listFamilyBudgetHistory`, `getFamilyBudgetSnapshot`), `server/routers.ts` (`familyBudget.history.*`), `client/src/pages/Settings.tsx`, `server/familyBudgetHistory.test.ts` |

## What is NOT done (your work — see `FIXES.md` for details)

- **Phase 0:** Wave 0 cleanup is reverted. Manus plugins are back in `package.json` and `vite.config.ts`. `registerStorageProxy` and `registerOAuthRoutes` are being called in `server/_core/index.ts`. Manus localStorage write is unwrapped in `useAuth.ts`. Local run will fail until cleaned.
- **Phase 1:** Local environment never set up (no `.env`, MySQL not initialized).
- **Phase 2:** IA refactor — 13-item nav still there, new container pages (`GelirGider`, `BorcOdemeler`, `Hedef`, `Raporlar`) don't exist, dead pages (`MyBudget`, `SpouseBudget`, `PaymentTracking`, `GoalPlanning`, `Categories`, `ComponentShowcase`) still present, App.tsx still has 28 routes including English duplicates, no global person filter.
- **Phase 3:** Data model cleanup — `Income.planned/actual` and `Expense.planned/actual` should become single `amount`. `Expense.urgency` should be removed. `BudgetLimit.owner: 'Eşim' | 'Ortak'` should normalize to `'Esim' | 'Ev'`. Drizzle `familyBudget` table has both `savings` and `savingsGoals` text columns — investigate and dedup.
- **Phase 4:** Auto-rollover for fixed expenses. Template system (`useRecurringTemplates`, "Sabit Gider Şablonları" UI) must be removed entirely; `type='Sabit'` expenses should auto-replicate to next month on month change.
- **Phase 5:** Tab styling for the new container pages must match sidebar nav design language. Section name `"Yükümlülükler"` → `"Borç & Ödemeler"` everywhere.

## HARD RULES — do not break these

1. **Preserve Wave 1/2/3 behavior.** Do not modify auth flow, rate limit, optimistic lock, history snapshot/restore, or their tests. They are working; do not "improve" them.
2. **Do not touch existing migrations** (`drizzle/0000_swift_pepper_potts.sql`, `drizzle/0001_lethal_jackpot.sql`). Generate new migrations with `pnpm exec drizzle-kit generate` if schema changes.
3. **Do not reintroduce Manus dependencies.** No `vite-plugin-manus-runtime`, no `@builder.io/vite-plugin-jsx-loc`, no `registerStorageProxy(app)` call, no `registerOAuthRoutes(app)` call, no unwrapped `manus-runtime-user-info` localStorage write.
4. **Do not delete `_core/` files.** Files like `server/_core/oauth.ts`, `server/_core/storageProxy.ts`, `server/_core/llm.ts` are dead code — they will not be called after Phase 0, but the files stay (template artifacts).
5. **No version bumps.** Don't run `pnpm update` or change versions in `package.json` unless adding a new package required by a phase.
6. **No new auth model.** This app uses one shared family password — do not add per-user accounts, OAuth, or 2FA. Keep scope.
7. **Commit between phases.** Each phase ends with a commit. If a phase breaks something, the previous phase's work must remain intact.

## How to run locally

```bash
# 1. Install dependencies (after Phase 0 cleanup)
pnpm install

# 2. Set up MySQL 8 locally on port 3306
# brew install mysql && brew services start mysql
mysql -u root -e "CREATE DATABASE IF NOT EXISTS viyana_budget CHARACTER SET utf8mb4;"

# 3. Set up environment (see .env.example)
# Generate password hash:
pnpm tsx scripts/hash-family-password.ts <yourPassword>
# Generate cookie secret:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Put both into .env (and DATABASE_URL, NODE_ENV, PORT)

# 4. Run migrations
pnpm exec drizzle-kit migrate

# 5. Start dev server
pnpm dev
# Server logs "Server running on http://localhost:3000/"
```

## How to verify each phase

Run after every phase, do not advance until all green:

```bash
pnpm test           # vitest — all 4 test suites must pass
pnpm exec tsc --noEmit   # no type errors
pnpm build          # production bundle builds clean
```

Plus the smoke checklist in `FIXES.md` end of each phase.

## Design Reference

Yeni UI tasarımı `_design/claude-design-v4/` klasöründe Claude Design çıktısı olarak duruyor. Bu klasör build edilmez, sadece referanstır. Dosya yapısı:

| Dosya | Amaç |
|---|---|
| `app.jsx` | Root layout, viewport/theme toggle, page routing |
| `components.jsx` | Avatar, CategoryPill, StatusBadge, PersonFilterChips, TabBar, EmptyState, Skeleton (PageSkeleton + 6 sub-component), HeroMetric, OwnerCard, SummaryCard |
| `nav.jsx` | Sidebar (desktop), MobileBottomNav (with FAB), MobileHeader, Icon library |
| `porsuk.jsx` | Calico cat character — 26 poses, click handler with anger meter (0-4), speech bubbles (idle/click/reactive/page-context), state machine, 4-frame leg cycle animation |
| `notifications.jsx` | NotificationsPanel (dropdown desktop / bottom sheet mobile) with 5 sample notifications + empty state |
| `dialogs.jsx` | AddIncomeDialog, AddExpenseDialog, AddDebtDialog, AddGoalDialog (CRUD modals) |
| `page-giris.jsx` | Login page with avatar select + password + ambient orbs + parallax |
| `page-ana.jsx` | Dashboard: Bütçe Sağlık Skoru, Net Değer, owner cards, summary cards, "BUGÜN" widget, Bütçe vs Gerçekleşen |
| `page-gelir.jsx` | Gelir & Gider with 3 tabs (Gelirler, Giderler, Bütçe Limitleri with circular gauges) |
| `page-borc.jsx` | Borç & Ödemeler with 3 tabs (Borçlar, Taksitler, Yıllık Ödemeler) |
| `page-birikim.jsx` | Birikim & Hedef with filter tabs (Aktif/Tamamlanan/Tümü) |
| `page-rapor.jsx` | Raporlar with 2 tabs (Aylık Karşılaştırma, Analitik) — custom SVG charts |
| `page-ayar.jsx` | Ayarlar — Profil, Görünüm, Veri Yönetimi, Yedek Geçmişi, Çıkış |
| `data.js` | Sample data: incomes, expenses, debts, installments, goals, budgets, backups, ownerLabel, fmtEUR helpers |
| `styles.css` | Design tokens (oklch palette, owner colors, category colors, status, shadows, radii) + dark/light theme + animations |
| `tweaks-panel.jsx` | Dev preview controls (skip during integration) |

### Design tokens özet (styles.css :root)

- Owner colors: --owner-yigit (blue), --owner-arzu (purple), --owner-ev (orange), --owner-tumu (green)
- Category colors: --cat-konut, --cat-yiyecek, --cat-ulasim, --cat-saglik, --cat-eglence, --cat-abonelik, --cat-giyim, --cat-spor, --cat-cocuk, --cat-diger
- Status: --status-success, --status-warning, --status-danger
- Surface (dark): --bg-base, --bg-surface, --bg-elevated, --bg-tint
- Surface (light): aynı isimler farklı tonlar
- Typography: --font-sans (Geist), --font-mono (Geist Mono)
- Radii: --r-sm, --r-md, --r-lg, --r-xl, --r-full
- Shadows: --shadow-sm, --shadow-md, --shadow-lg, --shadow-card

### Hard rules for design integration

1. `_design/` salt-okunur referans. Asla import etme.
2. `_design/` içindeki vanilla JSX + CSS'i **port et**, Tailwind utility class + TypeScript component olarak. Birebir kopyalama yok, mevcut shadcn/ui ve Tailwind sistemine adapte et.
3. oklch CSS variables Tailwind config'e eklenecek (theme.extend.colors).
4. Geist font Google Fonts CDN ile yüklenecek (zaten Inter vardı, üstüne Geist).
5. Porsuk component standalone — başka feature'a karışmayacak.
6. Wave 1/2/3 backend dokunulmaz.
7. Drizzle schema dokunulmaz.

### Integration plan

Tasarım entegrasyonu fazlara bölünecek (FIXES.md'deki gibi). İlerleyen prompt'larda her faz spec'i verilecek. Mevcut master/butce.aileplan.uk dokunulmaz — yeni `design-claude-v4` branch'inde çalışılır, test.aileplan.uk preview'i bu branch'e işaret eder.

## Where to start

1. Read `FIXES.md` end-to-end.
2. Confirm you can satisfy each phase's acceptance criteria.
3. Begin Phase 0. Commit. Phase 1. Commit. Phase 2. Commit. … Phase 6.
4. After Phase 6, summarize: which files changed, any deviations from the spec, any open issues.

If a step is genuinely unclear or you hit an unrecoverable error, stop and report — do not guess. The user values correctness over speed.
