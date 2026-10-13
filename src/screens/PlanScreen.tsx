import { useCallback, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { fmt, mealPlanned, plannedMeals, plannedWithSnack } from '../lib/nutrition';
import { byOrder, insertAt, makeItem, makeMeal, moveById, removeById, updateItem, updateMeal } from '../lib/planEdit';
import { newId } from '../lib/ids';
import type { Plan } from '../lib/types';
import { savePlan } from '../hooks/planSync';
import { showUndo } from '../components/toast/toastStore';
import { scheduleOrphanCleanup } from '../db/photos';
import { MealIconNode } from '../components/icons/icons';
import { TextInput } from '../components/inputs/TextInput';
import { DragHandle, SortableList, SortableRow } from '../components/dnd/Sortable';
import { SwipeToDelete } from '../components/dnd/SwipeToDelete';
import { MealEditorSheet } from '../components/plan/MealEditorSheet';
import { ItemEditorSheet } from '../components/plan/ItemEditorSheet';

/**
 * Plan editor (PLAN-1 … PLAN-10). Every edit is saved immediately; today's log follows the plan
 * per PLAN-9 (silently, or via the prompt shown when leaving this tab).
 */
export function PlanScreen({ plan }: { plan: Plan }) {
  const [mealId, setMealId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);

  const meals = byOrder(plan.meals);
  const meal = meals.find((m) => m.id === mealId);
  const item = meal?.items.find((i) => i.id === itemId);
  const totals = { meals: plannedMeals(plan.meals), withSnack: plannedWithSnack(plan.meals) };

  const closeMeal = useCallback(() => {
    setItemId(null);
    setMealId(null);
  }, []);
  const closeItem = useCallback(() => setItemId(null), []);

  // --- meals ---------------------------------------------------------------
  function addMeal() {
    const id = `m-${newId()}`;
    const last = meals.at(-1);
    savePlan((p) => ({ ...p, meals: [...byOrder(p.meals), { ...makeMeal(id, p.meals.length), time: last?.time ?? '12:00' }] }));
    setMealId(id);
  }

  function deleteMeal(id: string) {
    // Undo data comes from what is on screen; the delete itself runs against fresh data.
    const { removed, index } = removeById(plan.meals, id);
    if (!removed) return;
    savePlan((p) => ({ ...p, meals: removeById(p.meals, id).list }));
    scheduleOrphanCleanup();
    closeMeal();
    showUndo(`“${removed.name}” deleted`, () => savePlan((p) => ({ ...p, meals: insertAt(p.meals, removed, index) })));
  }

  // --- items ---------------------------------------------------------------
  function addItem(forMealId: string) {
    const id = `${forMealId}-${newId()}`;
    savePlan((p) => updateMeal(p, forMealId, (m) => ({ ...m, items: [...byOrder(m.items), makeItem(id, m.items.length)] })));
    setItemId(id);
  }

  function deleteItem(forMealId: string, id: string) {
    const current = plan.meals.find((m) => m.id === forMealId);
    const { removed, index } = removeById(current?.items ?? [], id);
    if (!removed) return;
    savePlan((p) => updateMeal(p, forMealId, (m) => ({ ...m, items: removeById(m.items, id).list })));
    scheduleOrphanCleanup();
    if (itemId === id) setItemId(null);
    showUndo(`“${removed.name}” deleted`, () =>
      savePlan((p) => updateMeal(p, forMealId, (m) => ({ ...m, items: insertAt(m.items, removed, index) }))),
    );
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 pt-6">
      {/* PLAN-10: the title is editable; the Today header always shows the computed kcal before it. */}
      <label className="block">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-olive uppercase">Plan title</span>
        <TextInput
          value={plan.title}
          onCommit={(title) => savePlan((p) => ({ ...p, title }))}
          unstyled
          className="mt-1 w-full rounded-xl border border-transparent bg-transparent py-1 font-serif text-[28px] font-bold text-forest outline-none focus:border-gold/50 focus:bg-field focus:px-3"
        />
      </label>
      <p className="mt-1 text-[12.5px] text-warm-grey tabular">
        Shows as “{fmt(totals.withSnack.kcal)} kcal {plan.title}” · meals {fmt(totals.meals.kcal)} kcal · {fmt(totals.meals.protein)}g protein
      </p>

      <SortableList ids={meals.map((m) => m.id)} onMove={(from, to) => savePlan((p) => ({ ...p, meals: moveById(p.meals, from, to) }))}>
        <ul className="mt-5 space-y-2.5">
          {meals.map((m) => (
            <li key={m.id}>
              <SortableRow id={m.id}>
                {(handle) => (
                  <SwipeToDelete
                    label={m.name}
                    onDelete={() => deleteMeal(m.id)}
                    className="rounded-[20px] shadow-card"
                    surfaceClass={m.isFreeSlot ? 'bg-porcelain' : 'bg-sage'}
                  >
                    <div className={`flex items-center gap-2 py-2.5 pr-3 pl-2 ${m.isFreeSlot ? 'rounded-[20px] border-[1.5px] border-dashed border-olive/60' : ''}`}>
                      <DragHandle label={m.name} {...handle} />
                      <button onClick={() => setMealId(m.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <MealIconNode icon={m.icon} size={34} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-semibold text-olive tabular">{m.time}</span>
                          <span className="block truncate font-serif text-[16px] font-semibold text-espresso">{m.name}</span>
                          <span className="block text-[11.5px] text-warm-grey tabular">
                            {m.isFreeSlot
                              ? `Free slot · ~${fmt(m.freeSlotBudgetKcal ?? 0)} kcal`
                              : `${m.items.length} item${m.items.length === 1 ? '' : 's'} · ${fmt(mealPlanned(m).kcal)} kcal · ${fmt(mealPlanned(m).protein)}g P`}
                          </span>
                        </span>
                        <ChevronRight size={18} className="shrink-0 text-warm-grey" aria-hidden />
                      </button>
                    </div>
                  </SwipeToDelete>
                )}
              </SortableRow>
            </li>
          ))}
        </ul>
      </SortableList>

      <button
        onClick={addMeal}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[20px] border border-dashed border-forest/45 py-3 text-[14.5px] font-semibold text-forest"
      >
        <Plus size={17} aria-hidden /> Add meal
      </button>
      <p className="mt-3 text-center text-[11.5px] leading-relaxed text-warm-grey">
        Drag ⋮⋮ to reorder · swipe left to delete · tap to edit.
        <br />
        Changes apply from today onward; past days never change.
      </p>

      <MealEditorSheet
        meal={meal}
        onClose={closeMeal}
        onChange={(update) => meal && savePlan((p) => updateMeal(p, meal.id, update))}
        onDeleteMeal={() => meal && deleteMeal(meal.id)}
        onAddItem={() => meal && addItem(meal.id)}
        onEditItem={setItemId}
        onDeleteItem={(id) => meal && deleteItem(meal.id, id)}
      />
      <ItemEditorSheet
        item={item}
        onClose={closeItem}
        onChange={(update) => meal && item && savePlan((p) => updateMeal(p, meal.id, (m) => updateItem(m, item.id, update)))}
        onDelete={() => meal && item && deleteItem(meal.id, item.id)}
      />
    </div>
  );
}
