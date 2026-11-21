import { cn } from '../lib/cn';

/**
 * The mony "rising y": a lowercase y whose tail sweeps up into a rising line.
 * Left arm in the ink colour, right arm and tail in lime. Coordinates are in a
 * 32-unit box; keep public/favicon.svg in sync with the mark.
 */
const Y_ARM = 'M7.6 7.8L16.5 16.2';
const Y_TAIL = 'M21.6 7.8L13.2 21.6c-1.2 2-.2 3.3 1.8 2.6l9.4-4.3';

/**
 * The app mark: the rising y on a deep green rounded-square tile. The tile keeps
 * its colours in both themes (a brand constant, like the favicon), with a faint
 * lime edge in dark mode so it doesn't sink into dark surfaces.
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
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="9"
        fill="rgb(var(--logo-tile))"
        stroke="rgb(var(--logo-edge))"
        strokeWidth="1"
      />
      <g fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d={Y_ARM} stroke="rgb(var(--logo-ink))" />
        <path d={Y_TAIL} stroke="rgb(var(--logo-accent))" />
      </g>
    </svg>
  );
}

/**
 * The wordmark: "mon" set in the UI face, then the rising y drawn to sit on the
 * same x-height with its tail as the descender. The arm takes the text colour;
 * the tail uses a lime that keeps contrast on the current surface.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline font-extrabold lowercase tracking-[-0.04em] text-content',
        className,
      )}
      aria-label="mony"
      role="img"
    >
      <span aria-hidden="true">mon</span>
      <svg
        viewBox="5.6 5.3 21 21"
        aria-hidden="true"
        className="ml-[-0.03em] h-[0.955em] w-[0.955em] translate-y-[0.31em]"
      >
        <g fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={Y_ARM} stroke="currentColor" />
          <path d={Y_TAIL} stroke="rgb(var(--logo-tail))" />
        </g>
      </svg>
    </span>
  );
}

/** Mark + wordmark lockup. */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      <Wordmark className="text-xl" />
    </span>
  );
}
