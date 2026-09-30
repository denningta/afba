# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"afba" (Another Funky Budgeting App) — a personal budgeting app built on Next.js 16 / React 19 with MongoDB, integrating Plaid for bank/transaction sync. Single-user, self-hosted via Docker.

## Common Commands

```bash
npm run dev          # Next dev server on :3000 (expects mongodb on localhost:27017)
npm run dev:docker   # Full stack (app + mongo) via docker-compose.dev.yml; opens localhost:3000 in the browser unless a tab is already open
npm run dev:debug    # Dev server with Node inspector on :9229
npm run build        # Production Next build (output: 'standalone')
npm run lint         # next lint (eslint config: next/core-web-vitals)
npm run publish      # Build + push production Docker image to denningta/afba:latest
npm run db:sync [user@host]   # Stream prod MongoDB into the local dev container + save a snapshot in backup/ (host defaults to REMOTE_DB_HOST)
npm run db:restore            # Restore local DB from the newest backup/ snapshot (or `-- <file>`)
docker exec -it afba node scripts/reset-password.mjs <email> [--admin]   # Lockout recovery: set a password (and optionally make admin)
```

There is no test suite in this repo.

## Architecture

This is a single Next.js app that combines UI, API, and data access:

- **`app/`** — Next.js App Router. Signed-in pages live in the `app/(app)/` route group (sidebar shell: `budget`, `transactions`, `calendar`, `balance`, `connect`, `upload`, `settings`); `/login` and `/setup` are in `app/(auth)/`. API routes under **`app/api/<resource>/route.ts`** live here. There is no separate backend.
- **`app/api/`** — REST-ish endpoints (transactions, categories, accounts, budget-summary, budget-vs-actual, plus Plaid endpoints: `create-link-token`, `exchange-public-token`, `update-link-token`, `items`, `transactions/sync`).
- **`app/queries/`** — Mongo aggregation/query logic per resource (`transactions.ts`, `categories.ts`, `budgetVsActual.ts`, …). API route handlers stay thin and delegate here.
- **`app/lib/mongodb.ts`** — Singleton `MongoClient` connecting to `mongodb://mongodb:27017/afba`. Hostname `mongodb` is the docker-compose service name; running `npm run dev` (not `dev:docker`) requires that hostname to resolve (e.g., via `/etc/hosts` or by editing the URI).
- **`accounts` collection** (`app/queries/accounts.ts`) — Local cache of Plaid account metadata plus the user's `includeInBudget` flag, refreshed from Plaid by `refreshAccounts()`. Includes a `manual` pseudo-account for transactions without an `account_id`. Every budget aggregation must prepend `getBudgetAccountMatch()` to its transactions `$lookup` pipeline so excluded accounts don't count.
- **Auth** — Better Auth (`app/lib/auth.ts`, email + password, admin plugin) with its own `authUsers`/`authSessions`/`authAccounts` collections. Household model: every signed-in user shares the one budget; role `admin` also manages users (`/settings/users`) and bank connections, role `member` just uses the budget. `proxy.ts` checks the session on every page and API request (401 JSON for API, redirect to `/login` for pages); admin-only API routes also call `requireAdmin()` from `app/lib/session.ts`. No self sign-up: the first admin is created at `/setup` while no users exist. Plaid data stays under the household id `HOUSEHOLD_ID` (`app/lib/household.ts`), not per person.
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
- Required vars: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` (sandbox/development/production), `BETTER_AUTH_SECRET` (signs sessions; changing it signs everyone out), `BETTER_AUTH_URL` (the app's main address). Optional: `BETTER_AUTH_TRUSTED_ORIGINS` (comma-separated other addresses people sign in from, wildcards allowed, e.g. `http://192.168.1.*:3000`). `REMOTE_DB_HOST` is read by `scripts/sync-db.sh`.

## Deployment

Production runs as a single Docker image (`denningta/afba`) alongside a `mongo` container on the prod host. The build uses `next.config.mjs` `output: 'standalone'`. `prod.Dockerfile` builds the image; `docker-compose.yml` is the production compose file. See `README.md` for syncing prod data to local dev (`scripts/sync-db.sh`).

## Gotchas

- Mongo connection URI is **hardcoded** to `mongodb://mongodb:27017/afba` in `app/lib/mongodb.ts`. Local `npm run dev` (outside Docker) won't connect without DNS for `mongodb` or a code change.
- The Docker dev image installs deps with `--legacy-peer-deps`. Match this when reproducing build issues locally.
- `GEMINI.md` exists with similar overview content but mentions `.eslintrc.json` — the actual ESLint config is the flat-config `eslint.config.mjs`. Trust this file over `GEMINI.md` where they conflict.
