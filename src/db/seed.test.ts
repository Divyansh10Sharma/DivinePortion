import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { fmt, plannedMeals, plannedWithSnack, sumItems } from '../lib/nutrition';
import { PlateDB, seedIfEmpty } from './db';
import { buildSeedMeals } from './seed';

// SPEC.md §4.3 — expected seed totals, computed from items.
const EXPECTED: Record<string, [kcal: number, p: number, c: number, f: number, fibre: number]> = {
  m1: [263, 8, 42, 8, 5],
  m2: [554, 40, 71, 13, 5],
  m4: [5, 0, 0, 0, 0],
  m5: [348, 31, 52, 1, 19],
  m6: [40, 2, 9, 0, 3],
  m7: [616, 41, 75, 16, 8],
  // Owner's poster says 77g carbs here; items sum to 76 (see PROGRESS.md decisions).
  m8: [407, 21, 76, 1, 18],
};

describe('seed totals (§4.3)', () => {
  const meals = buildSeedMeals();

  it.each(Object.entries(EXPECTED))('meal %s subtotal', (id, expected) => {
    const meal = meals.find((m) => m.id === id)!;
    const t = sumItems(meal.items);
    expect([t.kcal, t.protein, t.carbs, t.fat, t.fibre]).toEqual(expected);
  });

  it('meals total = 2233 kcal · 143 P · 325 C · 39 F · 58 fibre', () => {
    const t = plannedMeals(meals);
    expect([t.kcal, t.protein, t.carbs, t.fat, t.fibre]).toEqual([2233, 143, 325, 39, 58]);
  });

  it('with free slot = 2363 kcal (header number)', () => {
    expect(fmt(plannedWithSnack(meals).kcal)).toBe('2363');
  });

  it('has 8 meals with stable ids, one free slot with a 130 kcal budget', () => {
    expect(meals.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8']);
    const free = meals.filter((m) => m.isFreeSlot);
    expect(free).toHaveLength(1);
    expect(free[0]!.freeSlotBudgetKcal).toBe(130);
    expect(free[0]!.items).toHaveLength(0);
  });

  it('stores every seed item as manual so totals stay exactly as written', () => {
    for (const m of meals) for (const i of m.items) expect(i.valuesSource).toBe('manual');
  });
});

describe('seedIfEmpty', () => {
  let database: PlateDB | undefined;
  afterEach(async () => {
    await database?.delete();
  });

  it('seeds an empty database once and never re-seeds', async () => {
    database = new PlateDB(`test-${crypto.randomUUID()}`);
    expect(await seedIfEmpty(database, 1)).toBe(true);
    const plan = await database.plan.get('active');
    expect(plan?.title).toBe('Bulking Plan');
    expect((await database.settings.get('settings'))?.targets).toEqual({ kcal: 2363, proteinMin: 140, fatMin: 45, fibreMin: 45 });

    await database.plan.update('active', { title: 'Changed' });
    expect(await seedIfEmpty(database, 2)).toBe(false);
    expect((await database.plan.get('active'))?.title).toBe('Changed');
  });
});
