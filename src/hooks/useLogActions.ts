import { useMemo } from 'react';
import { updateDayLog } from '../db/dayLogs';
import {
  addExtraItem,
  addFreeSlotEntry,
  makeLoggedItem,
  markMealEaten,
  markMealNotEaten,
  removeExtraItem,
  removeFreeSlotEntry,
  setItemAmount,
  setItemEaten,
} from '../lib/dayLog';
import { newId } from '../lib/ids';
import type { QuickItemValues } from '../components/inputs/QuickItemForm';

export interface LogActions {
  markEaten(mealId: string): void;
  markNotEaten(mealId: string): void;
  setItemEaten(mealId: string, itemId: string, eaten: boolean): void;
  setItemAmount(mealId: string, itemId: string, amount: number | undefined): void;
  addExtra(mealId: string, values: QuickItemValues): void;
  removeExtra(mealId: string, itemId: string): void;
  addEntry(mealId: string, values: QuickItemValues): void;
  removeEntry(mealId: string, entryId: string): void;
}

/** Binds the pure dayLog.ts mutations to the stored log for `date`. */
export function useLogActions(date: string): LogActions {
  return useMemo(() => {
    const run = (fn: Parameters<typeof updateDayLog>[1]) => void updateDayLog(date, fn);
    return {
      markEaten: (m) => run((log) => markMealEaten(log, m)),
      markNotEaten: (m) => run((log) => markMealNotEaten(log, m)),
      setItemEaten: (m, i, e) => run((log) => setItemEaten(log, m, i, e)),
      setItemAmount: (m, i, a) => run((log) => setItemAmount(log, m, i, a)),
      addExtra: (m, v) => run((log) => addExtraItem(log, m, makeLoggedItem(newId(), v))),
      removeExtra: (m, i) => run((log) => removeExtraItem(log, m, i)),
      addEntry: (m, v) => run((log) => addFreeSlotEntry(log, m, makeLoggedItem(newId(), v))),
      removeEntry: (m, e) => run((log) => removeFreeSlotEntry(log, m, e)),
    } satisfies LogActions;
  }, [date]);
}
