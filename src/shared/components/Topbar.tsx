import { Icon } from './Icon';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';

/**
 * App top bar: a (currently non-functional) global search affordance and the
 * theme control. Search wiring lands in Phase 2; the field is intentionally
 * disabled rather than absent so the layout is final.
 */
export function Topbar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/60 px-5 backdrop-blur">
      <div className="relative flex-1 max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
          <Icon name="search" size={16} />
        </span>
        <input
          type="search"
          disabled
          placeholder="Search transactions… (coming in Phase 2)"
          className="input pl-9 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Search"
        />
      </div>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
