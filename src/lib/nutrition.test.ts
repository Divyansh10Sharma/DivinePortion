import { describe, expect, it } from 'vitest';
import {
  baseFactor,
  deriveMealStatus,
  fmt,
  fmtAmount,
  isBaseCompatible,
  itemEatenValue,
  mealPlanned,
  plannedMeals,
  plannedWithSnack,
  sumItems,
  valuesFromBase,
} from './nutrition';
import type { Item, Meal } from './types';

const oats: Item = {
  id: 'x',
  order: 0,
  name: 'Rolled Oats',
  amount: 50,
  unit: 'g',
  kcal: 204,
  protein: 6,
  carbs: 34,
  fat: 5,
  fibre: 5,
  base: { per: '100g', kcal: 407, protein: 12, carbs: 68.5, fat: 9.5, fibre: 10 },
  valuesSource: 'manual',
};

const spices: Item = {
  id: 'y',
  order: 1,
  name: 'Spices',
  amount: 2,
  unit: 'serving',
  kcal: 10,
  protein: 1,
  carbs: 2,
  fat: 0,
  fibre: 0,
  valuesSource: 'manual',
};

describe('base scaling', () => {
  it('matches units to bases', () => {
    expect(isBaseCompatible('100g', 'g')).toBe(true);
    expect(isBaseCompatible('100ml', 'ml')).toBe(true);
    expect(isBaseCompatible('1piece', 'piece')).toBe(true);
    expect(isBaseCompatible('100g', 'ml')).toBe(false);
    expect(isBaseCompatible('1piece', 'each')).toBe(false);
  });

  it('computes the factor per base', () => {
    expect(baseFactor('100g', 50)).toBe(0.5);
    expect(baseFactor('100ml', 300)).toBe(3);
    expect(baseFactor('1piece', 1.5)).toBe(1.5);
  });

  it('scales all five values from the base, keeping decimals', () => {
    expect(valuesFromBase(oats, 50)).toEqual({ kcal: 203.5, protein: 6, carbs: 34.25, fat: 4.75, fibre: 5 });
  });

  it('returns null without a base or with an incompatible unit', () => {
    expect(valuesFromBase(spices, 3)).toBeNull();
    expect(valuesFromBase({ ...oats, unit: 'ml' }, 50)).toBeNull();
  });
});

describe('itemEatenValue', () => {
  it('is zero when not ticked', () => {
    expect(itemEatenValue(oats, undefined).kcal).toBe(0);
    expect(itemEatenValue(oats, { eaten: false, amount: 80 }).kcal).toBe(0);
  });

  it('uses planned values when ticked without an amount', () => {
    expect(itemEatenValue(oats, { eaten: true })).toEqual({ kcal: 204, protein: 6, carbs: 34, fat: 5, fibre: 5 });
  });

  it('uses the base when an amount is given and the base is compatible', () => {
    expect(itemEatenValue(oats, { eaten: true, amount: 25 }).kcal).toBeCloseTo(101.75);
  });

  it('scales planned values proportionally without a base', () => {
    expect(itemEatenValue(spices, { eaten: true, amount: 1 })).toEqual({ kcal: 5, protein: 0.5, carbs: 1, fat: 0, fibre: 0 });
  });

  it('falls back to proportional scaling when the base unit is incompatible', () => {
    const odd = { ...oats, unit: 'cup' };
    expect(itemEatenValue(odd, { eaten: true, amount: 25 }).kcal).toBe(102);
  });
});

describe('deriveMealStatus', () => {
  const items = [oats, spices];
  it('none / partial / eaten', () => {
    expect(deriveMealStatus(items, {})).toBe('none');
    expect(deriveMealStatus(items, { x: { eaten: true } })).toBe('partial');
    expect(deriveMealStatus(items, { x: { eaten: true }, y: { eaten: true } })).toBe('eaten');
    expect(deriveMealStatus(items, { x: { eaten: true, amount: 40 }, y: { eaten: true } })).toBe('partial');
    expect(deriveMealStatus(items, { x: { eaten: true, amount: 60 }, y: { eaten: true } })).toBe('eaten');
    expect(deriveMealStatus([], {})).toBe('none');
  });
});

describe('planned totals', () => {
  const normal: Meal = { id: 'a', order: 0, time: '08:00', name: 'A', icon: 'sun', isFreeSlot: false, items: [oats, spices] };
  const free: Meal = { id: 'b', order: 1, time: '10:00', name: 'B', icon: 'star', isFreeSlot: true, freeSlotBudgetKcal: 130, items: [] };

  it('sums items, keeping free slots kcal-only', () => {
    expect(sumItems(normal.items).kcal).toBe(214);
    expect(mealPlanned(free)).toEqual({ kcal: 130, protein: 0, carbs: 0, fat: 0, fibre: 0 });
    expect(plannedMeals([normal, free]).kcal).toBe(214);
    expect(plannedWithSnack([normal, free])).toEqual({ kcal: 344, protein: 7, carbs: 36, fat: 5, fibre: 5 });
  });
});

describe('display formatting', () => {
  it('rounds only for display and never prints -0', () => {
    expect(fmt(203.5)).toBe('204');
    expect(fmt(-0.2)).toBe('0');
    expect(fmtAmount(1.5)).toBe('1.5');
    expect(fmtAmount(0.1 + 0.2)).toBe('0.3');
  });
});
