import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { LoginPage } from '@/features/auth/LoginPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
/**
 * Routes are lazy-loaded so each feature ships as its own chunk (code splitting).
 * The dashboard is eager since it's the default landing view.
 */
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { AppLayout } from '@/shared/components/AppLayout';
import { FullScreenLoader } from '@/shared/components/FullScreenLoader';

const ExpensesPage = lazy(() =>
  import('@/features/expenses/ExpensesPage').then((m) => ({ default: m.ExpensesPage })),
);
const IncomePage = lazy(() =>
  import('@/features/income/IncomePage').then((m) => ({ default: m.IncomePage })),
);
const BudgetsPage = lazy(() =>
  import('@/features/budgets/BudgetsPage').then((m) => ({ default: m.BudgetsPage })),
);
const SavingsPage = lazy(() =>
  import('@/features/savings/SavingsPage').then((m) => ({ default: m.SavingsPage })),
);
const LoansPage = lazy(() =>
  import('@/features/loans/LoansPage').then((m) => ({ default: m.LoansPage })),
);
const SubscriptionsPage = lazy(() =>
  import('@/features/subscriptions/SubscriptionsPage').then((m) => ({
    default: m.SubscriptionsPage,
  })),
);
const CategoriesPage = lazy(() =>
  import('@/features/categories/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
);
const ImportPage = lazy(() =>
  import('@/features/import/ImportPage').then((m) => ({ default: m.ImportPage })),
);
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const NotFoundPage = lazy(() =>
  import('@/features/misc/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function lazyPage(node: React.ReactNode) {
  return <Suspense fallback={<FullScreenLoader />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'expenses', element: lazyPage(<ExpensesPage />) },
          { path: 'income', element: lazyPage(<IncomePage />) },
          { path: 'budgets', element: lazyPage(<BudgetsPage />) },
          { path: 'savings', element: lazyPage(<SavingsPage />) },
          { path: 'loans', element: lazyPage(<LoansPage />) },
          { path: 'subscriptions', element: lazyPage(<SubscriptionsPage />) },
          { path: 'categories', element: lazyPage(<CategoriesPage />) },
          { path: 'import', element: lazyPage(<ImportPage />) },
          // Reports merged into the dashboard — keep old links working.
          { path: 'reports', element: <Navigate to="/" replace /> },
          { path: 'settings', element: lazyPage(<SettingsPage />) },
          { path: '*', element: lazyPage(<NotFoundPage />) },
        ],
      },
    ],
  },
]);
