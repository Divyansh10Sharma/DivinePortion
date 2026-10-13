import { createElement } from 'react';
import type { LucideProps } from 'lucide-react';
import type { FooterIcon, MealIcon } from '../../lib/types';
import { footerIconComponent, mealIconComponent } from './registry';

// The icon components are static module-level lucide components looked up by key;
// createElement keeps that lookup out of JSX so it isn't mistaken for a component created during render.

export function MealGlyph({ icon, ...props }: { icon: MealIcon } & LucideProps) {
  return createElement(mealIconComponent(icon), { 'aria-hidden': true, ...props });
}

export function FooterGlyph({ icon, ...props }: { icon: FooterIcon } & LucideProps) {
  return createElement(footerIconComponent(icon), { 'aria-hidden': true, ...props });
}

/** Forest-green circle with a cream glyph — the timeline node (§6.3, PLAN-3). */
export function MealIconNode({ icon, size = 36 }: { icon: MealIcon; size?: number }) {
  return (
    <span
      className="relative z-10 flex items-center justify-center rounded-full bg-forest text-cream ring-4 ring-cream"
      style={{ width: size, height: size }}
    >
      <MealGlyph icon={icon} size={size * 0.5} strokeWidth={1.75} />
    </span>
  );
}
