import { useState } from 'react';

import { Icon } from './Icon';

/** Bump the suffix to show the banner again to people who dismissed an older message. */
const STORAGE_KEY = 'mony:testing-banner-dismissed-v1';

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false; // Storage blocked (private mode, policy): just show the banner.
  }
}

/**
 * Slim notice across the top of the landing page and the app while mony is in
 * testing. Dismissing it is remembered on this device only.
 */
export function TestingBanner() {
  const [hidden, setHidden] = useState(wasDismissed);
  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Not remembered; it will reappear on the next visit.
    }
  };

  return (
    <div
      role="status"
      className="relative z-40 flex items-center justify-center gap-3 bg-logo-accent py-2 pl-4 pr-12 text-logo-tile"
    >
      <span className="hidden shrink-0 rounded-full bg-logo-tile px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-logo-accent sm:inline">
        Testing
      </span>
      <p className="text-center text-xs font-medium leading-snug sm:text-sm">
        mony is in its testing phase. We’re making ongoing improvements to make the platform more
        secure and stronger.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss testing notice"
        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full transition hover:bg-logo-tile/10"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
