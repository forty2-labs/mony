import { useAuth } from '@/features/auth/AuthProvider';
import { PageHeader } from '@/shared/components/PageHeader';
import { BASE_CURRENCY, env } from '@/shared/lib/env';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="mt-0.5 text-xs text-content-muted">{description}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage appearance, account and security." />

      <div className="space-y-6">
        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-content-muted">
            Appearance
          </h2>
          <div className="card divide-y divide-border">
            <Row title="Theme" description="Light, dark, or follow your system.">
              <ThemeToggle />
            </Row>
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-content-muted">
            Account
          </h2>
          <div className="card divide-y divide-border">
            <Row title="Email">
              <span className="text-sm text-content-muted">{user?.email}</span>
            </Row>
            <Row title="Base currency" description="Display currency for totals.">
              <span className="text-sm text-content-muted">{BASE_CURRENCY}</span>
            </Row>
            <Row title="Auto-logout" description="Sign out after a period of inactivity.">
              <span className="text-sm text-content-muted">
                {env.VITE_INACTIVITY_TIMEOUT_MINUTES === 0
                  ? 'Disabled'
                  : `${env.VITE_INACTIVITY_TIMEOUT_MINUTES} min`}
              </span>
            </Row>
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-content-muted">
            Data & security
          </h2>
          <div className="card divide-y divide-border">
            <Row
              title="Export all data"
              description="Download a full copy of your vault. Available in Phase 5."
            >
              <button className="btn-ghost border border-border" disabled>
                Export
              </button>
            </Row>
            <Row
              title="Delete account"
              description="Permanently erase your vault. Available in Phase 5."
            >
              <button className="btn-ghost border border-border text-danger" disabled>
                Delete
              </button>
            </Row>
            <Row title="Sign out" description="End this session on this device.">
              <button onClick={() => void signOut()} className="btn-ghost border border-border">
                Sign out
              </button>
            </Row>
          </div>
        </section>
      </div>
    </div>
  );
}
