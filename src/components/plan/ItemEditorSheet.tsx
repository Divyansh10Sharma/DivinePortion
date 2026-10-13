import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react';
import { fmt, NUTRIENT_KEYS, isBaseCompatible, type NutrientKey } from '../../lib/nutrition';
import {
  baseFromCurrentValues,
  canScale,
  KNOWN_UNITS,
  recalcFromBase,
  setBaseValue,
  setItemAmount,
  setItemBase,
  setItemUnit,
  setItemValue,
} from '../../lib/planEdit';
import type { BasePer, Item } from '../../lib/types';
import { omitKey } from '../../lib/objects';
import { BottomSheet } from '../sheets/BottomSheet';
import { NumberInput } from '../inputs/NumberInput';
import { TextInput } from '../inputs/TextInput';
import { Field, SectionTitle } from './Field';

const LABEL: Record<NutrientKey, string> = { kcal: 'kcal', protein: 'Protein g', carbs: 'Carbs g', fat: 'Fat g', fibre: 'Fibre g' };
const PERS: { per: BasePer; label: string }[] = [
  { per: '100g', label: 'per 100 g' },
  { per: '100ml', label: 'per 100 ml' },
  { per: '1piece', label: 'per piece' },
];
const BASE_UNIT: Record<BasePer, string> = { '100g': 'g', '100ml': 'ml', '1piece': 'piece' };

/**
 * Item editor (PLAN-5, PLAN-6, PLAN-7). Every change is saved immediately via `onChange`
 * (the pure helpers in planEdit.ts implement the smart-scaling rules).
 * Photo upload arrives in Phase 4.
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
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="font-serif text-[21px] font-semibold text-espresso">Edit item</h2>
          <button onClick={onClose} aria-label="Done" className="rounded-full bg-forest px-4 py-1.5 text-[13.5px] font-semibold text-cream">
            Done
          </button>
        </div>
      }
    >
      {item && <ItemForm item={item} onChange={onChange} onDelete={onDelete} />}
    </BottomSheet>
  );
}

function ItemForm({ item, onChange, onDelete }: { item: Item; onChange: (update: (item: Item) => Item) => void; onDelete: () => void }) {
  const base = item.base;
  const compatible = base ? isBaseCompatible(base.per, item.unit) : false;
  const scalable = canScale(item);

  return (
    <div className="space-y-3.5 pt-1">
      <Field label="Name">
        <TextInput value={item.name} onCommit={(name) => onChange((i) => ({ ...i, name }))} />
      </Field>

      <div className="grid grid-cols-[1fr_1.2fr] gap-3">
        <Field label="Amount">
          <NumberInput
            value={item.amount}
            onCommit={(v) => v !== undefined && onChange((i) => setItemAmount(i, v))}
            className="w-full"
          />
        </Field>
        <Field label="Unit">
          <TextInput value={item.unit} list="plate-known-units" onCommit={(u) => onChange((i) => setItemUnit(i, u))} />
          <datalist id="plate-known-units">
            {KNOWN_UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field label="Note (optional)" hint='Shown inline in small italic, e.g. "every third day".'>
        <TextInput value={item.note ?? ''} onCommit={(note) => onChange((i) => (note ? { ...i, note } : omitKey(i, 'note')))} />
      </Field>

      {/* Values */}
      <div className="flex items-end justify-between">
        <SectionTitle>Nutrition</SectionTitle>
        <span
          className={`mb-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            item.valuesSource === 'base' ? 'bg-forest/10 text-forest' : 'bg-warm-grey/15 text-warm-grey'
          }`}
        >
          {item.valuesSource === 'base' ? 'Auto from base' : 'Manual'}
        </span>
      </div>
      <p className="-mt-2 text-[12px] leading-snug text-warm-grey">
        For {fmtAmountUnit(item)}.{' '}
        {scalable
          ? 'Changing the amount recalculates these from the base; typing a value makes them manual.'
          : 'Typed values are used as-is.'}
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {NUTRIENT_KEYS.map((k) => (
          <label key={k} className="block text-center">
            <span className="mb-1 block text-[10px] font-semibold text-warm-grey">{LABEL[k].replace(' g', '')}</span>
            <NumberInput
              aria-label={LABEL[k]}
              value={round2(item[k])}
              onCommit={(v) => v !== undefined && onChange((i) => setItemValue(i, k, v))}
              className="w-full px-0.5 text-center"
            />
          </label>
        ))}
      </div>
      {scalable && item.valuesSource === 'manual' && (
        <button
          onClick={() => onChange(recalcFromBase)}
          className="flex items-center gap-1.5 rounded-full border border-forest/50 px-3.5 py-1.5 text-[13px] font-semibold text-forest"
        >
          <RotateCcw size={14} aria-hidden /> Recalculate from base
        </button>
      )}

      {/* Base (PLAN-7) */}
      <SectionTitle>Base for scaling</SectionTitle>
      {!base ? (
        <div className="rounded-2xl border border-dashed border-olive/50 p-3.5 text-[13px] text-warm-grey">
          <p>No base — values are fixed as typed. Add one to scale automatically when the amount changes.</p>
          <button
            onClick={() => onChange((i) => setItemBase(i, baseFromCurrentValues(i)))}
            className="mt-2.5 rounded-full bg-forest px-3.5 py-1.5 text-[13px] font-semibold text-cream"
          >
            Add base
          </button>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl bg-sage p-3.5">
          <div role="radiogroup" aria-label="Base per" className="grid grid-cols-3 gap-1 rounded-full bg-white/70 p-1">
            {PERS.map(({ per, label }) => (
              <button
                key={per}
                role="radio"
                aria-checked={base.per === per}
                onClick={() => onChange((i) => (i.base ? setItemBase(i, { ...i.base, per }) : i))}
                className={`rounded-full py-1.5 text-[12.5px] font-semibold ${base.per === per ? 'bg-forest text-cream' : 'text-forest'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {NUTRIENT_KEYS.map((k) => (
              <label key={k} className="block text-center">
                <span className="mb-1 block text-[10px] font-semibold text-warm-grey">{LABEL[k].replace(' g', '')}</span>
                <NumberInput
                  aria-label={`Base ${LABEL[k]}`}
                  value={base[k]}
                  onCommit={(v) => v !== undefined && onChange((i) => (i.base ? setItemBase(i, setBaseValue(i.base, k, v)) : i))}
                  className="w-full px-0.5 text-center"
                />
              </label>
            ))}
          </div>
          {!compatible && (
            <p className="flex items-start gap-1.5 text-[12.5px] leading-snug text-terracotta">
              <AlertTriangle size={15} className="mt-px shrink-0" aria-hidden />
              This base is {PERS.find((p) => p.per === base.per)!.label} but the unit is “{item.unit}”. Values won't scale — set
              the unit to “{BASE_UNIT[base.per]}” to use it.
            </p>
          )}
          <button
            onClick={() => onChange((i) => setItemBase(i, undefined))}
            className="flex items-center gap-1 text-[13px] font-semibold text-terracotta"
          >
            <X size={15} aria-hidden /> Remove base
          </button>
        </div>
      )}

      <button
        onClick={onDelete}
        className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-full border border-terracotta/50 py-2.5 text-[14px] font-semibold text-terracotta"
      >
        <Trash2 size={16} aria-hidden /> Delete item
      </button>
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmtAmountUnit(item: Item): string {
  return `${round2(item.amount)} ${item.unit} · ${fmt(item.kcal)} kcal`;
}

