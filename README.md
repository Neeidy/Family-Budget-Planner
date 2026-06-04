<div align="center">

# 💶 Family Budget Planner

***plan together — every euro, in three languages***

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![tRPC](https://img.shields.io/badge/tRPC-v11-2596BE?logo=trpc&logoColor=white)
![Drizzle + MySQL](https://img.shields.io/badge/Drizzle%20%2B%20MySQL-8-4479A1?logo=mysql&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-TR%20%C2%B7%20EN%20%C2%B7%20DE-22C55E)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)
![license](https://img.shields.io/badge/license-MIT-blue)

</div>

> A self-hosted family budget planner with a fully localized **TR · EN · DE** UI,
> a public demo backed by locale-overlaid sample data, and a strict
> production/demo split.

**Family Budget Planner** helps an Austrian household track income, expenses,
debts, installments, annual payments, and savings goals — with money, dates, and
category names all rendered per locale, an installable PWA shell, and
cookie-based family auth. The public demo serves hardcoded sample data with
mutations disabled; real household data never touches it.

**🔗 Live demo:** [demo.aileplan.uk](https://demo.aileplan.uk) — no login, sample data.

---

## Features

- **Complete budgeting model** — incomes, fixed/variable expenses, debts,
  installments, annual payments, savings goals, and per-category budget limits.
- **Trilingual UI** — 🇹🇷 / 🇬🇧 / 🇦🇹 via i18next. Currency (EUR), dates, month
  names, and category labels all format per locale (`tr-TR` · `en-GB` · `de-AT`).
- **Reports** — category breakdowns, per-owner splits, and spend charts.
- **Monthly archive & rollover** — snapshot each month, carry balances forward.
- **Demo mode** — the public demo serves locale-translated sample data and is
  read-only server-side (all mutations `FORBIDDEN`).
- **PWA** — installable, offline-tolerant app shell (Workbox).
- **Cookie-based family auth** — one shared household password, stored only as a
  hash in `.env` (never in the repo).

## Tech stack

| Layer    | Tech                                                |
| -------- | --------------------------------------------------- |
| Frontend | React 19, Vite 7, Tailwind CSS v4, wouter, i18next  |
| API      | Express, tRPC v11, superjson                        |
| Data     | Drizzle ORM, MySQL 8                                |
| Tooling  | pnpm 10, TypeScript (strict mode), Vitest           |
| Delivery | PWA (Workbox), Cloudflare Tunnel ingress            |

## Architecture

```
client/  ──  React 19 SPA (wouter · i18next · Tailwind v4)
   │            pages · components · contexts · /locales (tr, en, de)
   │   tRPC over HTTP (superjson, cookie auth)
   ▼
server/  ──  Express + tRPC v11
   │            family auth · demo overlay (isGuest) · routers
   │   Drizzle ORM
   ▼
MySQL 8  ──  single-family budget document

shared/  ──  categories + demo translations (used by client ⇄ server)
```

## Getting started

Prerequisites: Node 20+, pnpm 10, and MySQL 8 running locally on port 3306.

```bash
# 1. Create the database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS viyana_budget CHARACTER SET utf8mb4;"

# 2. Configure environment — copy the template, fill in real values
cp .env.example .env
pnpm tsx scripts/hash-family-password.ts <your-password>                  # → FAMILY_PASSWORD_HASH
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"  # → FAMILY_COOKIE_SECRET

# 3. Install, migrate, run
pnpm install
pnpm exec drizzle-kit migrate
pnpm dev          # http://localhost:3000
```

## Scripts

```bash
pnpm dev                 # dev server (Vite + tRPC API)
pnpm build               # production build
pnpm test                # Vitest suite
pnpm exec tsc --noEmit   # type-check
```

## License

MIT — see [LICENSE](./LICENSE).

---

<div align="center">

Built by [Yigitcan Uk](https://www.linkedin.com/in/yigitcanuk/) · [GitHub](https://github.com/Neeidy)

</div>
