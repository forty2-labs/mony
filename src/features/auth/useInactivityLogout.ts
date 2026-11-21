import { useEffect, useRef } from 'react';

import { useProfile } from '@/features/profile/hooks';
import { DEFAULT_INACTIVITY_TIMEOUT_MINUTES } from '@/shared/lib/env';

import { useAuth } from './AuthProvider';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'];

/**
 * Signs the user out after the period of inactivity set in their profile. A no-op when the
 * timeout is 0 or no one is signed in. The timer resets on any user interaction
 * (throttled) and when the tab regains focus.
 */
export function useInactivityLogout() {
  const { user, signOut } = useAuth();
  const profile = useProfile();
  const timerRef = useRef<number | null>(null);
  const minutes = profile.data?.inactivity_timeout_minutes ?? DEFAULT_INACTIVITY_TIMEOUT_MINUTES;
  const timeoutMs = minutes * 60_000;

  useEffect(() => {
    if (!user || timeoutMs <= 0) return;

    let lastReset = 0;

    const clear = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };

    const arm = () => {
      clear();
      timerRef.current = window.setTimeout(() => {
        void signOut();
      }, timeoutMs);
    };

    const onActivity = () => {
      const now = Date.now();
      // Throttle resets to at most once per second.
      if (now - lastReset < 1000) return;
      lastReset = now;
      arm();
    };

    arm();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    window.addEventListener('focus', arm);

    return () => {
      clear();
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      window.removeEventListener('focus', arm);
    };
  }, [user, signOut, timeoutMs]);
}
