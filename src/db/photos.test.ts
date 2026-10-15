import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { fitWithin } from '../lib/images';
import { updateMeal } from '../lib/planEdit';
import type { DayLog } from '../lib/types';
import { PlateDB, seedIfEmpty } from './db';
import { saveCurrentPlan } from './library';
import { updatePlan } from './plan';
import { deleteOrphanPhotos, savePhoto } from './photos';

const img = (n: number) => ({ data: new Uint8Array([n, 1, 2]).buffer, mimeType: 'image/jpeg', width: 10, height: 10, thumbDataUrl: 'data:,' });

describe('fitWithin (PHOTO-2)', () => {
  it('caps the long edge at 1000 and never upscales', () => {
    expect(fitWithin(4032, 3024, 1000)).toEqual({ width: 1000, height: 750 });
    expect(fitWithin(3024, 4032, 1000)).toEqual({ width: 750, height: 1000 });
    expect(fitWithin(800, 600, 1000)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(5000, 2, 24)).toEqual({ width: 24, height: 1 });
  });
});

describe('photo storage & orphan clean-up (PHOTO-3, PHOTO-6)', () => {
  let database: PlateDB | undefined;
  afterEach(async () => {
    await database?.delete();
  });

  it('stores ArrayBuffer + MIME and round-trips the bytes', async () => {
    database = new PlateDB(`test-${crypto.randomUUID()}`);
    const id = await savePhoto(img(7), database, 1);
    const p = await database.photos.get(id);
    expect(p?.mimeType).toBe('image/jpeg');
    expect(Array.from(new Uint8Array(p!.data))).toEqual([7, 1, 2]);
  });

  it('keeps photos used by the meals, a saved plan or legacy day logs, deletes the rest (with a grace period)', async () => {
    const d = (database = new PlateDB(`test-${crypto.randomUUID()}`));
    await seedIfEmpty(d, 1);
    const T = 1_000_000_000;
    const current = await savePhoto(img(1), d, T);
    const inSavedPlan = await savePhoto(img(2), d, T);
    const inOldLog = await savePhoto(img(3), d, T);
    const orphan = await savePhoto(img(4), d, T);
    const fresh = await savePhoto(img(5), d, T + 5 * 60_000); // e.g. just picked, form not saved yet

    // Save a plan while meal 1 shows `inSavedPlan`, then replace it in the current meals.
    await updatePlan((p) => updateMeal(p, 'm1', (m) => ({ ...m, photoId: inSavedPlan })), d, T);
    await saveCurrentPlan('Old', d, T);
    await updatePlan((p) => updateMeal(p, 'm1', (m) => ({ ...m, photoId: current })), d, T);
    // A legacy (v1) day log that references a photo.
    const plan = (await d.plan.get('active'))!;
    const log: DayLog = {
      date: '2026-10-01',
      mealsSnapshot: plan.meals.map((m) => (m.id === 'm2' ? { ...m, photoId: inOldLog } : m)),
      eaten: {},
      extraItems: {},
      freeSlotEntries: {},
      targetsSnapshot: { kcal: 2363, proteinMin: 140, fatMin: 45, fibreMin: 45 },
      createdAt: T,
      updatedAt: T,
    };
    await d.dayLogs.put(log);

    expect(await deleteOrphanPhotos(d, T + 11 * 60_000)).toBe(1);
    const left = (await d.photos.toCollection().primaryKeys()) as string[];
    expect(left.sort()).toEqual([current, inSavedPlan, inOldLog, fresh].sort());
    expect(left).not.toContain(orphan);
  });
});
