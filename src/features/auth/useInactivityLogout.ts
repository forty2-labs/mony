import { useEffect, useRef } from 'react';
import { INACTIVITY_TIMEOUT_MS } from '@/shared/lib/env';
import { useAuth } from './AuthProvider';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'];

/**
 * Signs the user out after a configurable period of inactivity. A no-op when the
 * timeout is 0 or no one is signed in. The timer resets on any user interaction
 * (throttled) and when the tab regains focus.
 */
export function useInactivityLogout() {
  const { user, signOut } = useAuth();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user || INACTIVITY_TIMEOUT_MS <= 0) return;

    let lastReset = 0;

    const clear = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };

    const arm = () => {
      clear();
      timerRef.current = window.setTimeout(() => {
        void signOut();
      }, INACTIVITY_TIMEOUT_MS);
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
  }, [user, signOut]);
}
