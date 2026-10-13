import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { fmt, fmtAmount, sumItems } from '../../lib/nutrition';
import { byOrder, isValidTime, moveById, setFreeSlot } from '../../lib/planEdit';
import type { Meal } from '../../lib/types';
import { omitKey } from '../../lib/objects';
import { BottomSheet } from '../sheets/BottomSheet';
import { NumberInput } from '../inputs/NumberInput';
import { TextInput } from '../inputs/TextInput';
import { DragHandle, SortableList, SortableRow } from '../dnd/Sortable';
import { SwipeToDelete } from '../dnd/SwipeToDelete';
import { Field, SectionTitle, Toggle } from './Field';
import { IconPicker } from './IconPicker';
import { PhotoPicker } from '../photos/PhotoPicker';
import { ItemThumb } from '../photos/ItemThumb';

/**
 * Meal editor (PLAN-2, PLAN-4, PLAN-5). Changes save immediately through `onChange`.
 * Items: drag the grip to reorder, swipe left to delete (Undo toast), tap to edit.
 */
export function MealEditorSheet({
  meal,
  onChange,
  onDeleteMeal,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onClose,
}: {
  meal: Meal | undefined;
  /** Receives an updater, applied to the freshly stored meal inside the save transaction. */
  onChange: (update: (meal: Meal) => Meal) => void;
  onDeleteMeal: () => void;
  onAddItem: () => void;
  onEditItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet
      open={!!meal}
      onClose={onClose}
      label={meal ? `Edit ${meal.name}` : 'Edit meal'}
      header={
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="font-serif text-[21px] font-semibold text-espresso">Edit meal</h2>
          <button onClick={onClose} className="rounded-full bg-forest px-4 py-1.5 text-[13.5px] font-semibold text-cream">
            Done
          </button>
        </div>
      }
    >
      {meal && (
        <MealForm
          meal={meal}
          onChange={onChange}
          onDeleteMeal={onDeleteMeal}
          onAddItem={onAddItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
        />
      )}
    </BottomSheet>
  );
}

function MealForm({
  meal,
  onChange,
  onDeleteMeal,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: {
  meal: Meal;
  onChange: (update: (meal: Meal) => Meal) => void;
  onDeleteMeal: () => void;
  onAddItem: () => void;
  onEditItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
}) {
  const items = byOrder(meal.items);
  const subtotal = sumItems(meal.items);

  return (
    <div className="space-y-3.5 pt-1">
      <div>
        <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-olive uppercase">Photo</span>
        <PhotoPicker
          photoId={meal.photoId}
          label="meal photo"
          onChange={(photoId) => onChange((m) => (photoId ? { ...m, photoId } : omitKey(m, 'photoId')))}
        />
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Name">
          <TextInput value={meal.name} onCommit={(name) => onChange((m) => ({ ...m, name }))} />
        </Field>
        <Field label="Time">
          {/* type=time gives the iOS wheel and always yields "HH:MM" (24h) */}
          <TextInput
            type="time"
            value={meal.time}
            onCommit={(time) => isValidTime(time) && onChange((m) => ({ ...m, time }))}
            className="w-[118px] tabular"
          />
        </Field>
      </div>

      <Field label="Timeline icon">
        <IconPicker value={meal.icon} onChange={(icon) => onChange((m) => ({ ...m, icon }))} />
      </Field>

      <Field label="Badge (optional)" hint="Small terracotta badge on the card, e.g. LAST CAFFEINE OF THE DAY.">
        <TextInput
          value={meal.badge ?? ''}
          placeholder="e.g. LAST CAFFEINE OF THE DAY"
          onCommit={(badge) => onChange((m) => (badge ? { ...m, badge } : omitKey(m, 'badge')))}
        />
      </Field>
      <Field label="Note (optional)">
        <TextInput value={meal.note ?? ''} onCommit={(note) => onChange((m) => (note ? { ...m, note } : omitKey(m, 'note')))} />
      </Field>

      <div className="rounded-2xl border border-dashed border-olive/50 bg-field px-3.5 py-2.5">
        <Toggle label="Free slot" checked={meal.isFreeSlot} onChange={(v) => onChange((m) => setFreeSlot(m, v))} />
        {meal.isFreeSlot && (
          <div className="mt-2.5 space-y-3 pb-1">
            <Field label="Budget (kcal)">
              <NumberInput
                value={meal.freeSlotBudgetKcal}
                onCommit={(v) => v !== undefined && onChange((m) => ({ ...m, freeSlotBudgetKcal: v }))}
                className="w-full"
              />
            </Field>
            <Field label="Hint">
              <TextInput
                value={meal.freeSlotHint ?? ''}
                onCommit={(hint) => onChange((m) => (hint ? { ...m, freeSlotHint: hint } : omitKey(m, 'freeSlotHint')))}
              />
            </Field>
          </div>
        )}
      </div>

      {meal.isFreeSlot ? (
        items.length > 0 && (
          <p className="text-[12.5px] text-warm-grey">
            This meal's {items.length} item{items.length === 1 ? ' is' : 's are'} kept but hidden while it is a free slot.
          </p>
        )
      ) : (
        <>
          <div className="flex items-end justify-between">
            <SectionTitle>Items</SectionTitle>
            <span className="mb-2 text-[12px] text-warm-grey tabular">
              {fmt(subtotal.kcal)} kcal · {fmt(subtotal.protein)}g P
            </span>
          </div>
          <SortableList ids={items.map((i) => i.id)} onMove={(from, to) => onChange((m) => ({ ...m, items: moveById(m.items, from, to) }))}>
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li key={item.id}>
                  <SortableRow id={item.id}>
                    {(handle) => (
                      <SwipeToDelete label={item.name} onDelete={() => onDeleteItem(item.id)} className="rounded-2xl" surfaceClass="bg-sage">
                        <div className="flex items-center gap-1 py-1.5 pr-2 pl-2">
                          <DragHandle label={item.name} {...handle} />
                          <button onClick={() => onEditItem(item.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                            <ItemThumb photoId={item.photoId} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] text-espresso">{item.name}</span>
                              <span className="block text-[11px] text-warm-grey tabular">
                                {fmtAmount(item.amount)} {item.unit} · {fmt(item.kcal)} kcal · {fmt(item.protein)}g P
                                {item.base && (item.valuesSource === 'base' ? ' · auto' : ' · manual')}
                              </span>
                            </span>
                            <ChevronRight size={16} className="shrink-0 text-warm-grey" aria-hidden />
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
            onClick={onAddItem}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-forest/40 py-2.5 text-[14px] font-semibold text-forest"
          >
            <Plus size={16} aria-hidden /> Add item
          </button>
          {items.length > 1 && <p className="text-center text-[11.5px] text-warm-grey">Drag ⋮⋮ to reorder · swipe left to delete</p>}
        </>
      )}

      <button
        onClick={onDeleteMeal}
        className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-full border border-terracotta/50 py-2.5 text-[14px] font-semibold text-terracotta"
      >
        <Trash2 size={16} aria-hidden /> Delete meal
      </button>
    </div>
  );
}

