# Fix List — Viyana Budget Planner

Run phases **in order**. Each phase has acceptance criteria; do not advance until all green. Commit at the end of each phase with a message like `phase 0: manus cleanup`, `phase 1: local env`, etc.

If you finish a phase and a Wave 1/2/3 test broke, you violated the hard rules in `CLAUDE.md`. Stop and report.

---

## Phase 0 — Wave 0 cleanup (Manus dead code removal)

Manus's export reverted earlier cleanup work. Local run will not work until these are reapplied.

### 0.1 Remove Manus packages from `package.json`
Delete from `devDependencies`:
- `"@builder.io/vite-plugin-jsx-loc": "^0.1.1"`
- `"vite-plugin-manus-runtime": "^0.0.57"`

Also remove the dead `@types/bcryptjs` (since auth uses HMAC, not bcrypt — no `bcryptjs` import anywhere).

### 0.2 Clean `vite.config.ts`
Replace the entire file with this minimal version:

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
```

Delete `vite.config.ts.bak` if present.

### 0.3 Disable Manus dead-code calls in `server/_core/index.ts`
Comment out (do NOT delete the imports — the files stay, calls don't):
- Line ~7: `// import { registerOAuthRoutes } from "./oauth";`
- Line ~8: `// import { registerStorageProxy } from "./storageProxy";`
- Around line 83-84:
  ```ts
  // registerStorageProxy(app);
  // registerOAuthRoutes(app);
  ```

### 0.4 Wrap Manus localStorage in `client/src/_core/hooks/useAuth.ts`
Around line 45-48, wrap the `localStorage.setItem("manus-runtime-user-info", ...)` call in try/catch:

```ts
const state = useMemo(() => {
  try {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
  } catch {
    /* manus runtime not available locally */
  }
  return {
    // ... rest unchanged
  };
}, [...]);
```

### 0.5 Acceptance criteria — Phase 0
- [ ] `package.json` does not contain `vite-plugin-manus-runtime`, `@builder.io/vite-plugin-jsx-loc`, or `@types/bcryptjs`.
- [ ] `grep -rn "registerStorageProxy\|registerOAuthRoutes" server/_core/index.ts` shows only commented lines (no active calls).
- [ ] `grep -rn "vitePluginManusRuntime\|jsxLocPlugin" vite.config.ts` returns nothing.
- [ ] `grep -n "manus-runtime-user-info" client/src/_core/hooks/useAuth.ts` shows it inside a `try {}` block.

**Commit:** `phase 0: remove manus dead code`

---

## Phase 1 — Local environment setup

### 1.1 Create `.env`
Copy `.env.example` to `.env`. Generate values:

```bash
# Password hash:
pnpm install   # ensure tsx is available
pnpm tsx scripts/hash-family-password.ts <pickAGoodPassword>
# Copy output to FAMILY_PASSWORD_HASH

# Cookie secret (32+ random hex chars):
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Copy output to FAMILY_COOKIE_SECRET
```

Required values in `.env`:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://root@localhost:3306/viyana_budget
FAMILY_PASSWORD_HASH=<from-script>
FAMILY_COOKIE_SECRET=<from-node>
```

If MySQL root has a password: `mysql://root:PASSWORD@localhost:3306/viyana_budget`.

### 1.2 Set up MySQL database
```bash
# If MySQL not installed:
# brew install mysql && brew services start mysql

mysql -u root -e "CREATE DATABASE IF NOT EXISTS viyana_budget CHARACTER SET utf8mb4;"
```

### 1.3 Install + migrate
```bash
pnpm install
pnpm exec drizzle-kit migrate
```

If migrate fails saying schema is empty or already applied, try `pnpm db:push`.

### 1.4 Smoke test
```bash
pnpm dev
```
- [ ] Server logs `Server running on http://localhost:3000/`.
- [ ] Open `http://localhost:3000` → `/login` page renders (panda + person selection + password field).
- [ ] Wrong password → "Şifre hatalı" toast.
- [ ] Correct password + person → dashboard loads.
- [ ] Add a test income → save → reload page → income persists.
- [ ] Settings → Yedek Geçmişi shows the snapshot from that save.
- [ ] `curl http://localhost:3000/api/trpc/familyBudget.get` without cookie → 401.

### 1.5 Run tests
```bash
pnpm test
```
- [ ] All 4 test suites pass: `auth.logout.test.ts`, `familyAuth.test.ts`, `familyBudget.test.ts`, `familyBudgetHistory.test.ts`.

**Commit:** `phase 1: local env up + smoke tests pass`

---

## Phase 2 — IA refactor (the big one)

Goal: 13 nav items → 6. Dead pages removed. Tabbed container pages. Global person filter.

### 2.1 Create new container pages

**`client/src/pages/GelirGider.tsx`** — tabs: Gelirler | Giderler | Bütçe Limitleri
- Reuse existing `Incomes.tsx`, `Expenses.tsx`, `BudgetLimits.tsx` as tab content.
- In Giderler tab, add a status filter chip group: `Tümü | Bekliyor | Ödendi | Gecikti` (replaces standalone `PaymentTracking`).

**`client/src/pages/BorcOdemeler.tsx`** — tabs: Borçlar | Taksitler | Yıllık Ödemeler
- Reuse `Debts.tsx`, `Installments.tsx`, `AnnualPayments.tsx` as tab content.
- Page title: `Borç & Ödemeler`. Subtitle: `Borç, taksit ve yıllık ödemelerinizi takip edin`.

**`client/src/pages/Hedef.tsx`** — single list (no tabs)
- Merge `Savings.tsx` and `GoalPlanning.tsx` into one form/list using the `SavingsGoal` interface (all fields).
- Filter chips: `Aktif | Tamamlanan | Tümü` (tamamlanan = `currentAmount >= targetAmount`).

**`client/src/pages/Raporlar.tsx`** — tabs: Aylık Karşılaştırma | Analitik
- Reuse `MonthArchive.tsx` and `Analytics.tsx` as tab content.
- Inline whatever `Categories.tsx` does into the Analitik tab.

### 2.2 Tab styling — use the same design language as the sidebar nav

The sidebar nav uses primary green (`bg-primary` or whatever is used in the active state of `DashboardLayout.tsx`'s nav button) for the selected item. Tab triggers must mirror that:
- Container: card-style (`bg-card` + `border` + `rounded-xl/2xl`), matching the rest of the UI.
- Active tab: same primary green background as sidebar active item, white text.
- Inactive tab: transparent or subtle hover (`hover:bg-accent`).
- Padding/typography: match sidebar items (`py-2 px-4`, medium weight).

Implement either:
- (a) A reusable `<ThemedTabs>` wrapper, or
- (b) Inline className overrides in all 3 tab pages.

Either works; pick one and be consistent. Document which in your phase summary.

### 2.3 Delete dead pages
```
client/src/pages/MyBudget.tsx
client/src/pages/SpouseBudget.tsx
client/src/pages/PaymentTracking.tsx
client/src/pages/GoalPlanning.tsx
client/src/pages/Categories.tsx
client/src/pages/ComponentShowcase.tsx
```

### 2.4 Update routing — `client/src/App.tsx`
Replace the route block with:

```tsx
<Route path="/" component={Home} />
<Route path="/gelir-gider" component={GelirGider} />
<Route path="/borc-odemeler" component={BorcOdemeler} />
<Route path="/hedef" component={Hedef} />
<Route path="/raporlar" component={Raporlar} />
<Route path="/ayarlar" component={Settings} />
<Route path="/login" component={Login} />
<Route component={NotFound} />
```

For the old paths (`/gelirler`, `/giderler`, `/borclar`, `/birikim`, `/yillik-odemeler`, `/analitik`, `/butce-limitleri`, `/odeme-takibi`, `/ay-arsivi`, `/hedef-planlama`, `/taksitler`, `/benim-butcem`, `/esimin-butcesi`, plus all English duplicates), add 301 redirects to the new paths. Use `wouter`'s `<Redirect>` component or a custom `<Route>` that redirects.

### 2.5 Update sidebar nav — `client/src/components/DashboardLayout.tsx`
Replace the 13-item `navItems` array with:

```ts
const navItems = [
  { icon: LayoutDashboard, label: "Ana Sayfa",        path: "/" },
  { icon: ArrowLeftRight,  label: "Gelir & Gider",     path: "/gelir-gider" },
  { icon: ClipboardList,   label: "Borç & Ödemeler",  path: "/borc-odemeler" },
  { icon: Target,          label: "Birikim & Hedef",   path: "/hedef" },
  { icon: BarChart3,       label: "Raporlar",          path: "/raporlar" },
  { icon: Settings,        label: "Ayarlar",           path: "/ayarlar" },
];
```

Pick equivalent `lucide-react` icons that exist in the package. If `ArrowLeftRight` or `ClipboardList` aren't available, pick alternates that read clearly.

### 2.6 Update mobile nav — `client/src/components/MobileBottomNav.tsx`
4 main items + "Daha":
- Ana Sayfa
- Gelir & Gider
- Borç & Ödemeler
- Hedef
- ⋯ Daha (popover/sheet with Raporlar + Ayarlar)

### 2.7 Global person filter — new file `client/src/contexts/PersonFilterContext.tsx`
- Context with state: `filter: 'Tümü' | 'Benim' | 'Esim' | 'Ev'`.
- Provider wrapped around the dashboard layout (after auth gate).
- Hook `usePersonFilter()` returns `{ filter, setFilter }`.
- Add a filter chip group at the top of `DashboardLayout` (above page content): `[ Tümü ] [ Yigit ] [ Arzu ] [ Ev ]`. Use `person1Name`/`person2Name` from `PersonContext` for labels.
- Update list components in Incomes, Expenses, Debts, AnnualPayments, Installments, Savings to filter by `owner` based on this context.

### 2.8 Acceptance criteria — Phase 2
- [ ] Sidebar shows 6 items, no more.
- [ ] Mobile nav: 4 main + Daha.
- [ ] Visiting `/gelirler` redirects to `/gelir-gider` (HTTP 301 or client-side replace).
- [ ] Visiting `/borclar` redirects to `/borc-odemeler`.
- [ ] Same for all old paths including English duplicates.
- [ ] `client/src/pages/MyBudget.tsx`, `SpouseBudget.tsx`, `PaymentTracking.tsx`, `GoalPlanning.tsx`, `Categories.tsx`, `ComponentShowcase.tsx` no longer exist.
- [ ] Person filter chip group visible at top, selecting "Yigit" filters lists across all CRUD pages.
- [ ] Tab styling on the 3 tabbed pages matches sidebar active-state design (primary green, card container, rounded).
- [ ] Wave 1/2/3 tests still pass.
- [ ] `pnpm build` clean.

**Commit:** `phase 2: ia consolidation 13→6 nav, tabbed pages, person filter`

---

## Phase 3 — Data model cleanup

### 3.1 `client/src/hooks/useBudgetData.ts` — interface changes

**`Income`:**
- Remove `planned: number` and `actual: number`.
- Add `amount: number`.

**`Expense`:**
- Remove `planned: number` and `actual: number`.
- Add `amount: number`.
- Remove `urgency: 'Zorunlu' | 'Esnek' | 'Gereksiz'`.
- Keep `type`, `status`, `owner`, etc.

**`BudgetLimit`:**
- `owner: 'Benim' | 'Eşim' | 'Ortak'` → **`owner: 'Benim' | 'Esim' | 'Ev'`** (remove Turkish ş, normalize 'Ortak' to 'Ev' to match other entities).

### 3.2 Update all consumers
Search and update `planned`/`actual` references to `amount` in:
- `client/src/contexts/BudgetContext.tsx` (calculateTotals, getCategorySummary)
- `client/src/pages/Incomes.tsx`, `Expenses.tsx` (forms)
- `client/src/components/Dashboard.tsx`
- Analytics, MonthArchive (use `amount` for charts)

Search and remove `urgency` references in:
- `client/src/pages/Expenses.tsx` form and table
- Anywhere `urgency` is read or written

### 3.3 Schema dedup — `drizzle/schema.ts` `familyBudget` table

The table has both `savings: text` and `savingsGoals: text`. Investigate which is actually used:
1. Search for `.savings` and `.savingsGoals` references in `server/db.ts`, `server/routers.ts`, frontend code.
2. Determine which is alive (likely `savingsGoals` based on the `SavingsGoal` interface).
3. Drop the dead column. Generate a new migration: `pnpm exec drizzle-kit generate`.
4. Document your reasoning in the phase summary (which one was kept and why).

### 3.4 Data migration script — new file `scripts/migrate-data-cleanup.ts`

Idempotent script that updates existing rows:
- For every `familyBudget` row and every `familyBudgetHistory` row (the snapshot JSON):
  - Parse `incomes` JSON. For each item: `amount = actual ?? planned ?? 0`, then delete `planned` and `actual` keys.
  - Parse `expenses` JSON. Same dollar transform + delete `urgency` key.
  - Parse `budgetLimits` JSON. Map `owner: 'Eşim' → 'Esim'`, `owner: 'Ortak' → 'Ev'`.
  - Re-stringify and write back.
- Idempotent: re-running on already-migrated data is a no-op.
- Run via: `pnpm tsx scripts/migrate-data-cleanup.ts`.

### 3.5 Acceptance criteria — Phase 3
- [ ] `Income` and `Expense` interfaces have `amount`, no `planned`/`actual`.
- [ ] `Expense` has no `urgency` field.
- [ ] `BudgetLimit.owner` enum is `'Benim' | 'Esim' | 'Ev'`.
- [ ] Adding a new income/expense in the UI shows only `Miktar` field, no `Planlanan/Gerçekleşen`/`Zorunluluk`.
- [ ] Dashboard totals compute correctly (no NaN, no zero where data exists).
- [ ] Migration script runs idempotently. Old test rows convert cleanly.
- [ ] `familyBudget` schema has only one of {`savings`, `savingsGoals`} text columns.
- [ ] Wave 1/2/3 tests still pass.
- [ ] `pnpm build` clean.

**Commit:** `phase 3: data model — amount, urgency removed, owner normalized, savings dedup`

---

## Phase 4 — Auto-rollover (template removal)

### 4.1 Remove template system
- Delete `useRecurringTemplates`, `RecurringTemplate`, related state from `client/src/hooks/useMonthlyArchive.ts`.
- Remove `templates`, `addTemplate`, `updateTemplate`, `deleteTemplate`, `applyTemplatesToCurrentMonth` from `client/src/contexts/BudgetContext.tsx`.
- Delete the "Sabit Gider Şablonları" section from `client/src/pages/Settings.tsx`.
- Clean any localStorage keys related to templates on first load (one-time cleanup).

### 4.2 New hook — `client/src/hooks/useMonthRollover.ts`

```ts
// Pseudocode:
// - Run on app mount (after auth).
// - Read current state via familyBudget.get.
// - Compare budgetData.year + budgetData.month with today's year + month.
// - If today's month > stored month: ROLLOVER
//   - Build new state:
//     - incomes: [] (user enters fresh each month)
//     - expenses: filter type==='Sabit' from previous expenses, regenerate ids, status='Bekliyor', amount preserved, paymentDay/category/owner/notes preserved
//     - debts, savingsGoals, annualPayments, installments, budgetLimits: kept as-is
//     - month, year: today
//   - Save via familyBudget.save (with current expectedUpdatedAt)
//   - Show toast: "Yeni ay açıldı — N sabit gider otomatik eklendi."
// - Edge cases:
//   - No prior data: skip rollover.
//   - Save returned CONFLICT: another device already rolled over; refetch.
//   - Two cookies same family: server's month/year is the truth.
```

Mount this hook once at the top of the dashboard tree (e.g., inside the auth gate after person is loaded).

### 4.3 Stop-recurring UX
- In Expenses table actions, ensure user can change `type` from `Sabit` to `Değişken` (existing edit form). Add a tooltip "Sabit ise her ay otomatik gelir, Değişken tek seferlik."
- Document in Settings page (or a help blurb): "Sabit gideri durdurmak için tipini Değişken yapın veya silin."

### 4.4 Acceptance criteria — Phase 4
- [ ] Settings page does NOT show "Sabit Gider Şablonları" anymore.
- [ ] `useRecurringTemplates` hook does not exist; `BudgetContext` has no `templates`/`addTemplate`/etc.
- [ ] Manual test: add a `Sabit` expense in current month. Either change system clock to next month or temporarily edit `budgetData.month` in DB. Reload app. The expense appears in the new month with `status='Bekliyor'`. Toast appears.
- [ ] Same test with `Değişken` type expense → does NOT auto-appear next month.
- [ ] Delete a `Sabit` expense → does NOT appear in the next rollover.
- [ ] Wave 1/2/3 tests still pass.
- [ ] `pnpm build` clean.

**Commit:** `phase 4: auto-rollover for sabit expenses, template system removed`

---

## Phase 5 — Final polish + naming

### 5.1 Verify rename consistency
Search the codebase for any remaining `Yükümlülükler` / `Yukumluluk` / `Yukumlulukler` references and replace with `Borç & Ödemeler`. Should already be done in Phase 2 but double-check:
- Sidebar nav label
- Mobile nav label
- Page heading
- Comments and TypeScript types
- Browser tab title if set per-route

### 5.2 Update sidebar header to use real names
The screenshot shows "UK Ailesi Butce" (typo) and the panda emoji. If you find a similar literal in `DashboardLayout.tsx` or top bar component, leave it (it's the brand) but make sure typography/casing is consistent.

### 5.3 Consider adding "stop recurring" UI affordance
In the Expenses tab, on the row action menu, add a clear `Tek seferlik yap` action that toggles `type: 'Sabit' → 'Değişken'`. This is the user's escape hatch from auto-rollover.

### 5.4 Acceptance criteria — Phase 5
- [ ] No `Yükümlülükler` strings remain (case-insensitive search).
- [ ] Tab styling consistent across all 3 tabbed pages, matching sidebar active state.
- [ ] No console warnings or React key warnings on any page.
- [ ] `pnpm build` clean.

**Commit:** `phase 5: rename consistency + ux polish`

---

## Phase 6 — Verification

### 6.1 Full test run
```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm dev   # then run smoke tests below
```

### 6.2 Smoke checklist (manual, in browser)

**Auth (Wave 1):**
- [ ] Incognito → forwarded to `/login`.
- [ ] Wrong password → "Şifre hatalı".
- [ ] 11 wrong attempts in 60s → 429.
- [ ] Correct credentials → dashboard.
- [ ] Cookie shows `httpOnly: true, sameSite: Strict` in DevTools.
- [ ] Logout → cookie cleared, redirected to /login.

**Rate limit + validation (Wave 2):**
- [ ] `curl` POST to `familyBudget.save` with 300KB body → 413.
- [ ] tRPC save with `incomes: "deneme"` (invalid JSON) → 400.
- [ ] 200 requests/minute exceeded → 429.

**History (Wave 3):**
- [ ] After saving an expense, Settings → Yedek Geçmişi shows new snapshot with correct savedBy.
- [ ] After 31 saves, count is still 30 (oldest pruned).
- [ ] Restore an old snapshot → current state changes; the pre-restore state is a new history entry.

**IA (Phase 2):**
- [ ] 6 items in sidebar.
- [ ] Tab bars in Gelir & Gider / Borç & Ödemeler / Raporlar match sidebar active styling.
- [ ] Person filter at top filters Incomes/Expenses/Debts list across pages.
- [ ] All redirects from old URLs work.

**Data model (Phase 3):**
- [ ] Income/Expense forms show only `Miktar`, no Planlanan/Gerçekleşen/Zorunluluk.
- [ ] Dashboard totals correct.

**Rollover (Phase 4):**
- [ ] (Test as described in 4.4) Sabit expenses auto-replicate to new month.
- [ ] Settings has no "Sabit Gider Şablonları" section.

### 6.3 Final report
Write a brief summary to the user:
1. Which files were changed/added/deleted in each phase.
2. Any deviations from this spec and why.
3. Any open issues or follow-ups (e.g., "rate limit is in-memory, resets on server restart — Redis swap would be follow-up work").
4. Confirmation that all 6 phases have green acceptance criteria.

After Phase 6 succeeds, the system is ready to deploy via Cloudflare Tunnel or Railway. That deployment is **not** in scope here — this fix list ends at "runs cleanly on local with all acceptance criteria green".
