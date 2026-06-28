import { Icon, type IconName } from './Icon';
import { PageHeader } from './PageHeader';

/** Placeholder for modules scheduled in later phases. */
export function ComingSoon({
  title,
  icon,
  phase,
  description,
}: {
  title: string;
  icon: IconName;
  phase: string;
  description: string;
}) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="card flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 text-content-muted">
          <Icon name={icon} size={28} />
        </div>
        <div className="max-w-sm">
          <p className="text-content">{description}</p>
          <p className="mt-2 inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            Planned for {phase}
          </p>
        </div>
      </div>
    </div>
  );
}
