import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { markMealEaten } from '../lib/dayLog';
import { PlateDB, seedIfEmpty } from './db';
import { ensureDayLog, updateDayLog } from './dayLogs';

describe('day log persistence', () => {
  let database: PlateDB | undefined;
  afterEach(async () => {
    await database?.delete();
  });

  it('creates a day once, then returns the stored one', async () => {
    database = new PlateDB(`test-${crypto.randomUUID()}`);
    await seedIfEmpty(database, 1);
    const first = await ensureDayLog('2026-10-13', database, 10);
    await updateDayLog('2026-10-13', (log) => markMealEaten(log, 'm1', 20), database);

    // Plan changes after the day exists must not leak into it.
    await database.plan.update('active', { title: 'Changed', meals: [] });
    const again = await ensureDayLog('2026-10-13', database, 30);
    expect(again.createdAt).toBe(first.createdAt);
    expect(again.mealsSnapshot).toHaveLength(8);
    expect(again.eaten.m1?.status).toBe('eaten');
    expect(again.updatedAt).toBe(20);

    // The next day snapshots the (changed) plan.
    const tomorrow = await ensureDayLog('2026-10-14', database, 40);
    expect(tomorrow.mealsSnapshot).toHaveLength(0);
    expect(await database.dayLogs.count()).toBe(2);
  });
});
