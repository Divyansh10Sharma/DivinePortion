import { motion, useReducedMotion } from 'motion/react';

/** ANIM-3: a check mark that draws itself (SVG pathLength) when it mounts. */
export function DrawnCheck({ size = 14, strokeWidth = 3, className = '' }: { size?: number; strokeWidth?: number; className?: string }) {
  // ANIM-11: under reduced motion the check simply fades in instead of drawing.
  const reduced = useReducedMotion();
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className={className}>
      <motion.path
        d="M5 12.5 L10 17.5 L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? { pathLength: 1, opacity: 0 } : { pathLength: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reduced ? 0.2 : 0.42, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  );
}
