# Landing page — design

Date: 2026-11-21 · Branch: `feat/landing-page` · Phase 4 (landing page and interactive demo)

## Intent

mony needs a public front door: a striking page that shows a stranger, in seconds, what the app does and lets them try it before signing up. The most persuasive thing mony has is its own interface, so the page is built around the **real dashboard running live on fictional data**, not screenshots. It also carries the pricing the user has set.

## Goals

- Signed-out visitors at `/` see the landing page; signed-in users still see their dashboard at `/`.
- A hero with the live preview: real `StatCard`s, the trend chart and a range switch, computed in the browser from a fictional year of transactions. Visitors can change the range and see every figure update.
- Clear, true explanation of what mony does, and the three pricing options.
- One visual system with the app (tokens, Manrope, rising-y logo), in light and dark.

## Non-goals

- Taking payments (Phase 5). The paid option collects intent by email for now.
- A full click-through demo of every app page. The pure report builder introduced here is the foundation for it; the full demo is a follow-up.
- Anything on the hosted Supabase project. The landing page and preview never touch the database.
- SEO prerendering. The page is part of the SPA for now.

## Anti-goals (a failure even if it works)

- Any claim that isn't true: no live bank connections, no bank logos, no compliance badges, no user counts, testimonials or ratings we don't have.
- Fictional figures that could be mistaken for a real person's data. The preview is labelled "Sample data".
- A landing page that slows down the app: its code and the chart load in their own chunks; signed-in users never download it.

## Constraints

- Follows CLAUDE.md: semantic tokens only, `.card` / `.btn-*` / `.icon-badge`, Manrope, `@/` imports, Prettier/ESLint.
- Works from 360px to wide desktop, both themes, `prefers-reduced-motion` respected.
- No new runtime dependencies.
- Contact links (`mailto:`) don't work for every visitor, so the address is also shown as text with a copy button.

## Approaches considered

1. **Inside the app at `/` for signed-out visitors, hero = live app components on fictional data** — _chosen._ Reuses the design system and real components; the preview doubles as the start of the public demo with zero risk to real data. Trade-off: search engines see a JS app.
2. **Separate static site (e.g. Astro).** Best load time and SEO, but duplicates the logo, tokens and components, needs a second deploy, and the hero becomes screenshots.
3. **Inside the app with screenshots/video.** Simpler, but loses the live hero for nearly the same effort and leaves the demo unsolved.

## Decided by the user

- Approach 1.
- Pricing: **Free** while in testing; **$20 one-time** to buy the app (lifetime access to hosted mony, no subscription); **Custom**: a version deployed on the customer's own machine, by contacting us.

## Design

### Routing

- `/`: if there's a session, the existing protected app shell and dashboard; otherwise the landing page. While auth is loading, show the existing full-screen loader (no flash of the landing page for signed-in users).
- `/login`, `/reset-password` unchanged. Every other app path still redirects signed-out visitors to `/login`.
- Landing CTAs: "Start free" → `/login` in sign-up mode (add support for `/login?mode=signup`); "Sign in" → `/login`.

### Fictional data and the report builder

- Split `fetchReport` in `features/reports/api.ts` into fetching and a pure `buildReport(range, expenses, income, prevTotals)` with no Supabase import. `fetchReport` calls it; behaviour unchanged (existing totals covered by a unit test).
- New `features/landing/sampleData.ts`: a deterministic generator (seeded PRNG) for twelve months of fictional transactions relative to today, mirroring `supabase/seed.sql` (salary, freelance, rent, bills, groceries, dining, a euro trip with a frozen rate). Unit tested for determinism and plausible totals.
- The preview calls `buildReport` with the selected range over the sample rows.

### Page sections (top to bottom)

1. **Top bar.** Rising-y logo + wordmark; anchor links Features · Pricing · FAQ; theme toggle; "Sign in" (ghost) and "Start free" (primary). Collapses to logo + "Start free" + menu on phones.
2. **Hero.** Headline built on the brand line _Your money. Your clarity._, one sentence on what mony is (spending, income, budgets, savings and loans in one place, from your bank's CSV exports). CTAs "Start free" and "Explore the preview ↓". Beside/below it, the **live preview**: a feature-styled net-worth card, income/expenses/net cards and the trend chart, with the range switch ("This month / Last 3 months / Last 12 months"), tagged "Sample data". Signature motion: the logo's rising tail draws in as a lime line across the hero and lands on the chart (once; static under reduced motion).
3. **How it works** (a real sequence, so numbered): 1 Export a CSV from Monzo, Revolut, Wise or any bank · 2 Import and review (duplicates and transfers flagged) · 3 See where it goes (budgets, trends, categories).
4. **Features.** Budgets · Savings goals · Money lent and borrowed · Subscriptions (true monthly cost) · Multi-currency with the rate frozen on the day · Your data (export everything, delete your account anytime). Each with an `icon-badge`.
5. **Privacy.** Plain, true statements: no bank login needed (you import files you exported); every account is isolated in the database and this is tested; export or delete everything yourself. No certifications claimed.
6. **Pricing.** Three cards; the $20 card is the `card-feature` highlight.
   - Free — "Free while in testing" — full app, CTA "Start free".
   - $20 one-time — "Lifetime access, no subscription" — CTA "Reserve lifetime access" (opens email to us with a prefilled subject; payments arrive later).
   - Custom — "Your own deployment, on your machine" — CTA "Contact us".
     Contact address shown as text with a copy button under the cards.
7. **FAQ** (native `<details>`): Is it really free? What does $20 get me? Do you connect to my bank? Where is my data? Can I export or delete my data? Can I run it myself?
8. **Closing CTA** band + footer (logo, anchor links, contact address, © year).

### Visual direction

Hero on the deep green (`#112320`/`#1B3530`) in both themes, lime as the single accent, large Manrope display type with tight tracking; the rest of the page on the normal `bg`/`surface` tokens so it follows the theme. Cards use the app's 24px radius; the preview sits slightly overlapping the hero's bottom edge so the app visibly "comes out of" the hero.

### Files (expected)

- `src/features/landing/LandingPage.tsx`, section components, `sampleData.ts` (+ test), `LivePreview.tsx`.
- `src/features/reports/api.ts`: extract `buildReport` (+ test).
- `src/app/router.tsx`: `/` gate; `LoginPage`: `?mode=signup`.
- `src/shared/components/Icon.tsx`: any new icons.

## Verification

- Unit: `buildReport` totals match the old path; sample data is deterministic and spans 12 months.
- Browser: signed-out `/` shows the landing page, signed-in `/` shows the dashboard, no flash between them; range switch updates every preview figure; anchors, CTAs, copy button; 375px and 1440px; light and dark; reduced motion.
- Build: landing code in its own chunk; typecheck, lint, tests pass.

## Left to the builder

Exact copy within the rules above, section spacing, icon choices, the hero animation's timing.

## Open (needs the user)

- **Contact email address** for "Reserve lifetime access" and "Contact us".
- **Currency:** keep **$20** (as specified) or show **£20** for UK visitors.
