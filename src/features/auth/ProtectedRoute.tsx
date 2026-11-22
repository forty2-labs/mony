import { lazy, Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { FullScreenLoader } from '@/shared/components/FullScreenLoader';

import { failedAuthLink } from './authLink';
import { useAuth } from './AuthProvider';

// Only signed-out visitors at `/` load this chunk.
const LandingPage = lazy(() =>
  import('@/features/landing/LandingPage').then((m) => ({ default: m.LandingPage })),
);

/**
 * Gates all authenticated routes; redirects to /login when signed out, except
 * `/`, which shows the public landing page to signed-out visitors.
 */
export function ProtectedRoute() {
  const { session, loading, passwordRecovery } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader label="Loading your account…" />;

  if (!session) {
    if (location.pathname === '/') {
      // An email link that fell back to the site root still carries its token.
      if (new URLSearchParams(location.search).has('token_hash')) {
        return <Navigate to={`/auth/confirm${location.search}`} replace />;
      }
      // An expired, used or cross-browser link: say so instead of showing the landing page.
      if (failedAuthLink(location.search, location.hash)) {
        return <Navigate to="/login?mode=otp&link=expired" replace />;
      }
      // The home page is public: signed-out visitors get the landing page there.
      return (
        <Suspense fallback={<FullScreenLoader />}>
          <LandingPage />
        </Suspense>
      );
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // A reset-link session must choose a new password before using the app.
  if (passwordRecovery) return <Navigate to="/reset-password" replace />;

  return <Outlet />;
}
