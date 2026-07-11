# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Vault" — a single-user, **local-first** personal expense tracker replacing a Google Sheets workflow. React + Vite + TypeScript frontend; Supabase (Postgres + Auth) backend with strict Row Level Security. Not a SaaS, not multi-tenant.

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
```

Imports are sorted and grouped by ESLint ([eslint-plugin-simple-import-sort](eslint.config.js)): third-party packages → `@/` internal alias → relative `./`, blank-line separated and alphabetized within each group. Formatting is owned by Prettier ([.prettierrc.json](.prettierrc.json)); `eslint-config-prettier` disables any ESLint rules that would fight it.

There is **no test runner yet** (testing is planned for Phase 5). When adding tests, wire the runner into `package.json` before assuming `npm test` exists.

`npm run dev` will throw immediately if `.env.local` is missing or invalid — env is validated by Zod at startup ([src/shared/lib/env.ts](src/shared/lib/env.ts)). Copy `.env.local.example` → `.env.local` and supply the Supabase URL + **anon** key (never the service_role key). `npm run build` does _not_ need env (validation is runtime, in the browser).

## Phased build — read before adding features

This project follows a **mandatory phased build** with an approval gate. Do not jump ahead to a later phase's modules without explicit user go-ahead.

- **Phase 1 (done):** foundation — setup, Supabase + Auth, schema + RLS, theme, app shell.
- **Phase 2 (done):** Expenses, Income, Categories (full CRUD), live Dashboard data, search & filtering, FX auto-fetch.
- **Phase 3:** Budgets, Savings goals, Loans, Subscriptions.
- **Phase 4:** Reports & charts, Import (CSV/Excel/PDF), multi-currency refinement.
- **Phase 5:** Offline PWA, performance, testing, UX polish.

**Phase Control Rule:** at the end of each phase, summarize what was built, explain decisions and trade-offs, suggest improvements, then **stop and wait for approval**. Pages for not-yet-built modules render the `ComingSoon` placeholder ([src/shared/components/ComingSoon.tsx](src/shared/components/ComingSoon.tsx)) — replacing one is how a module graduates from placeholder to real.

## Architecture

**Feature-based modularity.** Each domain lives under `src/features/<name>/` and is self-contained; cross-cutting code lives in `src/shared/`. The app is composed in `src/app/` (`App.tsx`, `router.tsx`, `queryClient.ts`).

**Provider nesting** (`src/app/App.tsx`): `ErrorBoundary → ThemeProvider → QueryClientProvider → AuthProvider → RouterProvider`. Anything needing auth/theme/query must sit inside this tree.

**Routing** ([src/app/router.tsx](src/app/router.tsx)): all routes except the dashboard are `lazy()`-loaded for code-splitting. `/login` is public; everything else is wrapped in `ProtectedRoute` (redirects to `/login` when no session) then `AppLayout` (sidebar + topbar shell with animated transitions). Add a route by creating `features/<name>/<Name>Page.tsx`, lazy-importing it in the router, and adding an entry to `NAV_ITEMS` in [src/shared/navigation.ts](src/shared/navigation.ts).

**Auth** ([src/features/auth/](src/features/auth/)): `AuthProvider` wraps Supabase auth (password, OTP magic-link, signup) and exposes `useAuth()`. Sessions persist and auto-refresh. `useInactivityLogout` signs the user out after `VITE_INACTIVITY_TIMEOUT_MINUTES`.

**Data access:** all reads/writes go through the single Supabase client ([src/shared/lib/supabase.ts](src/shared/lib/supabase.ts)). Security is enforced by **Row Level Security in the database, not the client** — the anon key alone grants nothing. Use TanStack Query (configured in `src/app/queryClient.ts`) for server state. Per-feature convention: each module has an `api.ts` (raw Supabase calls) + `hooks.ts` (TanStack Query wrappers). Mutations that affect totals invalidate both their own key and `['dashboard']`.

**Money entry & FX:** monetary input uses the shared `CurrencyAmountField` ([src/features/fx/CurrencyAmountField.tsx](src/features/fx/CurrencyAmountField.tsx)). For non-base currencies it auto-fetches the rate _as of the transaction date_ from Frankfurter ([src/features/fx/fxService.ts](src/features/fx/fxService.ts)), caches it in `exchange_rates`, but always lets the user override; the rate + `amount_base` are then frozen on the row. FX fetches never throw to the UI — on failure the field falls back to manual entry.

**Schema↔types gotcha:** `Database` ([src/shared/types/database.ts](src/shared/types/database.ts)) wraps each table in a `TableDef` helper that adds the `Relationships: []` key and `Flatten`s the row `interface` — both are required for postgrest-js to recognize the schema (otherwise every table resolves to `never`). `Insertable` makes server-managed and nullable columns optional on insert.

## Critical invariants

- **RLS on everything.** Every table has `enable` + `force` RLS with an owner-only policy keyed on `auth.uid()`; there are no public policies. New tables MUST follow this pattern (see [supabase/migrations/0001_initial_schema.sql](supabase/migrations/0001_initial_schema.sql)). `audit_logs` is append-only (select + insert only).
- **Money & frozen FX.** Amounts are `numeric(14,2)`; FX rates `numeric(18,8)`. Every monetary row stores `amount_original`, `currency_original`, `exchange_rate`, and a converted **`amount_base` that is immutable** — historical values never change when rates move. Base currency is GBP.
- **Soft deletes** (`deleted_at`) on transactional tables (`expenses`, `income`); filter `deleted_at is null` in queries (partial indexes already assume this).
- **Schema ↔ types contract.** SQL lives in `supabase/migrations/`; the hand-maintained TypeScript mirror is [src/shared/types/database.ts](src/shared/types/database.ts). Changing one means changing the other — they are not auto-generated.

## Conventions

- **Theming:** never hardcode colors. Use the semantic Tailwind tokens (`bg`, `surface`, `surface-2`, `border`, `content`, `content-muted`, `brand`, `success`, `danger`, `warning`) which resolve to CSS variables defined per-theme in [src/index.css](src/index.css). Reusable classes: `.card`, `.input`, `.btn-primary`, `.btn-ghost`. Dark mode is class-based on `<html>`.
- **Icons:** add to the inline set in [src/shared/components/Icon.tsx](src/shared/components/Icon.tsx) (no icon library is installed).
- **Imports:** use the `@/` alias for `src/`.
- **Forms:** React Hook Form + Zod for standalone forms (e.g. login). Modal CRUD forms (expense/income/category) use local `useState` + manual validation because they embed the async, self-managing `CurrencyAmountField`.
- **Shared UI primitives:** `Modal`, `Toast` (via `useToast()`, provider in App tree), `Skeleton`, `EmptyState`, `FilterBar`, `StatCard`, `PageHeader`. Prefer these over bespoke versions.
