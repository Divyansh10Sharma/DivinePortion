// Plan persistence. v2 redesign: no daily logging any more, so a plan edit is a plain write.

import type { Plan } from '../lib/types';
import { db, type PlateDB } from './db';

/** Applies a pure edit to the active plan inside one transaction (edits read fresh data). */
export async function updatePlan(edit: (plan: Plan) => Plan, database: PlateDB = db, now = Date.now()): Promise<void> {
  await database.transaction('rw', database.plan, async () => {
    const plan = await database.plan.get('active');
    if (!plan) throw new Error('No active plan');
    await database.plan.put({ ...edit(plan), id: 'active', updatedAt: now });
  });
}
