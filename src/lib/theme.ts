// Theme (owner request after Phase 6): dark gradient by default, original cream "light" on request.
//
// The choice lives in Settings (so it is backed up) and is mirrored to localStorage so the inline
// script in index.html can set `data-theme` and the iOS status-bar metas before the first paint
// (no light/dark flash on launch).
//
// iOS status bar: `apple-mobile-web-app-status-bar-style` is only read when the installed app
// launches, so after switching theme the status-bar text colour follows on the next launch.
//   dark  → "black-translucent" (white status-bar text over our dark, frosted top strip)
//   light → "default" (dark text on cream, as in SPEC IOS-5)

export type Theme = 'dark' | 'light';
export const DEFAULT_THEME: Theme = 'dark';
export const THEME_STORAGE_KEY = 'plate-theme';

export const THEME_COLOR: Record<Theme, string> = { dark: '#0F1A14', light: '#F6F1E7' };
const STATUS_BAR: Record<Theme, string> = { dark: 'black-translucent', light: 'default' };

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (root.dataset.theme !== theme) root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // private mode / storage blocked: the setting still lives in IndexedDB
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', STATUS_BAR[theme]);
}
