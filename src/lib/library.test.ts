import { describe, expect, it } from 'vitest';
import { buildSeedMeals, buildSeedPlan } from '../db/seed';
import {
  applyLibraryEdit,
  itemFromLibrary,
  migrateMealsToLibrary,
  setLibraryItemGrams,
  sortLibrary,
  unlinkLibraryItem,
  valuesForGrams,
} from './library';
import { plannedMeals, plannedWithSnack } from './nutrition';
import type { LibraryItem } from './types';

let n = 0;
const ids = () => `x${++n}`;
const oats: LibraryItem = {
  id: 'lib-oats',
  name: 'Rolled Oats',
  per100: { kcal: 407, protein: 12, carbs: 68.5, fat: 9.5, fibre: 10 },
  createdAt: 0,
  updatedAt: 0,
};

describe('library items in meals (grams)', () => {
  it('computes values for grams from per-100 g', () => {
    expect(valuesForGrams(oats.per100, 50)).toEqual({ kcal: 203.5, protein: 6, carbs: 34.25, fat: 4.75, fibre: 5 });
  });

  it('builds a linked meal item and recomputes when grams change', () => {
    const item = itemFromLibrary(oats, 'i1', 0, 80);
    expect(item).toMatchObject({ libraryId: 'lib-oats', unit: 'g', amount: 80, valuesSource: 'base', base: { per: '100g', kcal: 407 } });
    expect(item.kcal).toBeCloseTo(325.6);
    const more = setLibraryItemGrams(item, 100);
    expect(more).toMatchObject({ amount: 100, kcal: 407, protein: 12 });
  });

  it('library edits flow into the current meals; deleting unlinks but keeps values', () => {
    const plan = buildSeedPlan(0);
    plan.meals[0]!.items.push(itemFromLibrary(oats, 'i1', 9, 50));
    const edited = applyLibraryEdit(plan, { ...oats, name: 'Oats', per100: { ...oats.per100, kcal: 400 } });
    const it = edited.meals[0]!.items.find((i) => i.id === 'i1')!;
    expect(it).toMatchObject({ name: 'Oats', kcal: 200 });
    expect(applyLibraryEdit(plan, { ...oats, id: 'other' })).toBe(plan); // nothing linked → unchanged

    const unlinked = unlinkLibraryItem(edited, 'lib-oats').meals[0]!.items.find((i) => i.id === 'i1')!;
    expect(unlinked.libraryId).toBeUndefined();
    expect(unlinked).toMatchObject({ kcal: 200, valuesSource: 'manual' });
  });

  it('sorts by name, case-insensitively', () => {
    const b = { ...oats, id: 'b', name: 'banana' };
    const a = { ...oats, id: 'a', name: 'Almonds' };
    expect(sortLibrary([oats, b, a]).map((i) => i.name)).toEqual(['Almonds', 'banana', 'Rolled Oats']);
  });
});

describe('migration of the v1 meals ("convert what I can")', () => {
  const { meals, library, added } = migrateMealsToLibrary(buildSeedMeals(), [], ids, 5);

  it('creates one library item per distinct per-100 food (milk and protein counted once)', () => {
    expect(added).toEqual(library);
    expect(sortLibrary(library).map((l) => l.name)).toEqual([
      'Chocos',
      'Moong Dal (raw)',
      'Peanut Butter',
      'Protein Powder (1 scoop)',
      'Rice (raw)',
      'Rolled Oats',
      'Soya Chunks (raw)',
      'Toned Milk',
    ]);
    expect(library.find((l) => l.name === 'Toned Milk')!.per100).toEqual({ kcal: 58, protein: 3, carbs: 4.7, fat: 3, fibre: 0 });
  });

  it('links converted items (grams), leaves per-piece / sachet / serving items as they were', () => {
    const all = meals.flatMap((m) => m.items);
    const milk = all.filter((i) => i.name === 'Toned Milk');
    expect(milk).toHaveLength(3);
    expect(new Set(milk.map((i) => i.libraryId)).size).toBe(1);
    expect(milk.every((i) => i.unit === 'g' && i.base?.per === '100g')).toBe(true);
    const banana = all.find((i) => i.name === 'Banana')!;
    expect(banana.libraryId).toBeUndefined();
    expect(banana.unit).toBe('piece');
    expect(all.find((i) => i.name === 'Bru Coffee')!.libraryId).toBeUndefined();
  });

  it('keeps every total exactly as before (values untouched until grams are edited)', () => {
    expect(plannedMeals(meals)).toEqual(plannedMeals(buildSeedMeals()));
    expect(plannedWithSnack(meals).kcal).toBe(2363);
    expect(meals.flatMap((m) => m.items).every((i) => i.valuesSource === 'manual')).toBe(true);
  });

  it('is idempotent and reuses existing library items', () => {
    const again = migrateMealsToLibrary(meals, library, ids, 6);
    expect(again.added).toEqual([]);
    expect(again.meals).toEqual(meals);
  });
});
