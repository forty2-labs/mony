import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import { useInactivityLogout } from '@/features/auth/useInactivityLogout';

import { cn } from '../lib/cn';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/** The authenticated app shell: persistent sidebar + topbar around the page. */
export function AppLayout() {
  useInactivityLogout();
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {/* No route transition: cached pages render at once, so a fade would only
              make a revisit look like a reload. */}
          <div
            className={cn(
              'mx-auto px-6 py-8',
              // The dashboard uses the full width; other pages stay a readable column.
              location.pathname === '/' ? 'max-w-none' : 'max-w-6xl',
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
