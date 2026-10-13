import { useEffect } from 'react';
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react';

/**
 * ANIM-2: a number that counts smoothly to its new value whenever it changes.
 * The spring drives a motion value, so React doesn't re-render per frame; only the text node updates.
 * Rounded for display only (internal values keep their decimals).
 */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const reduced = useReducedMotion();
  const spring = useSpring(value, { stiffness: 90, damping: 20, mass: 0.8 });
  const text = useTransform(spring, (v) => String(Math.round(v) + 0));

  useEffect(() => {
    // ANIM-11: with reduced motion, jump straight to the value.
    if (reduced) spring.jump(value);
    else spring.set(value);
  }, [value, reduced, spring]);

  return <motion.span className={className ?? 'tabular'}>{text}</motion.span>;
}
