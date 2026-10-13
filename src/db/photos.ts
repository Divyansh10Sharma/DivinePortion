// Photo storage (PHOTO-3, PHOTO-6).
// Photos are stored as ArrayBuffer + MIME type (more robust than Blob in older iOS IndexedDB).
// They are referenced by id from the plan, plan snapshots in DayLogs, extras and free-slot entries.

import { newId } from '../lib/ids';
import type { DayLog, Item, Meal, Photo, Plan } from '../lib/types';
import type { ProcessedImage } from '../lib/images';
import { db, type PlateDB } from './db';

export async function savePhoto(image: ProcessedImage, database: PlateDB = db, now = Date.now()): Promise<string> {
  const photo: Photo = { id: `p-${newId()}`, createdAt: now, ...image };
  await database.photos.put(photo);
  return photo.id;
}

function addFromMeals(ids: Set<string>, meals: readonly Meal[]): void {
  for (const m of meals) {
    if (m.photoId) ids.add(m.photoId);
    for (const i of m.items) if (i.photoId) ids.add(i.photoId);
  }
}

function addFromItems(ids: Set<string>, lists: Record<string, Item[]>): void {
  for (const list of Object.values(lists)) for (const i of list) if (i.photoId) ids.add(i.photoId);
}

/** Every photo id still in use: the plan, and every DayLog (past snapshots included). */
export function referencedPhotoIds(plan: Plan | undefined, logs: readonly DayLog[]): Set<string> {
  const ids = new Set<string>();
  if (plan) addFromMeals(ids, plan.meals);
  for (const log of logs) {
    addFromMeals(ids, log.mealsSnapshot);
    addFromItems(ids, log.extraItems);
    addFromItems(ids, log.freeSlotEntries);
  }
  return ids;
}

/**
 * PHOTO-6: delete photos nothing references any more — never one used by any past DayLog.
 * Photos younger than `graceMs` are kept: they may belong to a form that hasn't been saved yet,
 * or to a delete that can still be undone.
 */
export async function deleteOrphanPhotos(database: PlateDB = db, now = Date.now(), graceMs = 10 * 60_000): Promise<number> {
  return database.transaction('rw', [database.plan, database.dayLogs, database.photos], async () => {
    const [plan, logs, photos] = await Promise.all([
      database.plan.get('active'),
      database.dayLogs.toArray(),
      database.photos.toCollection().primaryKeys(),
    ]);
    const used = referencedPhotoIds(plan, logs);
    const candidates = (photos as string[]).filter((id) => !used.has(id));
    if (candidates.length === 0) return 0;
    const meta = await database.photos.bulkGet(candidates);
    const doomed = meta.filter((p): p is Photo => !!p && now - p.createdAt >= graceMs).map((p) => p.id);
    await database.photos.bulkDelete(doomed);
    return doomed.length;
  });
}

let gcTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Debounced clean-up after a photo was removed/replaced or a meal/item deleted. Runs after the
 * 5s Undo window; keeps the grace period so a photo picked into an unsaved form survives.
 * (It also runs on every launch, which catches anything younger than the grace period.)
 */
export function scheduleOrphanCleanup(delayMs = 15_000): void {
  clearTimeout(gcTimer);
  gcTimer = setTimeout(() => void deleteOrphanPhotos().catch(() => {}), delayMs);
}
