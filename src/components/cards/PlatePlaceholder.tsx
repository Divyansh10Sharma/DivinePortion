import { useId } from 'react';

/**
 * PHOTO-5: elegant placeholder for meals/items without a photo —
 * a white porcelain plate (rim + subtle inner shadow) on a linen square.
 */
export function PlatePlaceholder({ size = 64 }: { size?: number }) {
  // Unique ids so several plates on one page don't share gradient/filter defs.
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden className="block">
      <defs>
        <radialGradient id={`rim-${uid}`} cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="78%" stopColor="#FBF8F1" />
          <stop offset="100%" stopColor="#E9E1D1" />
        </radialGradient>
        <radialGradient id={`well-${uid}`} cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#FDFBF6" />
          <stop offset="100%" stopColor="#ECE4D4" />
        </radialGradient>
        <pattern id={`linen-${uid}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#EFE7D8" />
          <path d="M0 .5h4M.5 0v4" stroke="#E2D7C3" strokeWidth=".5" />
        </pattern>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#linen-${uid})`} />
      {/* plate shadow */}
      <ellipse cx="50" cy="54" rx="40" ry="39" fill="#2A2420" opacity="0.08" />
      <circle cx="50" cy="50" r="40" fill={`url(#rim-${uid})`} stroke="#E4DACA" strokeWidth=".75" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="#C9A96E" strokeOpacity=".4" strokeWidth=".6" />
      <circle cx="50" cy="50" r="27" fill={`url(#well-${uid})`} stroke="#E8DFCE" strokeWidth=".8" />
      {/* soft highlight on the rim */}
      <path d="M22 36 A 32 32 0 0 1 44 18" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity=".9" />
    </svg>
  );
}
