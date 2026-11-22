import type { IconName } from '@/shared/components/Icon';

/**
 * Where every contact on the landing page goes ("Reserve lifetime access",
 * "Contact us", the line under pricing and the footer): the team's Upwork
 * profile. Change it here and every link follows.
 */
export const CONTACT_URL = 'https://www.upwork.com/freelancers/~0123dda34004da49e6';

/*
 * Landing page copy. Every claim here must be true of the product today: no
 * live bank connections, no compliance badges, no invented numbers.
 */

/** Which illustration a step shows (see StepIllustrations.tsx). */
export type StepScene = 'export' | 'review' | 'insight';

export const STEPS: { title: string; body: string; scene: StepScene }[] = [
  {
    title: 'Export a CSV from your bank',
    body: 'Monzo, Revolut, Wise or any bank that lets you download your transactions. No bank login is ever shared with mony.',
    scene: 'export',
  },
  {
    title: 'Import and review',
    body: 'mony recognises the format, suggests categories and flags transfers between your own accounts.',
    scene: 'review',
  },
  {
    title: 'See where it goes',
    body: 'Trends, categories by month, budgets and what you have left.',
    scene: 'insight',
  },
];

export const FEATURES: { title: string; body: string; icon: IconName }[] = [
  {
    title: 'Budgets',
    body: 'Set a monthly limit per category and watch what is left, month by month.',
    icon: 'budgets',
  },
  {
    title: 'Savings goals',
    body: 'Give each goal a target and a date, and add to it as you go.',
    icon: 'savings',
  },
  {
    title: 'Money you’ve lent',
    body: 'Keep track of who owes you what, and record repayments as they come in.',
    icon: 'loans',
  },
  {
    title: 'Subscriptions',
    body: 'Every recurring payment converted to what it really costs you each month.',
    icon: 'subscriptions',
  },
  {
    title: 'Many currencies',
    body: 'Spend in euros or dollars; mony converts to pounds at that day’s rate and keeps it fixed.',
    icon: 'globe',
  },
  {
    title: 'Your data, your call',
    body: 'Export everything as a file whenever you like, or delete your account and all of it.',
    icon: 'download',
  },
];

export const PRIVACY: string[] = [
  'You never give mony your bank login. It only sees the files you choose to import.',
  'Every account is kept separate in the database, and automated tests try to break that separation.',
  'Export all of your data, or delete your account and everything in it, yourself, at any time.',
];

export interface PricingTier {
  name: string;
  price: string;
  cadence: string;
  note: string;
  points: string[];
  cta: string;
  /** Internal route (starts with "/") or an external link, opened in a new tab. */
  href: string;
  highlight?: boolean;
}

export const PRICING: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    cadence: '',
    note: 'Free while in testing',
    points: ['The full app', 'CSV import from any bank', 'Export or delete anytime'],
    cta: 'Start free',
    href: '/login?mode=signup',
  },
  {
    name: 'Lifetime',
    price: '$20',
    cadence: 'one time',
    note: 'Lifetime access, no subscription',
    points: ['Everything in Free, for good', 'Pay once, never again', 'Every update included'],
    cta: 'Reserve lifetime access',
    href: CONTACT_URL,
    highlight: true,
  },
  {
    name: 'Custom',
    price: 'Let’s talk',
    cadence: '',
    note: 'Your own deployment, on your machine',
    points: [
      'mony running on your own server',
      'Set up for your needs',
      'Your data never leaves your hands',
    ],
    cta: 'Contact us',
    href: CONTACT_URL,
  },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Is it really free?',
    a: 'Yes. While mony is in testing, every feature is free, with no card needed. Anyone who reserves lifetime access will hear first when payments open.',
  },
  {
    q: 'What does $20 get me?',
    a: 'Lifetime access to mony, paid once, with no subscription and every future update included. Payments aren’t open yet, so for now message us on Upwork to reserve it.',
  },
  {
    q: 'Do you connect to my bank?',
    a: 'No. You download a CSV from your bank (Monzo, Revolut, Wise or any other) and import it. mony never asks for your bank login.',
  },
  {
    q: 'Where is my data?',
    a: 'In mony’s database, kept separate from every other account. Only you can see it once you’re signed in.',
  },
  {
    q: 'Can I export or delete my data?',
    a: 'Yes, both, from Settings, at any time. Export gives you everything as a file; deleting your account removes all of it.',
  },
  {
    q: 'Can I run mony myself?',
    a: 'Yes, as a custom deployment set up on your own machine. Message us on Upwork and we’ll talk through what you need.',
  },
];
