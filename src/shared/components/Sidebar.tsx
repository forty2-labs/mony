import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../navigation';
import { Icon } from './Icon';
import { cn } from '../lib/cn';
import { useAuth } from '@/features/auth/AuthProvider';

export function Sidebar() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? '';

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-surface/60 px-3 py-4 backdrop-blur">
      <div className="flex items-center gap-2.5 px-2.5 pb-5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand/10 text-brand">
          <Icon name="vault" size={20} />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">Vault</span>
      </div>

      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-surface-2 text-content shadow-soft'
                  : 'text-content-muted hover:bg-surface-2/60 hover:text-content',
              )
            }
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-2 border-t border-border pt-3">
        <div className="flex items-center justify-between gap-2 px-2.5">
          <div className="min-w-0">
            <p className="truncate text-xs text-content-muted" title={email}>
              {email}
            </p>
          </div>
          <button
            onClick={() => void signOut()}
            title="Sign out"
            className="rounded-lg p-1.5 text-content-muted transition hover:bg-surface-2 hover:text-danger"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
