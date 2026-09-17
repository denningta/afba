# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"afba" (Another Funky Budgeting App) — a personal budgeting app built on Next.js 16 / React 19 with MongoDB, integrating Plaid for bank/transaction sync. Single-user, self-hosted via Docker.

## Common Commands

```bash
npm run dev          # Next dev server on :3000 (expects mongodb on localhost:27017)
npm run dev:docker   # Full stack (app + mongo) via docker-compose.dev.yml
npm run dev:debug    # Dev server with Node inspector on :9229
npm run build        # Production Next build (output: 'standalone')
npm run lint         # next lint (eslint config: next/core-web-vitals)
npm run publish      # Build + push production Docker image to denningta/afba:latest
npm run db:sync <user@host>   # Pull prod MongoDB dump to local container (see scripts/sync-db.sh; needs REMOTE_DB_HOST in .env)
```

There is no test suite in this repo.

## Architecture

This is a single Next.js app that combines UI, API, and data access:

- **`app/`** — Next.js App Router. Both server-rendered pages (`page.tsx` under `app/budget`, `app/transactions`, `app/calendar`, `app/balance`, `app/connect`, `app/upload`) and API routes under **`app/api/<resource>/route.ts`** live here. There is no separate backend.
- **`app/api/`** — REST-ish endpoints (transactions, categories, accounts, budget-summary, budget-vs-actual, plus Plaid endpoints: `create-link-token`, `exchange-public-token`, `update-link-token`, `items`, `transactions/sync`).
- **`app/queries/`** — Mongo aggregation/query logic per resource (`transactions.ts`, `categories.ts`, `budgetVsActual.ts`, …). API route handlers stay thin and delegate here.
- **`app/lib/mongodb.ts`** — Singleton `MongoClient` connecting to `mongodb://mongodb:27017/afba`. Hostname `mongodb` is the docker-compose service name; running `npm run dev` (not `dev:docker`) requires that hostname to resolve (e.g., via `/etc/hosts` or by editing the URI).
- **`app/lib/plaid.ts`** — Plaid SDK client; environment selected by `PLAID_ENV` (defaults to `sandbox`), credentials from `PLAID_CLIENT_ID` / `PLAID_SECRET`.
- **`app/hooks/`** — SWR-based data hooks (`useTransactions`, `useBudgetOverview`, `useBudgetVsActual`, `useCategories`, `useSyncTransactions`, …). UI components consume these rather than fetching directly.
- **`app/components/`** — App-specific React components (Sidebar, budget/calendar/transactions widgets, Plaid Link integration, upload, table filtering UI). Stateful business components.
- **`app/context/CategoryProvider.tsx`** — Global category state, wrapped around the tree in `app/layout.tsx`.
- **`app/interfaces/`** — Shared TypeScript types (transactions, balance, categories). These are the de-facto schema, since MongoDB collections are schemaless.
- **`components/ui/`** (NOT `app/components/ui/`) — shadcn/ui primitives. Configured via `components.json` with style `radix-nova`, base color `neutral`, alias `@/components/ui`. Add new primitives with `npx shadcn@latest add <component>`.
- **`lib/utils.ts`** — `cn()` helper (clsx + tailwind-merge).

Two component trees coexist by design: `components/ui/*` are generic shadcn primitives (kept editable per shadcn convention), while `app/components/*` are feature components composed from those primitives plus Tremor/MUI/visx widgets.

### Path aliases

`@/*` maps to repo root (see `tsconfig.json`). So `@/components/ui/button` resolves to `components/ui/button.tsx` and `@/lib/utils` to `lib/utils.ts`. App-internal imports use relative paths inside `app/`.

### Styling

Tailwind v4 (`@tailwindcss/postcss`) with `tailwind.config.ts` listing `darkMode: ["class"]`. Theme is managed by `next-themes` via `ThemeProvider` in `app/layout.tsx`. The app mixes Tailwind, Tremor (`@tremor/react`), and MUI components — colors are driven by CSS variables in `app/globals.css`.

### Charts & tables

Charting uses **Tremor**, **Recharts**, and **visx** (different chart types pick different libs — don't assume one). Data grids use **@tanstack/react-table**.

## Environment

- `.env.development` is loaded when running `dev:docker`; `.env` is loaded for the production compose stack.
- Required vars: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` (sandbox/development/production). `REMOTE_DB_HOST` is read by `scripts/sync-db.sh`.

## Deployment

Production runs as a single Docker image (`denningta/afba`) alongside a `mongo` container on the prod host. The build uses `next.config.mjs` `output: 'standalone'`. `prod.Dockerfile` builds the image; `docker-compose.yml` is the production compose file. See `README.md` for the backup/restore procedure for the `afba_data` volume.

## Gotchas

- Mongo connection URI is **hardcoded** to `mongodb://mongodb:27017/afba` in `app/lib/mongodb.ts`. Local `npm run dev` (outside Docker) won't connect without DNS for `mongodb` or a code change.
- The Docker dev image installs deps with `--legacy-peer-deps`. Match this when reproducing build issues locally.
- `GEMINI.md` exists with similar overview content but mentions `.eslintrc.json` — the actual ESLint config is the flat-config `eslint.config.mjs`. Trust this file over `GEMINI.md` where they conflict.
