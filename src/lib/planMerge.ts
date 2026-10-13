// PLAN-9: applying plan changes to today's log.
//
// - No logging activity today (§11.13) → today's snapshot is silently replaced by the new plan.
// - Otherwise the owner is asked; "Yes" merges: the new plan becomes today's snapshot, and eaten
//   state is kept for meals/items whose IDs still exist. Extras are kept for meals that still exist;
//   free-slot entries are kept for meals that still exist AND are still free slots.
// Past days are never touched (HIST-3): only the log passed in is rebuilt.

import { createDayLog, hasLoggingActivity } from './dayLog';
import { deriveMealStatus } from './nutrition';
import type { DayLog, Item, MealLog, Plan } from './types';

/** Replaces the snapshot with the current plan, keeping the day's identity and targets. */
export function resnapshot(log: DayLog, plan: Plan, now = Date.now()): DayLog {
  const fresh = createDayLog(log.date, plan, log.targetsSnapshot, now);
  return { ...fresh, createdAt: log.createdAt };
}

export function mergePlanIntoDayLog(log: DayLog, plan: Plan, now = Date.now()): DayLog {
  const mealsSnapshot = structuredClone(plan.meals);
  const eaten: Record<string, MealLog> = {};
  const extraItems: Record<string, Item[]> = {};
  const freeSlotEntries: Record<string, Item[]> = {};

  for (const meal of mealsSnapshot) {
    const extras = log.extraItems[meal.id] ?? [];
    if (extras.length) extraItems[meal.id] = structuredClone(extras);

    if (meal.isFreeSlot) {
      const entries = log.freeSlotEntries[meal.id] ?? [];
      if (entries.length) freeSlotEntries[meal.id] = structuredClone(entries);
      eaten[meal.id] = { status: entries.length ? 'eaten' : 'none', itemOverrides: {} };
      continue;
    }

    const items = [...meal.items, ...extras];
    const liveIds = new Set(items.map((i) => i.id));
    const old = log.eaten[meal.id]?.itemOverrides ?? {};
    const itemOverrides = Object.fromEntries(Object.entries(old).filter(([id]) => liveIds.has(id)));
    eaten[meal.id] = { status: deriveMealStatus(items, itemOverrides), itemOverrides };
  }

  return { ...log, mealsSnapshot, eaten, extraItems, freeSlotEntries, updatedAt: now };
}

/**
 * What happens to today's log after a plan change:
 * - 'synced': no logging activity, so the snapshot was replaced silently (`log` is the new one);
 * - 'ask': there is activity → the owner must choose (merge or keep).
 */
export function planChangeForToday(log: DayLog, plan: Plan, now = Date.now()): { kind: 'synced'; log: DayLog } | { kind: 'ask' } {
  return hasLoggingActivity(log) ? { kind: 'ask' } : { kind: 'synced', log: resnapshot(log, plan, now) };
}
