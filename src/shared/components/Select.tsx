import { forwardRef, type SelectHTMLAttributes } from 'react';

import { cn } from '../lib/cn';
import { Icon } from './Icon';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Classes for the wrapping element (controls layout/width). */
  wrapperClassName?: string;
  /** Drop the shared `.input` base style — for compact contexts (e.g. a
   *  table-cell control) that bring their own box styling via `className`. */
  bare?: boolean;
}

/**
 * Native `<select>` with app styling and a themed custom chevron. Keeps the
 * accessibility, keyboard, and mobile behaviour of the platform control while
 * dropping the browser's default arrow for a consistent look. Drop-in for
 * `<select className="input">` — pass the same value/onChange/children.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, wrapperClassName, bare, children, ...rest },
  ref,
) {
  return (
    <div className={cn('group relative', wrapperClassName)}>
      <select
        ref={ref}
        className={cn(!bare && 'input', className, 'cursor-pointer appearance-none pr-9')}
        {...rest}
      >
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted transition-colors group-focus-within:text-brand"
      />
    </div>
  );
});
