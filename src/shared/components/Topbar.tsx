import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ThemeToggle } from '@/shared/theme/ThemeToggle';

import { Icon } from './Icon';

/**
 * App top bar: a global search box that jumps to the Expenses list with the
 * query pre-applied, plus the theme control.
 */
export function Topbar() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    navigate(trimmed ? `/expenses?q=${encodeURIComponent(trimmed)}` : '/expenses');
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/60 px-5 backdrop-blur">
      <form onSubmit={submit} className="relative max-w-md flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
          <Icon name="search" size={16} />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search expenses…"
          className="input pl-9"
          aria-label="Search expenses"
        />
      </form>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
