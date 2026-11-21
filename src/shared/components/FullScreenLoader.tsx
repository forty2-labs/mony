import { LogoMark } from './Logo';

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-4 bg-bg text-content-muted">
      <div className="animate-pulse">
        <LogoMark size={44} className="rounded-xl" />
      </div>
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}
