import type { SVGProps } from 'react';

/**
 * A tiny, dependency-free icon set (stroke-based, 24px grid). Kept inline so the
 * app has zero icon-library weight; extend as new glyphs are needed.
 */
export type IconName =
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
  // Category glyphs (selectable in the category form)
  | 'cart'
  | 'utensils'
  | 'car'
  | 'home'
  | 'bolt'
  | 'film'
  | 'heart'
  | 'bag'
  | 'plane'
  | 'wallet'
  | 'laptop'
  | 'trending-up'
  | 'gift'
  | 'coffee'
  | 'phone'
  | 'book'
  | 'music'
  | 'dumbbell'
  | 'paw'
  | 'tag'
  | 'hand-heart'
  | 'activity'
  | 'sparkles'
  | 'send'
  | 'ellipsis';

/**
 * Icons offered in the category picker, ordered so the glyphs that match the
 * common category set (Charity, Dining, Groceries, Health, Housing, Personal
 * Care, Remittance, Shopping, Transport, Travel, Utilities, …) come first.
 */
export const CATEGORY_ICONS: IconName[] = [
  'cart', 'utensils', 'film', 'bag', 'car', 'plane', 'home', 'bolt',
  'activity', 'sparkles', 'hand-heart', 'send', 'ellipsis', 'wallet',
  'coffee', 'gift', 'phone', 'laptop', 'book', 'music', 'dumbbell',
  'paw', 'heart', 'trending-up', 'tag',
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
  cart: (
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L22 7H6" />
    </>
  ),
  utensils: (
    <>
      <path d="M4 2v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2M6 11v11" />
      <path d="M17 2c-1.5 0-3 2-3 5s1 4 2 4v11" />
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
  home: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  film: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </>
  ),
  heart: (
    <path d="M12 21s-7-4.4-9.5-8.5A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.5 6.5C19 16.6 12 21 12 21Z" />
  ),
  bag: (
    <>
      <path d="M6 8h12l1 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  plane: (
    <path d="M10.2 4.6a1.6 1.6 0 0 1 3 .1l1 4.2 6.3 3.5a1 1 0 0 1-.6 1.9l-6.2-1.5-1.5 3.5 1.8 1.7-1.3 1-2.6-2-2.6 2-1.3-1 1.8-1.7-1.5-3.5L4.6 16a1 1 0 0 1-.6-1.9l6.3-3.5 1-4.2Z" />
  ),
  wallet: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h16a1 1 0 0 1 1 1v3" />
      <circle cx="16" cy="12.5" r="1" />
    </>
  ),
  laptop: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="1.5" />
      <path d="M2 20h20" />
    </>
  ),
  'trending-up': (
    <>
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M17 7h4v4" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13" />
      <path d="M12 8S10.5 4 8 4a2 2 0 0 0 0 4h4Zm0 0s1.5-4 4-4a2 2 0 0 1 0 4h-4Z" />
    </>
  ),
  coffee: (
    <>
      <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
      <path d="M17 9h2a2.5 2.5 0 0 1 0 5h-2M6 2v2M10 2v2M14 2v2" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M11 18h2" />
    </>
  ),
  book: (
    <>
      <path d="M5 4a2 2 0 0 1 2-2h12v18H7a2 2 0 0 0-2 2V4Z" />
      <path d="M5 18.5A2 2 0 0 1 7 17h12" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  dumbbell: (
    <path d="M6.5 6.5l11 11M4 8l1-1M16 20l1-1M3 11l2 2M19 11l-2 2M8 4l2 2M14 18l2 2M5 9 9 5M15 19l4-4" />
  ),
  paw: (
    <>
      <circle cx="7" cy="9" r="1.6" />
      <circle cx="12" cy="7" r="1.6" />
      <circle cx="17" cy="9" r="1.6" />
      <path d="M12 12c-2.5 0-4.5 2-4.5 4 0 1.5 1.2 2.5 2.7 2.2.9-.2 1.7-.2 3.6 0 1.5.3 2.7-.7 2.7-2.2 0-2-2-4-4.5-4Z" />
    </>
  ),
  tag: (
    <>
      <path d="M7 7h.01" />
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h5.1a2 2 0 0 1 1.4.6l8 8a2 2 0 0 1 0 2.8l-5.6 5.6a2 2 0 0 1-2.8 0l-8-8a2 2 0 0 1-.6-1.4V5.5Z" />
    </>
  ),
  'hand-heart': (
    <>
      <path d="M12 9.7c-.8-1.6-3.4-1.4-3.4 1 0 1.7 2.1 3.1 3.4 3.8 1.3-.7 3.4-2.1 3.4-3.8 0-2.4-2.6-2.6-3.4-1Z" />
      <path d="M3 14.5A1.5 1.5 0 0 1 4.5 13H8l2.4 1.2a1.3 1.3 0 0 1-.6 2.5H7" />
      <path d="M3 14.5V20M3 16.5h4.8a3 3 0 0 0 1.2-.25l6.4-2.6a1.5 1.5 0 0 1 1.7 2.35L14 20l-6 1.5-5-1.3" />
    </>
  ),
  activity: <path d="M3 12h4l2.5-7 5 14 2.5-7H21" />,
  sparkles: (
    <>
      <path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7L12 3Z" />
      <path d="M18.5 14l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3Z" />
    </>
  ),
  send: (
    <>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7Z" />
    </>
  ),
  ellipsis: (
    <>
      <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" />
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
