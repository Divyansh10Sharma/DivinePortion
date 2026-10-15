import { useCallback, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { fmt } from '../lib/nutrition';
import { sortLibrary } from '../lib/library';
import type { LibraryItem } from '../lib/types';
import { addLibraryItem, deleteLibraryItem, restoreLibraryItem, updateLibraryItem } from '../db/library';
import { showToast, showUndo } from '../components/toast/toastStore';
import { LibraryItemSheet } from '../components/items/LibraryItemSheet';

const COLS = ['Kcal', 'Protein', 'Carbs', 'Fats', 'Fiber'] as const;

/** "Your items" (v2 redesign): every food with its macros per 100 g, one row each. */
export function ItemsScreen({ items }: { items: LibraryItem[] }) {
  const [editing, setEditing] = useState<LibraryItem | 'new' | null>(null);
  const [query, setQuery] = useState('');
  const close = useCallback(() => setEditing(null), []);

  const q = query.trim().toLowerCase();
  const rows = sortLibrary(items).filter((i) => !q || i.name.toLowerCase().includes(q));
  const current = editing && editing !== 'new' ? items.find((i) => i.id === editing.id) : undefined;

  return (
    <div className="mx-auto max-w-[480px] px-4 pt-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-[28px] font-bold text-forest">Your items</h1>
          <p className="text-[12.5px] text-warm-grey">Macros per 100 g · {items.length} item{items.length === 1 ? '' : 's'}</p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="mb-1 flex items-center gap-1 rounded-full bg-forest px-3.5 py-2 text-[13.5px] font-semibold text-cream active:scale-[0.97]"
        >
          <Plus size={16} aria-hidden /> Add
        </button>
      </div>

      {items.length > 6 && (
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-gold/50 bg-field px-3">
          <Search size={16} className="shrink-0 text-warm-grey" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items"
            aria-label="Search items"
            className="w-full bg-transparent py-2 text-espresso outline-none placeholder:text-warm-grey/70"
          />
        </label>
      )}

      <section className="mt-4 overflow-hidden rounded-[20px] bg-porcelain shadow-card" aria-label="Your items">
        {/* Header row: Name Kcal Protein Carbs Fats Fiber */}
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(5,44px)] gap-x-1 border-b border-gold/40 px-3 py-2 text-[10.5px] font-semibold text-olive">
          <span>Name</span>
          {COLS.map((c) => (
            <span key={c} className="text-right">
              {c}
            </span>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13.5px] text-warm-grey">
            {items.length === 0 ? 'No items yet — tap Add to create your first one.' : 'No items match your search.'}
          </p>
        ) : (
          <ul>
            {rows.map((i) => (
              <li key={i.id} className="border-b border-gold/20 last:border-b-0">
                <button
                  onClick={() => setEditing(i)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_repeat(5,44px)] items-center gap-x-1 px-3 py-2.5 text-left text-[13px] active:bg-sage"
                >
                  <span className="leading-snug font-medium break-words text-espresso">{i.name}</span>
                  {[i.per100.kcal, i.per100.protein, i.per100.carbs, i.per100.fat, i.per100.fibre].map((v, k) => (
                    <span key={k} className={`text-right tabular ${k === 0 ? 'font-semibold text-forest' : 'text-warm-grey'}`}>
                      {fmtCell(v)}
                    </span>
                  ))}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="mt-3 text-center text-[11.5px] text-warm-grey">Tap an item to edit it. Pick items into meals from the Meals tab.</p>

      <LibraryItemSheet
        open={editing !== null}
        item={current}
        onClose={close}
        onSave={(fields) => {
          if (current) {
            void updateLibraryItem(current.id, fields).then(() => showToast({ message: `“${fields.name}” saved` }));
          } else {
            void addLibraryItem(fields).then(() => showToast({ message: `“${fields.name}” added` }));
          }
          close();
        }}
        onDelete={
          current
            ? () => {
                const victim = current;
                close();
                void deleteLibraryItem(victim.id).then((removed) => {
                  if (removed) showUndo(`“${removed.name}” deleted`, () => void restoreLibraryItem(removed));
                });
              }
            : undefined
        }
      />
    </div>
  );
}

/** Up to one decimal, no trailing ".0" (e.g. 4.7, 58, 6.8). */
function fmtCell(n: number): string {
  return Math.abs(n - Math.round(n)) < 0.05 ? fmt(n) : (Math.round(n * 10) / 10).toFixed(1);
}
