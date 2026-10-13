import { useState, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onCommit: (value: string) => void;
  /** Skip the default field styling (for inline-editable headings). */
  unstyled?: boolean;
};

export const fieldClass =
  'w-full rounded-xl border border-gold/50 bg-field px-3 py-2 text-espresso outline-none placeholder:text-warm-grey/70 focus:border-forest focus:ring-2 focus:ring-forest/15';

/**
 * Text field bound to stored data. Each keystroke is committed (saved to IndexedDB), but the field
 * shows its own draft while focused: the stored value comes back asynchronously via useLiveQuery,
 * and feeding that lagging value into a controlled input would drop characters / jump the caret.
 * Font-size ≥ 16px comes from global CSS (IOS-7).
 */
export function TextInput({ value, onCommit, className = '', unstyled = false, onFocus, onBlur, ...rest }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      {...rest}
      value={draft ?? value}
      className={unstyled ? className : `${fieldClass} ${className}`}
      onFocus={(e) => {
        setDraft(value);
        onFocus?.(e);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        onCommit(e.target.value);
      }}
      onBlur={(e) => {
        setDraft(null);
        onBlur?.(e);
      }}
    />
  );
}
