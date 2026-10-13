// Run in IST so the "toISOString returns the previous UTC day at 04:45" trap is real in this test.
process.env.TZ = 'Asia/Kolkata';

import { describe, expect, it } from 'vitest';
import { buildSeedPlan, buildSeedSettings } from '../db/seed';
import { localDateKey, msUntilNextLocalMidnight, timeToMinutes } from './dates';
import {
  addExtraItem,
  addFreeSlotEntry,
  createDayLog,
  dayTotals,
  freeSlotRemaining,
  hasLoggingActivity,
  makeLoggedItem,
  markMealEaten,
  markMealNotEaten,
  mealEaten,
  mealLogOf,
  nextMealId,
  remainingPlanned,
  removeExtraItem,
  removeFreeSlotEntry,
  setItemAmount,
  setItemEaten,
  targetStatus,
} from './dayLog';
import type { DayLog } from './types';

const plan = buildSeedPlan(0);
const targets = buildSeedSettings(0).targets;
const fresh = (): DayLog => createDayLog('2026-10-13', plan, targets, 1);
const meal = (log: DayLog, id: string) => log.mealsSnapshot.find((m) => m.id === id)!;

describe('local dates', () => {
  it('uses the local calendar day, not the UTC one (04:45 IST)', () => {
    const at0445 = new Date(2026, 9, 13, 4, 45);
    expect(localDateKey(at0445)).toBe('2026-10-13');
    expect(at0445.toISOString().slice(0, 10)).toBe('2026-10-12'); // the bug we avoid
  });

  it('rolls over exactly at local midnight', () => {
    expect(localDateKey(new Date(2026, 9, 13, 23, 59, 59))).toBe('2026-10-13');
    expect(localDateKey(new Date(2026, 9, 14, 0, 0, 0))).toBe('2026-10-14');
    expect(msUntilNextLocalMidnight(new Date(2026, 9, 13, 23, 59, 0))).toBe(60_000);
  });

  it('parses HH:MM', () => {
    expect(timeToMinutes('04:45')).toBe(285);
    expect(timeToMinutes('bad')).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('day creation', () => {
  it('deep-copies the plan and the targets', () => {
    const p = buildSeedPlan(0);
    const log = createDayLog('2026-10-13', p, targets, 5);
    p.meals[0]!.items[0]!.kcal = 9999;
    p.meals[0]!.name = 'changed';
    expect(meal(log, 'm1').items[0]!.kcal).toBe(135);
    expect(meal(log, 'm1').name).toBe('Pre-Gym Banana Coffee');
    expect(log.targetsSnapshot).toEqual(targets);
    expect(log.targetsSnapshot).not.toBe(targets);
    expect(Object.keys(log.eaten)).toHaveLength(8);
    expect(hasLoggingActivity(log)).toBe(false);
  });

  it('starts with seed planned totals and nothing eaten', () => {
    const t = dayTotals(fresh());
    expect(t.plannedMeals.kcal).toBe(2233);
    expect(t.plannedWithSnack.kcal).toBe(2363);
    expect(t.eaten).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });
  });
});

describe('eating whole meals', () => {
  it('marks a meal eaten and back', () => {
    let log = markMealEaten(fresh(), 'm2', 2);
    expect(mealLogOf(log, 'm2').status).toBe('eaten');
    expect(mealEaten(log, meal(log, 'm2'))).toEqual({ kcal: 554, protein: 40, carbs: 71, fat: 13, fibre: 5 });
    expect(log.updatedAt).toBe(2);
    expect(hasLoggingActivity(log)).toBe(true);

    log = markMealNotEaten(log, 'm2');
    expect(mealLogOf(log, 'm2').status).toBe('none');
    expect(dayTotals(log).eaten.kcal).toBe(0);
    expect(hasLoggingActivity(log)).toBe(false);
  });

  it('never mutates the input log', () => {
    const log = fresh();
    const before = structuredClone(log);
    markMealEaten(log, 'm1');
    addExtraItem(log, 'm1', makeLoggedItem('x', { name: 'x', kcal: 1 }));
    expect(log).toEqual(before);
  });

  it('eating everything gives the planned meals total', () => {
    let log = fresh();
    for (const m of log.mealsSnapshot) if (!m.isFreeSlot) log = markMealEaten(log, m.id);
    const t = dayTotals(log).eaten;
    expect([t.kcal, t.protein, t.carbs, t.fat, t.fibre]).toEqual([2233, 143, 325, 39, 58]);
  });
});

describe('partial eating', () => {
  it('ticking some items → partial; all → eaten', () => {
    let log = setItemEaten(fresh(), 'm1', 'm1-i1', true);
    expect(mealLogOf(log, 'm1').status).toBe('partial');
    for (const id of ['m1-i2', 'm1-i3', 'm1-i4', 'm1-i5']) log = setItemEaten(log, 'm1', id, true);
    expect(mealLogOf(log, 'm1').status).toBe('eaten');
    log = setItemEaten(log, 'm1', 'm1-i5', false);
    expect(mealLogOf(log, 'm1').status).toBe('partial');
  });

  it('a reduced amount WITH a compatible base is computed from the base', () => {
    // Rolled Oats: base 407 kcal / 100g; eat 25 g instead of 50 g → 101.75 kcal.
    const log = setItemAmount(fresh(), 'm7', 'm7-i1', 25);
    expect(mealLogOf(log, 'm7').itemOverrides['m7-i1']).toEqual({ eaten: true, amount: 25 });
    expect(mealEaten(log, meal(log, 'm7')).kcal).toBeCloseTo(101.75);
    expect(mealLogOf(log, 'm7').status).toBe('partial');
  });

  it('a reduced amount WITHOUT a base scales planned values proportionally', () => {
    // Cabbage: 0.5 piece = 50 kcal, no base → eating 0.25 piece = 25 kcal.
    const log = setItemAmount(fresh(), 'm5', 'm5-i2', 0.25);
    expect(mealEaten(log, meal(log, 'm5')).kcal).toBeCloseTo(25);
  });

  it('eating more than planned still counts as eaten for that item', () => {
    let log = markMealEaten(fresh(), 'm4');
    log = setItemAmount(log, 'm4', 'm4-i1', 8);
    expect(mealLogOf(log, 'm4').status).toBe('eaten');
    expect(mealEaten(log, meal(log, 'm4')).kcal).toBeCloseTo(10);
  });

  it('clearing the amount means the planned amount', () => {
    const log = setItemAmount(setItemAmount(fresh(), 'm7', 'm7-i1', 25), 'm7', 'm7-i1', undefined);
    expect(mealLogOf(log, 'm7').itemOverrides['m7-i1']).toEqual({ eaten: true });
  });
});

describe('extra items (today only)', () => {
  it('adds an eaten extra without touching the plan snapshot', () => {
    const extra = makeLoggedItem('e1', { name: 'Almonds', amount: 10, unit: 'g', kcal: 58, protein: 2, fat: 5 });
    let log = markMealEaten(fresh(), 'm1');
    log = addExtraItem(log, 'm1', extra);
    expect(meal(log, 'm1').items).toHaveLength(5);
    expect(mealLogOf(log, 'm1').status).toBe('eaten');
    expect(mealEaten(log, meal(log, 'm1')).kcal).toBe(263 + 58);
    expect(dayTotals(log).plannedMeals.kcal).toBe(2233); // extras are not "planned"

    log = setItemEaten(log, 'm1', 'e1', false);
    expect(mealLogOf(log, 'm1').status).toBe('partial');

    log = removeExtraItem(log, 'm1', 'e1');
    expect(log.extraItems.m1).toBeUndefined();
    expect(mealLogOf(log, 'm1').status).toBe('eaten');
  });
});

describe('free slot', () => {
  it('logs multiple entries and tracks the budget', () => {
    let log = fresh();
    const slot = meal(log, 'm3');
    expect(freeSlotRemaining(log, slot)).toBe(130);
    expect(mealLogOf(log, 'm3').status).toBe('none');

    log = addFreeSlotEntry(log, 'm3', makeLoggedItem('f1', { name: 'Peanuts', kcal: 90, fat: 7, protein: 4 }));
    log = addFreeSlotEntry(log, 'm3', makeLoggedItem('f2', { name: 'Apple', kcal: 60 }));
    expect(mealLogOf(log, 'm3').status).toBe('eaten');
    expect(freeSlotRemaining(log, meal(log, 'm3'))).toBe(-20); // over budget
    expect(dayTotals(log).eaten).toEqual({ kcal: 150, protein: 4, carbs: 0, fat: 7, fibre: 0 });

    log = removeFreeSlotEntry(log, 'm3', 'f1');
    log = removeFreeSlotEntry(log, 'm3', 'f2');
    expect(mealLogOf(log, 'm3').status).toBe('none');
    expect(hasLoggingActivity(log)).toBe(false);
  });
});

describe('target status (§4.4)', () => {
  it('fat is projected short (39 < 45) until the snack covers it', () => {
    let log = fresh();
    let s = targetStatus(log);
    expect(s.protein.status).toBe('on-track'); // 0 + 143 ≥ 140
    expect(s.fat.status).toBe('warning'); // 0 + 39 < 45
    expect(s.fibre.status).toBe('on-track'); // 58 ≥ 45
    expect(s.kcal.over).toBe(false);

    log = addFreeSlotEntry(log, 'm3', makeLoggedItem('f1', { name: 'Peanuts', kcal: 120, fat: 7 }));
    s = targetStatus(log);
    expect(s.fat.projected).toBe(46);
    expect(s.fat.status).toBe('on-track');
  });

  it('turns met once eaten ≥ min, and kcal over when eaten > target', () => {
    let log = fresh();
    for (const m of log.mealsSnapshot) if (!m.isFreeSlot) log = markMealEaten(log, m.id);
    let s = targetStatus(log);
    expect(s.protein.status).toBe('met');
    expect(s.fibre.status).toBe('met');
    expect(s.fat.status).toBe('warning');
    expect(remainingPlanned(log).kcal).toBe(0);

    log = addFreeSlotEntry(log, 'm3', makeLoggedItem('f1', { name: 'Cake', kcal: 300, fat: 10 }));
    s = targetStatus(log);
    expect(s.fat.status).toBe('met');
    expect(s.kcal.over).toBe(true); // 2533 > 2363
  });

  it('unticked items still count as remaining; eating less than planned drags the projection down', () => {
    let log = fresh();
    for (const m of log.mealsSnapshot) if (!m.isFreeSlot) log = markMealEaten(log, m.id);
    // Unticking a scoop just moves its 25 g back to "remaining": still projected 143.
    expect(targetStatus(setItemEaten(log, 'm2', 'm2-i2', false)).protein.status).toBe('on-track');

    // Half scoops (18 g of a 70 g/100 g base = 12.6 g protein each) → 143 - 2×12.4 = 118.2 < 140.
    log = setItemAmount(log, 'm2', 'm2-i2', 18);
    log = setItemAmount(log, 'm7', 'm7-i2', 18);
    const p = targetStatus(log).protein;
    expect(p.projected).toBeCloseTo(118.2);
    expect(p.status).toBe('warning');
  });
});

describe('next meal (HOME-9)', () => {
  it('is the first non-eaten meal at or after now, else the first non-eaten', () => {
    let log = fresh();
    expect(nextMealId(log, new Date(2026, 9, 13, 3, 0))).toBe('m1');
    expect(nextMealId(log, new Date(2026, 9, 13, 11, 0))).toBe('m4');
    log = markMealEaten(log, 'm4');
    expect(nextMealId(log, new Date(2026, 9, 13, 11, 0))).toBe('m5');
    expect(nextMealId(log, new Date(2026, 9, 13, 22, 0))).toBe('m1'); // nothing later → first open
    for (const m of log.mealsSnapshot) log = m.isFreeSlot ? addFreeSlotEntry(log, m.id, makeLoggedItem('x', { name: 'x', kcal: 1 })) : markMealEaten(log, m.id);
    expect(nextMealId(log, new Date(2026, 9, 13, 22, 0))).toBeUndefined();
  });
});

describe('final day status (HIST-1, §4.4 past days)', () => {
  it('empty / warning / good', async () => {
    const { finalDayStatus } = await import('./dayLog');
    let log = fresh();
    expect(finalDayStatus(log)).toBe('empty');
    expect(targetStatus(log, { final: true }).fat.status).toBe('warning'); // nothing more to come
    for (const m of log.mealsSnapshot) if (!m.isFreeSlot) log = markMealEaten(log, m.id);
    expect(finalDayStatus(log)).toBe('warning'); // fat 39 < 45
    log = addFreeSlotEntry(log, 'm3', makeLoggedItem('f', { name: 'Nuts', kcal: 100, fat: 7 }));
    expect(finalDayStatus(log)).toBe('good'); // 2333 ≤ 2363, P 143, F 46, Fibre 58
    log = addFreeSlotEntry(log, 'm3', makeLoggedItem('g', { name: 'Cake', kcal: 300 }));
    expect(finalDayStatus(log)).toBe('warning'); // kcal over
  });
});
