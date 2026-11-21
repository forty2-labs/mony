import { cn } from '../lib/cn';

/**
 * The mony mark: a lowercase "m" with a lime full stop ("mony.") on a round
 * tile. Drawn as paths, not text, so it renders identically everywhere. Colours
 * come from the badge tokens: a deep green tile in light mode, a lime tile with
 * a deep green "m" and dot in dark mode. Keep public/favicon.svg in sync with
 * the light version.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="16" fill="rgb(var(--badge))" />
      <path
        d="M9 12.5V22M9 15.5a3 3 0 0 1 6 0V22M15 15.5a3 3 0 0 1 6 0V22"
        fill="none"
        stroke="rgb(var(--brand-fg))"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25" cy="21" r="1.75" fill="rgb(var(--badge-fg))" />
    </svg>
  );
}

/** Lowercase wordmark with a full stop in the brand colour. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-semibold lowercase tracking-tight text-content', className)}>
      mony<span className="text-brand">.</span>
    </span>
  );
}

/** Mark + wordmark lockup. */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)} aria-label="mony">
      <LogoMark size={size} />
      <Wordmark className="text-xl" />
    </span>
  );
}
