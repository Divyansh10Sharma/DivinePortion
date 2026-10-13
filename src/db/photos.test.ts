import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { fitWithin } from '../lib/images';
import { addFreeSlotEntry, makeLoggedItem } from '../lib/dayLog';
import { updateItem, updateMeal } from '../lib/planEdit';
import { PlateDB, seedIfEmpty } from './db';
import { ensureDayLog, updateDayLog } from './dayLogs';
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

  it('deletes only unreferenced photos, never ones used by a past DayLog, and respects the grace period', async () => {
    const d = (database = new PlateDB(`test-${crypto.randomUUID()}`));
    await seedIfEmpty(d, 1);
    const T = 1_000_000_000;
    const mealPhoto = await savePhoto(img(1), d, T);
    const oldItemPhoto = await savePhoto(img(2), d, T);
    const entryPhoto = await savePhoto(img(3), d, T);
    const orphan = await savePhoto(img(4), d, T);
    const fresh = await savePhoto(img(5), d, T + 5 * 60_000); // e.g. picked into an unsaved form

    // Yesterday's snapshot uses the old item photo (and the meal photo).
    await updatePlan((p) => updateMeal(p, 'm1', (m) => updateItem({ ...m, photoId: mealPhoto }, 'm1-i1', (i) => ({ ...i, photoId: oldItemPhoto }))), d, '2026-10-12', T);
    await ensureDayLog('2026-10-12', d, T);
    // Then the plan replaces the item photo — the old one is still referenced by yesterday.
    await updatePlan((p) => updateMeal(p, 'm1', (m) => updateItem(m, 'm1-i1', (i) => ({ ...i, photoId: undefined }))), d, '2026-10-13', T);
    // Today's free-slot entry has a photo.
    await ensureDayLog('2026-10-13', d, T);
    await updateDayLog('2026-10-13', (l) => addFreeSlotEntry(l, 'm3', { ...makeLoggedItem('f1', { name: 'Nuts', kcal: 100 }), photoId: entryPhoto }), d);

    const deleted = await deleteOrphanPhotos(d, T + 11 * 60_000);
    expect(deleted).toBe(1);
    const left = (await d.photos.toCollection().primaryKeys()) as string[];
    expect(left.sort()).toEqual([mealPhoto, oldItemPhoto, entryPhoto, fresh].sort());
    expect(left).not.toContain(orphan);
  });
});
