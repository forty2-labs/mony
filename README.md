# mony

**Your money. Your clarity.** A multi-user personal finance app: spending,
income, budgets, loans and bank-statement import. React + Vite + TypeScript on
Supabase (Postgres, Auth, Edge Functions). Each user's data is isolated by Row
Level Security in the database, not the client.

> **Status:** Phase 2 (security and multi-tenancy) complete. See [Roadmap](#roadmap).

## Local development

Requires Node 20+ and Docker.

```bash
npm install
npm run db:start                 # local Supabase stack (first run pulls images)
cp .env.local.example .env.local # local defaults work as-is
npm run dev                      # http://localhost:5173
```

Signed out, `/` shows the public landing page (its live preview runs on fictional
sample data in the browser); signed in, `/` is the dashboard.

Auth emails go to Mailpit at <http://127.0.0.1:54324>; nothing is really sent.
Studio is at <http://127.0.0.1:54323>. Stop with `npm run db:stop` (local data
is kept).

A fresh database is seeded (`supabase/seed.sql`) with a demo account holding a
year of fictional data: `demo@example.com` / `MonyDemo2026`. In dev builds the
sign-in page has a **Demo account** button and a link to Mailpit. Seeds never
reach a hosted project; `db push` only applies migrations. The demo account is
flagged `app_metadata.demo`, and the `delete-account` function refuses to delete
it.

| Command            | What it does                                     |
| ------------------ | ------------------------------------------------ |
| `npm run build`    | type-check + production build                    |
| `npm run lint`     | ESLint (import ordering, unused imports)         |
| `npm run format`   | Prettier                                         |
| `npm test`         | unit tests (no database needed)                  |
| `npm run test:db`  | pgTAP: forced RLS on every table, no anon access |
| `npm run test:rls` | cross-user attack suite against the local API    |
| `npm run test:all` | all of the above                                 |
| `npm run db:reset` | wipe and rebuild the local database              |

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs all of these on every
pull request to `main`, with the database suites against a throwaway local stack.

## Changing the schema

Migrations are never applied automatically.

1. Add the next numbered file, e.g. `supabase/migrations/0005_loans.sql`. Never
   edit an applied migration; it won't re-run.
2. Apply locally: `npx supabase migration up` (keeps data) or `npm run db:reset`
   (replays everything from empty, the stronger check).
3. Update the hand-maintained types in `src/shared/types/database.ts`.
4. Follow the RLS pattern in `0003_security_hardening.sql`, add cases to
   `tests/rls/` for new tables or RPCs, and run `npm run test:all`.
5. At deploy time only: `npx supabase db push --remote`.

## Security model

- **Database-level isolation:** forced RLS with owner-only policies on every
  table; `anon` has no table privileges.
- **No cross-user references:** composite `(user_id, x_id)` foreign keys, since
  FK checks bypass RLS.
- **Proven by tests:** `test:rls` has one real user attack another's rows with
  forged IDs, foreign keys and RPCs.
- **Server-side privilege only:** the service-role key is used solely by the
  `delete-account` Edge Function.
- **Data rights:** Settings → Export downloads everything as JSON; Delete
  account cascades every row the user owns.

## Deploying (hosted Supabase)

1. Create a project (UK/EU region), then `npx supabase link --project-ref <ref>`.
2. `npx supabase db push --remote` and `npx supabase functions deploy delete-account`.
3. `npx supabase secrets set ALLOWED_ORIGINS=https://your-domain`.
4. Mirror the `[auth]` settings from `supabase/config.toml` in the dashboard,
   including the site URL and redirect allowlist, and paste the email templates
   from `supabase/templates/` into Authentication → Emails (magic link, reset
   password, confirm sign-up) so email links open `/auth/confirm`. Also turn on leaked-password
   protection and CAPTCHA, and set up a real SMTP provider.
5. Keep API **max rows** at 1,000 or more.
6. Build with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `SITE_URL` (the public
   address; it fills the link-preview tags, canonical URL, `robots.txt` and
   `sitemap.xml`). On Vercel, `SITE_URL` defaults to the project's production
   domain. The share image is `public/og-image.png`, a 1200×630 shot of the hero.

## Layout

```text
src/app/          App shell, router, query client
src/features/     One folder per domain (auth, dashboard, expenses, loans, …)
src/shared/       Reusable UI, lib (env, supabase, fetchAll), types
supabase/         migrations/, functions/, tests/ (pgTAP)
tests/rls/        Cross-user isolation tests
```

## Roadmap

| Phase | Scope                                                          | Status  |
| ----- | -------------------------------------------------------------- | ------- |
| 1     | Audit and plan                                                 | Done    |
| 2     | Security and multi-tenancy                                     | Done    |
| 3     | App improvements: loans, recurring, import history, onboarding | Next    |
| 4     | Landing page and interactive demo                              | Planned |
| 5     | Monetisation: Stripe, entitlements                             | Planned |
| 6     | Launch prep: security review, legal, deployment                | Planned |
