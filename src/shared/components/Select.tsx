import {
  Children,
  type CSSProperties,
  isValidElement,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '../lib/cn';
import { Icon } from './Icon';

interface OptionItem {
  value: string;
  label: ReactNode;
  text: string;
  disabled: boolean;
}

interface SelectProps {
  value: string | number;
  /** Called with the chosen option's value. */
  onChange: (value: string) => void;
  /** `<option value="…">Label</option>` elements, as with a native select. */
  children: ReactNode;
  id?: string;
  disabled?: boolean;
  'aria-label'?: string;
  /** Classes for the trigger button. */
  className?: string;
  /** Classes for the wrapping element (controls layout/width). */
  wrapperClassName?: string;
  /** Drop the shared `.input` base style — for compact contexts (e.g. a
   *  table-cell control) that bring their own box styling via `className`. */
  bare?: boolean;
}

const LIST_MAX_HEIGHT = 288;
const GAP = 6;

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

/** Collect `<option>` children, including ones produced by `.map()`. */
function readOptions(children: ReactNode): OptionItem[] {
  const out: OptionItem[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== 'option') return;
    const props = (
      child as ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>
    ).props;
    const label = props.children;
    out.push({
      value: String(props.value ?? textOf(label)),
      label,
      text: textOf(label).trim(),
      disabled: Boolean(props.disabled),
    });
  });
  return out;
}

/**
 * A styled dropdown that replaces the native `<select>` popup. Written like a
 * select (`<option>` children), but `onChange` receives the value directly.
 *
 * Follows the WAI-ARIA select-only combobox pattern: focus stays on the
 * trigger, arrows/Home/End move, Enter/Space pick, Escape closes, and typing
 * jumps to a matching option. The list renders in a portal with fixed
 * positioning so modals and scrolling tables can't clip it, and flips above
 * the trigger when there isn't room below.
 */
export function Select({
  value,
  onChange,
  children,
  id,
  disabled,
  'aria-label': ariaLabel,
  className,
  wrapperClassName,
  bare,
}: SelectProps) {
  const options = readOptions(children);
  const current = String(value);
  const selectedIndex = options.findIndex((o) => o.value === current);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [style, setStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: '', at: 0 });
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const enabledFrom = useCallback(
    (start: number, step: 1 | -1) => {
      for (let i = start; i >= 0 && i < options.length; i += step) {
        if (!options[i].disabled) return i;
      }
      return -1;
    },
    [options],
  );

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - GAP;
    const above = rect.top - GAP;
    const wanted = Math.min(LIST_MAX_HEIGHT, options.length * 40 + 12);
    const flip = below < wanted && above > below;
    setStyle({
      position: 'fixed',
      left: rect.left,
      minWidth: rect.width,
      maxHeight: Math.max(120, Math.min(LIST_MAX_HEIGHT, flip ? above : below)),
      ...(flip ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
    });
  }, [options.length]);

  const openList = () => {
    if (disabled) return;
    place();
    setActive(selectedIndex >= 0 ? selectedIndex : enabledFrom(0, 1));
    setOpen(true);
  };

  const close = () => setOpen(false);

  const choose = (i: number) => {
    const option = options[i];
    if (!option || option.disabled) return;
    close();
    triggerRef.current?.focus();
    if (option.value !== current) onChange(option.value);
  };

  // Keep the list attached to the trigger while the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  // Close on a press anywhere outside the trigger and the list.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return;
      close();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Keep the active option in view.
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const jumpToTyped = (key: string) => {
    const now = Date.now();
    const t = typeahead.current;
    t.text = now - t.at > 600 ? key : t.text + key;
    t.at = now;
    const needle = t.text.toLowerCase();
    const from = open ? active : selectedIndex;
    const order = options.map((_, i) => (from + 1 + i) % options.length);
    // A repeated single letter cycles through matches; otherwise match the prefix.
    const cycling = needle.length > 1 && [...needle].every((c) => c === needle[0]);
    const match = order.find(
      (i) =>
        !options[i].disabled &&
        options[i].text.toLowerCase().startsWith(cycling ? needle[0] : needle),
    );
    if (match === undefined) return;
    if (open) setActive(match);
    else if (options[match].value !== current) onChange(options[match].value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const key = e.key;

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
        e.preventDefault();
        openList();
      } else if (key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        jumpToTyped(key);
      }
      return;
    }

    switch (key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = enabledFrom(active + 1, 1);
        if (next >= 0) setActive(next);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = enabledFrom(active - 1, -1);
        if (prev >= 0) setActive(prev);
        break;
      }
      case 'Home':
        e.preventDefault();
        setActive(enabledFrom(0, 1));
        break;
      case 'End':
        e.preventDefault();
        setActive(enabledFrom(options.length - 1, -1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        // Close just the list, not a modal this select sits in.
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
      case 'Tab':
        close();
        break;
      default:
        if (key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) jumpToTyped(key);
    }
  };

  return (
    <div className={cn('group relative', wrapperClassName)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        aria-label={ariaLabel}
        // Full text on hover when a narrow trigger truncates the label.
        title={selected?.text || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          !bare && 'input',
          'flex items-center justify-between gap-2 pr-8 text-left',
          'disabled:cursor-not-allowed disabled:opacity-60',
          open && !bare && 'border-brand ring-2 ring-brand/30',
          className,
        )}
      >
        {/* Every label sits in one grid cell, invisible except the selected one,
            so the trigger is as wide as its longest option (like a native select)
            and doesn't jump when the choice changes. */}
        <span className="grid min-w-0">
          {options.map((o, i) => (
            <span key={i} aria-hidden className="invisible col-start-1 row-start-1 truncate">
              {o.label}
            </span>
          ))}
          <span className="col-start-1 row-start-1 truncate">{selected?.label ?? '\u00a0'}</span>
        </span>
      </button>
      <Icon
        name="chevron-down"
        size={16}
        className={cn(
          'pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted transition',
          open ? 'rotate-180 text-brand' : 'group-focus-within:text-brand',
        )}
      />

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              tabIndex={-1}
              style={style}
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="z-50 overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-soft-lg"
            >
              {options.map((o, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <li
                    key={`${o.value}-${i}`}
                    id={optionId(i)}
                    data-index={i}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={o.disabled || undefined}
                    onPointerMove={() => !o.disabled && setActive(i)}
                    onClick={() => choose(i)}
                    className={cn(
                      'flex cursor-pointer select-none items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm',
                      i === active && 'bg-surface-2',
                      isSelected ? 'font-medium text-content' : 'text-content-muted',
                      o.disabled && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSelected ? (
                      <Icon name="check" size={15} className="shrink-0 text-brand" />
                    ) : null}
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
