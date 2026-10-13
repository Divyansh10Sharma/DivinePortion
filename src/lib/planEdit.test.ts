import { describe, expect, it } from 'vitest';
import { buildSeedMeals } from '../db/seed';
import {
  baseFromCurrentValues,
  canScale,
  insertAt,
  isValidTime,
  makeItem,
  moveById,
  recalcFromBase,
  removeById,
  setFreeSlot,
  setItemAmount,
  setItemBase,
  setItemUnit,
  setItemValue,
} from './planEdit';
import type { Item } from './types';

const meals = buildSeedMeals();
const oats = meals.find((m) => m.id === 'm7')!.items[0]!; // 50 g, base 407/12/68.5/9.5/10 per 100g, manual
const coffee = meals.find((m) => m.id === 'm1')!.items[3]!; // Bru Coffee 5 sachet, no base

describe('smart scaling (PLAN-7)', () => {
  it('changing the amount recalculates all five values from the base → "base"', () => {
    const next = setItemAmount(oats, 80);
    expect(next).toMatchObject({ amount: 80, valuesSource: 'base' });
    // Decimals are kept internally (float noise included); display rounds.
    const expected = { kcal: 325.6, protein: 9.6, carbs: 54.8, fat: 7.6, fibre: 8 };
    for (const [k, v] of Object.entries(expected)) expect(next[k as keyof typeof expected]).toBeCloseTo(v, 9);
    expect(oats.kcal).toBe(204); // input untouched
  });

  it('items without a base keep their typed values when the amount changes', () => {
    const next = setItemAmount(coffee, 2);
    expect(next).toMatchObject({ amount: 2, kcal: 6, valuesSource: 'manual' });
  });

  it('editing a value by hand switches to manual; recalculate goes back to base', () => {
    const auto = setItemAmount(oats, 100);
    const manual = setItemValue(auto, 'kcal', 400);
    expect(manual).toMatchObject({ kcal: 400, protein: 12, valuesSource: 'manual' });
    expect(recalcFromBase(manual)).toMatchObject({ kcal: 407, valuesSource: 'base' });
    expect(recalcFromBase(coffee)).toBe(coffee);
  });

  it('an incompatible unit keeps the manual values', () => {
    const cup = setItemUnit(setItemAmount(oats, 100), 'cup');
    expect(cup).toMatchObject({ unit: 'cup', kcal: 407, valuesSource: 'manual' });
    expect(canScale(cup)).toBe(false);
    expect(setItemAmount(cup, 2)).toMatchObject({ amount: 2, kcal: 407, valuesSource: 'manual' });
    // back to a compatible unit — manual stays manual until amount edit or recalc
    expect(setItemUnit(cup, 'g').valuesSource).toBe('manual');
  });

  it('add / edit / remove a base', () => {
    const plain: Item = { ...makeItem('x', 0), name: 'Curd', amount: 200, unit: 'g', kcal: 120, protein: 7, carbs: 9, fat: 6, fibre: 0 };
    const base = baseFromCurrentValues(plain);
    expect(base).toEqual({ per: '100g', kcal: 60, protein: 3.5, carbs: 4.5, fat: 3, fibre: 0 });

    const withBase = setItemBase(plain, base);
    expect(withBase.valuesSource).toBe('manual'); // adding a base doesn't overwrite typed values
    expect(setItemAmount(withBase, 100)).toMatchObject({ kcal: 60, valuesSource: 'base' });

    const auto = setItemAmount(withBase, 100);
    expect(setItemBase(auto, { ...base, kcal: 80 })).toMatchObject({ kcal: 80, valuesSource: 'base' });

    const removed = setItemBase(auto, undefined);
    expect(removed.base).toBeUndefined();
    expect(removed).toMatchObject({ kcal: 60, valuesSource: 'manual' });
  });

  it('per-piece bases scale by count', () => {
    const banana = meals.find((m) => m.id === 'm1')!.items[0]!; // 1.5 piece, base 90 per piece
    expect(setItemAmount(banana, 2)).toMatchObject({ kcal: 180, fibre: 5.2, valuesSource: 'base' });
  });
});

describe('ordering, delete and undo', () => {
  const items = meals.find((m) => m.id === 'm1')!.items;

  it('moves by id and renumbers order', () => {
    const moved = moveById(items, 'm1-i5', 'm1-i1');
    expect(moved.map((i) => i.id)).toEqual(['m1-i5', 'm1-i1', 'm1-i2', 'm1-i3', 'm1-i4']);
    expect(moved.map((i) => i.order)).toEqual([0, 1, 2, 3, 4]);
  });

  it('remove then insertAt restores the exact list', () => {
    const { list, removed, index } = removeById(items, 'm1-i3');
    expect(list.map((i) => i.id)).toEqual(['m1-i1', 'm1-i2', 'm1-i4', 'm1-i5']);
    expect(list.map((i) => i.order)).toEqual([0, 1, 2, 3]);
    expect(insertAt(list, removed!, index)).toEqual(items);
    expect(insertAt(items, removed!, 0)).toEqual(items); // undo twice is a no-op
  });
});

describe('meal fields', () => {
  it('free slot toggle keeps items and sets a default budget', () => {
    const m = setFreeSlot(meals[0]!, true);
    expect(m.isFreeSlot).toBe(true);
    expect(m.freeSlotBudgetKcal).toBe(100);
    expect(m.items).toHaveLength(5);
    expect(setFreeSlot(meals[2]!, true).freeSlotBudgetKcal).toBe(130);
  });

  it('validates HH:MM', () => {
    expect(isValidTime('04:45')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('4:45')).toBe(false);
  });
});
