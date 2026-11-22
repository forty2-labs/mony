import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

import { LogoMark, Wordmark } from '@/shared/components/Logo';

import { LivePreview } from './LivePreview';
import { ClosingCta, Faq, Features, Footer, HowItWorks, Pricing, Privacy } from './sections';

/** The wordmark's tail on the deep-green bar uses the bright lime, as in dark mode. */
const ON_DARK = { '--logo-tail': 'var(--logo-accent)' } as CSSProperties;

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

function TopBar() {
  return (
    <header
      style={ON_DARK}
      className="sticky top-0 z-30 border-b border-logo-ink/10 bg-logo-tile/95 backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="mony home">
          <LogoMark size={32} />
          <Wordmark className="text-[21px] text-logo-ink" />
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-full px-3 py-2 text-sm text-logo-ink/75 transition hover:bg-logo-ink/10 hover:text-logo-ink"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-logo-ink/85 transition hover:bg-logo-ink/10 hover:text-logo-ink sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/login?mode=signup"
            className="btn bg-logo-accent text-logo-tile hover:brightness-105"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * The logo's rising tail, writ large: a lime line that climbs across the hero
 * and draws itself in once on load (static when the visitor prefers reduced
 * motion). Purely decorative.
 */
function RisingLine() {
  const reduce = useReducedMotion();
  const draw = reduce
    ? { initial: false as const }
    : {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1] as const, delay: 0.2 },
      };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 420"
      fill="none"
      className="pointer-events-none absolute -right-10 top-10 hidden h-[420px] w-[56%] lg:block"
    >
      <motion.path
        d="M20 380 C 150 380 190 300 270 280 S 420 230 470 150 S 540 60 590 40"
        stroke="rgb(var(--logo-ink))"
        strokeOpacity={0.08}
        strokeWidth={2}
        strokeDasharray="4 10"
        {...draw}
      />
      <motion.path
        d="M20 400 C 170 400 210 320 300 290 S 450 220 500 140 S 560 50 590 30"
        stroke="rgb(var(--logo-accent))"
        strokeWidth={10}
        strokeLinecap="round"
        {...draw}
      />
      <motion.circle
        cx={590}
        cy={30}
        r={14}
        fill="rgb(var(--logo-accent))"
        initial={reduce ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: reduce ? 0 : 1.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: '590px 30px' }}
      />
    </svg>
  );
}

function Hero() {
  return (
    <section style={ON_DARK} className="relative overflow-hidden bg-logo-tile text-logo-ink">
      <RisingLine />
      <div className="mx-auto max-w-6xl px-4 pb-48 pt-16 sm:px-6 sm:pt-24 lg:pb-56">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-logo-ink/15 px-3 py-1 text-xs font-medium text-logo-ink/80">
          Personal finance for the UK · free while in testing
        </p>
        <h1 className="max-w-3xl text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.04em]">
          Your money.
          <br />
          <span className="text-logo-accent">Your clarity.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-logo-ink/75">
          Spending, income, budgets, savings goals and money you’ve lent, in one calm place. Import
          the CSV your bank already gives you and see where it all goes.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/login?mode=signup"
            className="btn bg-logo-accent px-6 py-3 text-base text-logo-tile hover:brightness-105"
          >
            Start free
          </Link>
          <a
            href="#preview"
            className="btn border border-logo-ink/25 px-6 py-3 text-base text-logo-ink hover:bg-logo-ink/10"
          >
            Explore the preview
          </a>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-content">
      <TopBar />
      <main>
        <Hero />
        <section
          id="preview"
          aria-label="Live preview with sample data"
          className="relative z-10 mx-auto -mt-40 max-w-6xl scroll-mt-24 px-4 sm:px-6 lg:-mt-48"
        >
          <LivePreview />
        </section>
        <HowItWorks />
        <Features />
        <Privacy />
        <Pricing />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
