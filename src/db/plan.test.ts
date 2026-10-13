import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { markMealEaten } from '../lib/dayLog';
import { removeById, updateMeal } from '../lib/planEdit';
import { PlateDB, seedIfEmpty } from './db';
import { ensureDayLog, updateDayLog } from './dayLogs';
import { applyPlanToToday, todayDiffersFromPlan, updatePlan } from './plan';

const YESTERDAY = '2026-10-12';
const TODAY = '2026-10-13';

describe('plan edits vs day logs', () => {
  let database: PlateDB | undefined;
  afterEach(async () => {
    await database?.delete();
  });

  async function setup() {
    database = new PlateDB(`test-${crypto.randomUUID()}`);
    await seedIfEmpty(database, 1);
    await ensureDayLog(YESTERDAY, database, 2);
    await updateDayLog(YESTERDAY, (l) => markMealEaten(l, 'm1'), database);
    await ensureDayLog(TODAY, database, 3);
    return database;
  }

  it('HIST-3: editing the plan never changes a past DayLog', async () => {
    const d = await setup();
    const before = structuredClone(await d.dayLogs.get(YESTERDAY));

    await updatePlan((p) => ({ ...p, meals: removeById(p.meals, 'm2').list }), d, TODAY, 10);
    await updatePlan((p) => updateMeal(p, 'm1', (m) => ({ ...m, name: 'Renamed', items: [] })), d, TODAY, 11);
    await updateDayLog(TODAY, (l) => markMealEaten(l, 'm4'), d);
    await updatePlan((p) => updateMeal(p, 'm5', (m) => ({ ...m, time: '14:00' })), d, TODAY, 12);
    await applyPlanToToday(d, TODAY, 13);

    expect(await d.dayLogs.get(YESTERDAY)).toEqual(before);
    expect((await d.dayLogs.get(YESTERDAY))!.mealsSnapshot).toHaveLength(8);
  });

  it('PLAN-9: silent sync without activity, ask + merge with activity', async () => {
    const d = await setup();

    expect(await updatePlan((p) => ({ ...p, meals: removeById(p.meals, 'm6').list }), d, TODAY, 10)).toBe('synced');
    expect((await d.dayLogs.get(TODAY))!.mealsSnapshot.map((m) => m.id)).not.toContain('m6');
    expect(await todayDiffersFromPlan(d, TODAY)).toBe(false);

    await updateDayLog(TODAY, (l) => markMealEaten(l, 'm1'), d);
    expect(await updatePlan((p) => updateMeal(p, 'm1', (m) => ({ ...m, name: 'Renamed' })), d, TODAY, 11)).toBe('ask');
    // "No": today keeps the old name
    expect((await d.dayLogs.get(TODAY))!.mealsSnapshot[0]!.name).toBe('Pre-Gym Banana Coffee');
    expect(await todayDiffersFromPlan(d, TODAY)).toBe(true);

    // "Yes": merged, eaten state kept
    await applyPlanToToday(d, TODAY, 12);
    const merged = (await d.dayLogs.get(TODAY))!;
    expect(merged.mealsSnapshot[0]!.name).toBe('Renamed');
    expect(merged.eaten.m1!.status).toBe('eaten');
    expect(await todayDiffersFromPlan(d, TODAY)).toBe(false);
  });

  it('plan writes bump updatedAt and keep the id', async () => {
    const d = await setup();
    await updatePlan((p) => ({ ...p, title: 'Cut Plan' }), d, TODAY, 99);
    expect(await d.plan.get('active')).toMatchObject({ id: 'active', title: 'Cut Plan', updatedAt: 99 });
  });
});
