// Domain types — SPEC.md §4.1, plus the v2 redesign (owner request): an item library and saved plans.

/** Known units plus free text (e.g. "each", "cup", "serving"). */
export type KnownUnit = 'g' | 'ml' | 'piece' | 'sachet' | 'scoop' | 'pinch';
// `(string & {})` keeps editor autocomplete for the known units while still allowing free text.
export type Unit = KnownUnit | (string & {});

export type BasePer = '100g' | '100ml' | '1piece';

export interface Nutrition {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export interface Item extends Nutrition {
  id: string;
  order: number;
  name: string;
  amount: number;
  unit: Unit;
  base?: { per: BasePer } & Nutrition;
  /** PLAN-7: whether the five values were computed from `base` or typed by hand. */
  valuesSource: 'base' | 'manual';
  /** Legacy (v1): item photos are no longer shown or editable. */
  photoId?: string;
  note?: string;
  /**
   * v2: set when the item was picked from "Your items" (the library). Its `base` is the library
   * item's per-100 values and `amount` is in grams.
   */
  libraryId?: string;
}

/** v2 "Your items": a food with its macros per 100 g. */
export interface LibraryItem {
  id: string;
  name: string;
  /** kcal / protein / carbs / fat / fibre per 100 g */
  per100: Nutrition;
  createdAt: number;
  updatedAt: number;
}

/** v2 "Saved plans": a named, read-only copy of the meals. */
export interface SavedPlan {
  id: string;
  name: string;
  meals: Meal[];
  createdAt: number;
}

/** Legacy (v1): meal timeline icons are no longer shown or editable. */
export type KnownMealIcon =
  | 'sunrise'
  | 'sun'
  | 'star'
  | 'coffee'
  | 'leaf'
  | 'moon'
  | 'apple'
  | 'bowl'
  | 'cup'
  | 'sparkle';
export type MealIcon = KnownMealIcon | (string & {});

export interface Meal {
  id: string;
  order: number;
  /** "HH:MM", 24h local time */
  time: string;
  name: string;
  icon: MealIcon;
  photoId?: string;
  isFreeSlot: boolean;
  freeSlotBudgetKcal?: number;
  freeSlotHint?: string;
  /** e.g. "LAST CAFFEINE OF THE DAY" — rendered as a terracotta badge */
  badge?: string;
  note?: string;
  items: Item[];
}

export interface Plan {
  id: 'active';
  title: string;
  meals: Meal[];
  updatedAt: number;
}

export type FooterIcon = 'droplet' | 'leaf' | 'coffee' | 'clock' | (string & {});

export interface Targets {
  kcal: number;
  proteinMin: number;
  fatMin: number;
  fibreMin: number;
}

export interface Settings {
  id: 'settings';
  targets: Targets;
  footerItems: { icon: FooterIcon; text: string }[];
  lastBackupAt?: number;
  backupBannerDismissedAt?: number;
  /** Owner request after Phase 6. Missing = dark (the default). */
  theme?: 'dark' | 'light';
  seededAt: number;
  schemaVersion: number;
}

export interface ItemOverride {
  eaten: boolean;
  amount?: number;
}

export interface MealLog {
  status: 'none' | 'partial' | 'eaten';
  itemOverrides: Record<string, ItemOverride>;
}

export interface DayLog {
  /** "YYYY-MM-DD", local time — primary key */
  date: string;
  /** Deep copy of the plan that day; immutable once the day has passed. */
  mealsSnapshot: Meal[];
  /** mealId → log */
  eaten: Record<string, MealLog>;
  /** mealId → today-only extra items */
  extraItems: Record<string, Item[]>;
  /** free-slot mealId → entries */
  freeSlotEntries: Record<string, Item[]>;
  /** So history shows the targets that applied that day. */
  targetsSnapshot: Targets;
  createdAt: number;
  updatedAt: number;
}

export interface Photo {
  id: string;
  data: ArrayBuffer;
  mimeType: string;
  width: number;
  height: number;
  thumbDataUrl: string;
  createdAt: number;
}
