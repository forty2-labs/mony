import { Icon, type IconName } from './Icon';

const FALLBACK_COLOR = '#98989D';
const FALLBACK_ICON: IconName = 'tag';

/** A colored, icon-bearing chip representing a category (or "uncategorised"). */
export function CategoryBadge({
  color,
  icon,
  size = 36,
}: {
  color?: string | null;
  icon?: string | null;
  size?: number;
}) {
  const c = color ?? FALLBACK_COLOR;
  const name = (icon as IconName) || FALLBACK_ICON;
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl"
      style={{ backgroundColor: c + '22', color: c, width: size, height: size }}
    >
      <Icon name={name} size={Math.round(size * 0.5)} />
    </span>
  );
}
