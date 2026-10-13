import type { ReactNode } from 'react';
import { motion } from 'motion/react';

/**
 * ANIM-4: SVG ring that fills with a spring. `progress` is 0…1 (clamped; over-target shows a full ring
 * in the warning colour). pathLength is drawn via stroke-dashoffset by motion, so only paint changes.
 */
export function ProgressRing({
  progress,
  color,
  size = 64,
  stroke = 6,
  children,
}: {
  progress: number;
  color: string;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(31 77 46 / 0.1)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          // A zero-length round-capped path still paints a dot, so it's hidden when empty. Opacity lives in
          // `animate` (not `style`): motion reads style values once, so a style opacity would never update.
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: clamped, opacity: clamped === 0 ? 0 : 1 }}
          transition={{ pathLength: { type: 'spring', stiffness: 70, damping: 18 }, opacity: { duration: 0.2 } }}
          // Colour changes (e.g. → terracotta) via a CSS transition; motion can't interpolate var() colours.
          style={{ transition: 'stroke 300ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
