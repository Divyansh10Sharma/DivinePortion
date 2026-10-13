// Pure plan-editing helpers (PLAN-1 … PLAN-7). Every function returns new objects.
//
// Smart scaling rules (PLAN-7, §4.2):
// - Changing the AMOUNT of an item with a compatible base recalculates all five values from the
//   base and marks the item `valuesSource: 'base'`.
// - Typing any of the five values by hand switches the item to 'manual'.
// - "Recalculate from base" goes back to 'base'.
// - If the base is incompatible with the unit (e.g. per 100g but unit "cup"), values stay as typed
//   and the editor shows a warning.

import { valuesFromBase, type NutrientKey } from './nutrition';
import { omitKey } from './objects';
import type { BasePer, Item, Meal, Nutrition, Plan } from './types';

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

export function byOrder<T extends { order: number }>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => a.order - b.order);
}

/** Rewrites `order` as 0…n-1 following the array order. */
export function renumber<T extends { order: number }>(list: readonly T[]): T[] {
  return list.map((x, i) => (x.order === i ? x : { ...x, order: i }));
}

/** Moves the element with `fromId` to the position of `toId` (dnd-kit "over" target). */
export function moveById<T extends { id: string; order: number }>(list: readonly T[], fromId: string, toId: string): T[] {
  const sorted = byOrder(list);
  const from = sorted.findIndex((x) => x.id === fromId);
  const to = sorted.findIndex((x) => x.id === toId);
  if (from < 0 || to < 0 || from === to) return sorted;
  const next = [...sorted];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return renumber(next);
}

/** Removes by id; returns the new list plus what is needed to undo (PLAN-8). */
export function removeById<T extends { id: string; order: number }>(
  list: readonly T[],
  id: string,
): { list: T[]; removed?: T; index: number } {
  const sorted = byOrder(list);
  const index = sorted.findIndex((x) => x.id === id);
  if (index < 0) return { list: sorted, index: -1 };
  const removed = sorted[index];
  return { list: renumber(sorted.filter((x) => x.id !== id)), removed, index };
}

/** Re-inserts at `index` (clamped) — the Undo of `removeById`. No-op if the id already exists. */
export function insertAt<T extends { id: string; order: number }>(list: readonly T[], item: T, index: number): T[] {
  const sorted = byOrder(list);
  if (sorted.some((x) => x.id === item.id)) return sorted;
  const at = Math.max(0, Math.min(index, sorted.length));
  return renumber([...sorted.slice(0, at), item, ...sorted.slice(at)]);
}

// ---------------------------------------------------------------------------
// Meals & plan
// ---------------------------------------------------------------------------

export function makeMeal(id: string, order: number): Meal {
  return { id, order, time: '12:00', name: 'New meal', icon: 'sun', isFreeSlot: false, items: [] };
}

export function makeItem(id: string, order: number): Item {
  return {
    id,
    order,
    name: 'New item',
    amount: 1,
    unit: 'serving',
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fibre: 0,
    valuesSource: 'manual',
  };
}

export function updateMeal(plan: Plan, mealId: string, fn: (meal: Meal) => Meal): Plan {
  return { ...plan, meals: plan.meals.map((m) => (m.id === mealId ? fn(m) : m)) };
}

export function updateItem(meal: Meal, itemId: string, fn: (item: Item) => Item): Meal {
  return { ...meal, items: meal.items.map((i) => (i.id === itemId ? fn(i) : i)) };
}

/** PLAN-4: toggling free slot keeps the items (so toggling back loses nothing) and gives a default budget. */
export function setFreeSlot(meal: Meal, isFreeSlot: boolean): Meal {
  if (!isFreeSlot) return { ...meal, isFreeSlot: false };
  return { ...meal, isFreeSlot: true, freeSlotBudgetKcal: meal.freeSlotBudgetKcal ?? 100 };
}

/** "HH:MM" 24h. */
export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

// ---------------------------------------------------------------------------
// Items — smart scaling (PLAN-7)
// ---------------------------------------------------------------------------

function withValues(item: Item, n: Nutrition, source: Item['valuesSource']): Item {
  return { ...item, kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat, fibre: n.fibre, valuesSource: source };
}

/** True when the item has a base AND it applies to the item's unit. */
export function canScale(item: Pick<Item, 'base' | 'unit'>): boolean {
  return valuesFromBase(item, 1) !== null;
}

/** Changing the amount recalculates from a compatible base; otherwise the typed values stay. */
export function setItemAmount(item: Item, amount: number): Item {
  const next = { ...item, amount };
  const fromBase = valuesFromBase(next, amount);
  return fromBase ? withValues(next, fromBase, 'base') : next;
}

/** Hand-editing a value switches the item to manual. */
export function setItemValue(item: Item, key: NutrientKey, value: number): Item {
  return { ...item, [key]: value, valuesSource: 'manual' };
}

/** "Recalculate from base". No-op when there is no compatible base. */
export function recalcFromBase(item: Item): Item {
  const fromBase = valuesFromBase(item, item.amount);
  return fromBase ? withValues(item, fromBase, 'base') : item;
}

/**
 * Unit change. If values were auto-from-base and the new unit is incompatible, the item becomes
 * manual (keeping its current values). If it is still compatible and was 'base', values are recomputed.
 */
export function setItemUnit(item: Item, unit: string): Item {
  const next = { ...item, unit };
  if (next.valuesSource !== 'base') return next;
  const fromBase = valuesFromBase(next, next.amount);
  return fromBase ? withValues(next, fromBase, 'base') : { ...next, valuesSource: 'manual' };
}

/** Default "per" for a unit when adding a base. */
export function defaultBasePer(unit: string): BasePer {
  const u = unit.trim().toLowerCase();
  return u === 'ml' ? '100ml' : u === 'piece' ? '1piece' : '100g';
}

/**
 * Add / edit / remove the base. Editing the base of an item whose values are auto-from-base
 * recomputes them; manual items keep their values until the amount changes or "Recalculate".
 * Removing the base leaves the values as they are (manual).
 */
export function setItemBase(item: Item, base: Item['base'] | undefined): Item {
  if (!base) return { ...omitKey(item, 'base'), valuesSource: 'manual' };
  const next = { ...item, base };
  if (item.valuesSource !== 'base') return next;
  const fromBase = valuesFromBase(next, next.amount);
  return fromBase ? withValues(next, fromBase, 'base') : { ...next, valuesSource: 'manual' };
}

export function setBaseValue(base: NonNullable<Item['base']>, key: NutrientKey, value: number): NonNullable<Item['base']> {
  return { ...base, [key]: value };
}

/** A new base pre-filled from the item's current values (so "add base" starts from something sensible). */
export function baseFromCurrentValues(item: Item): NonNullable<Item['base']> {
  const per = defaultBasePer(item.unit);
  const factor = per === '1piece' ? item.amount : item.amount / 100;
  const v = (k: NutrientKey) => (factor > 0 ? item[k] / factor : 0);
  return { per, kcal: v('kcal'), protein: v('protein'), carbs: v('carbs'), fat: v('fat'), fibre: v('fibre') };
}


/** Units offered in pickers (PLAN-6); any free text is allowed too. */
export const KNOWN_UNITS = ['g', 'ml', 'piece', 'sachet', 'scoop', 'pinch', 'serving'] as const;
