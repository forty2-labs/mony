import type { SVGProps } from 'react';

/**
 * A tiny, dependency-free icon set (stroke-based, 24px grid). Kept inline so the
 * app has zero icon-library weight; extend as new glyphs are needed.
 */
export type IconName =
  // App / nav / action glyphs (kept in logical, nav-mirroring order)
  | 'dashboard'
  | 'expenses'
  | 'income'
  | 'budgets'
  | 'savings'
  | 'loans'
  | 'subscriptions'
  | 'categories'
  | 'reports'
  | 'settings'
  | 'search'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'duplicate'
  | 'close'
  | 'filter'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'logout'
  | 'vault'
  | 'calendar'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'import'
  | 'file'
  | 'alert'
  | 'check'
  // Category glyphs (selectable in the category form) — kept alphabetical
  | 'activity'
  | 'bag'
  | 'bolt'
  | 'book'
  | 'briefcase'
  | 'car'
  | 'cart'
  | 'charity'
  | 'coffee'
  | 'coins'
  | 'credit-card'
  | 'dumbbell'
  | 'ellipsis'
  | 'film'
  | 'fuel'
  | 'gift'
  | 'globe'
  | 'graduation'
  | 'hand-heart'
  | 'heart'
  | 'home'
  | 'laptop'
  | 'music'
  | 'paw'
  | 'phone'
  | 'pill'
  | 'plane'
  | 'salary'
  | 'scissors'
  | 'send'
  | 'shirt'
  | 'sparkles'
  | 'tag'
  | 'train'
  | 'trending-up'
  | 'utensils'
  | 'wallet';

/**
 * Icons offered in the category picker, in alphabetical order. Covers the common
 * category set — Charity, Clothing, Dining, Education, Groceries, Health, Housing,
 * Personal Care, Remittance, Salary, Shopping, Transport, Travel, Utilities, …
 */
export const CATEGORY_ICONS: IconName[] = [
  'activity',
  'bag',
  'bolt',
  'book',
  'briefcase',
  'car',
  'cart',
  'charity',
  'coffee',
  'coins',
  'credit-card',
  'dumbbell',
  'ellipsis',
  'film',
  'fuel',
  'gift',
  'globe',
  'graduation',
  'hand-heart',
  'heart',
  'home',
  'laptop',
  'music',
  'paw',
  'phone',
  'pill',
  'plane',
  'salary',
  'scissors',
  'send',
  'shirt',
  'sparkles',
  'tag',
  'train',
  'trending-up',
  'utensils',
  'wallet',
];

const paths: Record<IconName, JSX.Element> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  expenses: (
    <>
      <path d="M3 7h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M3 7l2-3h14l2 3" />
      <path d="M9 12h6" />
    </>
  ),
  income: (
    <>
      <path d="M12 3v18" />
      <path d="M17 8a4 4 0 0 0-4-3H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-3a4 4 0 0 1-4-3" />
    </>
  ),
  budgets: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12L12 3" />
      <path d="M12 12l7 4" />
    </>
  ),
  savings: (
    <>
      <path d="M3 12a9 6 0 1 0 18 0 9 6 0 1 0-18 0" />
      <path d="M3 12v4a9 6 0 0 0 18 0v-4" />
      <path d="M16 9.5h.01" />
    </>
  ),
  loans: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </>
  ),
  subscriptions: (
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </>
  ),
  categories: (
    <>
      <path d="M7 7h.01" />
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h5.1a2 2 0 0 1 1.4.6l8 8a2 2 0 0 1 0 2.8l-5.6 5.6a2 2 0 0 1-2.8 0l-8-8a2 2 0 0 1-.6-1.4V5.5Z" />
    </>
  ),
  reports: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-4 3 3 4-6" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  duplicate: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  close: (
    <>
      <path d="M18 6 6 18M6 6l12 12" />
    </>
  ),
  filter: (
    <>
      <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 7 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3 14a1.65 1.65 0 0 0-1.51-1H1a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3 7.5a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.6 3 1.65 1.65 0 0 0 10 1.51V1a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 16.5 3a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 21 8.6c.36.16.7.4.99.71" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: (
    <>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </>
  ),
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  vault: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8.5v1M12 14.5v1M8.5 12h1M14.5 12h1" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2.5" />
      <path d="M3 9h18M8 2.5v3M16 2.5v3" />
    </>
  ),
  'chevron-left': <path d="M15 6l-6 6 6 6" />,
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  'chevron-up': <path d="M6 15l6-6 6 6" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  import: (
    <>
      <path d="M12 3v11" />
      <path d="M8 10l4 4 4-4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,

  // ── Category glyphs (alphabetical) ──────────────────────────────────────
  activity: <path d="M3 12h4l2.5-7 5 14 2.5-7H21" />,
  bag: (
    <>
      <path d="M6 8h12l1 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  book: (
    <>
      <path d="M5 4a2 2 0 0 1 2-2h12v18H7a2 2 0 0 0-2 2V4Z" />
      <path d="M5 18.5A2 2 0 0 1 7 17h12" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </>
  ),
  car: (
    <>
      <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" />
      <path d="M4 13h16a1 1 0 0 1 1 1v4h-2.5M5.5 18H3v-4a1 1 0 0 1 1-1" />
      <circle cx="7.5" cy="18" r="1.6" />
      <circle cx="16.5" cy="18" r="1.6" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L22 7H6" />
    </>
  ),
  charity: (
    <>
      <path d="M12 7.5c-1.1-1.7-3.8-1.4-3.8 1 0 1.8 2.2 3.2 3.8 4 1.6-.8 3.8-2.2 3.8-4 0-2.4-2.7-2.7-3.8-1Z" />
      <path d="M4 13a2 2 0 0 1 3.4-1.45L9 13" />
      <path d="M20 13a2 2 0 0 0-3.4-1.45L15 13" />
      <path d="M4 13v1.5A5.5 5.5 0 0 0 9.5 20h5A5.5 5.5 0 0 0 20 14.5V13" />
    </>
  ),
  coffee: (
    <>
      <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
      <path d="M17 9h2a2.5 2.5 0 0 1 0 5h-2M6 2v2M10 2v2M14 2v2" />
    </>
  ),
  coins: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="M16.71 13.88l.7.71-2.82 2.82" />
    </>
  ),
  'credit-card': (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </>
  ),
  dumbbell: (
    <path d="M6.5 6.5l11 11M4 8l1-1M16 20l1-1M3 11l2 2M19 11l-2 2M8 4l2 2M14 18l2 2M5 9 9 5M15 19l4-4" />
  ),
  ellipsis: (
    <>
      <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  film: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </>
  ),
  fuel: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16" />
      <path d="M3 21h11" />
      <rect x="6" y="6" width="5" height="3.5" rx="0.5" />
      <path d="M13 10h2.5A1.5 1.5 0 0 1 17 11.5V16a1.75 1.75 0 0 0 3.5 0V9l-2.5-2.5" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13" />
      <path d="M12 8S10.5 4 8 4a2 2 0 0 0 0 4h4Zm0 0s1.5-4 4-4a2 2 0 0 1 0 4h-4Z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9Z" />
    </>
  ),
  graduation: (
    <>
      <path d="M22 10L12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
      <path d="M22 10v5" />
    </>
  ),
  'hand-heart': (
    <>
      <path d="M12 9.7c-.8-1.6-3.4-1.4-3.4 1 0 1.7 2.1 3.1 3.4 3.8 1.3-.7 3.4-2.1 3.4-3.8 0-2.4-2.6-2.6-3.4-1Z" />
      <path d="M3 14.5A1.5 1.5 0 0 1 4.5 13H8l2.4 1.2a1.3 1.3 0 0 1-.6 2.5H7" />
      <path d="M3 14.5V20M3 16.5h4.8a3 3 0 0 0 1.2-.25l6.4-2.6a1.5 1.5 0 0 1 1.7 2.35L14 20l-6 1.5-5-1.3" />
    </>
  ),
  heart: (
    <path d="M12 21s-7-4.4-9.5-8.5A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.5 6.5C19 16.6 12 21 12 21Z" />
  ),
  home: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  laptop: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="1.5" />
      <path d="M2 20h20" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="9" r="1.6" />
      <circle cx="12" cy="7" r="1.6" />
      <circle cx="17" cy="9" r="1.6" />
      <path d="M12 12c-2.5 0-4.5 2-4.5 4 0 1.5 1.2 2.5 2.7 2.2.9-.2 1.7-.2 3.6 0 1.5.3 2.7-.7 2.7-2.2 0-2-2-4-4.5-4Z" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M11 18h2" />
    </>
  ),
  pill: (
    <>
      <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="M8.5 8.5l7 7" />
    </>
  ),
  plane: (
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 4.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
  ),
  salary: (
    <>
      <path d="M15 7.3C14.4 5.2 12 4.4 10.3 5.4c-1.4.8-1.6 2.6-1.6 4.6V18" />
      <path d="M6.7 12.3h6" />
      <path d="M6.7 18h9.6" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <path d="M8.12 8.12L12 12" />
      <path d="M20 4L8.12 15.88" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14.8 14.8L20 20" />
    </>
  ),
  send: (
    <>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7Z" />
    </>
  ),
  shirt: (
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23Z" />
  ),
  sparkles: (
    <>
      <path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7L12 3Z" />
      <path d="M18.5 14l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3Z" />
    </>
  ),
  tag: (
    <>
      <path d="M7 7h.01" />
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h5.1a2 2 0 0 1 1.4.6l8 8a2 2 0 0 1 0 2.8l-5.6 5.6a2 2 0 0 1-2.8 0l-8-8a2 2 0 0 1-.6-1.4V5.5Z" />
    </>
  ),
  train: (
    <>
      <rect x="6" y="3" width="12" height="13" rx="2.5" />
      <path d="M6 10h12" />
      <path d="M9.5 13h.01M14.5 13h.01" />
      <path d="M8 16l-1.5 3M16 16l1.5 3" />
    </>
  ),
  'trending-up': (
    <>
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M17 7h4v4" />
    </>
  ),
  utensils: (
    <>
      <path d="M4 2v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2M6 11v11" />
      <path d="M17 2c-1.5 0-3 2-3 5s1 4 2 4v11" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h16a1 1 0 0 1 1 1v3" />
      <circle cx="16" cy="12.5" r="1" />
    </>
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
