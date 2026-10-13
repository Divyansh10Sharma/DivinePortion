// Nutrition math — SPEC.md §4.2.
//
// Rules worth remembering when editing this file:
// - Subtotals/totals are ALWAYS computed from items, never stored.
// - Decimals are kept internally; rounding happens only at display time (see `fmt`).
// - A free slot contributes its kcal budget to *planned* kcal only — no macros.

import type { BasePer, Item, ItemOverride, Meal, Nutrition, Unit } from './types';

export const NUTRIENT_KEYS = ['kcal', 'protein', 'carbs', 'fat', 'fibre'] as const;
export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

export const ZERO: Readonly<Nutrition> = Object.freeze({ kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });

export function nutritionOf(n: Nutrition): Nutrition {
  return { kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat, fibre: n.fibre };
}

export function add(a: Nutrition, b: Nutrition): Nutrition {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fibre: a.fibre + b.fibre,
  };
}

export function scale(n: Nutrition, factor: number): Nutrition {
  return {
    kcal: n.kcal * factor,
    protein: n.protein * factor,
    carbs: n.carbs * factor,
    fat: n.fat * factor,
    fibre: n.fibre * factor,
  };
}

export function sum(list: readonly Nutrition[]): Nutrition {
  return list.reduce<Nutrition>((acc, n) => add(acc, n), { ...ZERO });
}

/** Sum of the stored (planned) values of a list of items. */
export function sumItems(items: readonly Item[]): Nutrition {
  return sum(items.map(nutritionOf));
}

// ---------------------------------------------------------------------------
// Base scaling (PLAN-7)
// ---------------------------------------------------------------------------

/** Which unit a base is defined against: 100g ↔ g, 100ml ↔ ml, 1piece ↔ piece. */
const BASE_UNIT: Record<BasePer, Unit> = { '100g': 'g', '100ml': 'ml', '1piece': 'piece' };

/** Scaling from a base only makes sense when the item's unit matches the base's unit. */
export function isBaseCompatible(per: BasePer, unit: Unit): boolean {
  return BASE_UNIT[per] === unit.trim().toLowerCase();
}

/** factor = amount / 100 for per-100g/ml bases, amount / 1 for per-piece bases. */
export function baseFactor(per: BasePer, amount: number): number {
  return per === '1piece' ? amount : amount / 100;
}

/**
 * Values for `amount` of an item computed from its base.
 * Returns `null` when the item has no base or the unit is incompatible
 * (callers then keep the manual values and the editor shows a warning).
 */
export function valuesFromBase(item: Pick<Item, 'base' | 'unit'>, amount: number): Nutrition | null {
  const { base } = item;
  if (!base || !isBaseCompatible(base.per, item.unit)) return null;
  return scale(nutritionOf(base), baseFactor(base.per, amount));
}

// ---------------------------------------------------------------------------
// Eaten values (logging)
// ---------------------------------------------------------------------------

/**
 * Eaten value of a single item:
 * - not ticked → 0
 * - ticked, no amount override → planned values
 * - ticked with eaten amount → base × eaten amount if a compatible base exists,
 *   otherwise planned values scaled by eatenAmount / plannedAmount.
 */
export function itemEatenValue(item: Item, override: ItemOverride | undefined): Nutrition {
  if (!override?.eaten) return { ...ZERO };
  if (override.amount === undefined || override.amount === item.amount) return nutritionOf(item);
  const fromBase = valuesFromBase(item, override.amount);
  if (fromBase) return fromBase;
  // Planned amount of 0 can't be scaled proportionally; fall back to planned values.
  if (item.amount === 0) return nutritionOf(item);
  return scale(nutritionOf(item), override.amount / item.amount);
}

/**
 * Meal status from item overrides (incl. extras): `eaten` if every item is ticked at
 * planned amount or more, `none` if none ticked, else `partial`.
 * A meal with no items at all is `none`.
 */
export function deriveMealStatus(
  items: readonly Item[],
  overrides: Record<string, ItemOverride>,
): 'none' | 'partial' | 'eaten' {
  if (items.length === 0) return 'none';
  let ticked = 0;
  let full = 0;
  for (const item of items) {
    const o = overrides[item.id];
    if (!o?.eaten) continue;
    ticked++;
    if (o.amount === undefined || o.amount >= item.amount) full++;
  }
  if (ticked === 0) return 'none';
  return full === items.length ? 'eaten' : 'partial';
}

// ---------------------------------------------------------------------------
// Planned totals
// ---------------------------------------------------------------------------

/** Planned value of a meal: items for normal meals; kcal budget only for free slots. */
export function mealPlanned(meal: Meal): Nutrition {
  if (meal.isFreeSlot) return { ...ZERO, kcal: meal.freeSlotBudgetKcal ?? 0 };
  return sumItems(meal.items);
}

/** "Planned (meals)": all non-free-slot meal items. Seed → 2233 kcal. */
export function plannedMeals(meals: readonly Meal[]): Nutrition {
  return sum(meals.filter((m) => !m.isFreeSlot).map((m) => sumItems(m.items)));
}

/** Sum of free-slot kcal budgets. */
export function freeSlotBudgetTotal(meals: readonly Meal[]): number {
  return meals.reduce((acc, m) => acc + (m.isFreeSlot ? (m.freeSlotBudgetKcal ?? 0) : 0), 0);
}

/** "Planned (with snack)": meals + free-slot budgets (kcal only). Seed → 2363 kcal. */
export function plannedWithSnack(meals: readonly Meal[]): Nutrition {
  const base = plannedMeals(meals);
  return { ...base, kcal: base.kcal + freeSlotBudgetTotal(meals) };
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

/** Display rounding. Internal values are never rounded. `+ 0` avoids printing "-0". */
export function fmt(n: number): string {
  return String(Math.round(n) + 0);
}

/** Display an amount without float noise (1.5 → "1.5", 36 → "36"). */
export function fmtAmount(n: number): string {
  return String(Math.round(n * 100) / 100);
}
