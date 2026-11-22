import { useReducedMotion } from 'framer-motion';

/** The landing page's one easing curve: quick start, soft landing. */
export const EASE = [0.16, 1, 0.3, 1] as const;

export interface RevealOptions {
  /** Where the element starts, relative to its resting place. */
  from?: { x?: number; y?: number; scale?: number };
  /** Base delay before the stagger, in seconds. */
  delay?: number;
  /** Gap between staggered items, in seconds. */
  step?: number;
  /** How much of the element must be on screen before it plays (0–1). */
  amount?: number;
}

/**
 * Entrance props for scroll-revealed elements: spread the result of
 * `reveal(i)` onto a `motion.*` element to fade it in from `from` the first
 * time it scrolls into view, staggered by its index. Returns no props when the
 * visitor prefers reduced motion, so everything simply renders in place.
 */
export function useReveal() {
  const reduce = useReducedMotion();
  return (
    i = 0,
    { from = { y: 16 }, delay = 0.05, step = 0.08, amount = 0.3 }: RevealOptions = {},
  ) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, ...from },
          whileInView: { opacity: 1, x: 0, y: 0, scale: 1 },
          viewport: { once: true, amount },
          transition: { duration: 0.6, ease: EASE, delay: delay + i * step },
        };
}
