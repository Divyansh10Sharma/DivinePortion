// "Your items" (library) and "Saved plans" persistence (v2 redesign).

import { newId } from '../lib/ids';
import { applyLibraryEdit, unlinkLibraryItem } from '../lib/library';
import type { LibraryItem, Nutrition, Plan, SavedPlan } from '../lib/types';
import { db, type PlateDB } from './db';

export async function addLibraryItem(
  fields: { name: string; per100: Nutrition },
  database: PlateDB = db,
  now = Date.now(),
): Promise<LibraryItem> {
  const item: LibraryItem = { id: `lib-${newId()}`, name: fields.name.trim(), per100: fields.per100, createdAt: now, updatedAt: now };
  await database.library.put(item);
  return item;
}

/** Saves an edit and updates every current-plan item linked to it (saved plans are snapshots). */
export async function updateLibraryItem(
  id: string,
  fields: { name: string; per100: Nutrition },
  database: PlateDB = db,
  now = Date.now(),
): Promise<void> {
  await database.transaction('rw', [database.library, database.plan], async () => {
    const old = await database.library.get(id);
    if (!old) return;
    const lib: LibraryItem = { ...old, name: fields.name.trim(), per100: fields.per100, updatedAt: now };
    await database.library.put(lib);
    const plan = await database.plan.get('active');
    if (plan) {
      const next = applyLibraryEdit(plan, lib);
      if (next !== plan) await database.plan.put({ ...next, updatedAt: now });
    }
  });
}

/** Deletes a library item; meal items that used it keep their values (unlinked). Returns it for Undo. */
export async function deleteLibraryItem(id: string, database: PlateDB = db, now = Date.now()): Promise<LibraryItem | undefined> {
  return database.transaction('rw', [database.library, database.plan], async () => {
    const old = await database.library.get(id);
    if (!old) return undefined;
    await database.library.delete(id);
    const plan = await database.plan.get('active');
    if (plan) await database.plan.put({ ...unlinkLibraryItem(plan, id), updatedAt: now });
    return old;
  });
}

/** Undo of a delete: puts the item back (meal items stay unlinked — their values are unchanged). */
export async function restoreLibraryItem(item: LibraryItem, database: PlateDB = db): Promise<void> {
  await database.library.put(item);
}

// ---------------------------------------------------------------------------
// Saved plans
// ---------------------------------------------------------------------------

/** Saves a named copy of the current meals. */
export async function saveCurrentPlan(name: string, database: PlateDB = db, now = Date.now()): Promise<SavedPlan | undefined> {
  return database.transaction('rw', [database.plan, database.savedPlans], async () => {
    const plan = await database.plan.get('active');
    if (!plan) return undefined;
    const saved: SavedPlan = { id: `sp-${newId()}`, name: name.trim(), meals: structuredClone(plan.meals), createdAt: now };
    await database.savedPlans.put(saved);
    return saved;
  });
}

/** "Use this plan": the saved meals become the current meals (the saved plan itself is unchanged). */
export async function applySavedPlan(id: string, database: PlateDB = db, now = Date.now()): Promise<void> {
  await database.transaction('rw', [database.plan, database.savedPlans], async () => {
    const [saved, plan] = await Promise.all([database.savedPlans.get(id), database.plan.get('active')]);
    if (!saved || !plan) return;
    const next: Plan = { ...plan, meals: structuredClone(saved.meals), updatedAt: now };
    await database.plan.put(next);
  });
}
