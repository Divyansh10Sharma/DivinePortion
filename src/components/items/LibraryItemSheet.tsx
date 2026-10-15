import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { NUTRIENT_KEYS, type NutrientKey } from '../../lib/nutrition';
import type { LibraryItem, Nutrition } from '../../lib/types';
import { BottomSheet } from '../sheets/BottomSheet';
import { NumberInput } from '../inputs/NumberInput';
import { TextInput } from '../inputs/TextInput';

const LABEL: Record<NutrientKey, string> = { kcal: 'Kcal', protein: 'Protein', carbs: 'Carbs', fat: 'Fats', fibre: 'Fiber' };

type Draft = { name: string } & Record<NutrientKey, number | undefined>;

function draftOf(item: LibraryItem | undefined): Draft {
  return {
    name: item?.name ?? '',
    kcal: item?.per100.kcal,
    protein: item?.per100.protein,
    carbs: item?.per100.carbs,
    fat: item?.per100.fat,
    fibre: item?.per100.fibre,
  };
}

/**
 * Add / edit a "Your items" entry: name + macros per 100 g (v2 redesign). Uses an explicit Save so
 * an edit is applied to the meals that use the item once, not on every keystroke.
 * `item` undefined + `open` = adding a new item.
 */
export function LibraryItemSheet({
  open,
  item,
  onSave,
  onDelete,
  onClose,
}: {
  open: boolean;
  item: LibraryItem | undefined;
  onSave: (fields: { name: string; per100: Nutrition }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label={item ? `Edit ${item.name}` : 'New item'}
      header={
        <div className="px-4 pb-2">
          <h2 className="font-serif text-[21px] font-semibold text-espresso">{item ? 'Edit item' : 'New item'}</h2>
          <p className="text-[12.5px] text-warm-grey">Macros per 100 g</p>
        </div>
      }
    >
      {/* keyed so the form resets for each item */}
      {open && <Form key={item?.id ?? 'new'} item={item} onSave={onSave} onDelete={onDelete} />}
    </BottomSheet>
  );
}

function Form({
  item,
  onSave,
  onDelete,
}: {
  item: LibraryItem | undefined;
  onSave: (fields: { name: string; per100: Nutrition }) => void;
  onDelete: (() => void) | undefined;
}) {
  const [d, setD] = useState<Draft>(() => draftOf(item));
  const [touched, setTouched] = useState(false);
  const nameOk = d.name.trim().length > 0;
  const kcalOk = d.kcal !== undefined;

  function save() {
    setTouched(true);
    if (!nameOk || !kcalOk) return;
    onSave({
      name: d.name.trim(),
      per100: { kcal: d.kcal ?? 0, protein: d.protein ?? 0, carbs: d.carbs ?? 0, fat: d.fat ?? 0, fibre: d.fibre ?? 0 },
    });
  }

  return (
    <div className="space-y-4 pt-1">
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-olive uppercase">Name</span>
        <TextInput value={d.name} placeholder="e.g. Greek yoghurt" onCommit={(name) => setD((x) => ({ ...x, name }))} />
      </label>

      <div className="grid grid-cols-5 gap-1.5">
        {NUTRIENT_KEYS.map((k) => (
          <label key={k} className="block text-center">
            <span className="mb-1 block text-[10.5px] font-semibold text-warm-grey">{LABEL[k]}</span>
            <NumberInput
              aria-label={`${LABEL[k]} per 100 g`}
              value={d[k]}
              placeholder={k === 'kcal' ? '*' : '0'}
              onCommit={(v) => setD((x) => ({ ...x, [k]: v }))}
              className="w-full px-0.5 text-center"
            />
          </label>
        ))}
      </div>
      <p className="-mt-2 text-[12px] text-warm-grey">Kcal is required; empty macros count as 0. All values are per 100 g.</p>

      {touched && (!nameOk || !kcalOk) && (
        <p className="text-[12.5px] text-terracotta">
          {!nameOk ? 'Add a name. ' : ''}
          {!kcalOk ? 'Enter kcal per 100 g.' : ''}
        </p>
      )}

      <button onClick={save} className="w-full rounded-full bg-forest py-2.5 text-[15px] font-semibold text-cream active:scale-[0.98]">
        {item ? 'Save changes' : 'Add item'}
      </button>
      {item && (
        <p className="text-center text-[12px] text-warm-grey">Saving updates this item in your current meals too (saved plans stay as they were).</p>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-terracotta/50 py-2.5 text-[14px] font-semibold text-terracotta"
        >
          <Trash2 size={16} aria-hidden /> Delete item
        </button>
      )}
    </div>
  );
}
