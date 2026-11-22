# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**mony**: a public, **multi-user** personal-finance SaaS for UK users (it started as the single-user "Vault" tracker). React + Vite + TypeScript frontend; Supabase (Postgres + Auth + Edge Functions) backend. Tenant isolation is enforced by Row Level Security in the database and proven by tests; the client is never trusted.

## Commands

```bash
npm run dev        # Vite dev server at http://localhost:5173 (requires .env.local)
npm run build      # tsc -b && vite build — full type-check + production build
npm run typecheck  # tsc -b --noEmit — type-check only (fast, no esbuild)
npm run preview    # serve the production build
npm run lint       # eslint (import sort/grouping + unused-import removal are lint rules)
npm run lint:fix   # eslint --fix — sort/group imports, drop dead imports
npm run format     # prettier --write . — format the whole tree
npm run format:check  # prettier --check . — CI-friendly, no writes
npm test           # unit tests (Vitest, src/**/*.test.ts), no database
npm run db:start   # local Supabase stack in Docker (applies migrations, serves functions)
npm run db:reset   # rebuild local DB from supabase/migrations
npm run test:db    # pgTAP schema guarantees (supabase/tests)
npm run test:rls   # cross-user attack suite against the LOCAL API (tests/rls)
npm run test:all   # unit + pgTAP + isolation
```

Imports are sorted and grouped by ESLint ([eslint-plugin-simple-import-sort](eslint.config.js)): third-party packages → `@/` internal alias → relative `./`, blank-line separated and alphabetized within each group. Formatting is owned by Prettier ([.prettierrc.json](.prettierrc.json)); `eslint-config-prettier` disables any ESLint rules that would fight it.

`test:db` and `test:rls` need `npm run db:start` first. CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs format, lint, typecheck, unit tests, build, pgTAP and the isolation suite on every pull request. The isolation tests read keys from `supabase status` and refuse to run against a non-loopback URL. Any new table, RPC or Edge Function needs matching cases in `tests/rls/`; a security change isn't done until a test shows the attack fails.

`npm run dev` will throw immediately if `.env.local` is missing or invalid — env is validated by Zod at startup ([src/shared/lib/env.ts](src/shared/lib/env.ts)). Copy `.env.local.example` → `.env.local`; its defaults (URL + the CLI's fixed local publishable key) work as-is against `npm run db:start`. For a hosted project supply its URL + **publishable/anon** key (never the secret/service_role key). Those are the only `VITE_` vars: anything in them ships in the public bundle, so per-user settings belong in `profiles`, not env. `SITE_URL` (not `VITE_`) is build-only: [scripts/seo.ts](scripts/seo.ts) bakes it into the share tags in `index.html` and emits `robots.txt`/`sitemap.xml`; on Vercel it falls back to `VERCEL_PROJECT_PRODUCTION_URL`. `public/og-image.png` is a 1200×630 screenshot of the landing hero (banner dismissed); retake it if the hero changes. Base currency is the constant `BASE_CURRENCY = 'GBP'`. `npm run build` does _not_ need env (validation is runtime, in the browser).

## Phased build — read before adding features

The SaaS conversion runs in **phases with an approval gate**. Don't start a later phase's work without an explicit go-ahead.

- **Phase 1 (done):** audit and plan.
- **Phase 2 (done):** security and multi-tenancy: hardened RLS and grants, composite FKs, DB-level bounds, atomic RPCs, paged reads, per-user profile settings, password reset, data export, account deletion (Edge Function), test suites.
- **Phase 3:** app improvements: loans (borrowed/lent, interest, repayment history), payment method/account fields, recurring transactions, import history and duplicate detection, dashboard insights, onboarding, brand (mony), mobile polish.
- **Phase 4:** landing page and interactive demo (fictional data only, never connected to the DB).
- **Phase 5:** monetisation: Stripe via Edge Functions, server-written billing tables, entitlements.
- **Phase 6:** launch prep: security review, legal pages, deployment docs.

Product decisions already made: free-tier limits are handled manually (not enforced in code); bank data comes from CSV import first, with a pluggable aggregator later (no direct Monzo/Revolut/Wise API claims); don't advertise integrations or compliance that aren't real.

**Phase Control Rule:** at the end of each phase, summarise what was built (files and DB changes), the config needed, how to test it, and open issues, then **stop and wait for approval**.

## Architecture

**Feature-based modularity.** Each domain lives under `src/features/<name>/` and is self-contained; cross-cutting code lives in `src/shared/`. The app is composed in `src/app/` (`App.tsx`, `router.tsx`, `queryClient.ts`).

**Provider nesting** (`src/app/App.tsx`): `ErrorBoundary → ThemeProvider → QueryClientProvider → AuthProvider → RouterProvider`. Anything needing auth/theme/query must sit inside this tree.

**Routing** ([src/app/router.tsx](src/app/router.tsx)): all routes except the dashboard are `lazy()`-loaded for code-splitting. `/login` and `/reset-password` are public; everything else is wrapped in `ProtectedRoute` (redirects to `/login` when no session) then `AppLayout` (sidebar + topbar shell with animated transitions). Add a route by creating `features/<name>/<Name>Page.tsx`, lazy-importing it in the router, and adding an entry to `NAV_ITEMS` in [src/shared/navigation.ts](src/shared/navigation.ts).

**Auth** ([src/features/auth/](src/features/auth/)): `AuthProvider` wraps Supabase auth (password, magic link for existing users only, signup, password reset) and exposes `useAuth()`. Every auth email (templates in [supabase/templates/](supabase/templates/)) links to `/auth/confirm?token_hash=…&type=…`, where [AuthConfirmPage](src/features/auth/AuthConfirmPage.tsx) calls `verifyOtp`, so links work in any browser; the hosted project must use the same templates. A reset session must set a new password before using the app (flag kept per tab in sessionStorage, [authLink.ts](src/features/auth/authLink.ts)). It clears the TanStack Query cache whenever the signed-in user changes, so one user's data can't render for the next person. `useInactivityLogout` uses the profile's `inactivity_timeout_minutes`. Auth policy (email confirmation, password rules, redirect allowlist) is in [supabase/config.toml](supabase/config.toml); [password.ts](src/features/auth/password.ts) mirrors it client-side.

**Data access:** all reads/writes go through the single Supabase client ([src/shared/lib/supabase.ts](src/shared/lib/supabase.ts)). Security is enforced by **Row Level Security in the database, not the client** — the anon key alone grants nothing. Use TanStack Query (configured in `src/app/queryClient.ts`) for server state. Per-feature convention: each module has an `api.ts` (raw Supabase calls) + `hooks.ts` (TanStack Query wrappers). Mutations that affect totals invalidate both their own key and `['dashboard']`.

**Row cap:** PostgREST returns at most `max_rows` (1,000) per request, _silently_. Any read that may exceed it must go through [fetchAll](src/shared/lib/fetchAll.ts) with a deterministic order ending in `id`, or be aggregated in Postgres (e.g. the `account_balance()` RPC). Never sum an unpaged `select`.

**Privileged operations** run in Edge Functions ([supabase/functions/](supabase/functions/)), never the browser. `delete-account` identifies the caller from their JWT, requires a typed email confirmation and a sign-in within the last 30 minutes, then calls `auth.admin.deleteUser`; every table cascades from `auth.users`. RPCs that write are `security invoker` so RLS still applies.

**Money entry & FX:** monetary input uses the shared `CurrencyAmountField` ([src/features/fx/CurrencyAmountField.tsx](src/features/fx/CurrencyAmountField.tsx)). For non-base currencies it auto-fetches the rate _as of the transaction date_ from Frankfurter ([src/features/fx/fxService.ts](src/features/fx/fxService.ts)), caches it in `exchange_rates`, but always lets the user override; the rate + `amount_base` are then frozen on the row. FX fetches never throw to the UI — on failure the field falls back to manual entry.

**Schema↔types gotcha:** `Database` ([src/shared/types/database.ts](src/shared/types/database.ts)) wraps each table in a `TableDef` helper that adds the `Relationships: []` key and `Flatten`s the row `interface` — both are required for postgrest-js to recognize the schema (otherwise every table resolves to `never`). `Insertable` makes server-managed and nullable columns optional on insert.

## Critical invariants

- **RLS on everything.** Every table has `enable` + `force` RLS with owner-only policies `to authenticated` using `(select auth.uid())`; `anon` has no table privileges. New tables MUST follow the pattern in [0003_security_hardening.sql](supabase/migrations/0003_security_hardening.sql): `user_id uuid not null default auth.uid() references auth.users on delete cascade`, policies, bounds checks. The pgTAP suite fails if they don't. `audit_logs` is read-only to clients (server-side writers only).
- **Same-owner references.** FK checks bypass RLS, so any reference to another user-owned table must be a composite `(user_id, x_id)` FK (see the category FKs). Never a plain `x_id` FK to user data.
- **Profiles** are created by the sign-up trigger and updatable only through column-level grants (`display_name`, `base_currency`, `inactivity_timeout_minutes`, `internal_transfer_names`). Adding an editable column means adding it to that grant.
- **Money & frozen FX.** Amounts are `numeric(14,2)`; FX rates `numeric(18,8)`. Every monetary row stores `amount_original`, `currency_original`, `exchange_rate`, and a converted `amount_base` frozen at entry time: moving rates never rewrite history, though a user editing a row may change it. Base currency is GBP.
- **Soft deletes** (`deleted_at`) on transactional tables (`expenses`, `income`); filter `deleted_at is null` in queries (partial indexes already assume this).
- **Schema ↔ types contract.** SQL lives in `supabase/migrations/`; the hand-maintained TypeScript mirror is [src/shared/types/database.ts](src/shared/types/database.ts). Changing one means changing the other — they are not auto-generated.

## Conventions

- **Theming:** never hardcode colors. Use the semantic Tailwind tokens (`bg`, `surface`, `surface-2`, `border`, `content`, `content-muted`, `brand`, `success`, `danger`, `warning`) which resolve to CSS variables defined per-theme in [src/index.css](src/index.css). Reusable classes: `.card` (24px radius, white), `.card-feature` (the one highlighted card per view), `.input` (pill), `.btn-primary` / `.btn-ghost` (pills), `.icon-badge` (round dark-green disc, lime glyph). Palette: deep green `#1B3530`/`#112320`, lime `#C7F269`, grey `#ECECEC`; font Manrope (Google Fonts, in `index.html`). Logo: the "rising y" ([Logo.tsx](src/shared/components/Logo.tsx), `--logo-*` tokens), kept in sync with `public/favicon.svg`. Dark mode is class-based on `<html>`.
- **Icons:** add to the inline set in [src/shared/components/Icon.tsx](src/shared/components/Icon.tsx) (no icon library is installed).
- **Imports:** use the `@/` alias for `src/`. Ordering is enforced by ESLint (`simple-import-sort`), so let `npm run lint:fix` sort them — don't hand-order. Groups: third-party → `@/` alias → relative `./`, blank-line separated and alphabetized within each group. Unused imports are auto-removed (`unused-imports`).
- **Formatting:** owned by Prettier ([.prettierrc.json](.prettierrc.json)) — run `npm run format` (or wire up format-on-save). Never hand-format; `eslint-config-prettier` keeps ESLint from fighting it.
- **Forms:** React Hook Form + Zod for standalone forms (e.g. login). Modal CRUD forms (expense/income/category) use local `useState` + manual validation because they embed the async, self-managing `CurrencyAmountField`.
- **Shared UI primitives:** `Modal`, `Toast` (via `useToast()`, provider in App tree), `Skeleton`, `EmptyState`, `FilterBar`, `StatCard`, `PageHeader`. Prefer these over bespoke versions.
