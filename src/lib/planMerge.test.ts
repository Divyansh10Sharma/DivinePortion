import { describe, expect, it } from 'vitest';
import { buildSeedPlan, buildSeedSettings } from '../db/seed';
import { addExtraItem, addFreeSlotEntry, createDayLog, makeLoggedItem, markMealEaten, mealLogOf, setItemAmount } from './dayLog';
import { mergePlanIntoDayLog, planChangeForToday } from './planMerge';
import { removeById, setFreeSlot, updateItem, updateMeal } from './planEdit';
import type { Plan } from './types';

const targets = buildSeedSettings(0).targets;
const today = () => createDayLog('2026-10-13', buildSeedPlan(0), targets, 1);

function edited(): Plan {
  let plan = buildSeedPlan(0);
  // rename meal 1, delete its salt (m1-i5), delete meal 6, change an amount in meal 2
  plan = updateMeal(plan, 'm1', (m) => ({ ...m, name: 'Banana Coffee', items: removeById(m.items, 'm1-i5').list }));
  plan = { ...plan, meals: removeById(plan.meals, 'm6').list };
  plan = updateMeal(plan, 'm2', (m) => updateItem(m, 'm2-i1', (i) => ({ ...i, amount: 60, kcal: 223.8 })));
  return plan;
}

describe('PLAN-9 today sync', () => {
  it('no logging activity → silent re-snapshot', () => {
    const log = today();
    const r = planChangeForToday(log, edited(), 9);
    expect(r.kind).toBe('synced');
    if (r.kind !== 'synced') return;
    expect(r.log.mealsSnapshot.map((m) => m.id)).not.toContain('m6');
    expect(r.log.mealsSnapshot[0]!.name).toBe('Banana Coffee');
    expect(r.log.createdAt).toBe(log.createdAt);
    expect(r.log.targetsSnapshot).toEqual(log.targetsSnapshot);
  });

  it('with logging activity → ask', () => {
    expect(planChangeForToday(markMealEaten(today(), 'm1'), edited()).kind).toBe('ask');
    expect(planChangeForToday(addFreeSlotEntry(today(), 'm3', makeLoggedItem('f', { name: 'x', kcal: 1 })), edited()).kind).toBe('ask');
  });

  it('merge keeps eaten state for meals/items whose ids still exist', () => {
    let log = today();
    log = markMealEaten(log, 'm1'); // incl. salt m1-i5, which the edit deletes
    log = markMealEaten(log, 'm6'); // meal deleted by the edit
    log = setItemAmount(log, 'm2', 'm2-i1', 25);
    log = addExtraItem(log, 'm6', makeLoggedItem('e6', { name: 'Gone', kcal: 10 }));
    log = addExtraItem(log, 'm4', makeLoggedItem('e4', { name: 'Biscuit', kcal: 40 }));
    log = addFreeSlotEntry(log, 'm3', makeLoggedItem('f1', { name: 'Peanuts', kcal: 90 }));

    const merged = mergePlanIntoDayLog(log, edited(), 50);
    expect(merged.date).toBe(log.date);
    expect(merged.updatedAt).toBe(50);
    expect(merged.mealsSnapshot.find((m) => m.id === 'm1')!.name).toBe('Banana Coffee');
    // m1: all remaining items still ticked → still eaten; the deleted item's override is gone
    expect(mealLogOf(merged, 'm1').status).toBe('eaten');
    expect(mealLogOf(merged, 'm1').itemOverrides['m1-i5']).toBeUndefined();
    // m6 removed entirely, including its extras
    expect(merged.eaten.m6).toBeUndefined();
    expect(merged.extraItems.m6).toBeUndefined();
    // m2 partial amount survives
    expect(mealLogOf(merged, 'm2').itemOverrides['m2-i1']).toEqual({ eaten: true, amount: 25 });
    // extras on surviving meals and free-slot entries survive
    expect(merged.extraItems.m4?.map((i) => i.id)).toEqual(['e4']);
    expect(mealLogOf(merged, 'm4').status).toBe('partial'); // extra eaten, coffee not
    expect(merged.freeSlotEntries.m3?.map((i) => i.id)).toEqual(['f1']);
    expect(mealLogOf(merged, 'm3').status).toBe('eaten');
  });

  it('a meal that stops being a free slot drops its entries; a new free slot starts empty', () => {
    let log = addFreeSlotEntry(today(), 'm3', makeLoggedItem('f1', { name: 'Peanuts', kcal: 90 }));
    log = markMealEaten(log, 'm4');
    let plan = buildSeedPlan(0);
    plan = updateMeal(plan, 'm3', (m) => setFreeSlot(m, false));
    plan = updateMeal(plan, 'm4', (m) => setFreeSlot(m, true));
    const merged = mergePlanIntoDayLog(log, plan);
    expect(merged.freeSlotEntries.m3).toBeUndefined();
    expect(mealLogOf(merged, 'm3').status).toBe('none');
    expect(mealLogOf(merged, 'm4')).toEqual({ status: 'none', itemOverrides: {} });
  });
});
