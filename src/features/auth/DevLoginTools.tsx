import { useState } from 'react';

import { Icon } from '@/shared/components/Icon';
import { env } from '@/shared/lib/env';

/** Seeded by supabase/seed.sql into local databases only. */
const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'MonyDemo2026';

/** Mailpit, the local stack's catch-all inbox (`[local_smtp]` in config.toml). */
const MAILPIT_PORT = 54324;

function localStackHost(): URL | null {
  const url = new URL(env.VITE_SUPABASE_URL);
  return ['127.0.0.1', 'localhost'].includes(url.hostname) ? url : null;
}

/**
 * Development shortcuts on the sign-in page: one-click sign-in as the seeded
 * demo account, and a link to Mailpit where confirmation, magic-link and
 * reset emails land. Rendered only by dev builds pointed at a local stack.
 */
export function DevLoginTools({
  signIn,
}: {
  signIn: (email: string, password: string) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const local = localStackHost();
  if (!local) return null;

  const mailpit = `${local.protocol}//${local.hostname}:${MAILPIT_PORT}`;

  const signInAsDemo = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn(DEMO_EMAIL, DEMO_PASSWORD);
    } catch {
      setError('Demo account not found. Run `npm run db:reset` to seed it.');
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-dashed border-border p-4 text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-content-muted">
        Development
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="btn-ghost flex-1 border border-border"
          onClick={() => void signInAsDemo()}
          disabled={busy}
        >
          <Icon name="wallet" size={16} />
          {busy ? 'Signing in…' : 'Demo account'}
        </button>
        <a
          className="btn-ghost flex-1 border border-border"
          href={mailpit}
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="send" size={16} />
          Mailpit inbox
        </a>
      </div>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
      <p className="mt-2 text-xs text-content-muted">
        Sign-up confirmations, magic links and reset emails land in Mailpit.
      </p>
    </div>
  );
}
