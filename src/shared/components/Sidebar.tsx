import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAuth } from '@/features/auth/AuthProvider';

import { cn } from '../lib/cn';
import { NAV_ITEMS } from '../navigation';
import { Icon } from './Icon';
import { LogoMark, Wordmark } from './Logo';

const STORAGE_KEY = 'mony:sidebar-collapsed';

/**
 * Inactive nav icons share one quiet green-grey tone; the active item becomes a
 * brand pill (deep green with a lime icon, or lime in dark mode).
 */
const ICON_TONE = 'text-brand-2';

const EASE = [0.16, 1, 0.3, 1] as const;
/** One shared curve for every collapse motion, so nothing races. */
const GLIDE = { duration: 0.32, ease: EASE } as const;

export function Sidebar() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? '';
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  /** Labels don't animate layout — they fade while the rail clips them. */
  const label = (text: string, extra?: string) => (
    <motion.span
      animate={{ opacity: collapsed ? 0 : 1 }}
      transition={collapsed ? { duration: 0.12, ease: 'linear' } : GLIDE}
      className={cn('whitespace-nowrap', extra)}
    >
      {text}
    </motion.span>
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 78 : 240 }}
      transition={GLIDE}
      className="relative flex h-full shrink-0 flex-col border-r border-border bg-surface py-4 z-10"
    >
      {/* Collapse toggle — floats on the divider edge, outside the clip region */}
      <button
        onClick={toggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        className="absolute -right-3 top-[42px] grid h-6 w-6 place-items-center rounded-full border border-border bg-surface text-content-muted shadow-soft transition hover:scale-110 hover:text-content"
      >
        <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={14} />
      </button>

      {/* Everything below is clipped by the animating rail width */}
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 pb-5">
          <LogoMark size={36} />
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1 }}
            transition={collapsed ? { duration: 0.12, ease: 'linear' } : GLIDE}
            className="whitespace-nowrap"
          >
            <Wordmark className="text-[19px]" />
          </motion.span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={collapsed ? item.label : undefined}
              className="group block outline-none"
            >
              {({ isActive }) => (
                <motion.div
                  transition={GLIDE}
                  className={cn(
                    'relative isolate flex items-center gap-3 px-2.5 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'rounded-full bg-brand text-brand-fg'
                      : 'rounded-full text-content-muted group-hover:bg-surface-2/70 group-hover:text-content',
                  )}
                >
                  <motion.span
                    animate={{ scale: collapsed ? 1.2 : 1 }}
                    transition={GLIDE}
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center transition-colors',
                      isActive
                        ? 'text-badge-fg'
                        : item.to === '/settings'
                          ? 'text-content-muted'
                          : ICON_TONE,
                    )}
                  >
                    <Icon name={item.icon} size={20} />
                  </motion.span>
                  {label(item.label)}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Account / sign-out — icon-left so it stays put when collapsed */}
        <div className="mt-2 border-t border-border px-3 pt-3">
          <div className="flex items-center gap-2 px-1.5">
            <button
              onClick={() => void signOut()}
              title="Sign out"
              aria-label="Sign out"
              className="shrink-0 rounded-lg p-1.5 text-content-muted transition hover:bg-surface-2 hover:text-danger"
            >
              <Icon name="logout" size={18} />
            </button>
            {label(email, 'min-w-0 truncate text-xs text-content-muted')}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
