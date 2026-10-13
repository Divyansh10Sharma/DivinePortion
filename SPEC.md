# SPEC.md — "Plate": Personal Meal-Planning & Calorie-Logging PWA

> **This file is the single source of truth for this project.**
> Claude Code: read the whole file before writing any code. Re-read it in full at the **start and end of every phase** (see §0). If anything you are about to build contradicts this file, this file wins.

---

## 0. How to work on this project (instructions for Claude Code)

### 0.1 Files you must create and maintain
| File | Purpose |
|---|---|
| `SPEC.md` | This file. Never edit it unless the owner asks. |
| `CLAUDE.md` | Create in Phase 1 with the content in §0.4 so every new session re-reads this spec. |
| `PROGRESS.md` | Create in Phase 1. Phase checklist (copied from §9), status of each requirement ID, and a **Decisions** log. Update at the end of every phase. |
| `README.md` | Run / build / deploy / install instructions (Windows + iPhone). Kept current every phase. |

### 0.2 Phase gate — do this at the END of every phase, in order
1. Re-read **all of SPEC.md** top to bottom (not just the current phase).
2. Go through every requirement ID that belongs to this phase (§9) and every earlier phase. For each, confirm it is implemented and still works. Mark it in `PROGRESS.md` as ✅ done, ⚠️ partial (with reason), or ❌ missing.
3. Fix anything ❌ or ⚠️ that belongs to this phase before continuing.
4. Run and make pass: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`. Zero TypeScript errors.
5. Check you did not add anything listed in §2.7 (non-goals).
6. Report to the owner: what was built, any decisions made (also logged in `PROGRESS.md`), the exact Windows commands to run it, and how to preview it at iPhone size (§10.1).
7. **Stop and wait for the owner's go-ahead before starting the next phase.**

### 0.3 General rules
- Build only what is in this spec. No extra features (§2.7). The owner will ask for extras later.
- Never invent nutrition numbers. Seed data in §5 is to be used exactly.
- If something is ambiguous: make a sensible choice, record it under **Decisions** in `PROGRESS.md`, mention it in your phase report, and keep going. §11 already resolves many ambiguities — follow those.
- Clean, strictly typed, componentised code. Comment anything non-obvious (especially iOS workarounds and nutrition math).
- Write files directly; no placeholder stubs left behind ("TODO: implement") at the end of a phase unless the item belongs to a later phase.
- The owner develops on **Windows** (PowerShell). All commands you give must work there. Use cross-platform npm scripts (no `rm -rf`, no `&&`-dependent bash-isms in scripts; use `rimraf`/`cross-env` if needed).

### 0.4 Content for `CLAUDE.md` (create in Phase 1)
```md
# CLAUDE.md
This project is fully specified in SPEC.md. Before doing ANY work in a session:
1. Read SPEC.md in full.
2. Read PROGRESS.md to see the current phase, what is done, and past decisions.
Follow the phase gate in SPEC.md §0.2 at the end of every phase, then stop and wait for approval.
Never add features not in SPEC.md. Never change seed nutrition numbers.
Owner is on Windows (PowerShell) and tests on an iPhone 13 Pro (iOS Safari, installed PWA).
```

---

## 1. Environment & tech stack

### 1.1 Owner's setup
- **Phone:** iPhone 13 Pro — 390×844 CSS viewport, notch, iOS Safari. App is installed via Safari → Share → "Add to Home Screen" and must run **standalone, full-screen, no browser chrome**.
- **Computer:** HP laptop, Windows. **No Mac** → no native Swift/Xcode.
- Owner is a software engineer, comfortable with terminal, Node, Git.

### 1.2 Stack (fixed)
| Concern | Choice |
|---|---|
| Build | Vite + React + TypeScript (strict mode) |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`), theme tokens as CSS variables (§6.1) |
| Animation | Framer Motion (`motion` / `framer-motion`) |
| Storage | Dexie (IndexedDB) + `dexie-react-hooks` (`useLiveQuery`) — **all** data on device |
| PWA | `vite-plugin-pwa` (manifest + Workbox service worker) |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` (reliable touch support on iOS) with Framer Motion for visuals |
| Fonts | Self-hosted via `@fontsource/playfair-display` (or Cormorant Garamond) and `@fontsource-variable/inter` (or DM Sans) — must work offline |
| Dates | `date-fns` |
| UI state | React context or `zustand` (small) |
| Tests | Vitest (unit tests for nutrition math, day-log logic, seed totals, backup round-trip) |
| Hosting | Netlify (primary) or Vercel — free static HTTPS |

**No backend, no login, no cloud, no analytics.** Must work fully offline after first load.

### 1.3 Required npm scripts
`dev`, `build`, `preview`, `typecheck` (`tsc --noEmit`), `lint`, `test` (`vitest run`).

---

## 2. Functional requirements

Each requirement has an ID. Use these IDs in `PROGRESS.md`.

### 2.1 iOS PWA requirements (IOS)
- **IOS-1** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- **IOS-2** Safe areas: pad the app with `env(safe-area-inset-top/right/bottom/left)` — header clears the notch; bottom tab bar clears the home indicator.
- **IOS-3** `apple-touch-icon` 180×180 PNG (no transparency; cream background), plus manifest icons 192, 512, and 512 maskable. Generate PNGs from a single SVG source icon (e.g. `@vite-pwa/assets-generator` or a `sharp` script). Icon motif: white porcelain plate with a small forest-green leaf on cream.
- **IOS-4** `<meta name="apple-mobile-web-app-capable" content="yes">` and `<meta name="mobile-web-app-capable" content="yes">`; manifest `display: "standalone"`.
- **IOS-5** Status bar: `apple-mobile-web-app-status-bar-style` = `default` (dark text — readable on cream; `black-translucent` would put white text over cream). `theme-color` = `#F6F1E7`. `apple-mobile-web-app-title` = "Plate".
- **IOS-6** No rubber-band glitches: `html, body` fixed to full height with `overflow: hidden` and `overscroll-behavior: none`; each screen scrolls inside its own container with `overflow-y: auto; overscroll-behavior-y: contain`. Bottom sheets lock background scroll.
- **IOS-7** All inputs, selects and textareas have computed font-size **≥ 16px** (prevents iOS zoom-on-focus). Numeric inputs use `inputMode="decimal"`.
- **IOS-8** Disable tap highlight (`-webkit-tap-highlight-color: transparent`), disable text selection on chrome/buttons (not on inputs), `touch-action: manipulation` on buttons.
- **IOS-9** Offline: service worker precaches the app shell, fonts, icons. App loads and is fully usable in airplane mode after first load.
- **IOS-10** Call `navigator.storage.persist()` on first launch (best effort; log the result in Settings as "Storage: persistent / may be evicted").
- **IOS-11** Service worker update strategy: `registerType: 'autoUpdate'`, but never reload while a bottom sheet/editor is open (apply on next launch).

### 2.2 Home screen — "Today" poster (HOME)
- **HOME-1** Home screen renders today's plan as a vertical designed poster (style §6.3): header with total kcal, vertical timeline of meal cards, day-totals bar, footer.
- **HOME-2** Header title: `"{N} kcal Bulking Plan"` where N = live computed day total **including Free Slot budgets** (seed → 2363). Small leaf flourishes either side.
- **HOME-3** Pill strip under title: `HIGH PROTEIN · PURE VEGETARIAN · {P}g PROTEIN` with P live-computed from meal items (seed → 143g).
- **HOME-4** Each meal card shows: time + icon on the timeline, photo in circular plate frame (or SVG plate placeholder), meal name, item lines with per-item macros right-aligned in small grey text, bold subtotal line, and dark-green pill badge top-right `"{kcal} kcal / {P}g Protein"`.
- **HOME-5** Free Slot cards: dashed border, porcelain background, show budget (`~130 kcal`) and hint text instead of items (until something is logged).
- **HOME-6** Notes on items render inline in small italic (e.g. "every third day"). A meal-level badge note (e.g. "LAST CAFFEINE OF THE DAY") renders as a small terracotta/red uppercase badge.
- **HOME-7** Day-totals bar: full width, forest green, white bold text: meals-only totals line (kcal · P · C · F · Fibre) and a smaller second line "With snack: {kcal} kcal".
- **HOME-8** Three-column footer with icons, separated by gold hairlines; items come from Settings (`footerItems`).
- **HOME-9** In logging mode (Phase 2+): eaten meals show a gentle green check and slightly desaturated photo; upcoming meals stay vivid; the **next** meal (first non-eaten meal whose time ≥ now, else first non-eaten) is softly highlighted.

### 2.3 Daily logging (LOG)
- **LOG-1** Each local calendar day has its own `DayLog`, created automatically (deep copy of the current plan) the first time the app is opened that day. Use **local** date (`format(new Date(), 'yyyy-MM-dd')`) — never `toISOString()` (at 04:45 IST that returns the previous UTC day). Also re-check the date when the app returns to the foreground (`visibilitychange`), since an installed PWA can stay open across midnight.
- **LOG-2** "Eaten" button on each meal card marks every item eaten, with the satisfying animation (§7). Tapping again offers "Mark as not eaten".
- **LOG-3** Partial eating: in the meal detail sheet, per item I can tick/untick eaten, and change the amount actually eaten. Meal status derives automatically: none / partial / eaten.
- **LOG-4** Add an extra item to any meal **for today only** (does not change the plan).
- **LOG-5** Free Slot logging: enter what I ate — name, kcal, optional P/C/F/fibre, optional photo. Multiple entries allowed. Shows budget remaining / over (over → terracotta).
- **LOG-6** Live running totals: planned vs eaten for kcal, protein, carbs, fat, fibre.
- **LOG-7** Targets UI with progress rings or bars: kcal target (2363), protein ≥ 140g, fat ≥ 45g, fibre ≥ 45g. Warning colour rules in §4.4.
- **LOG-8** Reset today's log (in Settings, with confirmation) → re-snapshot from current plan, clear all eaten state/extras/free-slot entries.

### 2.4 History (HIST)
- **HIST-1** History tab: calendar view (month grid) + list of past days. Days with logs are marked; colour dot reflects kcal vs target.
- **HIST-2** Tap a day → read-only view of that day's poster as logged: what was eaten, extras, free-slot entries, planned vs eaten totals and target status.
- **HIST-3** Past days are **immutable snapshots**. Editing the plan must never change any past `DayLog`. (Unit-test this.)

### 2.5 Plan editor (PLAN)
- **PLAN-1** Add, delete, rename, reorder meals. Reorder by drag (drag handle; works with touch on iPhone; long-press/handle so normal scrolling still works).
- **PLAN-2** Edit meal time (HH:MM), name, timeline icon, photo, meal-level note/badge.
- **PLAN-3** Icons available: sunrise, sun, star, coffee, leaf, moon, plus a few extras (e.g. apple, bowl, cup, sparkle). Use inline SVG icons (e.g. `lucide-react`), forest-green circle with cream glyph.
- **PLAN-4** Toggle "Free Slot" on any meal: dashed border, editable kcal budget and hint text.
- **PLAN-5** Add, delete, reorder (drag), edit items inside each meal.
- **PLAN-6** Item fields: name, amount, unit (`g`, `ml`, `piece`, `sachet`, `scoop`, `pinch`, or free text), kcal, protein, carbs, fat, fibre, optional photo, optional note.
- **PLAN-7** **Smart scaling:** an item may store a `base` (per 100g / per 100ml / per 1 piece). When a base exists and the amount changes, all five values recalculate automatically (formula §4.2). Items without a base store fixed typed values. The editor shows the base clearly, lets me add/edit/remove it, and shows when values are "auto from base" vs "manual". Editing a value by hand on a based item switches that item to manual (with a "Recalculate from base" button to go back).
- **PLAN-8** Swipe item left to delete (red reveal). All deletes (meals and items) show an Undo toast (~5s).
- **PLAN-9** Plan changes apply from today onward. If today's log has **no logging activity** (no eaten flags, overrides, extras, or free-slot entries), today's snapshot silently updates. Otherwise show a prompt: "Apply these plan changes to today too?" — Yes merges (keep eaten state for meals/items whose IDs still exist) / No keeps today as is.
- **PLAN-10** Plan header title is editable (Plan.title) but the home header always shows the computed kcal number.

### 2.6 Photos (PHOTO)
- **PHOTO-1** Upload a photo for any meal or item (and free-slot entry) via `<input type="file" accept="image/*">` — iOS offers camera or library.
- **PHOTO-2** Compress client-side before saving: max 1000px long edge, JPEG quality 0.8 (iOS Safari canvas may not encode WebP — use JPEG and verify the output MIME). Respect EXIF orientation (`createImageBitmap(file, { imageOrientation: 'from-image' })` with fallback).
- **PHOTO-3** Store in IndexedDB. Store as `ArrayBuffer` + `mimeType` (more robust than raw Blob on older iOS IndexedDB); convert to Blob + object URL on read and revoke URLs on unmount.
- **PHOTO-4** Also store a tiny (~24px) blurred thumbnail data URL per photo for the blur-up placeholder.
- **PHOTO-5** Meals/items with no photo show an elegant SVG placeholder: white porcelain plate (rim, subtle inner shadow) on linen.
- **PHOTO-6** Replace and remove photo; orphaned photos are deleted (but never delete photos referenced by any past DayLog snapshot).

### 2.7 Settings & backup (SET)
- **SET-1** Edit targets: kcal, protein min, fat min, fibre min.
- **SET-2** Edit the three footer items (text + icon).
- **SET-3** **Export** all data (settings, plan, all day logs, all photos as base64) to one JSON file `plate-backup-YYYY-MM-DD.json` with `schemaVersion` and `exportedAt`. On iOS, use `navigator.share({ files: [...] })` when `navigator.canShare` supports files (so it can be saved to Files/iCloud), else fall back to an `<a download>` link.
- **SET-4** **Import** a backup JSON: validate structure and schemaVersion, show a summary (days, photos, date range), confirm, then replace all data atomically (Dexie transaction).
- **SET-5** Show "Last backup: X days ago" (or "Never"). Set `lastBackupAt` on successful export. If > 7 days (or never, after 7 days of use), show a gentle cream banner on the Today screen with a "Back up now" button (dismissible for 24h).
- **SET-6** Reset today's log (LOG-8).
- **SET-7** Show storage persistence status (IOS-10) and app version.

### 2.8 Navigation (NAV)
- **NAV-1** Bottom tab bar with four tabs: Today, History, Plan, Settings. Frosted cream glass (`backdrop-blur`, translucent cream), gold hairline on top, respects home-indicator safe area. Active tab in forest green.
- **NAV-2** Simple state-based navigation (no server routes needed → no SPA-redirect issues offline). Optional hash for the active tab.

### 2.9 Non-goals — do NOT build
Weight tracking, barcode scanner, AI features, accounts/login, cloud sync, notifications, food database/search, multiple plans, social/sharing features, analytics. (Ask the owner if you think something is needed.)

---

## 3. Platform notes / gotchas (read before Phase 1)
- Service workers need HTTPS (localhost is exempt). Testing on the real iPhone over LAN (`npm run dev -- --host`) works for layout but the SW won't register; the true installed-PWA test needs the deployed HTTPS site.
- iOS can evict PWA storage if unused for a while — this is why backup (SET-3..5) and `storage.persist()` matter.
- iOS standalone PWAs don't share storage with Safari tabs: data lives in the installed app only.
- `100vh` is unreliable on iOS; use `100dvh` or `height: 100%` chains.
- `position: fixed` + backdrop-filter: use `-webkit-backdrop-filter` too.

---

## 4. Data model & computation rules

### 4.1 Types (improve if needed; record changes in Decisions)
```ts
type Unit = 'g' | 'ml' | 'piece' | 'sachet' | 'scoop' | 'pinch' | string; // string = free text
type BasePer = '100g' | '100ml' | '1piece';
interface Nutrition { kcal: number; protein: number; carbs: number; fat: number; fibre: number; }

interface Item extends Nutrition {
  id: string; order: number; name: string;
  amount: number; unit: Unit;
  base?: { per: BasePer } & Nutrition;
  valuesSource: 'base' | 'manual';   // PLAN-7
  photoId?: string; note?: string;
}

type MealIcon = 'sunrise' | 'sun' | 'star' | 'coffee' | 'leaf' | 'moon' | string;

interface Meal {
  id: string; order: number; time: string /* "HH:MM" */; name: string; icon: MealIcon;
  photoId?: string;
  isFreeSlot: boolean; freeSlotBudgetKcal?: number; freeSlotHint?: string;
  badge?: string;   // e.g. "LAST CAFFEINE OF THE DAY"
  note?: string;
  items: Item[];
}

interface Plan { id: 'active'; title: string; meals: Meal[]; updatedAt: number; }

interface Settings {
  id: 'settings';
  targets: { kcal: number; proteinMin: number; fatMin: number; fibreMin: number };
  footerItems: { icon: string; text: string }[];
  lastBackupAt?: number; backupBannerDismissedAt?: number;
  seededAt: number; schemaVersion: number;
}

interface ItemOverride { eaten: boolean; amount?: number; }
interface MealLog { status: 'none' | 'partial' | 'eaten'; itemOverrides: Record<string, ItemOverride>; }

interface DayLog {
  date: string;                       // "YYYY-MM-DD", local time — primary key
  mealsSnapshot: Meal[];              // deep copy of the plan that day; immutable once the day has passed
  eaten: Record<string, MealLog>;     // mealId → log
  extraItems: Record<string, Item[]>; // mealId → today-only extra items
  freeSlotEntries: Record<string, Item[]>; // free-slot mealId → entries (keyed per slot so multiple free slots work)
  targetsSnapshot: Settings['targets']; // so history shows the targets that applied that day
  createdAt: number; updatedAt: number;
}

interface Photo { id: string; data: ArrayBuffer; mimeType: string; width: number; height: number; thumbDataUrl: string; createdAt: number; }
```
Dexie tables: `settings`, `plan`, `dayLogs` (key `date`), `photos` (key `id`). Use Dexie versioned schema from day one.

### 4.2 Nutrition rules (put in `src/lib/nutrition.ts`, fully unit-tested)
- **Subtotals and totals are ALWAYS computed from items, never stored.**
- **Keep decimals internally; round only for display** (`Math.round`, tabular numerals).
- Scaling with a base: `factor = per === '100g' | '100ml' ? amount / 100 : amount / 1`; each value = `base.value × factor`.
- Scaling a base only applies when the item's unit is compatible (`g`↔100g, `ml`↔100ml, `piece`↔1piece). If incompatible, show a small warning in the editor and keep manual values.
- **Seed values are stored exactly as given in §5** (with `valuesSource: 'manual'` where values would differ from the base by rounding, or simply `'manual'` for all seed items). Recalculation from the base happens only when the owner edits the amount or taps "Recalculate from base". This keeps seed totals exactly as the owner wrote them.
- **Eaten value of an item** (logging):
  - Not ticked → 0.
  - Ticked, no amount override → planned values.
  - Ticked with eaten amount: if item has a compatible base → compute from base × eaten amount; otherwise scale planned values proportionally `planned × (eatenAmount / plannedAmount)`.
- Meal status: `eaten` if all items (incl. extras) ticked at planned amount or more; `none` if none ticked; else `partial`. Marking a meal "Eaten" ticks all items.
- Free Slot: planned kcal = `freeSlotBudgetKcal`, planned macros = 0 (budget is kcal-only). Eaten = sum of entries.
- **Day totals:**
  - "Planned (meals)" = sum of all non-free-slot meal items → seed: 2233 kcal.
  - "Planned (with snack)" = meals + free-slot budgets → seed: 2363 kcal.
  - "Eaten" = sum of eaten items + extras + free-slot entries.

### 4.3 Expected seed totals (assert in a unit test)
Computed from the §5 items:

| Meal | kcal | P | C | F | Fibre |
|---|---|---|---|---|---|
| 1 Pre-Gym Banana Coffee | 263 | 8 | 42 | 8 | 5 |
| 2 Post-Gym Chocos Bowl | 554 | 40 | 71 | 13 | 5 |
| 4 Black Coffee | 5 | 0 | 0 | 0 | 0 |
| 5 Soya Veg Bowl | 348 | 31 | 52 | 1 | 19 |
| 6 Raw Veg & Green Tea | 40 | 2 | 9 | 0 | 3 |
| 7 Banana Milk Oats | 616 | 41 | 75 | 16 | 8 |
| 8 Moong Dal Khichdi + Isabgol | 407 | 21 | **76** | 1 | 18 |
| **Meals total** | **2233** | **143** | **325** | **39** | **58** |
| With Free Slot (130) | 2363 | | | | |

> ⚠️ **Known discrepancy in the owner's original plan:** Meal 8's stated subtotal says 77g carbs and the day total says 326g carbs, but its items sum to 48 + 24 + 0 + 4 = **76g** (day total **325g**). Per the rule "always compute from items", the app will show 76 / 325. Do not change item values. Mention this to the owner in the Phase 1 report.

### 4.4 Target status & warning colours
- kcal: ring/bar fills toward target; **terracotta** if eaten > target.
- Minimum targets (protein, fat, fibre): show eaten vs min. Status is **projected**: if `eaten + remaining planned (not yet eaten, non-free-slot)` < min → terracotta warning (fat will show this until the free-slot snack covers the ~6g gap — that is intended). Once eaten ≥ min → forest green with a check.
- Past days in History: terracotta if final eaten < min or kcal > target.

---

## 5. Seed data — load on first launch (use EXACTLY)

Use stable IDs (`m1`…`m8`, `m1-i1`…) so merges and tests are deterministic.

**Targets:** 2363 kcal/day · Protein ≥ 140g · Fat ≥ 45g · Fibre ≥ 45g
**Plan title:** "Bulking Plan"

Format: `name — amount unit — kcal · P · C · F · Fibre   [base for scaling, if any]`

**MEAL 1 — 04:45 — "Pre-Gym Banana Coffee" — icon: sunrise**
- Banana — 1.5 piece — 135 · 2 · 35 · 0 · 4   [per 1 piece: 90 · 1 · 23 · 0 · 2.6]
- Peanut Butter — 10 g — 64 · 3 · 2 · 5 · 1   [per 100g: 639 · 30 · 18 · 49 · 9]
- Toned Milk — 100 ml — 58 · 3 · 5 · 3 · 0   [per 100ml: 58 · 3 · 4.7 · 3 · 0]
- Bru Coffee — 5 sachet — 6 · 0 · 0 · 0 · 0
- Salt — 1 pinch — 0 · 0 · 0 · 0 · 0

**MEAL 2 — 07:00 — "Post-Gym Chocos Bowl" — icon: sun**
- Chocos — 50 g — 187 · 5 · 41 · 2 · 4   [per 100g: 373 · 9 · 81 · 3 · 7]
- Protein Powder (1 scoop) — 36 g — 138 · 25 · 4 · 2 · 0   [per 100g: 383 · 70 · 10.6 · 6.75 · 0]
- Toned Milk — 300 ml — 174 · 9 · 14 · 9 · 0   [per 100ml: 58 · 3 · 4.7 · 3 · 0]
- Banana — 0.5 piece — 45 · 1 · 12 · 0 · 1   [per 1 piece: 90 · 1 · 23 · 0 · 2.6]
- Cinnamon, Salt, 2g ORS — 1 serving — 10 · 0 · 0 · 0 · 0

**MEAL 3 — 10:30 — "Free Slot" — icon: star — FREE SLOT (dashed border)**
- Budget: 130 kcal (display "~130 kcal").
- Hint text: "Pick a higher-fat option (about 6g fat) to complete daily fat"
- No items.

**MEAL 4 — 12:00 — "Black Coffee" — icon: coffee**
- Black Coffee — 4 sachet — 5 · 0 · 0 · 0 · 0
- Meal badge (red/terracotta): "LAST CAFFEINE OF THE DAY"

**MEAL 5 — 13:30 — "Soya Veg Bowl" — icon: sun**
- Soya Chunks (raw) — 50 g — 170 · 26 · 12 · 1 · 7   [per 100g: 340 · 52 · 24 · 2 · 13]
- Cabbage, shredded — 0.5 piece — 50 · 3 · 11 · 0 · 5
- Capsicum + Tomato — 1 each — 52 · 2 · 12 · 0 · 4   (unit "each" = free text)
- Onion — 1 piece — 15 · 0 · 3 · 0 · 1   (note: "every third day")
- Amla — 1 piece — 30 · 0 · 7 · 0 · 2
- Honey 5g, Schezwan 5g, Ketchup 5g — 1 serving — 31 · 0 · 7 · 0 · 0

**MEAL 6 — 15:00 — "Raw Veg & Green Tea" — icon: leaf**
- Tomato — 1 piece — 22 · 1 · 5 · 0 · 2
- Cucumber — 1 piece — 16 · 1 · 4 · 0 · 1
- Green Tea — 1 cup — 2 · 0 · 0 · 0 · 0   (unit "cup" = free text)

**MEAL 7 — 16:30 — "Banana Milk Oats" — icon: sun**
- Rolled Oats — 50 g — 204 · 6 · 34 · 5 · 5   [per 100g: 407 · 12 · 68.5 · 9.5 · 10]
- Protein Powder (1 scoop) — 36 g — 138 · 25 · 4 · 2 · 0   [per 100g: 383 · 70 · 10.6 · 6.75 · 0]
- Toned Milk — 300 ml — 174 · 9 · 14 · 9 · 0   [per 100ml: 58 · 3 · 4.7 · 3 · 0]
- Banana — 1 piece — 90 · 1 · 23 · 0 · 3   [per 1 piece: 90 · 1 · 23 · 0 · 2.6]
- Cinnamon, Salt — 1 serving — 10 · 0 · 0 · 0 · 0

**MEAL 8 — 20:00 — "Moong Dal Khichdi + Isabgol" — icon: moon**
- Moong Dal (raw) — 80 g — 276 · 19 · 48 · 1 · 13   [per 100g: 345 · 23.75 · 60 · 1.25 · 16]
- Rice (raw) — 30 g — 108 · 2 · 24 · 0 · 1   [per 100g: 360 · 6.7 · 80 · 0 · 1]
- Spices — 1 serving — 5 · 0 · 0 · 0 · 0
- Isabgol in 300ml water — 5 g — 18 · 0 · 4 · 0 · 4

**Footer items:** "4 Litres Water Daily" (water-drop icon) | "100% Pure Vegetarian" (leaf icon) | "Caffeine before 12 PM only" (coffee/clock icon).

Seed only if the database is empty. Never re-seed over existing data.

---

## 6. Visual design — "White Plate, Paris Café"

The feeling: a morning at a Parisian café. Cream linen, white porcelain, forest green, soft daylight, calm luxury. Rich and warm — never clinical, never "fitness-bro". It must look like a **designed infographic poster**, not a generic list app.

### 6.1 Palette (CSS variables / Tailwind theme tokens)
| Token | Hex | Use |
|---|---|---|
| `--cream` | `#F6F1E7` | App background, with very subtle linen/paper texture (inline SVG noise or woven pattern as data URI, ~3–5% opacity — no external image) |
| `--sage` | `#E6EFDF` | Meal card surface |
| `--porcelain` | `#FFFDF8` | Free-slot cards, sheets, plate frames |
| `--forest` | `#1F4D2E` | Primary: timeline, icons, badges, totals bar |
| `--olive` | `#6B7F4E` | Secondary accents |
| `--espresso` | `#2A2420` | Main text |
| `--warm-grey` | `#8A8178` | Secondary text, per-item macros |
| `--terracotta` | `#C0623B` | Warnings (fat below min, over budget), red badges |
| `--gold` | `#C9A96E` | Hairline dividers — sparingly |

### 6.2 Typography
- Headings: Playfair Display (or Cormorant Garamond), self-hosted.
- Body & numbers: Inter (or DM Sans), `font-variant-numeric: tabular-nums` everywhere numbers appear.
- Inputs ≥ 16px (IOS-7).

### 6.3 Home poster layout (mirror the owner's existing poster)
- **Header:** large serif "2363 kcal Bulking Plan" (number live), small leaf flourishes; below it the pill strip `HIGH PROTEIN · PURE VEGETARIAN · 143g PROTEIN`.
- **Timeline (left):** thin forest-green vertical line; circular dark-green icon nodes; time printed under each node.
- **Meal cards:** 20–24px radius, pale sage, soft layered shadow (2–3 stacked low-opacity shadows). Photo on the left in a white circular "plate" frame with a subtle rim. Items on the right; per-item macros in small grey text, right-aligned. Bold subtotal line at bottom. Dark-green pill badge top-right `"554 kcal / 40g Protein"`.
- **Free Slot cards:** dashed border (olive/forest), porcelain background.
- **Day totals bar:** full width, forest green, white bold text, second smaller line for "with snack".
- **Footer:** three columns with icons, separated by thin gold hairlines.
- **Logging mode:** eaten meals → green check + slightly desaturated photo (`filter: saturate(0.6)` is fine, it's not animated in a loop); upcoming stay vivid; next meal softly highlighted (gentle glow/ring).
- Layout target: 390px wide, with 16px gutters; must still look good 360–430px.

### 6.4 Navigation
Bottom tab bar, four tabs (Today, History, Plan, Settings), frosted cream glass, home-indicator safe area.

---

## 7. Animation & feel (ANIM)

Framer Motion throughout, spring physics. It should feel alive and expensive.
- **ANIM-1** Home load: timeline line "draws" top→bottom (scaleY from origin top, or SVG pathLength) while cards fade + rise staggered 60–80ms apart.
- **ANIM-2** Totals count up smoothly whenever they change (animate a motion value, render rounded).
- **ANIM-3** Mark eaten: check mark draws itself (SVG pathLength), card does a soft scale "settle" (e.g. 1 → 0.98 → 1 spring), gentle green ripple expands from the timeline dot (scale + opacity).
- **ANIM-4** Progress rings fill with a spring.
- **ANIM-5** Shared-element transition: tapping a meal card expands it into the meal detail/edit sheet (`layoutId`), photo flies into place.
- **ANIM-6** Bottom sheets: drag-to-dismiss with rubber-band resistance past the top, velocity-based dismissal, backdrop fades.
- **ANIM-7** Drag-to-reorder meals and items with smooth layout animations.
- **ANIM-8** Swipe item left to delete — red reveal, Undo toast.
- **ANIM-9** Photos fade in from the blur thumbnail (PHOTO-4).
- **ANIM-10** Subtle parallax on meal photos while scrolling home (`useScroll` on the scroll container + `useTransform`, a few px only).
- **ANIM-11** `prefers-reduced-motion`: replace all motion with simple opacity fades (`useReducedMotion` / `MotionConfig reducedMotion="user"`).
- **ANIM-12** 60fps on iPhone 13 Pro: animate only `transform` and `opacity`; never animate layout properties (width/height/top/left) in loops; use `will-change` sparingly.

Phases 1–5 should already use basic, tasteful motion; Phase 6 is the full polish pass.

---

## 8. Suggested project structure
```
src/
  main.tsx, App.tsx
  styles/ (index.css with Tailwind + tokens + linen texture)
  db/ (dexie schema, seed.ts, repositories)
  lib/ (nutrition.ts, dayLog.ts, dates.ts, images.ts, backup.ts)
  components/ (poster/, timeline/, cards/, sheets/, inputs/, icons/, toast/, rings/)
  screens/ (Today, History, Plan, Settings)
  hooks/
tests/ (or *.test.ts next to lib files)
public/ (icons, generated)
```

---

## 9. Phases & checklists

Copy this section into `PROGRESS.md` in Phase 1 and tick items as you go. Each phase ends with the gate in §0.2.

### Phase 1 — Scaffold, PWA, theme, fonts, seed data, read-only Today poster
- [ ] Vite + React + TS (strict) project, Tailwind v4, Framer Motion, Dexie, vite-plugin-pwa, Vitest, ESLint; npm scripts per §1.3
- [ ] `CLAUDE.md`, `PROGRESS.md`, `README.md` created
- [ ] IOS-1 … IOS-11 (icons generated from SVG source)
- [ ] Theme tokens, linen texture, self-hosted fonts (§6.1, §6.2)
- [ ] Dexie schema (§4.1), seed on first launch (§5), `nutrition.ts` with unit tests incl. §4.3 seed totals
- [ ] HOME-1 … HOME-8 (read-only), SVG plate placeholder (PHOTO-5)
- [ ] NAV-1, NAV-2 (other tabs can be simple placeholders)
- [ ] Basic ANIM-1 and ANIM-11
- [ ] Report the carbs discrepancy from §4.3

### Phase 2 — Daily logging & totals
- [ ] LOG-1 … LOG-7 (LOG-8 may land in Phase 5 with Settings)
- [ ] HOME-9 logging-mode visuals
- [ ] Meal detail bottom sheet (basic version of ANIM-5/ANIM-6)
- [ ] Target status rules §4.4
- [ ] `dayLog.ts` unit tests: day creation, local-date rollover, eaten math, partial with/without base, free slot
- [ ] Basic ANIM-2, ANIM-3, ANIM-4

### Phase 3 — Plan editor, smart scaling, reordering
- [ ] PLAN-1 … PLAN-10
- [ ] Undo toast system
- [ ] HIST-3 snapshot immutability unit test (edit plan → past logs unchanged)
- [ ] PLAN-9 today-merge logic unit-tested
- [ ] Basic ANIM-7, ANIM-8

### Phase 4 — Photos
- [ ] PHOTO-1 … PHOTO-6 (meals, items, free-slot entries)
- [ ] ANIM-9

### Phase 5 — History, settings, export/import
- [ ] HIST-1, HIST-2
- [ ] SET-1 … SET-7, LOG-8
- [ ] Backup round-trip unit test (export → wipe → import → deep-equal, incl. photos)

### Phase 6 — Animation polish & iPhone QA
- [ ] ANIM-1 … ANIM-12 complete and refined
- [ ] Full re-audit of every requirement ID in this spec → all ✅ in `PROGRESS.md`
- [ ] iPhone QA checklist (§10.3) written into `README.md`
- [ ] Deployment + install instructions (§10.2) finalised in `README.md`

---

## 10. Run, preview, deploy, install

### 10.1 After each phase, tell the owner (Windows PowerShell)
```powershell
npm install
npm run dev            # http://localhost:5173
npm run test
npm run build; npm run preview   # production build incl. service worker, http://localhost:4173
```
Preview at iPhone size: Chrome → F12 → Toggle device toolbar (Ctrl+Shift+M) → choose **iPhone 12 Pro** (390×844, same as 13 Pro). Note DevTools doesn't emulate the notch/safe areas or standalone mode.
Optional real-device layout check: `npm run dev -- --host`, open the shown LAN IP on the iPhone (same Wi-Fi; allow Node through Windows Firewall). Service worker won't run there (not HTTPS).

### 10.2 Deployment (finalise in README)
**Netlify (CLI):**
```powershell
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --dir=dist          # draft URL to test
netlify deploy --prod --dir=dist   # production URL
```
(Alternatively connect the Git repo in the Netlify dashboard: build command `npm run build`, publish directory `dist`.)
Add `netlify.toml` with correct headers: `sw.js` and `index.html` served with `Cache-Control: no-cache`; hashed assets cached long-term.

**Vercel alternative:** `npm i -g vercel`, `vercel login`, `vercel --prod` (framework: Vite, output `dist`), with equivalent `vercel.json` headers.

**Install on iPhone:**
1. Open the production HTTPS URL in **Safari**.
2. Wait for it to load fully once (this caches it for offline).
3. Tap Share → "Add to Home Screen" → confirm name "Plate" → Add.
4. Launch from the home-screen icon (opens standalone, no browser bars).
5. Test offline: enable Airplane Mode, launch again — it must work.
6. First thing: Settings → Export a backup and save it to Files/iCloud.

### 10.3 iPhone QA checklist (Phase 6, put in README)
Must cover at least: standalone launch, no browser chrome, status bar readable, notch & home indicator clearance on every screen and sheet, no zoom on input focus, no rubber-band of the whole page, offline launch, midnight rollover with app left open, eaten animation smoothness, drag reorder by touch without breaking scroll, swipe-delete + undo, camera and library upload, photo orientation correct, export via share sheet to Files, import back, reduced-motion setting respected, app update after redeploy, data survives app relaunch and phone restart.

---

## 11. Decisions already made (follow these; log any new ones in PROGRESS.md)
1. App name "Plate" (manifest `name`: "Plate — Meal Plan", `short_name`: "Plate"). Owner may rename later.
2. Header kcal = meals + free-slot budgets (2363); totals bar line 1 = meals only (2233), line 2 = with snack (2363).
3. Free-slot budget counts toward planned kcal only, not macros.
4. Seed values stored as written; base recalculation only on amount edit or explicit "Recalculate" (§4.2).
5. Displayed values rounded; internal decimals kept; totals summed from unrounded values.
6. Day boundary = local midnight; date checked on launch and on foreground.
7. Minimum-target warnings use projected status (§4.4).
8. Photos stored as ArrayBuffer + MIME, JPEG 0.8, max 1000px, plus blur thumbnail.
9. Reorder via dnd-kit with drag handles (touch-friendly, keeps scroll working); swipe-to-delete via Framer drag on rows.
10. State-based tab navigation, no router dependency.
11. Backup JSON embeds photos as base64; import replaces all data after confirmation.
12. Status bar style `default` + `theme-color` cream.
13. "Logging activity" (for PLAN-9) = any eaten flag, item override, extra item, or free-slot entry in today's log.
