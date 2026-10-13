import { fmt } from './nutrition';
import type { Nutrition } from './types';

/** "135 kcal · 2P · 35C · 0F · 4Fib" — compact per-item macros (rounded for display only). */
export function macroText(n: Nutrition): string {
  return `${fmt(n.kcal)} kcal · ${fmt(n.protein)}P · ${fmt(n.carbs)}C · ${fmt(n.fat)}F · ${fmt(n.fibre)}Fib`;
}

/** "1,5" and "1.5" both parse (iOS decimal keypads differ by locale). '' → undefined, garbage → NaN. */
export function parseDecimal(text: string): number | undefined {
  const t = text.trim().replace(',', '.');
  if (t === '') return undefined;
  return /^\d*\.?\d*$/.test(t) && t !== '.' ? Number(t) : Number.NaN;
}
