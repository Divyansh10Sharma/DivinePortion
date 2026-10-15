// "Your items" library (v2 redesign, owner request): foods with macros per 100 g, picked into meals
// by grams. Pure functions; the DB side lives in db/library.ts.
//
// A meal item picked from the library stores a copy of the library values as its `base`
// ({ per: '100g', ...per100 }) plus `libraryId`, `unit: 'g'` and `amount` in grams, so all the
// existing nutrition maths (valuesFromBase, sums) keep working unchanged.

import { scale } from './nutrition';
import { omitKey } from './objects';
import type { Item, LibraryItem, Meal, Nutrition, Plan } from './types';

export function per100Of(n: Nutrition): Nutrition {
  return { kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat, fibre: n.fibre };
}

/** Values for `grams` of a library item. */
export function valuesForGrams(per100: Nutrition, grams: number): Nutrition {
  return scale(per100Of(per100), grams / 100);
}

/** A meal item for `grams` of a library item (values computed from the per-100 values). */
export function itemFromLibrary(lib: LibraryItem, id: string, order: number, grams: number): Item {
  return {
    ...valuesForGrams(lib.per100, grams),
    id,
    order,
    name: lib.name,
    amount: grams,
    unit: 'g',
    base: { per: '100g', ...per100Of(lib.per100) },
    valuesSource: 'base',
    libraryId: lib.id,
  };
}

/** Changing the grams of a library-linked item recomputes its values from the library copy. */
export function setLibraryItemGrams(item: Item, grams: number): Item {
  if (!item.base) return { ...item, amount: grams };
  return { ...item, ...valuesForGrams(item.base, grams), amount: grams, valuesSource: 'base' };
}

/**
 * After a library item is edited, every current-plan item linked to it takes the new name and
 * per-100 values and recomputes for its grams. Saved plans are snapshots and are not touched.
 */
export function applyLibraryEdit(plan: Plan, lib: LibraryItem): Plan {
  let changed = false;
  const meals = plan.meals.map((meal) => {
    let mealChanged = false;
    const items = meal.items.map((item) => {
      if (item.libraryId !== lib.id) return item;
      changed = mealChanged = true;
      return {
        ...item,
        ...valuesForGrams(lib.per100, item.amount),
        name: lib.name,
        base: { per: '100g' as const, ...per100Of(lib.per100) },
        valuesSource: 'base' as const,
      };
    });
    return mealChanged ? { ...meal, items } : meal;
  });
  return changed ? { ...plan, meals } : plan;
}

/** Deleting a library item: linked meal items keep their values but are no longer linked. */
export function unlinkLibraryItem(plan: Plan, libraryId: string): Plan {
  return {
    ...plan,
    meals: plan.meals.map((meal) => ({
      ...meal,
      items: meal.items.map((item) => {
        if (item.libraryId !== libraryId) return item;
        return { ...omitKey(item, 'libraryId'), valuesSource: 'manual' as const };
      }),
    })),
  };
}

// ---------------------------------------------------------------------------
// Migration of v1 meals ("Convert what I can")
// ---------------------------------------------------------------------------

const sameNutrition = (a: Nutrition, b: Nutrition) =>
  a.kcal === b.kcal && a.protein === b.protein && a.carbs === b.carbs && a.fat === b.fat && a.fibre === b.fibre;

/**
 * Turns every item that has a per-100 g or per-100 ml base into a library item (deduplicated by
 * name + values) and links the meal item to it. Per-100 ml (milk) is treated as per 100 g and the
 * amount's unit becomes "g" (grams only, owner choice). The item's stored values are kept exactly
 * (valuesSource stays as it was), so totals don't change until its grams are edited.
 * Items without such a base (per piece, sachets, servings) are left as they are.
 */
export function migrateMealsToLibrary(
  meals: Meal[],
  existing: LibraryItem[],
  newId: () => string,
  now: number,
): { meals: Meal[]; library: LibraryItem[]; added: LibraryItem[] } {
  const library = [...existing];
  const added: LibraryItem[] = [];

  const findOrCreate = (name: string, per100: Nutrition): LibraryItem => {
    const key = name.trim().toLowerCase();
    const found = library.find((l) => l.name.trim().toLowerCase() === key && sameNutrition(l.per100, per100));
    if (found) return found;
    const lib: LibraryItem = { id: `lib-${newId()}`, name: name.trim(), per100: per100Of(per100), createdAt: now, updatedAt: now };
    library.push(lib);
    added.push(lib);
    return lib;
  };

  const out = meals.map((meal) => ({
    ...meal,
    items: meal.items.map((item) => {
      if (item.libraryId || !item.base || (item.base.per !== '100g' && item.base.per !== '100ml')) return item;
      const lib = findOrCreate(item.name, item.base);
      return { ...item, libraryId: lib.id, unit: 'g', base: { ...item.base, per: '100g' as const } };
    }),
  }));
  return { meals: out, library, added };
}

/** Library items sorted for display (case-insensitive by name). */
export function sortLibrary(items: readonly LibraryItem[]): LibraryItem[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}
