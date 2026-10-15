// Icon registry: inline SVG icons from lucide-react, keyed by the string stored in data.
// v2: only the poster footer uses these (meal timeline icons were dropped — owner request).

import {
  Apple,
  Clock,
  Coffee,
  CupSoda,
  Droplet,
  Leaf,
  Moon,
  Soup,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  type LucideIcon,
} from 'lucide-react';
import type { FooterIcon, KnownMealIcon } from '../../lib/types';

const MEAL_ICONS: Record<KnownMealIcon, LucideIcon> = {
  sunrise: Sunrise,
  sun: Sun,
  star: Star,
  coffee: Coffee,
  leaf: Leaf,
  moon: Moon,
  apple: Apple,
  bowl: Soup,
  cup: CupSoda,
  sparkle: Sparkles,
};

const FOOTER_ICONS: Record<string, LucideIcon> = {
  ...MEAL_ICONS,
  droplet: Droplet,
  clock: Clock,
};

export function footerIconComponent(icon: FooterIcon): LucideIcon {
  return FOOTER_ICONS[icon] ?? Leaf;
}
