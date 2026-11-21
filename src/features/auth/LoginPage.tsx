import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import { LogoMark } from '@/shared/components/Logo';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';

import { useAuth } from './AuthProvider';
import { friendlyAuthError, PASSWORD_HINT, passwordProblem } from './password';

type Mode = 'signin' | 'signup' | 'otp' | 'forgot';

interface FormValues {
  email: string;
  password: string;
  displayName?: string;
}

const MODE_COPY: Record<Mode, { title: string; cta: string }> = {
  signin: { title: 'Welcome back', cta: 'Sign in' },
  signup: { title: 'Create your account', cta: 'Create account' },
  otp: { title: 'Sign in with a link', cta: 'Email me a link' },
  forgot: { title: 'Reset your password', cta: 'Email me a reset link' },
};

export function LoginPage() {
  const { session, signInWithPassword, signUpWithPassword, signInWithOtp, sendPasswordReset } =
    useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('signin');
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { email: '', password: '' } });

  if (session) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  const switchMode = (next: Mode) => {
    setMode(next);
    setBanner(null);
  };

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null);
    try {
      if (mode === 'signin') {
        await signInWithPassword(values.email, values.password);
      } else if (mode === 'signup') {
        const { needsConfirmation } = await signUpWithPassword(
          values.email,
          values.password,
          values.displayName,
        );
        if (needsConfirmation) {
          setBanner({
            kind: 'success',
            text: 'Check your email to confirm your account, then sign in.',
          });
        }
      } else if (mode === 'forgot') {
        await sendPasswordReset(values.email);
        // Same message whether or not the account exists (no account enumeration).
        setBanner({
          kind: 'success',
          text: 'If an account exists for that email, a reset link is on its way.',
        });
      } else {
        // Unknown emails are rejected (magic links never create accounts); treat
        // that like success so the response doesn't reveal who has an account.
        await signInWithOtp(values.email).catch((e: unknown) => {
          const code = (e as { code?: string } | null)?.code;
          if (code !== 'otp_disabled' && !/signups not allowed/i.test(String(e))) throw e;
        });
        setBanner({
          kind: 'success',
          text: 'If an account exists for that email, a sign-in link is on its way.',
        });
      }
    } catch (err) {
      setBanner({
        kind: 'error',
        text: friendlyAuthError(err),
      });
    }
  });

  const copy = MODE_COPY[mode];

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={56} className="mb-4" />
          <h1 className="text-2xl font-medium tracking-tight">{copy.title}</h1>
          <p className="mt-1 text-sm text-content-muted">Your money. Your clarity.</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-7">
          {banner && (
            <div
              className={
                banner.kind === 'error'
                  ? 'rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger'
                  : 'rounded-xl bg-success/10 px-3 py-2.5 text-sm text-success'
              }
            >
              {banner.text}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="displayName">
                Name
              </label>
              <input
                id="displayName"
                className="input"
                autoComplete="name"
                placeholder="Your name"
                {...register('displayName')}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="email"
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>

          {(mode === 'signin' || mode === 'signup') && (
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                {...register('password', {
                  required: 'Password is required',
                  validate: mode === 'signup' ? passwordProblem : undefined,
                })}
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
              ) : mode === 'signup' ? (
                <p className="mt-1 text-xs text-content-muted">{PASSWORD_HINT}</p>
              ) : null}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : copy.cta}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2 text-sm text-content-muted">
          {mode === 'signin' && (
            <>
              <button className="hover:text-content" onClick={() => switchMode('forgot')}>
                Forgot your password?
              </button>
              <button className="hover:text-content" onClick={() => switchMode('otp')}>
                Sign in with a magic link instead
              </button>
              <button className="hover:text-content" onClick={() => switchMode('signup')}>
                New to mony? <span className="text-brand">Create an account</span>
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button className="hover:text-content" onClick={() => switchMode('signin')}>
              Already have an account? <span className="text-brand">Sign in</span>
            </button>
          )}
          {(mode === 'otp' || mode === 'forgot') && (
            <button className="hover:text-content" onClick={() => switchMode('signin')}>
              Back to sign in
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
