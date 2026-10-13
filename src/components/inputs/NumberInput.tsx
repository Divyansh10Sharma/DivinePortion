import { useState, type InputHTMLAttributes } from 'react';
import { fmtAmount } from '../../lib/nutrition';
import { parseDecimal } from '../../lib/format';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | undefined;
  /** Called with every valid edit (undefined = field cleared). Invalid text is kept as a draft only. */
  onCommit: (value: number | undefined) => void;
};

/**
 * Decimal input for iOS: text input + inputMode="decimal" (IOS-7 — the number type
 * behaves badly on iOS), font-size ≥ 16px via global CSS so focus never zooms.
 * Keeps a local draft while focused so "1." or "0," can be typed mid-way.
 */
export function NumberInput({ value, onCommit, className = '', onFocus, onBlur, ...rest }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === undefined ? '' : fmtAmount(value));

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      enterKeyHint="done"
      value={shown}
      className={`tabular rounded-xl border border-gold/50 bg-white/80 px-2.5 py-1.5 text-espresso outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 ${className}`}
      onFocus={(e) => {
        setDraft(shown);
        onFocus?.(e);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = parseDecimal(e.target.value);
        if (n === undefined || Number.isFinite(n)) onCommit(n);
      }}
      onBlur={(e) => {
        setDraft(null);
        onBlur?.(e);
      }}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}
