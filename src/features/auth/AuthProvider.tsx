import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';

import { resetVisits } from '@/shared/lib/firstVisit';
import { supabase } from '@/shared/lib/supabase';

import { type AuthLink, clearRecovery, isRecovering, rememberRecovery } from './authLink';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True until the initial session check resolves. */
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ needsConfirmation: boolean }>;
  signInWithOtp: (email: string) => Promise<void>;
  /** Email a password-reset link; it lands on /auth/confirm, then /reset-password. */
  sendPasswordReset: (email: string) => Promise<void>;
  /** Sign in from an email link's one-time token (see authLink.ts). */
  verifyEmailLink: (link: AuthLink) => Promise<void>;
  /** Set a new password for the signed-in (or recovering) user. */
  updatePassword: (password: string) => Promise<void>;
  /** True after arriving from a password-reset link, until the password is changed. */
  passwordRecovery: boolean;
  signOut: () => Promise<void>;
}

/**
 * Where auth emails send people back to: the page that verifies the link's
 * token. Must be in the project's redirect allowlist.
 */
const confirmUrl = () => `${window.location.origin}/auth/confirm`;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const userId = session?.user.id ?? null;

  // Cached server state belongs to one user. Drop it whenever the signed-in user
  // changes (sign-out, expiry, or a different account) so nothing from the
  // previous session can render for the next person on this device.
  const previousUserId = useRef<string | null>(null);
  useEffect(() => {
    if (previousUserId.current !== null && previousUserId.current !== userId) {
      queryClient.clear();
      resetVisits();
    }
    previousUserId.current = userId;
  }, [userId, queryClient]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      // A reload mid-reset must still require the new password (MON-9).
      setPasswordRecovery(isRecovering(data.session?.user.id ?? null));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY' && nextSession) {
        rememberRecovery(nextSession.user.id);
        setPasswordRecovery(true);
      }
      if (event === 'SIGNED_OUT') {
        clearRecovery();
        setPasswordRecovery(false);
      }
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      passwordRecovery,
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUpWithPassword(email, password, displayName) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: displayName ? { display_name: displayName } : undefined,
            emailRedirectTo: confirmUrl(),
          },
        });
        if (error) throw error;
        // When email confirmation is enabled, no session is returned yet.
        return { needsConfirmation: !data.session };
      },
      async signInWithOtp(email) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          // Magic links sign in existing accounts only; sign-up goes through the
          // password flow so new users always see the onboarding notices.
          options: { emailRedirectTo: confirmUrl(), shouldCreateUser: false },
        });
        if (error) throw error;
      },
      async sendPasswordReset(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: confirmUrl(),
        });
        if (error) throw error;
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        clearRecovery();
        setPasswordRecovery(false);
      },
      async verifyEmailLink({ tokenHash, type }) {
        // A recovery token fires PASSWORD_RECOVERY, which sets the reset gate above.
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) throw error;
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [session, loading, passwordRecovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
