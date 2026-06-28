import { Icon } from './Icon';

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-4 bg-bg text-content-muted">
      <div className="animate-pulse text-brand">
        <Icon name="vault" size={40} />
      </div>
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}
