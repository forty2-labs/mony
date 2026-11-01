import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { useInactivityLogout } from '@/features/auth/useInactivityLogout';

import { cn } from '../lib/cn';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/** The authenticated app shell: persistent sidebar + topbar, animated content. */
export function AppLayout() {
  useInactivityLogout();
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              // The dashboard uses the full width; other pages stay a readable column.
              className={cn(
                'mx-auto px-6 py-8',
                location.pathname === '/' ? 'max-w-none' : 'max-w-6xl',
              )}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
