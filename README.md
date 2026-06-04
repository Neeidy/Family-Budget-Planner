# Vienna Budget Planner

A trilingual (🇹🇷 Türkçe · 🇬🇧 English · 🇦🇹 Deutsch) family budget planner for an
Austrian household — track income, expenses, debts, installments, annual
payments, and savings goals, with fully locale-aware currency/date formatting
and an installable PWA.

**Live demo:** https://demo.aileplan.uk — public, sample data, no login required.

## Features

- **Complete budgeting model** — incomes, fixed/variable expenses, debts,
  installments, annual payments, savings goals, and per-category budget limits.
- **Trilingual UI** — TR / EN / DE via i18next with a compact language switcher.
  Money, dates, and month names render per locale (EUR formatted as `tr-TR`,
  `en-GB`, or `de-AT`), and category names are localized too.
- **Reports** — category breakdowns, per-owner splits, and spend charts.
- **Monthly archive & rollover** — snapshot each month and carry balances forward.
- **Demo mode** — the public demo serves hardcoded sample data with
  locale-translated labels; all mutations are disabled server-side.
- **PWA** — installable, offline-tolerant app shell (vite-plugin-pwa / Workbox).
- **Cookie-based family auth** — a single shared household password (no per-user
  accounts); the password is stored only as a hash in `.env`, never in the repo.

## Tech stack

| Layer    | Tech                                                |
| -------- | --------------------------------------------------- |
| Frontend | React 19, Vite 7, Tailwind CSS v4, wouter, i18next  |
| API      | Express, tRPC v11, superjson                        |
| Data     | Drizzle ORM, MySQL 8                                |
| Tooling  | pnpm 10, TypeScript (strict mode), Vitest           |
| Delivery | PWA (Workbox), Cloudflare Tunnel ingress            |

## Getting started

Prerequisites: Node 20+, pnpm 10, and MySQL 8 running locally on port 3306.

```bash
# 1. Create the database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS viyana_budget CHARACTER SET utf8mb4;"

# 2. Configure environment — copy the template and fill in real values
cp .env.example .env

#    Generate the family password hash and paste it into FAMILY_PASSWORD_HASH:
pnpm tsx scripts/hash-family-password.ts <your-password>

#    Generate a cookie secret and paste it into FAMILY_COOKIE_SECRET:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Install, migrate, run
pnpm install
pnpm exec drizzle-kit migrate
pnpm dev
```

The app starts on http://localhost:3000.

## Scripts

```bash
pnpm dev                 # dev server (Vite + tRPC API)
pnpm build               # production build
pnpm test                # Vitest suite
pnpm exec tsc --noEmit   # type-check
```

## Project layout

```
client/    React app — pages, components, contexts, and i18n locales
server/    Express + tRPC API, family auth, and demo data
shared/    Code shared by client and server (categories, demo translations)
drizzle/   ORM schema and migrations
scripts/   CLI helpers (e.g. password hashing)
```

## License

MIT — see [LICENSE](./LICENSE).

---

Built by [Yigitcan Uk](https://www.linkedin.com/in/yigitcanuk/)
· [GitHub](https://github.com/Neeidy)
