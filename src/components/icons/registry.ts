// Icon registry (PLAN-3): inline SVG icons from lucide-react, keyed by the string stored in data.

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
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { FooterIcon, KnownMealIcon, MealIcon } from '../../lib/types';

export const MEAL_ICONS: Record<KnownMealIcon, LucideIcon> = {
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

export function mealIconComponent(icon: MealIcon): LucideIcon {
  return MEAL_ICONS[icon as KnownMealIcon] ?? Utensils;
}

export function footerIconComponent(icon: FooterIcon): LucideIcon {
  return FOOTER_ICONS[icon] ?? Leaf;
}
