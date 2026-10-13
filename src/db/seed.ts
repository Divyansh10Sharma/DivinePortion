// Seed data — SPEC.md §5. Values are used EXACTLY as written by the owner.
// All seed items are stored with valuesSource 'manual' (§4.2): the base is kept for later
// scaling, but nothing is recalculated until the owner edits an amount or taps "Recalculate".

import type { BasePer, Item, Meal, MealIcon, Plan, Settings } from '../lib/types';

export const SCHEMA_VERSION = 1;

type N5 = readonly [kcal: number, protein: number, carbs: number, fat: number, fibre: number];

function item(
  mealId: string,
  index: number,
  name: string,
  amount: number,
  unit: string,
  [kcal, protein, carbs, fat, fibre]: N5,
  base?: { per: BasePer; values: N5 },
  note?: string,
): Item {
  const result: Item = {
    id: `${mealId}-i${index}`,
    order: index - 1,
    name,
    amount,
    unit,
    kcal,
    protein,
    carbs,
    fat,
    fibre,
    valuesSource: 'manual',
  };
  if (base) {
    const [bk, bp, bc, bf, bfi] = base.values;
    result.base = { per: base.per, kcal: bk, protein: bp, carbs: bc, fat: bf, fibre: bfi };
  }
  if (note) result.note = note;
  return result;
}

function meal(
  index: number,
  time: string,
  name: string,
  icon: MealIcon,
  build: (id: string) => Item[],
  extra: Partial<Meal> = {},
): Meal {
  const id = `m${index}`;
  return { id, order: index - 1, time, name, icon, isFreeSlot: false, items: build(id), ...extra };
}

// Shared bases (per §5)
const BANANA = { per: '1piece', values: [90, 1, 23, 0, 2.6] } as const;
const MILK = { per: '100ml', values: [58, 3, 4.7, 3, 0] } as const;
const PROTEIN = { per: '100g', values: [383, 70, 10.6, 6.75, 0] } as const;

export function buildSeedMeals(): Meal[] {
  return [
    meal(1, '04:45', 'Pre-Gym Banana Coffee', 'sunrise', (m) => [
      item(m, 1, 'Banana', 1.5, 'piece', [135, 2, 35, 0, 4], BANANA),
      item(m, 2, 'Peanut Butter', 10, 'g', [64, 3, 2, 5, 1], { per: '100g', values: [639, 30, 18, 49, 9] }),
      item(m, 3, 'Toned Milk', 100, 'ml', [58, 3, 5, 3, 0], MILK),
      item(m, 4, 'Bru Coffee', 5, 'sachet', [6, 0, 0, 0, 0]),
      item(m, 5, 'Salt', 1, 'pinch', [0, 0, 0, 0, 0]),
    ]),
    meal(2, '07:00', 'Post-Gym Chocos Bowl', 'sun', (m) => [
      item(m, 1, 'Chocos', 50, 'g', [187, 5, 41, 2, 4], { per: '100g', values: [373, 9, 81, 3, 7] }),
      item(m, 2, 'Protein Powder (1 scoop)', 36, 'g', [138, 25, 4, 2, 0], PROTEIN),
      item(m, 3, 'Toned Milk', 300, 'ml', [174, 9, 14, 9, 0], MILK),
      item(m, 4, 'Banana', 0.5, 'piece', [45, 1, 12, 0, 1], BANANA),
      item(m, 5, 'Cinnamon, Salt, 2g ORS', 1, 'serving', [10, 0, 0, 0, 0]),
    ]),
    meal(3, '10:30', 'Free Slot', 'star', () => [], {
      isFreeSlot: true,
      freeSlotBudgetKcal: 130,
      freeSlotHint: 'Pick a higher-fat option (about 6g fat) to complete daily fat',
    }),
    meal(4, '12:00', 'Black Coffee', 'coffee', (m) => [item(m, 1, 'Black Coffee', 4, 'sachet', [5, 0, 0, 0, 0])], {
      badge: 'LAST CAFFEINE OF THE DAY',
    }),
    meal(5, '13:30', 'Soya Veg Bowl', 'sun', (m) => [
      item(m, 1, 'Soya Chunks (raw)', 50, 'g', [170, 26, 12, 1, 7], { per: '100g', values: [340, 52, 24, 2, 13] }),
      item(m, 2, 'Cabbage, shredded', 0.5, 'piece', [50, 3, 11, 0, 5]),
      item(m, 3, 'Capsicum + Tomato', 1, 'each', [52, 2, 12, 0, 4]),
      item(m, 4, 'Onion', 1, 'piece', [15, 0, 3, 0, 1], undefined, 'every third day'),
      item(m, 5, 'Amla', 1, 'piece', [30, 0, 7, 0, 2]),
      item(m, 6, 'Honey 5g, Schezwan 5g, Ketchup 5g', 1, 'serving', [31, 0, 7, 0, 0]),
    ]),
    meal(6, '15:00', 'Raw Veg & Green Tea', 'leaf', (m) => [
      item(m, 1, 'Tomato', 1, 'piece', [22, 1, 5, 0, 2]),
      item(m, 2, 'Cucumber', 1, 'piece', [16, 1, 4, 0, 1]),
      item(m, 3, 'Green Tea', 1, 'cup', [2, 0, 0, 0, 0]),
    ]),
    meal(7, '16:30', 'Banana Milk Oats', 'sun', (m) => [
      item(m, 1, 'Rolled Oats', 50, 'g', [204, 6, 34, 5, 5], { per: '100g', values: [407, 12, 68.5, 9.5, 10] }),
      item(m, 2, 'Protein Powder (1 scoop)', 36, 'g', [138, 25, 4, 2, 0], PROTEIN),
      item(m, 3, 'Toned Milk', 300, 'ml', [174, 9, 14, 9, 0], MILK),
      item(m, 4, 'Banana', 1, 'piece', [90, 1, 23, 0, 3], BANANA),
      item(m, 5, 'Cinnamon, Salt', 1, 'serving', [10, 0, 0, 0, 0]),
    ]),
    meal(8, '20:00', 'Moong Dal Khichdi + Isabgol', 'moon', (m) => [
      item(m, 1, 'Moong Dal (raw)', 80, 'g', [276, 19, 48, 1, 13], { per: '100g', values: [345, 23.75, 60, 1.25, 16] }),
      item(m, 2, 'Rice (raw)', 30, 'g', [108, 2, 24, 0, 1], { per: '100g', values: [360, 6.7, 80, 0, 1] }),
      item(m, 3, 'Spices', 1, 'serving', [5, 0, 0, 0, 0]),
      item(m, 4, 'Isabgol in 300ml water', 5, 'g', [18, 0, 4, 0, 4]),
    ]),
  ];
}

export function buildSeedPlan(now: number): Plan {
  return { id: 'active', title: 'Bulking Plan', meals: buildSeedMeals(), updatedAt: now };
}

export function buildSeedSettings(now: number): Settings {
  return {
    id: 'settings',
    targets: { kcal: 2363, proteinMin: 140, fatMin: 45, fibreMin: 45 },
    footerItems: [
      { icon: 'droplet', text: '4 Litres Water Daily' },
      { icon: 'leaf', text: '100% Pure Vegetarian' },
      { icon: 'coffee', text: 'Caffeine before 12 PM only' },
    ],
    seededAt: now,
    schemaVersion: SCHEMA_VERSION,
  };
}
