import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { addExtraItem, addFreeSlotEntry, hasLoggingActivity, makeLoggedItem, markMealEaten } from '../lib/dayLog';
import { PlateDB, seedIfEmpty } from './db';
import { ensureDayLog, updateDayLog } from './dayLogs';
import { updatePlan } from './plan';
import { resetToday, updateTargets } from './settings';

describe('settings writes', () => {
  let d: PlateDB | undefined;
  afterEach(async () => {
    await d?.delete();
  });

  it('SET-1: new targets apply to today, never to past days', async () => {
    d = new PlateDB(`test-${crypto.randomUUID()}`);
    await seedIfEmpty(d, 1);
    await ensureDayLog('2026-10-12', d);
    await ensureDayLog('2026-10-13', d);
    await updateTargets((t) => ({ ...t, kcal: 2500, fatMin: 50 }), d, '2026-10-13');
    expect((await d.settings.get('settings'))!.targets).toEqual({ kcal: 2500, proteinMin: 140, fatMin: 50, fibreMin: 45 });
    expect((await d.dayLogs.get('2026-10-13'))!.targetsSnapshot.kcal).toBe(2500);
    expect((await d.dayLogs.get('2026-10-12'))!.targetsSnapshot.kcal).toBe(2363);
  });

  it('LOG-8: reset today re-snapshots the plan and clears all logging', async () => {
    d = new PlateDB(`test-${crypto.randomUUID()}`);
    await seedIfEmpty(d, 1);
    const created = await ensureDayLog('2026-10-13', d, 10);
    await updateDayLog('2026-10-13', (l) => markMealEaten(l, 'm1'), d);
    await updateDayLog('2026-10-13', (l) => addExtraItem(l, 'm2', makeLoggedItem('e', { name: 'x', kcal: 5 })), d);
    await updateDayLog('2026-10-13', (l) => addFreeSlotEntry(l, 'm3', makeLoggedItem('f', { name: 'y', kcal: 5 })), d);
    // plan changed meanwhile (with activity → today was not synced)
    await updatePlan((p) => ({ ...p, meals: p.meals.filter((m) => m.id !== 'm8') }), d, '2026-10-13');
    expect((await d.dayLogs.get('2026-10-13'))!.mealsSnapshot).toHaveLength(8);

    await resetToday(d, '2026-10-13', 99);
    const log = (await d.dayLogs.get('2026-10-13'))!;
    expect(hasLoggingActivity(log)).toBe(false);
    expect(log.mealsSnapshot).toHaveLength(7);
    expect(log.createdAt).toBe(created.createdAt);
    expect(log.updatedAt).toBe(99);
  });
});
