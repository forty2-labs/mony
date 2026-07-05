import type { IconName } from './components/Icon';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

/** Primary navigation. Order here drives the sidebar. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/expenses', label: 'Expenses', icon: 'expenses' },
  { to: '/income', label: 'Income', icon: 'income' },
  { to: '/budgets', label: 'Budgets', icon: 'budgets' },
  { to: '/savings', label: 'Savings', icon: 'savings' },
  { to: '/loans', label: 'Loans', icon: 'loans' },
  { to: '/subscriptions', label: 'Subscriptions', icon: 'subscriptions' },
  { to: '/categories', label: 'Categories', icon: 'categories' },
  { to: '/import', label: 'Import', icon: 'import' },
  { to: '/reports', label: 'Reports', icon: 'reports' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];
