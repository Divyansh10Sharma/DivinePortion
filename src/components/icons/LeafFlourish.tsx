/** Small decorative leaf sprig for either side of the poster title (HOME-2). */
export function LeafFlourish({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 40 24"
      width={34}
      height={20}
      aria-hidden
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M2 12 C 12 12, 24 12, 38 12" stroke="var(--olive)" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M14 12 C 16 5, 22 3, 26 4 C 24 9, 19 12, 14 12 Z" fill="var(--forest)" />
      <path d="M22 12 C 24 18, 30 21, 34 20 C 32 15, 27 12, 22 12 Z" fill="var(--olive)" />
      <path d="M6 12 C 7 8, 10 7, 12 7.5 C 11 10, 9 12, 6 12 Z" fill="var(--olive)" opacity="0.8" />
    </svg>
  );
}
