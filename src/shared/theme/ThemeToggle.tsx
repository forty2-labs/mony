import { useTheme, type ThemePreference } from './ThemeProvider';
import { Icon, type IconName } from '../components/Icon';
import { cn } from '../lib/cn';

const OPTIONS: { value: ThemePreference; icon: IconName; label: string }[] = [
  { value: 'light', icon: 'sun', label: 'Light' },
  { value: 'system', icon: 'monitor', label: 'System' },
  { value: 'dark', icon: 'moon', label: 'Dark' },
];

/** Segmented control for choosing light / system / dark. */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 p-1"
    >
      {OPTIONS.map((opt) => {
        const active = preference === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            title={opt.label}
            onClick={() => setPreference(opt.value)}
            className={cn(
              'flex h-8 w-9 items-center justify-center rounded-lg transition',
              active
                ? 'bg-surface text-content shadow-soft'
                : 'text-content-muted hover:text-content',
            )}
          >
            <Icon name={opt.icon} size={16} />
          </button>
        );
      })}
    </div>
  );
}
