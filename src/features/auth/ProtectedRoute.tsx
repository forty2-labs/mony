import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { FullScreenLoader } from '@/shared/components/FullScreenLoader';

import { useAuth } from './AuthProvider';

/** Gates all authenticated routes; redirects to /login when signed out. */
export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader label="Unlocking your vault…" />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
