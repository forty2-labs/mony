import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { FullScreenLoader } from '@/shared/components/FullScreenLoader';
import { LogoMark } from '@/shared/components/Logo';

import { parseAuthLink } from './authLink';
import { useAuth } from './AuthProvider';

/**
 * Where every auth email link lands (magic link, password reset, sign-up
 * confirmation). It verifies the link's one-time token, then sends the user on:
 * a reset goes to /reset-password, everything else to the dashboard.
 */
export function AuthConfirmPage() {
  const { session, loading, passwordRecovery, verifyEmailLink } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [link] = useState(() => parseAuthLink(search));
  const [failed, setFailed] = useState(false);
  // Tokens work once; StrictMode's double effect must not spend it twice.
  const started = useRef(false);

  useEffect(() => {
    if (!link || started.current) return;
    started.current = true;
    verifyEmailLink(link)
      .then(() => navigate(link.type === 'recovery' ? '/reset-password' : '/', { replace: true }))
      .catch(() => setFailed(true));
  }, [link, navigate, verifyEmailLink]);

  // Without a token, this is a link from Supabase's default templates (e.g. a
  // hosted project not yet using ours): the client has already exchanged its
  // `?code=`, so a session here means it worked.
  if (!link) {
    if (loading) return <FullScreenLoader label="Checking your link…" />;
    if (session) return <Navigate to={passwordRecovery ? '/reset-password' : '/'} replace />;
  } else if (!failed) {
    return <FullScreenLoader label="Checking your link…" />;
  }

  const isReset = link?.type === 'recovery';
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={56} className="mb-4" />
          <h1 className="text-2xl font-medium tracking-tight">This link has expired</h1>
        </div>
        <div className="card space-y-4 p-6 text-sm">
          <p>
            Email links work once and expire after a short while. If you asked for more than one,
            only the newest works. Request a fresh link and use that one.
          </p>
          <Link
            to={isReset ? '/login?mode=forgot' : '/login?mode=otp'}
            className="btn-primary w-full"
          >
            {isReset ? 'Email me a new reset link' : 'Email me a new sign-in link'}
          </Link>
          <Link to="/login" className="btn-ghost w-full">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
