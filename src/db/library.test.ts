import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { plannedMeals } from '../lib/nutrition';
import { buildSeedPlan, buildSeedSettings } from './seed';
import { PlateDB, seedIfEmpty } from './db';
import { addLibraryItem, applySavedPlan, deleteLibraryItem, saveCurrentPlan, updateLibraryItem } from './library';
import { updatePlan } from './plan';

describe('v2 database', () => {
  const names: string[] = [];
  afterEach(async () => {
    await Promise.all(names.map((n) => Dexie.delete(n)));
    names.length = 0;
  });
  const fresh = () => {
    const name = `test-${crypto.randomUUID()}`;
    names.push(name);
    return new PlateDB(name);
  };

  it('a fresh install seeds the meals and the 8 converted library items', async () => {
    const d = fresh();
    await seedIfEmpty(d, 1);
    expect(await d.library.count()).toBe(8);
    const plan = (await d.plan.get('active'))!;
    expect(plannedMeals(plan.meals).kcal).toBe(2233);
  });

  it('upgrading an existing v1 database converts its meals and keeps everything else', async () => {
    const name = `test-${crypto.randomUUID()}`;
    names.push(name);
    // A v1 database as the installed app had it.
    const v1 = new Dexie(name);
    v1.version(1).stores({ settings: 'id', plan: 'id', dayLogs: 'date', photos: 'id' });
    await v1.table('settings').put(buildSeedSettings(1));
    await v1.table('plan').put({ ...buildSeedPlan(1), title: 'My Plan' });
    v1.close();

    const d = new PlateDB(name);
    await d.open();
    const plan = (await d.plan.get('active'))!;
    expect(plan.title).toBe('My Plan');
    expect(await d.library.count()).toBe(8);
    expect(plan.meals.flatMap((m) => m.items).filter((i) => i.libraryId)).toHaveLength(11); // PB, milk×3, Chocos, protein×2, soya, oats, dal, rice
    expect(plannedMeals(plan.meals).kcal).toBe(2233);
    expect(await d.savedPlans.count()).toBe(0);
    d.close();
  });

  it('editing a library item updates the current meals but not saved plans', async () => {
    const d = fresh();
    await seedIfEmpty(d, 1);
    await saveCurrentPlan('Before', d, 2);
    const milk = (await d.library.toArray()).find((l) => l.name === 'Toned Milk')!;
    await updateLibraryItem(milk.id, { name: 'Milk 1.5%', per100: { ...milk.per100, kcal: 50 } }, d, 3);

    const items = (await d.plan.get('active'))!.meals.flatMap((m) => m.items).filter((i) => i.libraryId === milk.id);
    expect(items.map((i) => [i.name, i.kcal])).toEqual([
      ['Milk 1.5%', 50],
      ['Milk 1.5%', 150],
      ['Milk 1.5%', 150],
    ]);
    const saved = (await d.savedPlans.toArray())[0]!;
    expect(saved.meals.flatMap((m) => m.items).filter((i) => i.libraryId === milk.id).map((i) => i.name)).toEqual([
      'Toned Milk',
      'Toned Milk',
      'Toned Milk',
    ]);
  });

  it('deleting a library item keeps the meal values (unlinked)', async () => {
    const d = fresh();
    await seedIfEmpty(d, 1);
    const before = plannedMeals((await d.plan.get('active'))!.meals);
    const pb = (await d.library.toArray()).find((l) => l.name === 'Peanut Butter')!;
    expect((await deleteLibraryItem(pb.id, d))?.name).toBe('Peanut Butter');
    const plan = (await d.plan.get('active'))!;
    expect(plannedMeals(plan.meals)).toEqual(before);
    expect(plan.meals.flatMap((m) => m.items).find((i) => i.name === 'Peanut Butter')!.libraryId).toBeUndefined();
  });

  it('saved plans: save, change the meals, use the saved plan again', async () => {
    const d = fresh();
    await seedIfEmpty(d, 1);
    const saved = (await saveCurrentPlan('  Bulking  ', d, 2))!;
    expect(saved.name).toBe('Bulking');
    await updatePlan((p) => ({ ...p, meals: p.meals.slice(0, 2) }), d, 3);
    expect((await d.plan.get('active'))!.meals).toHaveLength(2);

    await applySavedPlan(saved.id, d, 4);
    const plan = (await d.plan.get('active'))!;
    expect(plan.meals).toEqual(saved.meals);
    expect(plan.updatedAt).toBe(4);
    expect(await d.savedPlans.count()).toBe(1); // the saved plan itself is unchanged

    const added = await addLibraryItem({ name: ' Curd ', per100: { kcal: 60, protein: 3.5, carbs: 4.5, fat: 3, fibre: 0 } }, d, 5);
    expect(added.name).toBe('Curd');
    expect(await d.library.count()).toBe(9);
  });
});
