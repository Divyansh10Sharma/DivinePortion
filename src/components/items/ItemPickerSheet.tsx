import { useState } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import { fmt } from '../../lib/nutrition';
import { sortLibrary, valuesForGrams } from '../../lib/library';
import { macroText } from '../../lib/format';
import type { LibraryItem } from '../../lib/types';
import { BottomSheet } from '../sheets/BottomSheet';
import { NumberInput } from '../inputs/NumberInput';

/**
 * Pick items from "Your items" into a meal by grams (v2 redesign). Tap an item → enter grams →
 * Add. The sheet stays open so several items can be added in a row; "New item" creates one in the
 * library first.
 */
export function ItemPickerSheet({
  open,
  mealName,
  library,
  onPick,
  onCreateNew,
  onClose,
}: {
  open: boolean;
  mealName: string;
  library: LibraryItem[];
  onPick: (item: LibraryItem, grams: number) => void;
  onCreateNew: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label={`Add items to ${mealName}`}
      header={
        <div className="flex items-center justify-between gap-3 px-4 pb-2">
          <div className="min-w-0">
            <h2 className="font-serif text-[21px] font-semibold text-espresso">Add items</h2>
            <p className="truncate text-[12.5px] text-warm-grey">to {mealName}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-forest px-4 py-1.5 text-[13.5px] font-semibold text-cream">
            Done
          </button>
        </div>
      }
    >
      {open && <Picker library={library} onPick={onPick} onCreateNew={onCreateNew} />}
    </BottomSheet>
  );
}

function Picker({
  library,
  onPick,
  onCreateNew,
}: {
  library: LibraryItem[];
  onPick: (item: LibraryItem, grams: number) => void;
  onCreateNew: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [grams, setGrams] = useState<number | undefined>(100);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const rows = sortLibrary(library).filter((i) => !q || i.name.toLowerCase().includes(q));

  function add(item: LibraryItem) {
    if (grams === undefined || grams <= 0) return;
    onPick(item, grams);
    setJustAdded(item.id);
    setSelectedId(null);
    setGrams(100);
  }

  return (
    <div className="space-y-3 pt-1">
      <label className="flex items-center gap-2 rounded-xl border border-gold/50 bg-field px-3">
        <Search size={16} className="shrink-0 text-warm-grey" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your items"
          aria-label="Search your items"
          className="w-full bg-transparent py-2 text-espresso outline-none placeholder:text-warm-grey/70"
        />
      </label>

      <button
        onClick={onCreateNew}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-forest/45 py-2.5 text-[14px] font-semibold text-forest"
      >
        <Plus size={16} aria-hidden /> New item in Your items
      </button>

      {rows.length === 0 ? (
        <p className="py-4 text-center text-[13.5px] text-warm-grey">
          {library.length === 0 ? 'Your items is empty — create one above.' : 'No items match your search.'}
        </p>
      ) : (
        <ul className="divide-y divide-gold/25">
          {rows.map((i) => {
            const selected = i.id === selectedId;
            const preview = grams !== undefined && grams > 0 ? valuesForGrams(i.per100, grams) : undefined;
            return (
              <li key={i.id} className="py-2">
                <button
                  onClick={() => {
                    setSelectedId(selected ? null : i.id);
                    setGrams(100);
                  }}
                  aria-expanded={selected}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-medium text-espresso">{i.name}</span>
                    <span className="block text-[11px] text-warm-grey tabular">per 100 g · {macroText(i.per100)}</span>
                  </span>
                  {justAdded === i.id && !selected && (
                    <span className="flex items-center gap-0.5 text-[12px] font-semibold text-forest">
                      <Check size={14} aria-hidden /> added
                    </span>
                  )}
                </button>
                {selected && (
                  <div className="mt-2 flex items-center gap-2 rounded-2xl bg-sage p-2.5">
                    <NumberInput
                      aria-label={`Grams of ${i.name}`}
                      value={grams}
                      onCommit={setGrams}
                      className="w-[84px] text-right"
                      autoFocus
                    />
                    <span className="text-[13px] text-warm-grey">g</span>
                    <span className="min-w-0 flex-1 truncate text-right text-[11.5px] text-forest tabular">
                      {preview ? `${fmt(preview.kcal)} kcal · ${fmt(preview.protein)}g P` : ''}
                    </span>
                    <button
                      onClick={() => add(i)}
                      disabled={grams === undefined || grams <= 0}
                      className="rounded-full bg-forest px-4 py-2 text-[13.5px] font-semibold text-cream disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
