import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { FullScreenLoader } from '@/shared/components/FullScreenLoader';
import { LogoMark } from '@/shared/components/Logo';
import { useToast } from '@/shared/components/Toast';

import { useAuth } from './AuthProvider';
import { friendlyAuthError, PASSWORD_HINT, passwordProblem } from './password';

interface FormValues {
  password: string;
  confirm: string;
}

/**
 * Where a password-reset link ends up, after /auth/confirm has verified it and
 * signed the user in with a recovery session, which is what allows
 * `updateUser({ password })` here.
 */
export function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { password: '', confirm: '' } });

  if (loading) return <FullScreenLoader label="Checking your reset link…" />;

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null);
    try {
      await updatePassword(password);
      toast.success('Password updated');
      navigate('/', { replace: true });
    } catch (e) {
      setError(friendlyAuthError(e));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={56} className="mb-4" />
          <h1 className="text-2xl font-medium tracking-tight">Choose a new password</h1>
        </div>

        {!session ? (
          <div className="card space-y-4 p-6 text-sm">
            <p>
              To choose a new password, open the latest reset link from your email. Links work once
              and expire after a short while.
            </p>
            <Link to="/login?mode=forgot" className="btn-primary w-full">
              Email me a new reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card space-y-4 p-7" noValidate>
            {error && (
              <div role="alert" className="rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                autoComplete="new-password"
                {...register('password', {
                  required: 'Password is required',
                  validate: passwordProblem,
                })}
              />
              <p
                className={`mt-1 text-xs ${errors.password ? 'text-danger' : 'text-content-muted'}`}
              >
                {errors.password?.message ?? PASSWORD_HINT}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="confirm">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                className="input"
                autoComplete="new-password"
                {...register('confirm', {
                  validate: (v) => v === getValues('password') || 'Passwords don’t match',
                })}
              />
              {errors.confirm && (
                <p className="mt-1 text-xs text-danger">{errors.confirm.message}</p>
              )}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
