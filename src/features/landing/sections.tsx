import { type CSSProperties, type ReactNode, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { Icon } from '@/shared/components/Icon';
import { LogoMark, Wordmark } from '@/shared/components/Logo';
import { cn } from '@/shared/lib/cn';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';

import {
  CONTACT_EMAIL,
  FAQ,
  FEATURES,
  PRICING,
  type PricingTier,
  PRIVACY,
  STEPS,
  type StepScene,
} from './content';
import { copyText } from './copyText';
import { ExportIllustration, InsightIllustration, ReviewIllustration } from './StepIllustrations';

/** On the deep-green bands the wordmark tail uses the bright lime. */
const ON_DARK = { '--logo-tail': 'var(--logo-accent)' } as CSSProperties;

function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-content-muted">
          {eyebrow}
        </p>
        <h2 className="text-balance text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
          {title}
        </h2>
        {intro ? <p className="mt-4 text-lg leading-relaxed text-content-muted">{intro}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** An internal route renders as a router link; anything else (mailto) as a plain link. */
function CtaLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  return href.startsWith('/') ? (
    <Link to={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

const SCENES: Record<StepScene, () => JSX.Element> = {
  export: ExportIllustration,
  review: ReviewIllustration,
  insight: InsightIllustration,
};

export function HowItWorks() {
  return (
    <Section eyebrow="How it works" title="From bank export to a clear picture in three steps.">
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => {
          const Scene = SCENES[s.scene];
          return (
            <li key={s.title} className="card flex flex-col p-4 sm:p-5">
              <Scene />
              <div className="px-1 pb-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-content-muted">
                  Step {i + 1}
                </p>
                <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-content-muted">{s.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

export function Features() {
  return (
    <Section
      id="features"
      eyebrow="Features"
      title="Everything your money touches, in one calm place."
      intro="Built for everyday personal finance in pounds, with room for the other currencies life brings."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6">
            <span className="icon-badge mb-5 h-11 w-11">
              <Icon name={f.icon} size={20} />
            </span>
            <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-content-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Privacy() {
  return (
    <Section
      eyebrow="Privacy"
      title="Your numbers stay yours."
      intro="No bank logins, and nothing you can’t take with you."
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {PRIVACY.map((p) => (
          <li key={p} className="flex gap-4 rounded-3xl border border-border p-6">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success/15 text-success">
              <Icon name="check" size={16} />
            </span>
            <p className="text-sm leading-relaxed">{p}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function PriceCard({ tier }: { tier: PricingTier }) {
  const hi = tier.highlight;
  return (
    <div className={cn('flex flex-col p-7', hi ? 'card-feature' : 'card')}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{tier.name}</h3>
        {hi ? (
          <span className="rounded-full bg-feature-fg/10 px-3 py-1 text-xs font-medium text-feature-accent">
            Best value
          </span>
        ) : null}
      </div>
      <p className="mt-6 flex items-baseline gap-2">
        <span
          className={cn(
            'text-5xl font-semibold tracking-[-0.04em] tabular-nums',
            hi && 'text-feature-accent',
          )}
        >
          {tier.price}
        </span>
        {tier.cadence ? (
          <span className={cn('text-sm', hi ? 'text-feature-muted' : 'text-content-muted')}>
            {tier.cadence}
          </span>
        ) : null}
      </p>
      <p className={cn('mt-2 text-sm', hi ? 'text-feature-muted' : 'text-content-muted')}>
        {tier.note}
      </p>
      <ul className="mb-8 mt-6 space-y-3 text-sm">
        {tier.points.map((p) => (
          <li key={p} className="flex items-start gap-3">
            <Icon
              name="check"
              size={16}
              className={cn('mt-0.5 shrink-0', hi ? 'text-feature-accent' : 'text-success')}
            />
            {p}
          </li>
        ))}
      </ul>
      <CtaLink
        href={tier.href}
        className={cn(
          'btn mt-auto w-full py-3',
          hi
            ? 'bg-feature-accent text-feature hover:brightness-105'
            : 'border border-border bg-surface text-content hover:bg-surface-2',
        )}
      >
        {tier.cta}
      </CtaLink>
    </div>
  );
}

function ContactLine() {
  const emailRef = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<'idle' | 'copied' | 'selected'>('idle');

  const onCopy = async () => {
    const ok = await copyText(CONTACT_EMAIL, emailRef.current);
    setState(ok ? 'copied' : 'selected');
    window.setTimeout(() => setState('idle'), 2000);
  };

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-content-muted">
      <span>Questions first? Write to</span>
      <span ref={emailRef} className="select-all font-medium text-content">
        {CONTACT_EMAIL}
      </span>
      <button
        type="button"
        onClick={() => void onCopy()}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-content transition hover:bg-surface-2"
      >
        <Icon name={state === 'copied' ? 'check' : 'duplicate'} size={13} />
        {state === 'copied' ? 'Copied' : state === 'selected' ? 'Selected, press copy' : 'Copy'}
      </button>
      <span aria-live="polite" className="sr-only">
        {state === 'copied' ? 'Email address copied' : ''}
      </span>
    </div>
  );
}

export function Pricing() {
  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      title="Free to try. Yours for life for $20."
      intro="No subscription to remember. Use everything free while mony is in testing, keep it for good with one payment, or have your own copy set up."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {PRICING.map((t) => (
          <PriceCard key={t.name} tier={t} />
        ))}
      </div>
      <ContactLine />
    </Section>
  );
}

export function Faq() {
  return (
    <Section id="faq" eyebrow="FAQ" title="Questions, answered plainly.">
      <div className="divide-y divide-border rounded-3xl border border-border bg-surface">
        {FAQ.map((f) => (
          <details key={f.q} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium marker:hidden [&::-webkit-details-marker]:hidden">
              {f.q}
              <Icon
                name="chevron-down"
                size={18}
                className="shrink-0 text-content-muted transition group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-content-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function ClosingCta() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div
        style={ON_DARK}
        className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-logo-tile px-8 py-14 text-logo-ink sm:px-12 md:flex-row md:items-center"
      >
        <div>
          <h2 className="text-balance text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
            See your money <span className="text-logo-accent">clearly</span>.
          </h2>
          <p className="mt-3 text-logo-ink/70">Free while in testing. No card, no bank login.</p>
        </div>
        <Link
          to="/login?mode=signup"
          className="btn shrink-0 bg-logo-accent px-7 py-3 text-base text-logo-tile hover:brightness-105"
        >
          Start free
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <Wordmark className="text-lg" />
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-content-muted"
        >
          <a href="#features" className="hover:text-content">
            Features
          </a>
          <a href="#pricing" className="hover:text-content">
            Pricing
          </a>
          <a href="#faq" className="hover:text-content">
            FAQ
          </a>
          <Link to="/login" className="hover:text-content">
            Sign in
          </Link>
        </nav>
        <ThemeToggle />
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 pb-10 text-xs text-content-muted sm:px-6">
        <span>© {new Date().getFullYear()} mony</span>
        <span>{CONTACT_EMAIL}</span>
      </div>
    </footer>
  );
}
