import { updatePlan } from '../db/plan';
import type { Plan } from '../lib/types';

/** Saves a pure plan edit (fire-and-forget; the UI updates through useLiveQuery). */
export function savePlan(edit: (plan: Plan) => Plan): void {
  void updatePlan(edit);
}
