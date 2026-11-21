import type { ReactNode } from 'react';

import { Icon, type IconName } from './Icon';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 w-full py-16 text-center">
      <div className="icon-badge h-14 w-14 ring-8 ring-surface-2">
        <Icon name={icon} size={26} />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-xs text-sm text-content-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
