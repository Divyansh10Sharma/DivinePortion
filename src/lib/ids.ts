/**
 * Random id. crypto.randomUUID only exists in secure contexts, and the LAN dev URL
 * (`npm run dev -- --host`, plain http) on the iPhone is not one — so fall back to getRandomValues.
 */
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
