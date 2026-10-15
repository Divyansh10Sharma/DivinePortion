import { Trash2 } from 'lucide-react';
import { fmt, fmtAmount, NUTRIENT_KEYS, type NutrientKey } from '../../lib/nutrition';
import { setLibraryItemGrams } from '../../lib/library';
import { macroText } from '../../lib/format';
import { setItemValue } from '../../lib/planEdit';
import type { Item } from '../../lib/types';
import { omitKey } from '../../lib/objects';
import { BottomSheet } from '../sheets/BottomSheet';
import { NumberInput } from '../inputs/NumberInput';
import { TextInput } from '../inputs/TextInput';
import { Field } from './Field';

const LABEL: Record<NutrientKey, string> = { kcal: 'kcal', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', fibre: 'Fibre' };

/**
 * Item in a meal (v2 redesign). Items picked from "Your items" are edited by grams only — their
 * per-100 g values live in Your items. Older custom items (pieces, sachets, servings) keep their
 * name / amount / unit / values fields. No item photos (owner request). Changes save immediately.
 */
export function ItemEditorSheet({
  item,
  onChange,
  onDelete,
  onClose,
}: {
  item: Item | undefined;
  /** Receives an updater, applied to the freshly stored item inside the save transaction. */
  onChange: (update: (item: Item) => Item) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet
      open={!!item}
      onClose={onClose}
      label={item ? `Edit ${item.name}` : 'Edit item'}
      header={
        <div className="flex items-center justify-between gap-3 px-4 pb-2">
          <h2 className="min-w-0 truncate font-serif text-[21px] font-semibold text-espresso">{item?.name ?? 'Item'}</h2>
          <button onClick={onClose} className="shrink-0 rounded-full bg-forest px-4 py-1.5 text-[13.5px] font-semibold text-cream">
            Done
          </button>
        </div>
      }
    >
      {item && (item.libraryId ? <LibraryItemForm item={item} onChange={onChange} /> : <CustomItemForm item={item} onChange={onChange} />)}
      {item && (
        <div className="pt-3">
          <Field label="Note (optional)" hint='Shown in small italic on the card, e.g. "every third day".'>
            <TextInput value={item.note ?? ''} onCommit={(note) => onChange((i) => (note ? { ...i, note } : omitKey(i, 'note')))} />
          </Field>
          <button
            onClick={onDelete}
            className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-full border border-terracotta/50 py-2.5 text-[14px] font-semibold text-terracotta"
          >
            <Trash2 size={16} aria-hidden /> Remove from meal
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

/** Picked from Your items: grams only; values follow the per-100 g values. */
function LibraryItemForm({ item, onChange }: { item: Item; onChange: (update: (item: Item) => Item) => void }) {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-end gap-2">
        <Field label="Grams">
          <NumberInput
            value={item.amount}
            onCommit={(v) => v !== undefined && v >= 0 && onChange((i) => setLibraryItemGrams(i, v))}
            className="w-[110px] text-right"
          />
        </Field>
        <span className="mb-2.5 text-[14px] text-warm-grey">g</span>
      </div>
      <div className="rounded-2xl bg-sage px-4 py-3">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-olive uppercase">For {fmtAmount(item.amount)} g</p>
        <p className="mt-1 text-[15px] font-semibold text-espresso tabular">{macroText(item)}</p>
        {item.base && <p className="mt-1 text-[12px] text-warm-grey tabular">Per 100 g: {macroText(item.base)}</p>}
      </div>
      <p className="text-[12px] leading-snug text-warm-grey">
        From Your items — change its name or per-100 g macros in the Items tab.
        {item.valuesSource === 'manual' && ' (Values are as originally entered until you change the grams.)'}
      </p>
    </div>
  );
}

/** Older custom item (not from Your items): editable name, amount, unit and the five values. */
function CustomItemForm({ item, onChange }: { item: Item; onChange: (update: (item: Item) => Item) => void }) {
  return (
    <div className="space-y-3 pt-1">
      <Field label="Name">
        <TextInput value={item.name} onCommit={(name) => onChange((i) => ({ ...i, name }))} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount">
          <NumberInput value={item.amount} onCommit={(v) => v !== undefined && onChange((i) => ({ ...i, amount: v }))} className="w-full" />
        </Field>
        <Field label="Unit">
          <TextInput value={item.unit} onCommit={(unit) => onChange((i) => ({ ...i, unit }))} />
        </Field>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {NUTRIENT_KEYS.map((k) => (
          <label key={k} className="block text-center">
            <span className="mb-1 block text-[10px] font-semibold text-warm-grey">{LABEL[k]}</span>
            <NumberInput
              aria-label={LABEL[k]}
              value={Math.round(item[k] * 100) / 100}
              onCommit={(v) => v !== undefined && onChange((i) => setItemValue(i, k, v))}
              className="w-full px-0.5 text-center"
            />
          </label>
        ))}
      </div>
      <p className="text-[12px] leading-snug text-warm-grey">
        A custom item ({fmt(item.kcal)} kcal for {fmtAmount(item.amount)} {item.unit}). Values are fixed as typed. To scale by grams, add the food to
        Your items and pick it instead.
      </p>
    </div>
  );
}
