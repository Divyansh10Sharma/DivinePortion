// Day-log logic (LOG-1 … LOG-7, §4.2, §4.4). Pure functions: every mutation returns a NEW DayLog
// so the caller can persist it in one Dexie write and React sees a fresh object.
//
// Conventions (see PROGRESS.md decisions):
// - "Planned" always means the plan snapshot (items + free-slot kcal budgets). Today-only extra
//   items are NOT planned; they count toward "eaten" (and toward meal status, per §4.2).
// - Extra items are added as already eaten (you add them because you ate them).
// - A free slot's status is "eaten" once it has at least one entry, otherwise "none".

import { minutesOfDay, timeToMinutes } from './dates';
import { deriveMealStatus, itemEatenValue, mealPlanned, nutritionOf, sum } from './nutrition';
import type { DayLog, Item, Meal, MealLog, Nutrition, Plan, Targets } from './types';

type Status = MealLog['status'];

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

/** LOG-1: a new day = deep copy of the current plan + the targets in force today. */
export function createDayLog(date: string, plan: Plan, targets: Targets, now = Date.now()): DayLog {
  const mealsSnapshot = structuredClone(plan.meals);
  const eaten: Record<string, MealLog> = {};
  for (const meal of mealsSnapshot) eaten[meal.id] = { status: 'none', itemOverrides: {} };
  return {
    date,
    mealsSnapshot,
    eaten,
    extraItems: {},
    freeSlotEntries: {},
    targetsSnapshot: { ...targets },
    createdAt: now,
    updatedAt: now,
  };
}

/** §11.13: any eaten flag, item override, extra item or free-slot entry. */
export function hasLoggingActivity(log: DayLog): boolean {
  const anyOverride = Object.values(log.eaten).some((m) => Object.keys(m.itemOverrides).length > 0);
  const anyExtra = Object.values(log.extraItems).some((list) => list.length > 0);
  const anyEntry = Object.values(log.freeSlotEntries).some((list) => list.length > 0);
  return anyOverride || anyExtra || anyEntry;
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export function sortedMeals(log: DayLog): Meal[] {
  return [...log.mealsSnapshot].sort((a, b) => a.order - b.order);
}

export function findMeal(log: DayLog, mealId: string): Meal | undefined {
  return log.mealsSnapshot.find((m) => m.id === mealId);
}

export function extrasOf(log: DayLog, mealId: string): Item[] {
  return log.extraItems[mealId] ?? [];
}

export function entriesOf(log: DayLog, mealId: string): Item[] {
  return log.freeSlotEntries[mealId] ?? [];
}

export function mealLogOf(log: DayLog, mealId: string): MealLog {
  return log.eaten[mealId] ?? { status: 'none', itemOverrides: {} };
}

/** Planned items + today-only extras: the set meal status is derived from. */
export function loggableItems(log: DayLog, meal: Meal): Item[] {
  return [...meal.items, ...extrasOf(log, meal.id)];
}

/** What was eaten from one meal (free slot = sum of its entries). */
export function mealEaten(log: DayLog, meal: Meal): Nutrition {
  if (meal.isFreeSlot) return sum(entriesOf(log, meal.id).map(nutritionOf));
  const { itemOverrides } = mealLogOf(log, meal.id);
  return sum(loggableItems(log, meal).map((item) => itemEatenValue(item, itemOverrides[item.id])));
}

export interface DayTotals {
  /** Non-free-slot meal items (seed → 2233 kcal). */
  plannedMeals: Nutrition;
  /** plannedMeals + free-slot kcal budgets (seed → 2363 kcal). */
  plannedWithSnack: Nutrition;
  /** Eaten items + extras + free-slot entries. */
  eaten: Nutrition;
}

export function dayTotals(log: DayLog): DayTotals {
  const meals = log.mealsSnapshot;
  const plannedMeals = sum(meals.filter((m) => !m.isFreeSlot).map(mealPlanned));
  const budget = meals.reduce((acc, m) => acc + (m.isFreeSlot ? mealPlanned(m).kcal : 0), 0);
  const eaten = sum(meals.map((m) => mealEaten(log, m)));
  return { plannedMeals, plannedWithSnack: { ...plannedMeals, kcal: plannedMeals.kcal + budget }, eaten };
}

/** Free slot budget remaining (negative = over budget → terracotta). */
export function freeSlotRemaining(log: DayLog, meal: Meal): number {
  return (meal.freeSlotBudgetKcal ?? 0) - mealEaten(log, meal).kcal;
}

// ---------------------------------------------------------------------------
// Target status (§4.4)
// ---------------------------------------------------------------------------

/**
 * Planned values still to come: planned items of non-free-slot meals that are not ticked yet.
 * A ticked item counts as done even if a smaller amount was eaten.
 */
export function remainingPlanned(log: DayLog): Nutrition {
  const parts: Nutrition[] = [];
  for (const meal of log.mealsSnapshot) {
    if (meal.isFreeSlot) continue;
    const { itemOverrides } = mealLogOf(log, meal.id);
    for (const item of meal.items) if (!itemOverrides[item.id]?.eaten) parts.push(nutritionOf(item));
  }
  return sum(parts);
}

export type MinStatus = 'met' | 'on-track' | 'warning';

export interface MinTarget {
  eaten: number;
  min: number;
  /** eaten + remaining planned */
  projected: number;
  status: MinStatus;
}

export interface TargetStatus {
  kcal: { eaten: number; target: number; over: boolean };
  protein: MinTarget;
  fat: MinTarget;
  fibre: MinTarget;
}

function minTarget(eaten: number, remaining: number, min: number): MinTarget {
  const projected = eaten + remaining;
  const status: MinStatus = eaten >= min ? 'met' : projected < min ? 'warning' : 'on-track';
  return { eaten, min, projected, status };
}

export function targetStatus(log: DayLog): TargetStatus {
  const { eaten } = dayTotals(log);
  const rest = remainingPlanned(log);
  const t = log.targetsSnapshot;
  return {
    kcal: { eaten: eaten.kcal, target: t.kcal, over: eaten.kcal > t.kcal },
    protein: minTarget(eaten.protein, rest.protein, t.proteinMin),
    fat: minTarget(eaten.fat, rest.fat, t.fatMin),
    fibre: minTarget(eaten.fibre, rest.fibre, t.fibreMin),
  };
}

// ---------------------------------------------------------------------------
// Next meal (HOME-9)
// ---------------------------------------------------------------------------

/** First non-eaten meal whose time ≥ now, else the first non-eaten meal, else none. */
export function nextMealId(log: DayLog, now: Date): string | undefined {
  const open = sortedMeals(log).filter((m) => mealLogOf(log, m.id).status !== 'eaten');
  const nowMin = minutesOfDay(now);
  return (open.find((m) => timeToMinutes(m.time) >= nowMin) ?? open[0])?.id;
}

// ---------------------------------------------------------------------------
// Mutations (each returns a new DayLog)
// ---------------------------------------------------------------------------

function computeStatus(log: DayLog, meal: Meal): Status {
  if (meal.isFreeSlot) return entriesOf(log, meal.id).length > 0 ? 'eaten' : 'none';
  return deriveMealStatus(loggableItems(log, meal), mealLogOf(log, meal.id).itemOverrides);
}

/** Clone, apply `fn` to the meal's log, then re-derive that meal's status. */
function withMeal(log: DayLog, mealId: string, now: number, fn: (next: DayLog, meal: Meal, ml: MealLog) => void): DayLog {
  const next = structuredClone(log);
  const meal = findMeal(next, mealId);
  if (!meal) return log;
  const ml = (next.eaten[mealId] ??= { status: 'none', itemOverrides: {} });
  fn(next, meal, ml);
  ml.status = computeStatus(next, meal);
  next.updatedAt = now;
  return next;
}

/** LOG-2: tick every item (incl. extras) at its planned amount. */
export function markMealEaten(log: DayLog, mealId: string, now = Date.now()): DayLog {
  return withMeal(log, mealId, now, (next, meal, ml) => {
    ml.itemOverrides = {};
    for (const item of loggableItems(next, meal)) ml.itemOverrides[item.id] = { eaten: true };
  });
}

/**
 * LOG-2 "Mark as not eaten": untick the planned items. Extras stay (they were added because
 * they were eaten) — removing an extra is a separate, explicit action.
 */
export function markMealNotEaten(log: DayLog, mealId: string, now = Date.now()): DayLog {
  return withMeal(log, mealId, now, (_next, meal, ml) => {
    for (const item of meal.items) delete ml.itemOverrides[item.id];
  });
}

/** LOG-3: tick / untick one item (planned or extra). Unticking keeps no override at all. */
export function setItemEaten(log: DayLog, mealId: string, itemId: string, eaten: boolean, now = Date.now()): DayLog {
  return withMeal(log, mealId, now, (_next, _meal, ml) => {
    if (eaten) ml.itemOverrides[itemId] = { eaten: true, ...pickAmount(ml.itemOverrides[itemId]?.amount) };
    else delete ml.itemOverrides[itemId];
  });
}

/**
 * LOG-3: set the amount actually eaten. Entering an amount implies the item was eaten.
 * `undefined` (field cleared) means "the planned amount".
 */
export function setItemAmount(
  log: DayLog,
  mealId: string,
  itemId: string,
  amount: number | undefined,
  now = Date.now(),
): DayLog {
  return withMeal(log, mealId, now, (_next, _meal, ml) => {
    ml.itemOverrides[itemId] = { eaten: true, ...pickAmount(amount) };
  });
}

function pickAmount(amount: number | undefined): { amount?: number } {
  return amount === undefined || !Number.isFinite(amount) || amount < 0 ? {} : { amount };
}

/** LOG-4: add a today-only item to a meal (ticked as eaten). The plan is untouched. */
export function addExtraItem(log: DayLog, mealId: string, item: Item, now = Date.now()): DayLog {
  return withMeal(log, mealId, now, (next, _meal, ml) => {
    const list = (next.extraItems[mealId] ??= []);
    list.push({ ...item, order: list.length });
    ml.itemOverrides[item.id] = { eaten: true };
  });
}

export function removeExtraItem(log: DayLog, mealId: string, itemId: string, now = Date.now()): DayLog {
  return withMeal(log, mealId, now, (next, _meal, ml) => {
    next.extraItems[mealId] = extrasOf(next, mealId).filter((i) => i.id !== itemId);
    if (next.extraItems[mealId].length === 0) delete next.extraItems[mealId];
    delete ml.itemOverrides[itemId];
  });
}

/** LOG-5: add a free-slot entry (multiple allowed). */
export function addFreeSlotEntry(log: DayLog, mealId: string, entry: Item, now = Date.now()): DayLog {
  return withMeal(log, mealId, now, (next) => {
    const list = (next.freeSlotEntries[mealId] ??= []);
    list.push({ ...entry, order: list.length });
  });
}

export function removeFreeSlotEntry(log: DayLog, mealId: string, entryId: string, now = Date.now()): DayLog {
  return withMeal(log, mealId, now, (next) => {
    next.freeSlotEntries[mealId] = entriesOf(next, mealId).filter((i) => i.id !== entryId);
    if (next.freeSlotEntries[mealId].length === 0) delete next.freeSlotEntries[mealId];
  });
}

/** Build a manual (no base) item from a quick-entry form (extras / free-slot entries). */
export function makeLoggedItem(
  id: string,
  fields: { name: string; amount?: number; unit?: string; photoId?: string } & Partial<Nutrition> & { kcal: number },
): Item {
  const item: Item = {
    kcal: fields.kcal,
    protein: fields.protein ?? 0,
    carbs: fields.carbs ?? 0,
    fat: fields.fat ?? 0,
    fibre: fields.fibre ?? 0,
    id,
    order: 0,
    name: fields.name.trim(),
    amount: fields.amount ?? 1,
    unit: fields.unit?.trim() || 'serving',
    valuesSource: 'manual',
  };
  if (fields.photoId) item.photoId = fields.photoId;
  return item;
}
