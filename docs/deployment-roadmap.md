# Roadmap: self-hosted + cloud editions of afba

_Written 2026-10-01. Update this file as decisions are made and phases ship._

## Context
Today afba is a single-household app run on one private server.

The goal is two editions:
- **Self-hosted:** free to run. Bank sync through Plaid is a paid add-on.
- **Cloud:** you host it. People sign up for their own account, on a free tier (1 connected account) or a paid tier.

This is a roadmap, not a single change. Each phase below would get its own implementation plan.

### Where the code stands today (what blocks this)
| Area | Today | Problem for the two editions |
|---|---|---|
| Tenancy | Everything hangs off `HOUSEHOLD_ID = 'root-user'` (`app/lib/household.ts`, 16 uses). `transactions`, `categories`, `accounts`, `scheduledTransactions` and `streamOverrides` have no owner field. | Cloud users would all see each other's data. |
| Auth | Better Auth with `disableSignUp`, `useSecureCookies: false` and invite-only via `/setup` (`app/lib/auth.ts`). | Cloud needs public sign-up, email verification, password reset and secure cookies. |
| Config | Mongo URI hardcoded in `app/lib/mongodb.ts`. No edition switch. | Can't point at a managed DB, and can't turn cloud-only behavior on or off. |
| Plaid tokens | `plaidAccessToken` stored in plain text in the `users` collection. | Unacceptable for a hosted product, and Plaid's security review will ask about it. |
| Sync | Only user-triggered (`app/api/transactions/sync`). No webhooks or background jobs. Forecast and balance call Plaid live on every page load. | Cloud data goes stale, and Plaid costs scale with page views. |
| Safety net | No tests, no license file, no schema migrations, version `0.1.0`. | A paid product needs tests on money math and tenant isolation, a license and safe upgrades. |

## Decisions to make first
These shape everything below.

1. **How self-hosters pay for Plaid.** Plaid's terms don't let you hand your API keys to self-hosters, so the options are:
   - **Recommended: a hosted "bank connector" (relay).** Self-hosted instances get bank data through your cloud API, using your Plaid account, with a paid subscription key. You hold their Plaid access tokens. Be upfront about that in the self-hosting docs. It's the same model Actual Budget and Maybe use with SimpleFIN/Plaid bridges.
   - **Alternative: bring your own Plaid keys.** Free, but then you have no way to charge for bank sync.
2. **License.** To stop others reselling your cloud, use AGPL-3.0, or a source-available license such as FSL or BSL that converts to open source after 2 years.
3. **Billing provider.**
   - **Stripe:** Better Auth has an official Stripe plugin for subscriptions. You handle sales tax yourself with Stripe Tax.
   - **Paddle or Lemon Squeezy:** they act as merchant of record and handle sales tax and VAT for you.
4. **What "1 account" means for the free tier.** Limit by Plaid *Items* (bank logins). Plaid bills per Item, and one login can carry several accounts.

## Phases

### Phase 1: Foundations (both editions)
- Read the Mongo URI and all secrets from environment variables, and add `AFBA_EDITION=selfhosted|cloud` with a small `app/lib/edition.ts` for feature flags.
- Encrypt Plaid access tokens at rest. Use AES-GCM with a key from the environment (KMS in the cloud). Write a migration that encrypts existing tokens.
- Add schema migrations: a `migrations` collection and numbered scripts run at startup. Upgrades for self-hosters depend on this.
- Add a test setup (Vitest plus a throwaway Mongo) and cover the critical areas:
  - Budget, KPI, forecast and spending math, including `app/lib/forecast.ts` and `app/queries/*`.
  - Tenant isolation, once Phase 2 is done.
- Run lint, tests and an image build in CI (GitHub Actions). Publish versioned images (`denningta/afba:1.x`), not just `latest`.

### Phase 2: Multi-tenancy (required for the cloud)
- Introduce a **household** (tenant) document. Map Better Auth users to households, and keep the current admin/member roles within a household.
- Add `householdId` to every domain collection and index it. Scope every query and aggregation by it:
  - `app/queries/*`, including the `$lookup` pipelines and `getBudgetAccountMatch()`.
  - API routes that read `HOUSEHOLD_ID`.
- Resolve the household from the session in one helper, e.g. `requireHousehold()` next to `requireAdmin()` in `app/lib/session.ts`, and remove the `HOUSEHOLD_ID` constant.
- Use the household id as Plaid's `client_user_id`.
- Self-hosted keeps working as a single household created by `/setup`, with the same code path.
- Migration: assign all existing documents to the first household.
- Tests: user A can never read or write household B's data through any API route.

### Phase 3: Accounts and auth for the cloud
- Public sign-up when `edition=cloud`: email verification and password reset through an email provider such as Resend or Postmark. Add OAuth (Google, Apple) if wanted.
- Secure cookies and HTTPS-only in the cloud. Keep the LAN-friendly settings for self-hosted.
- Invite other members to a household by email. Today an admin creates them directly.
- Account deletion and data export, needed for GDPR/CCPA and Plaid's requirements. Deletion must also call Plaid `/item/remove`.
- Rate limiting and brute-force protection on auth and API routes.

### Phase 4: Plaid as a paid, metered capability
- **Plaid production access:** company details, the security questionnaire, a privacy policy, and an end-user data consent flow in Link. This takes weeks, so start early, in parallel with Phase 1.
- **Webhooks:** add `SYNC_UPDATES_AVAILABLE` and `ITEM` error/expiry handling, with a background job that runs `/transactions/sync`. Remove the reliance on manual sync.
- **Cache balances and recurring streams** instead of calling Plaid on every forecast or balance page view (`app/api/forecast`, `app/api/balance`). This keeps per-user cost predictable.
- **Entitlements:** a function such as `canConnectItem(household)`, checked in `create-link-token` and `exchange-public-token`. Free cloud gets 1 Item; paid gets N or unlimited. Show an upgrade prompt in the Connect page.
- **Relay for self-hosters** (if decision 1 is the relay): a small authenticated API on the cloud side, keyed per self-hosted instance and tied to a paid subscription. It exposes link-token, exchange, sync, balance and recurring endpoints. The self-hosted app calls this instead of Plaid when `PLAID_MODE=relay`.

### Phase 5: Billing
- Subscriptions with a free plan and a paid plan (monthly and yearly). Use the Better Auth Stripe plugin, or the chosen merchant of record.
- Webhook-driven plan state on the household.
- On downgrade: keep data, pause syncing for Items above the limit, and let the user choose which Item stays.
- The same subscription backs the self-hosted relay key.

### Phase 6: Operating the cloud
- **Hosting:** managed Mongo (Atlas) with backups and point-in-time restore. The app runs on a container platform such as Fly, Render or ECS with HTTPS.
- **Observability:** error tracking (Sentry), structured logs, uptime checks, and alerts on Plaid webhook and sync failures.
- **Background worker** for sync jobs and webhook processing, separate from web requests.
- **Status page and support channel.**

### Phase 7: Legal, docs and launch
- Terms of service, privacy policy, a data-processing disclosure, and Plaid's end-user privacy language.
- Self-hosting docs: the compose file, environment reference, upgrade guide, backups (reuse `scripts/sync-db.sh` ideas), and the relay add-on.
- A marketing and pricing page, and onboarding for new cloud users: link a bank or import CSV, then create the first budget from a template.
- Optional opt-in telemetry for self-hosters.

## Suggested order
1. Start Plaid production access right away, since it has the longest lead time.
2. Phase 1, then Phase 2. Multi-tenancy is the biggest refactor, so do it before adding more features.
3. Phases 3 and 4 in parallel, then Phase 5, then Phases 6 and 7 for launch.
4. A self-hosted release can ship after Phases 1, 4 (relay) and 5, without waiting for the cloud.

## Verification (per phase)
- Every phase lands with tests in CI. Phase 2 also includes an automated cross-tenant access test across all API routes.
- Migrations are tested by restoring a production snapshot (`npm run db:restore`) and running them.
- Plaid flows are tested end to end in the Plaid sandbox (webhooks fired with `/sandbox/item/fire_webhook`) before switching to production.
- Billing is tested with Stripe test mode and test clocks for upgrades, downgrades and failed payments.
