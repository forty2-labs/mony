import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { FullScreenLoader } from '@/shared/components/FullScreenLoader';

import { useAuth } from './AuthProvider';

/** Gates all authenticated routes; redirects to /login when signed out. */
export function ProtectedRoute() {
  const { session, loading, passwordRecovery } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader label="Loading your account…" />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // A reset-link session must choose a new password before using the app.
  if (passwordRecovery) return <Navigate to="/reset-password" replace />;

  return <Outlet />;
}
