# Vault — Personal Expense Tracker

A private, **local-first** financial operating system for a single user. Built to
replace a Google Sheets workflow with something fast, beautiful, insightful and
secure. React + Vite + TypeScript on the front end; Supabase (Postgres + Auth)
with strict Row Level Security on the back end.

> **Status: Phase 1 (Foundation) complete.** See [Build phases](#build-phases).

## Features by phase

| Phase | Scope                                                                 | Status     |
| ----- | --------------------------------------------------------------------- | ---------- |
| 1     | Project setup, Supabase + Auth, schema + RLS, theme system, app shell | ✅ Done    |
| 2     | Expenses, Income, Categories, Dashboard data, Search & filtering      | ⏳ Planned |
| 3     | Budgets, Savings goals, Loans, Subscriptions                          | ⏳ Planned |
| 4     | Reports & charts, Import (CSV/Excel/PDF), multi-currency refinement   | ⏳ Planned |
| 5     | Offline PWA, performance, testing, UX polish                          | ⏳ Planned |

## Tech stack

- **UI:** React 18, Vite 5, TypeScript, Tailwind CSS, Framer Motion
- **Data/forms:** TanStack Query, React Hook Form, Zod, Recharts
- **Routing:** React Router (lazy-loaded, code-split routes)
- **Backend:** Supabase (PostgreSQL + Auth), Row Level Security on every table

## Getting started

### 1. Create a Supabase project

Create a free project at [supabase.com](https://supabase.com) (or run a
self-hosted instance for a fully local setup).

### 2. Apply the database schema

In the Supabase **SQL editor**, run the migrations in order:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_seed_default_categories.sql`

These create all tables, indexes, triggers, and **enable + force RLS** with
owner-only policies. There are no public policies.

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your project's
API settings. Only the **anon** key belongs here — never the `service_role` key.

### 4. Install & run

```bash
npm install
npm run dev      # start the app at http://localhost:5173
npm run build    # type-check + production build
npm run typecheck
```

On first sign-up, a profile row and a starter set of categories are created
automatically via a database trigger.

## Architecture

Feature-based modularity under `src/`:

```
src/
  app/            App shell, router, query client
  features/
    auth/         Auth provider, login, protected routes, inactivity logout
    dashboard/    Overview screen
    expenses/ income/ budgets/ savings/ loans/ subscriptions/ reports/ settings/
  shared/
    components/   Reusable UI (layout, cards, icons, error boundary)
    lib/          env, supabase client, formatting, cn()
    theme/        Light/dark/system theme system
    types/        Database type contract
supabase/migrations/   SQL schema + RLS
```

### Security model

- **RLS everywhere.** Every table has `enable` + `force` row level security and an
  owner-only policy keyed on `auth.uid()`. `audit_logs` is append-only.
- **No secrets in the frontend.** Only the public anon key is exposed; it grants
  nothing without an authenticated, RLS-gated session.
- **Auto-logout** after a configurable period of inactivity.
- **Frozen FX.** Each transaction stores its original amount, currency, exchange
  rate and converted base amount — historical values never change.

## Build phases

This project is built in deliberate phases. At the end of each phase the work is
summarized and paused for review before the next phase begins. We are currently
at the **end of Phase 1**.
