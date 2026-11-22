import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

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

function Hero() {
  return (
    <section style={ON_DARK} className="relative overflow-hidden bg-logo-tile text-logo-ink">
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
