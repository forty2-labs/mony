# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A public landing page at `/` for signed-out visitors, built around a live preview of the real dashboard on fictional data, with the three pricing options.

**Architecture:** The report maths moves out of the Supabase fetch into a pure `buildReport`, so the landing page can run it in the browser over a deterministic fictional year. `ProtectedRoute` renders the lazily loaded landing page at `/` when there's no session instead of redirecting. Sections are plain React components on the existing tokens and primitives.

**Tech Stack:** React 18, React Router 7, Tailwind (semantic tokens), Framer Motion, Recharts (existing `TrendAreaChart`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-landing-page-design.md`

## Global Constraints

- Semantic tokens only (`bg`, `surface`, `surface-2`, `border`, `content`, `content-muted`, `brand`, `success`, `danger`, `warning`, `feature*`, `badge*`, `logo-*`); reuse `.card`, `.card-feature`, `.btn-primary`, `.btn-ghost`, `.icon-badge`.
- No new runtime dependencies. `@/` imports; run `npm run lint:fix` and `npm run format` before each commit.
- Copy is true: no live bank connections, no bank logos, no compliance claims, no user counts, ratings or testimonials. Banks named only as "Monzo, Revolut, Wise or any bank" CSV exports.
- The preview is labelled **"Sample data"**; the landing page never calls Supabase.
- Pricing copy, verbatim: Free — "Free while in testing"; **$20** one-time — "Lifetime access, no subscription", CTA "Reserve lifetime access"; Custom — "Your own deployment, on your machine", CTA "Contact us".
- Contact address lives in one constant, `CONTACT_EMAIL` in `src/features/landing/content.ts`, set to the placeholder `contact@example.com` until the user supplies the real one. Shown as text with a copy button, and as a `mailto:` link.
- Works at 360px–1440px, light and dark; hero stays deep green in both themes; `prefers-reduced-motion` disables the hero animation.
- Landing code ships in its own lazy chunk; signed-in users never load it.

## Review Focus

- A signed-in user opening `/` (or reloading it) never sees the landing page flash while auth loads. → Task 4 browser check.
- A password-recovery session at `/` still goes to `/reset-password`, not the landing page. → Task 4 browser check (session exists, so the landing branch must not run).
- Sample data generated on the 1st of a month or 1 January has no future-dated rows and "This month" still renders (possibly near-empty, no crash). → Task 2 unit tests with fixed `today`.
- On a 360px phone, nothing scrolls sideways (preview cards, chart, pricing). → Task 6 browser check.
- The copy-email button where the Clipboard API is missing or rejects: falls back to selecting the text, never throws. → Task 5 unit test of `copyText`.

---

### Task 1: Pure report builder

**Files:**

- Create: `src/features/reports/report.ts`
- Modify: `src/features/reports/api.ts`
- Test: `src/features/reports/report.test.ts`

**Interfaces:**

- Produces (in `report.ts`, all re-exported from `api.ts` so existing imports keep working): every type now in `api.ts` (`RangeKey`, `RANGE_OPTIONS`, `RangeSelection`, `ResolvedRange`, `ReportCategory`, `ReportTrendPoint`, `ReportTx`, `ReportData`), `resolveRange`, plus
  - `export interface ReportRow { id: string; amount_base: number; amount_original: number; currency_original: string; exchange_rate: number; occurred_on: string; notes: string | null; category: { name: string; color: string | null; icon: string | null } | null }`
  - `export function buildReport(range: ResolvedRange, expenses: ReportRow[], income: ReportRow[], prev?: { totalIncome: number; totalExpenses: number }): ReportData`
- `report.ts` must not import `@/shared/lib/supabase` (it validates env at import).

- [ ] **Step 1: Write the failing test** `report.test.ts`, `describe('buildReport')`:
  - `it('totals income, expenses, net and savings rate')`: range `{ key: 'custom', label: 'x', from: '2026-01-01', to: '2026-03-31' }`, expenses `[100, 50.5]`, income `[1000]` → `totalExpenses` 150.5, `totalIncome` 1000, `net` 849.5, `savingsRate` 84.95, `txCount` 3.
  - `it('ranks categories and shares percentages')`: two expense categories (Rent 300, Food 100) → `expenseCategories[0]` `{ name: 'Rent', pct: 75 }`, `[1].pct` 25; a row with `category: null` is named `'Uncategorised'`.
  - `it('passes previous totals through as prev with net')`: `prev { totalIncome: 500, totalExpenses: 200 }` → `report.prev` equals `{ totalIncome: 500, totalExpenses: 200, net: 300 }`; omitted → `undefined`.
  - `it('sorts transactions newest first and builds one trend point per month')`: rows in Jan and Mar → `transactions[0].date` is the March one; `trend.map(p => p.month)` equals `['2026-01','2026-02','2026-03']`.
  - `it('returns a null savings rate without income')`.
- [ ] **Step 2: Run** `npx vitest run src/features/reports/report.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Move** the types, `RANGE_OPTIONS`, date helpers, `resolveRange`, `categoryBreakdown`, `monthsSpan`, `monthLabel`, `trendNaturalStart`, `buildTrend` from `api.ts` into `report.ts` unchanged; rename the duplicate `ExpenseRow`/`IncomeRow` to the exported `ReportRow`; implement `buildReport` from the body of `fetchReport` after the fetches. In `api.ts`, keep only `fetchReport` (fetch, sum the prev rows, `return buildReport(...)`) and add `export * from './report'`.
- [ ] **Step 4: Run** `npx vitest run src/features/reports` and `npm run typecheck` — Expected: PASS, no type errors.
- [ ] **Step 5: Commit** — `git commit -m "Split the report maths out of the Supabase fetch"`

### Task 2: Deterministic sample year

**Files:**

- Create: `src/features/landing/sampleData.ts`
- Test: `src/features/landing/sampleData.test.ts`

**Interfaces:**

- Consumes: `ReportRow`, `RangeSelection`, `ReportData`, `resolveRange`, `buildReport` from Task 1 (import from `@/features/reports/report`).
- Produces:
  - `export function generateSampleYear(today: Date): { expenses: ReportRow[]; income: ReportRow[] }`
  - `export function sampleReport(selection: RangeSelection, today?: Date): ReportData` (defaults `today` to now; filters rows to the resolved range and its `prev` window, then calls `buildReport`).
- Content mirrors `supabase/seed.sql`: salary 3450 on the 25th; freelance every third month (450–1100); interest at each completed month end; rent 1250, energy 64.50, broadband 38, council tax 142, travel pass 98.40, charity 15; groceries, dining, shopping/entertainment/personal care, occasional health; a 4-row EUR trip four months ago at rate `0.8542` with `amount_base = round(amount × 0.8542, 2)`. Category names and colours from the seed's default categories. Randomness from a seeded PRNG (e.g. mulberry32, seed `2026`), so output depends only on `today`.

- [ ] **Step 1: Write the failing tests** (`describe('generateSampleYear')`):
  - `it('is deterministic for a given day')`: two calls with `new Date(2026, 10, 22)` are deep-equal.
  - `it('covers twelve months and nothing in the future')`: distinct `occurred_on.slice(0,7)` count is 12; every date ≤ `'2026-11-22'`.
  - `it('earns more than it spends over the year')`: sum income > sum expenses > 0.
  - `it('includes the euro trip at a frozen rate')`: 4 rows with `currency_original 'EUR'`, `exchange_rate 0.8542`, `amount_base === Math.round(amount_original * 0.8542 * 100) / 100`.
  - `it('has no future rows on the first of the month or new year')`: for `new Date(2026, 0, 1)` and `new Date(2026, 2, 1)`, no row is after `today`.
  - `describe('sampleReport')` → `it('reports the selected range only')`: `sampleReport({ key: 'last_3_months' }, new Date(2026, 10, 22))` has every `transactions[].date` within `range.from..range.to` and a defined `prev`.
- [ ] **Step 2: Run** `npx vitest run src/features/landing` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement** both functions in `sampleData.ts`. Row ids are stable strings (e.g. `s-${index}`).
- [ ] **Step 4: Run** `npx vitest run src/features/landing` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "Generate a deterministic sample year for the landing page"`

### Task 3: Live preview

**Files:**

- Create: `src/features/landing/LivePreview.tsx`

**Interfaces:**

- Consumes: `sampleReport` (Task 2); existing `StatCard` (`feature`, `accent`, `icon`, `tag`, `hint`), `Delta` from `@/features/reports/ReportSections`, lazy `TrendAreaChart` from `@/features/reports/ReportCharts`, `formatMoney`.
- Produces: `export function LivePreview(): JSX.Element` — self-contained, no props.

- [ ] **Step 1: Implement** `LivePreview`: a `.card` with a "Sample data" pill and a segmented control (buttons with `aria-pressed`) for `this_month`, `last_3_months`, `last_12_months` (default `last_12_months`); `useMemo(() => sampleReport({ key }), [key])`; four `StatCard`s — Net (feature, with savings-rate `tag`), Income (success, `Delta`), Expenses (danger, `Delta`), Avg monthly spend (neutral) — and `TrendAreaChart` inside `Suspense` with a `Skeleton` fallback. Grid: 2 columns on phones, 4 on `lg`.
- [ ] **Step 2: Verify** `npm run typecheck` — Expected: no errors. (Rendered and checked in Task 6.)
- [ ] **Step 3: Commit** — `git commit -m "Add the live dashboard preview on sample data"`

### Task 4: Route `/` to the landing page when signed out; sign-up deep link

**Files:**

- Create: `src/features/landing/LandingPage.tsx` (shell: top bar, hero with `LivePreview`, footer; later sections added in Task 5)
- Modify: `src/features/auth/ProtectedRoute.tsx`, `src/features/auth/LoginPage.tsx`

**Interfaces:**

- Consumes: `LivePreview` (Task 3), `Logo`/`LogoMark`/`Wordmark`, `ThemeToggle`.
- Produces: `export function LandingPage(): JSX.Element`; `LoginPage` reads `?mode=signup` (also `otp`, `forgot`) as its initial mode.

- [ ] **Step 1: Modify `ProtectedRoute`**: when `!session && location.pathname === '/'`, render the lazily imported `LandingPage` inside `Suspense` (fallback `FullScreenLoader`) instead of redirecting. The `loading` check stays first, the recovery check unchanged.
- [ ] **Step 2: Modify `LoginPage`**: initial `mode` from `useSearchParams().get('mode')` when it is one of the `Mode` values, else `'signin'`.
- [ ] **Step 3: Implement the `LandingPage` shell**: sticky top bar (logo + wordmark; anchors `#features`, `#pricing`, `#faq`; `ThemeToggle`; "Sign in" → `/login`; "Start free" → `/login?mode=signup`; on phones only logo + "Start free"). Hero on a fixed deep-green band (use `bg-[rgb(var(--logo-tile))]`-style token values, not literals) with the headline "Your money. Your clarity.", one-sentence summary, CTAs "Start free" and "Explore the preview" (anchor to the preview), and `LivePreview` overlapping the band's bottom edge.
- [ ] **Step 4: Verify in the browser** (dev server + local stack): signed out, `/` shows the landing page and `/expenses` redirects to `/login`; "Start free" opens the sign-up form; signed in (Demo account), `/` and a hard reload of `/` show the dashboard with no landing flash; a password-reset link session still lands on `/reset-password`.
- [ ] **Step 5: Run** `npm run typecheck && npm run lint && npm test` — Expected: pass (2 pre-existing lint warnings).
- [ ] **Step 6: Commit** — `git commit -m "Show the landing page at / for signed-out visitors"`

### Task 5: Content sections, pricing and contact

**Files:**

- Create: `src/features/landing/content.ts`, `src/features/landing/sections.tsx`, `src/features/landing/copyText.ts`
- Test: `src/features/landing/copyText.test.ts`
- Modify: `src/features/landing/LandingPage.tsx`, `src/shared/components/Icon.tsx` (only if an icon is missing)

**Interfaces:**

- Produces:
  - `content.ts`: `CONTACT_EMAIL = 'contact@example.com'`; `STEPS`, `FEATURES`, `PRICING`, `FAQ` arrays of plain objects (`{ title, body, icon? }`, pricing `{ name, price, note, cta, href, highlight? }`); `mailtoHref(subject: string): string` → `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`.
  - `copyText.ts`: `export async function copyText(text: string, fallbackEl?: HTMLElement | null): Promise<boolean>` — `navigator.clipboard.writeText` when available; on absence or rejection, select `fallbackEl`'s text and resolve `false`; never throws.
  - `sections.tsx`: `HowItWorks`, `Features`, `Privacy`, `Pricing`, `Faq`, `ClosingCta`, `Footer`.

- [ ] **Step 1: Write the failing tests** `copyText.test.ts`: `it('uses the clipboard when available')` (stub `navigator.clipboard.writeText` resolving → `true`, called with the text); `it('falls back without throwing when the clipboard rejects')` (rejecting stub → resolves `false`); `it('falls back when there is no clipboard API')` (`navigator.clipboard` undefined → `false`). Also `it('builds a mailto link with an encoded subject')` for `mailtoHref('Reserve lifetime access')`.
- [ ] **Step 2: Run** `npx vitest run src/features/landing` — Expected: FAIL.
- [ ] **Step 3: Implement** `copyText`, `content.ts` and the sections. Copy per the spec: How it works (numbered 1–3); six features with `icon-badge`s; Privacy (three true statements); Pricing (three cards, $20 card uses `card-feature`; Free → `/login?mode=signup`, $20 → `mailtoHref('Reserve lifetime access')`, Custom → `mailtoHref('Custom mony deployment')`; under the cards the address as text with a copy button that shows "Copied" for 2s, or selects the text on fallback); FAQ as native `<details>` with the six questions from the spec; closing CTA band; footer (logo, anchors, address, © current year). Add `id="features" | "pricing" | "faq"` targets and `scroll-margin-top` for the sticky bar.
- [ ] **Step 4: Run** `npx vitest run src/features/landing && npm run typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "Add the landing page sections, pricing and contact"`

### Task 6: Hero motion, responsive and theme pass, verification

**Files:**

- Modify: `src/features/landing/LandingPage.tsx`, `src/features/landing/sections.tsx`, `src/features/landing/LivePreview.tsx` as needed
- Modify: `README.md` (one line under Local development: the landing page at `/` when signed out)

- [ ] **Step 1: Implement the hero motion**: an SVG lime line in the hero that echoes the logo's rising tail, drawn in once with `pathLength`/`stroke-dashoffset` via Framer Motion; skipped (rendered static) when `useReducedMotion()` is true.
- [ ] **Step 2: Browser pass** at 360px, 768px and 1440px in light and dark: no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`), anchors land below the sticky bar, preview range switch updates all four figures and the chart, copy button works, no console errors, reduced-motion renders the line static.
- [ ] **Step 3: Check the bundle**: `npm run build` — Expected: a separate `LandingPage-*.js` chunk; the main entry chunk does not grow by more than a few KB versus `main`.
- [ ] **Step 4: Run** `npm run typecheck && npm run lint && npm run format:check && npm test` — Expected: pass.
- [ ] **Step 5: Commit** — `git commit -m "Polish the landing page hero motion and layout"`
