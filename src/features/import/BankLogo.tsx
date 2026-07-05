import type { CSSProperties } from 'react';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/lib/cn';

/**
 * Self-contained, theme-proof brand lockups for the supported statement
 * formats. Each is a solid brand-coloured badge with the wordmark, so it reads
 * correctly on any surface (light or dark) without external logo assets.
 * These approximate the brands via their colours + wordmark; they are not
 * official trademark artwork.
 */
interface Brand {
  wordmark: string;
  style: CSSProperties;
  /** Extra tracking/case tweaks to better evoke the real wordmark. */
  textClass?: string;
}

const BRANDS: Record<string, Brand> = {
  monzo: {
    wordmark: 'monzo',
    style: {
      background: 'linear-gradient(135deg, #ff6a5a, #f8402c)',
      color: '#ffffff',
    },
    textClass: 'lowercase tracking-tight',
  },
  revolut: {
    wordmark: 'Revolut',
    style: { background: '#0b0b0d', color: '#ffffff' },
    textClass: 'tracking-tight',
  },
  wise: {
    wordmark: 'Wise',
    style: { background: '#9fe870', color: '#163300' },
    textClass: 'tracking-tight',
  },
};

export function BankLogo({ id, className }: { id: string; className?: string }) {
  const brand = BRANDS[id];
  if (!brand) return null;
  return (
    <span
      className={cn(
        'inline-flex h-11 w-full items-center justify-center rounded-lg px-3 text-lg font-semibold shadow-soft ring-1 ring-inset ring-white/10',
        brand.textClass,
        className,
      )}
      style={brand.style}
    >
      {brand.wordmark}
    </span>
  );
}

/** The "Auto-detect" tile, styled with the app's own brand gradient. */
export function AutoLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-brand to-brand-2 px-3 text-sm font-semibold text-brand-fg shadow-soft ring-1 ring-inset ring-white/15',
        className,
      )}
    >
      <Icon name="sparkles" size={16} />
      Auto-detect
    </span>
  );
}
