# PROGRESS.md

**Current phase:** Phase 6 complete — all six phases done. Remaining: the owner's on-device run of the iPhone QA checklist in README.md.

Legend: ✅ done · ⚠️ partial (reason given) · ❌ missing · ⏳ belongs to a later phase

---

## Phase checklist (from SPEC.md §9)

### Phase 1 — Scaffold, PWA, theme, fonts, seed data, read-only Today poster
- [x] Vite + React + TS (strict) project, Tailwind v4, Framer Motion, Dexie, vite-plugin-pwa, Vitest, ESLint; npm scripts per §1.3
- [x] `CLAUDE.md`, `PROGRESS.md`, `README.md` created
- [x] IOS-1 … IOS-11 (icons generated from SVG source)
- [x] Theme tokens, linen texture, self-hosted fonts (§6.1, §6.2)
- [x] Dexie schema (§4.1), seed on first launch (§5), `nutrition.ts` with unit tests incl. §4.3 seed totals
- [x] HOME-1 … HOME-8 (read-only), SVG plate placeholder (PHOTO-5)
- [x] NAV-1, NAV-2 (other tabs can be simple placeholders)
- [x] Basic ANIM-1 and ANIM-11
- [x] Report the carbs discrepancy from §4.3

### Phase 2 — Daily logging & totals
- [x] LOG-1 … LOG-7 (LOG-8 may land in Phase 5 with Settings)
- [x] HOME-9 logging-mode visuals
- [x] Meal detail bottom sheet (basic version of ANIM-5/ANIM-6)
- [x] Target status rules §4.4
- [x] `dayLog.ts` unit tests: day creation, local-date rollover, eaten math, partial with/without base, free slot
- [x] Basic ANIM-2, ANIM-3, ANIM-4

### Phase 3 — Plan editor, smart scaling, reordering
- [x] PLAN-1 … PLAN-10
- [x] Undo toast system
- [x] HIST-3 snapshot immutability unit test (edit plan → past logs unchanged)
- [x] PLAN-9 today-merge logic unit-tested
- [x] Basic ANIM-7, ANIM-8

### Phase 4 — Photos
- [x] PHOTO-1 … PHOTO-6 (meals, items, free-slot entries)
- [x] ANIM-9
- [x] **Owner request:** crop step after picking a photo (see Decision 34)

### Phase 5 — History, settings, export/import
- [x] HIST-1, HIST-2
- [x] SET-1 … SET-7, LOG-8
- [x] Backup round-trip unit test (export → wipe → import → deep-equal, incl. photos)

### Phase 6 — Animation polish & iPhone QA
- [x] ANIM-1 … ANIM-12 complete and refined
- [x] Full re-audit of every requirement ID in this spec → all ✅ in `PROGRESS.md`
- [x] iPhone QA checklist (§10.3) written into `README.md`
- [x] Deployment + install instructions (§10.2) finalised in `README.md`

### After Phase 6 — owner requests
- [x] Dark gradient theme with a Dark / Light toggle, dark by default (Decision 47)

---

## Requirement status

| ID | Status | Notes |
|---|---|---|
| IOS-1 | ✅ | `index.html` viewport meta with `viewport-fit=cover` |
| IOS-2 | ✅ | Scroll containers pad top/bottom with `env(safe-area-inset-*)`, root pads left/right, tab bar pads bottom; a solid cream strip sits under the status bar so scrolled content never collides with it |
| IOS-3 | ✅ | `assets/icon-source.svg` → `npm run icons` (sharp) → `public/apple-touch-icon.png` (180, flattened, no alpha), `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png` (art in 80% safe zone), `favicon.svg` |
| IOS-4 | ✅ | Both capable metas; manifest `display: standalone` |
| IOS-5 | ✅ (adapted) | Light theme: status bar `default` + `theme-color` `#F6F1E7` exactly as specified. Dark theme (the owner-requested default, Decision 47): `black-translucent` (white status-bar text) + `theme-color` `#0F1A14`, chosen before first paint from the saved theme. Title "Plate" |
| IOS-6 | ✅ | html/body locked (`overflow:hidden`, `overscroll-behavior:none`), each tab is its own `.scroll-area`. An open bottom sheet holds a UI lock; while it does, the screen behind gets `overflow-y: hidden`, and the sheet's own content area is `overscroll-behavior: contain` |
| IOS-7 | ✅ | Global CSS: inputs/selects/textareas `font-size: max(16px, 1rem)`. Every numeric input uses `inputMode="decimal"`; `NumberInput` accepts both `1.5` and `1,5`. Phase 6 audit in Chrome at 360 / 390 / 430 px: every visible input on all tabs, the meal sheet (incl. the extra-item form), the free-slot sheet, and the meal and item editors is ≥ 16 px; no horizontal overflow anywhere |
| IOS-8 | ✅ | Tap highlight off, `user-select: none` on chrome/buttons (inputs re-enabled), `touch-action: manipulation` on buttons |
| IOS-9 | ✅ | Workbox precaches JS/CSS/HTML/SVG/PNG/woff2 (33 entries, about 1.3 MB). Re-verified on the final build: an offline reload shows the full poster with all fonts |
| IOS-10 | ✅ | `navigator.storage.persist()` on launch (best effort); Settings shows "Storage: persistent / may be evicted" |
| IOS-11 | ✅ | `registerType: 'autoUpdate'`; `src/lib/swUpdate.ts` defers the reload while any UI lock is open (the meal sheet holds one), and only reloads while the app is backgrounded or within 5s of launch |
| HOME-1 | ✅ | Header, targets panel, timeline, totals bar, footer; rendered from today's DayLog snapshot |
| HOME-2 | ✅ | Live `plannedWithSnack` kcal → 2363, with leaf flourishes |
| HOME-3 | ✅ | Pill strip, protein live from items → 143g |
| HOME-4 | ✅ | Time + icon node, plate frame (placeholder), name, items with right-aligned grey macros, bold subtotal, top-right forest pill |
| HOME-5 | ✅ | Dashed olive border, porcelain, "~130 kcal", hint until something is logged; then the entries plus remaining / over |
| HOME-6 | ✅ | Item note inline italic; meal badge as terracotta uppercase pill |
| HOME-7 | ✅ | Meals-only line (2233 · 143 · 325 · 39 · 58) + "With snack: 2363 kcal" |
| HOME-8 | ✅ | Three columns, gold hairlines, from `settings.footerItems` |
| HOME-9 | ✅ | Eaten: photo `saturate(0.6)` plus a small green check that draws itself; ticked items get a check in the card. Next meal (first non-eaten with time ≥ now, else first non-eaten) gets a soft forest ring + glow. Re-evaluated every minute |
| LOG-1 | ✅ | `ensureDayLog(localDateKey())` creates a deep-copied snapshot of plan + targets on the first open of the day (rw transaction). The date is re-checked every minute, at local midnight, and on `visibilitychange` → visible (`useNow`). Never uses `toISOString()` (unit-tested in IST). Phase 6: with the page clock set to 23:59:55 and the app open, a new day log appeared at 00:00 and the next-meal highlight moved to Meal 1 |
| LOG-2 | ✅ | "Mark eaten" on each card ticks every item (incl. extras). The "Eaten" button opens an inline "Keep / Mark as not eaten" choice. Animation per ANIM-3 |
| LOG-3 | ✅ | The meal sheet ticks/unticks each item, and has an "amount eaten" field per item (blank = planned; typing an amount ticks the item). Status none / partial / eaten is derived on every change |
| LOG-4 | ✅ | "Add an extra item (today only)" in the sheet: name, amount, unit, kcal, optional P/C/F/fibre. Stored in `DayLog.extraItems`; the plan is untouched. Shown on the card as "+ name · today" |
| LOG-5 | ✅ | Free-slot sheet: name, kcal, optional P/C/F/fibre, **optional photo**, multiple entries, remove (Undo); budget remaining / over (terracotta) |
| LOG-6 | ✅ | Targets panel table: Eaten vs Planned for kcal · P · C · F · Fibre. Planned kcal includes the free-slot budget |
| LOG-7 | ✅ | Four rings (Calories of 2363, Protein / Fat / Fibre minimums) with the §4.4 colours and a check when met, plus a one-line text warning so colour isn't the only signal. Uses `DayLog.targetsSnapshot` |
| LOG-8 | ✅ | Settings → "Reset today's log" → confirmation → today is re-snapshotted from the current plan + targets (eaten state, extras and free-slot entries cleared; `createdAt` kept). Unit-tested |
| §4.4 | ✅ | Today: kcal terracotta when eaten > target; minimums projected (eaten + unticked planned items of non-free-slot meals) → terracotta if short, forest + check once met, olive in between. Past days (History): `targetStatus(log, { final: true })` judges the final eaten amounts (terracotta if any minimum missed or kcal over); `finalDayStatus` drives the calendar dots. Unit-tested |
| HIST-1 | ✅ | History tab: Monday-first month grid (prev/next limited to logged months), today ringed; days with a log are tappable and carry a dot: forest = targets met, terracotta = kcal over or a minimum missed, grey = nothing eaten logged, olive = today (in progress), plus a key. Below: "Logged days" list, newest first, with eaten kcal / target and P, F, fibre |
| HIST-2 | ✅ | Tap a day → read-only poster: date, the targets that applied, rings + Eaten vs Planned (final status), the timeline with eaten / partly / not eaten per meal, ticked items, extras, free-slot entries, then the totals bar. No buttons, no sheets. Checked in the browser |
| HIST-3 | ✅ | `ensureDayLog` never rewrites an existing log; plan writes only touch today's log (`updatePlan` / `applyPlanToToday`). Unit-tested in `src/db/plan.test.ts`: several plan edits, a silent sync and a merge leave yesterday's log deep-equal to before |
| PLAN-1 | ✅ | Plan tab: add meal, delete (swipe left or "Delete meal" in the editor; Undo toast), rename (editor), reorder by dragging the ⋮⋮ grip (dnd-kit; drag starts only from the handle, so scrolling and swiping elsewhere still work). Verified in headless Chrome |
| PLAN-2 | ✅ | Time (iOS time wheel, validated `HH:MM`), name, icon, photo (add / replace / remove), badge and note are all editable |
| PLAN-3 | ✅ | 10 icons (sunrise, sun, star, coffee, leaf, moon, apple, bowl, cup, sparkle) as forest circles with cream lucide glyphs; the selected one gets a gold ring |
| PLAN-4 | ✅ | "Free slot" toggle with editable kcal budget and hint. Items are kept (hidden) while a meal is a free slot, so toggling back loses nothing |
| PLAN-5 | ✅ | Meal editor: add item, delete (swipe left or "Delete item"; Undo toast), reorder by drag handle, tap to open the item editor |
| PLAN-6 | ✅ | Name, amount, unit (known units offered as suggestions, any free text allowed), kcal / P / C / F / fibre, photo, note |
| PLAN-7 | ✅ | Base per 100 g / 100 ml / piece: add (pre-filled from the current values), edit, remove. Badge shows "Auto from base" or "Manual". Editing the amount recalculates from a compatible base; typing a value makes the item manual; "Recalculate from base" goes back. An incompatible unit shows a terracotta warning and keeps manual values. Unit-tested, and checked in the browser (Peanut Butter 20 g → 127.8 kcal) |
| PLAN-8 | ✅ | Swipe left reveals red "Delete"; swipe further (or flick) deletes. Every meal / item delete shows a 5s "Undo" toast that re-inserts at the original position. Undo is also offered when removing today's extras and free-slot entries |
| PLAN-9 | ✅ | Each plan write runs in one transaction with today's log. With no logging activity, today is re-snapshotted silently; otherwise a pending flag is set, and leaving the Plan tab asks "Apply these plan changes to today too?". Yes merges, keeping eaten state for surviving meal/item IDs; No keeps today. Unit-tested (`planMerge.test.ts`, `plan.test.ts`) and checked end-to-end in the browser |
| PLAN-10 | ✅ | Plan title is inline-editable at the top of the Plan tab; the Today header shows "{computed kcal} kcal {title}" (a preview line under the title shows exactly that) |
| PHOTO-1 | ✅ | `PhotoPicker` (`<input type="file" accept="image/*">`, which on iPhone offers camera or library) for meals (meal editor), plan items (item editor), and today's extras and free-slot entries (quick-entry form) |
| PHOTO-2 | ✅ | `lib/images.ts`: `createImageBitmap(file, { imageOrientation: 'from-image' })`, falling back to an `<img>` decode. Scaled to ≤ 1000 px on the long edge, encoded with `canvas.toBlob('image/jpeg', 0.8)`; the stored MIME type is the encoder's actual output. Verified in Chrome: a 3000×2000 JPEG tagged EXIF orientation 6 was stored as a 667×1000 `image/jpeg` the right way up |
| PHOTO-3 | ✅ | Stored in IndexedDB `photos` as `ArrayBuffer` + `mimeType` (+ width, height, createdAt). `PhotoView` makes a Blob + object URL only while mounted and revokes it on unmount or change |
| PHOTO-4 | ✅ | A 24 px (long edge) JPEG thumbnail data URL is stored with each photo |
| PHOTO-5 | ✅ | `PlatePlaceholder` SVG: porcelain plate (rim, inner shadow, gold line) on linen. Shown wherever a meal / item / entry has no photo (cards, sheets, editor rows) |
| PHOTO-6 | ✅ | Replace = pick again; Remove = button. `deleteOrphanPhotos` removes photos referenced by neither the plan nor **any** DayLog (snapshots, extras, entries). It runs on launch and 15 s after a removal / delete, i.e. after the Undo window; photos younger than 10 min are kept (they may sit in an unsaved form). Unit-tested, including "a past day still uses it → kept" |
| SET-1 | ✅ | Daily targets (kcal, protein / fat / fibre minimums) with decimal inputs. New targets also update **today's** `targetsSnapshot`; past days keep theirs. Unit-tested |
| SET-2 | ✅ | Three footer items: text field + icon choice (droplet, leaf, coffee, clock, sun, moon, apple, star, sparkle); the poster footer updates live |
| SET-3 | ✅ | "Export backup" builds `plate-backup-YYYY-MM-DD.json` (`app`, `schemaVersion`, `exportedAt`, settings, plan, all day logs, all photos as base64). "Save backup file" uses `navigator.share({ files })` when `navigator.canShare` allows (iOS → Save to Files / iCloud), otherwise an `<a download>`. `lastBackupAt` is set only after a successful share or download (a cancelled share sheet doesn't count). Both paths checked in the browser |
| SET-4 | ✅ | "Import backup" (.json): checks structure (settings, plan meals and items, every day log incl. extras / entries, photos incl. base64) and `schemaVersion` (newer → refused with a message). Shows days, photos, date range and export date, asks for confirmation, then replaces everything in **one Dexie transaction**. Afterwards today's log is recreated if the backup didn't contain it. Unit-tested (round-trip + rejections) and checked in the browser |
| SET-5 | ✅ | "Last backup: Today / Yesterday / X days ago / Never" in Settings. Today banner when the last backup is > 7 days old (or never, after 7 days of use), dismissible for 24 h; "Back up now" opens Settings with the backup already being prepared. Unit-tested rules, checked in the browser |
| SET-6 | ✅ | = LOG-8 |
| SET-7 | ✅ | About: storage persistence ("persistent / may be evicted") and app version |
| NAV-1 | ✅ | Frosted cream glass (`-webkit-backdrop-filter` too), gold hairline, safe-area bottom, active tab forest + sliding indicator |
| NAV-2 | ✅ | State-based tabs with optional `#history` / `#plan` / `#settings` hash (`replaceState`, no router) |
| ANIM-1 | ✅ | Timeline line draws top → bottom (scaleY from the top) while the cards fade + rise with a 70 ms stagger (spring) |
| ANIM-2 | ✅ | `AnimatedNumber`: a spring-driven motion value rendered rounded, for the header kcal / protein, totals bar, ring centres, Eaten / Planned table and sheet totals. It updates the text node only (no React re-render per frame) |
| ANIM-3 | ✅ | When a meal becomes eaten (from the card or the sheet): the check draws itself (pathLength), the card settles 1 → 0.975 → 1, and a green ripple expands from the timeline dot (scale + opacity). Triggered on the transition into "eaten" only |
| ANIM-4 | ✅ | `ProgressRing`: pathLength spring fill; colour changes via a CSS transition |
| ANIM-5 | ✅ | **Shared-element expand:** each card's background is a surface layer whose `layoutId` it shares with the sheet's surface, so the card grows into the sheet (position, size, corner radius) while the sheet content fades in. The meal photo flies into the sheet header (its own `layoutId`), and on close both morph back into the card. Checked frame by frame in Chrome (60 / 120 / 500 ms) |
| ANIM-6 | ✅ | Drag the handle / header down to dismiss (distance > 110 px or velocity > 600 px/s). Dragging up past the top rubber-bands (elastic 0.05). The backdrop fades as the sheet is pulled down (dragY → opacity: 0.46 at 250 px), and fades in / out on open / close. Sheets without a card (plan editors) spring up from the bottom |
| ANIM-7 | ✅ | dnd-kit sortable with handles: neighbours slide aside with transform transitions; the lifted row scales 1.02 with a shadow; vertical axis only |
| ANIM-8 | ✅ | Framer `drag="x"` with direction lock (vertical scroll still works); the red "Delete" layer fades in by opacity; release animates the row away (then Undo toast) or springs it back |
| ANIM-9 | ✅ | The blurred 24 px thumbnail shows at once; the full image fades in over it (opacity) once decoded |
| ANIM-10 | ✅ | `useScroll({ container: Today's <main>, target: photo frame })` + `useTransform` → each meal photo drifts ±5 px (translateY, scaled 1.14 so the edges never show) inside its round frame while Today scrolls. Only on the live Today poster; off under reduced motion. Measured in Chrome: +0.3 px → −5 px across a 600 px scroll |
| ANIM-11 | ✅ | `<MotionConfig reducedMotion="user">` drops transform / layout animations, leaving opacity fades. Non-transform motion is handled explicitly: ring fill and check drawing become instant / fade, numbers jump, the settle is skipped, parallax is off, the card → sheet morph becomes a plain fade. Verified with emulated `prefers-reduced-motion: reduce`: no transforms, no errors |
| ANIM-12 | ✅ | Audit: every motion animation is transform, opacity or SVG stroke (pathLength). No animation of width / height / top / left; the only CSS transitions are one-off colour / shadow / filter / toggle-transform changes; no `will-change`; the only infinite animation is the small loading spinner. The crop preview is a downscaled ≤ 1600 px canvas moved by `translate3d` + `scale`. Real 60 fps needs the on-device check in the README checklist |

Phase 6 re-audit (all requirement IDs above re-checked; SPEC.md unchanged). Unit tests (Vitest, 80 passing):
- `src/lib/nutrition.test.ts`: scaling, compatibility, eaten value, meal status, planned totals, display rounding.
- `src/db/seed.test.ts`: §4.3 per-meal and day totals, seed only when empty.
- `src/lib/dayLog.test.ts` (runs in IST): local date vs `toISOString` at 04:45, midnight rollover, deep-copy day creation, whole / partial meals (with and without a base), over-eating, extras, free slot entries and budget, §4.4 projections, next meal, final (History) day status.
- `src/db/dayLogs.test.ts`: create once, later plan changes don't leak into an existing day, the next day snapshots the new plan.
- `src/lib/format.test.ts`: decimal parsing (`1,5` / `1.5`), display rounding.
- `src/lib/planEdit.test.ts`: smart scaling (amount → base, manual switch, recalculate, incompatible unit, add/edit/remove base, per-piece), move/remove/insert-at (undo), free-slot toggle, time validation.
- `src/lib/planMerge.test.ts`: PLAN-9 silent sync vs ask; merge keeps surviving eaten state / extras / free-slot entries and drops deleted ones; free-slot flips.
- `src/db/plan.test.ts`: **HIST-3** (past log unchanged after edits, sync and merge), PLAN-9 end-to-end in IndexedDB, plan writes bump `updatedAt`.
- `src/db/backup.test.ts`: **backup round-trip** (export → wipe → put other data → import → deep-equal settings, plan, all day logs and photo bytes incl. a 200 KB photo), import into an empty DB, validation rejections (not JSON, not Plate, newer schema, damaged plan / day / photo), base64, file name, "Last backup" labels, banner rules.
- `src/db/settings.test.ts`: targets apply to today but not past days; reset today.
- `src/lib/crop.test.ts`: crop maths (cover + centre, the square always stays covered, zoom keeps the pinch point fixed, 1×–5× limits, portrait / landscape).
- `src/db/photos.test.ts`: `fitWithin` (1000 px cap, no upscaling), ArrayBuffer round-trip, orphan clean-up (keeps plan / past-day / entry photos and fresh ones, deletes true orphans).

---

## Decisions

1. **Toolchain versions (Node 20.19 compatibility).** The owner has Node 20.19.6. Vitest 5 needs Node ≥ 22, so **Vitest 4.1** is used. typescript-eslint supports TS < 6.1, so **TypeScript 6.0** is used (TS 7 is out but is not supported by the linter yet). Other packages are at their latest versions: Vite 8, React 19, Tailwind 4.3, vite-plugin-pwa 2.0, Dexie 4.4, motion 14 (`motion/react`), ESLint 10.
2. **Home header uses the plan title:** it renders `"{N} kcal {plan.title}"` (seed title is "Bulking Plan", so it shows "2363 kcal Bulking Plan"). This makes PLAN-10 meaningful: the title can be edited, and the kcal number is always computed.
3. **Meal-8 carbs discrepancy (§4.3):** the app shows **76 g** for Meal 8 and **325 g** for the day, computed from items. The original poster's 77 / 326 is not used. Item values are unchanged.
4. **Per-item macro format:** `135 kcal · 2P · 35C · 0F · 4Fib` (compact so it fits at 360–430 px). The totals bar spells out "Fibre".
5. **Service-worker reload timing (IOS-11):** besides "never while a sheet or editor is open", a pending update reloads only while the app is backgrounded or within 5s of launch. This way the owner never sees the page reload under their finger.
6. **Fonts:** Playfair Display (latin subset 400/600/700/400-italic) and Inter Variable (all subsets, normal + italic) come from @fontsource. Only `.woff2` is precached; `.woff` fallbacks aren't needed on iOS.
7. **Unit and icon types:** `Unit` and `MealIcon` are typed as `KnownX | (string & {})`. They accept the same values as the spec's `| string`, but editor autocomplete still lists the known values. `KnownMealIcon` adds `apple | bowl | cup | sparkle` (PLAN-3).
8. **Seeding guard:** seeding runs only when settings, plan **and** dayLogs are all empty, inside one Dexie transaction.
9. **Tabs stay mounted:** all four tab screens stay mounted (hidden when inactive) so each one keeps its scroll position.
10. **Icon generation:** a small `sharp` script (`npm run icons`) is used instead of `@vite-pwa/assets-generator`, for exact control (flattened cream background, maskable safe zone). The generated PNGs are committed in `public/`.
11. **Extras are not "planned".** "Planned" always means the plan snapshot (+ free-slot budget for kcal), so the header, totals bar and Planned row never jump when an extra is added. Extras count toward "eaten" and toward meal status (§4.2). They are added already ticked, because you add them after eating them.
12. **"Mark as not eaten" unticks the planned items only.** Extras stay in the log; removing one is a separate × in the sheet.
13. **Free slot status:** "eaten" once it has ≥ 1 entry, otherwise "none" (drives HOME-9 and "next meal").
14. **§4.4 projection detail:** "remaining planned" = planned values of **unticked** items in non-free-slot meals. A ticked item counts as done even if a smaller amount was eaten, so eating half a scoop lowers the projection.
15. **Amount eaten:** typing an amount ticks the item; clearing the field means "the planned amount". The value is computed from the base when the unit is compatible, otherwise proportionally (§4.2).
16. **Ring colours:** the spec defines terracotta (short / over) and forest + check (met). Minimums in between ("on track") use olive.
17. **Targets panel placement:** a porcelain card between the header pill strip and the timeline, so the poster still reads top-down: title → today's progress → meals → totals → footer.
18. **Day rollover:** besides launch and `visibilitychange`, a timer fires at local midnight (plus a one-minute clock for the next-meal highlight), for when the app is left open and visible across midnight.
19. **Sheet dragging:** only the handle/header area starts a drag, so the item list scrolls normally (same idea as §11.9 for reordering).
20. **Version:** `package.json` version bumped to 0.2.0 for Phase 2 (shown in Settings → Version).
21. **When the PLAN-9 prompt appears:** plan edits save on every change. If today has logging activity, the owner is asked **once, when leaving the Plan tab** (not on every keystroke), and only if today's snapshot really differs from the plan. If the app is closed before leaving the tab, today stays as it was (same as "No").
22. **Meal order is manual.** The timeline follows the drag order (`order`); editing a meal's time does not re-sort it.
23. **New meals** start as "New meal" with the "sun" icon, at the last meal's time, so they can be dragged into place. **New items** start as "New item", 1 serving, 0 kcal, manual.
24. **Adding a base pre-fills it** from the item's current values and amount (e.g. Curd 200 g · 120 kcal → 60 kcal per 100 g). Adding a base never changes typed values by itself.
25. **Free slot toggle keeps items:** turning a meal into a free slot hides its items instead of deleting them, and gives a default budget of 100 kcal if none was set.
26. **Undo toasts:** one at a time (a new one replaces the old), 5s, shown above the tab bar and above sheets. Undo re-inserts the deleted meal/item at its old position.
27. **Editors save via updaters:** sheets pass functions that are applied to the freshly stored meal/item inside the save transaction, so quick edits across fields can't overwrite each other.
28. **Version:** 0.3.0 for Phase 3.
29. **Where item photos show:** in the meal detail sheet, the plan editor rows and the free-slot entry rows (36 px thumbnails). The Today poster cards show only the meal photo, so the poster stays as clean as the original design.
30. **Photos on today's extras and free-slot entries** are both offered through the same quick-entry form (PHOTO-1 says "meal or item … and free-slot entry", and extras are items).
31. **Orphan photo clean-up timing:** on launch, and 15 s after any photo removal or meal/item delete (so Undo still works), with a 10-minute grace period for brand-new photos.
32. **Thumbnail blur** is applied when displayed (CSS `blur`) rather than baked into the data URL; the stored thumbnail is a plain 24 px JPEG.
33. **Version:** 0.4.0 for Phase 4.
34. **Photo crop (owner request after Phase 4 iPhone testing, not in SPEC.md).** The iOS file picker offers no crop for web pages, so every picked or taken photo opens an in-app **Move and scale** screen: drag to move, pinch / slider / mouse wheel to zoom (1×–5×), with a circle guide because photos show in round frames. **Use photo** stores the square around the circle (≤ 1000 px JPEG, same rules as PHOTO-2); **Cancel** stores nothing. Only the cropped image is kept, not the original. It applies to camera shots too, since a web page can't tell camera from library. Version 0.4.1.
35. **Export is two taps** ("Export backup" → "Save backup file"). iOS only opens the share sheet straight after a tap, and building the file (reading every photo) can take long enough to lose that permission. The second tap shares a file that is already built.
36. **Targets apply from today:** editing targets updates today's `targetsSnapshot` too, so today's rings change immediately; past days keep the targets that applied then (HIST-2 shows them).
37. **Day dots:** the spec's "colour dot reflects kcal vs target" uses the §4.4 past-day rule (terracotta if kcal over **or** a minimum missed), plus grey for days with nothing eaten logged and olive for today (still in progress).
38. **Calendar weeks start on Monday.** Months can be browsed back to the first logged month.
39. **Import also recreates today's log** if the backup doesn't contain today, so the Today tab is never empty after a restore.
40. **Backup validation** checks everything the app relies on (and that the base64 photo data decodes); unknown extra fields are kept as they are.
41. **The "Back up now" banner** switches to Settings and starts preparing the file; the owner then taps "Save backup file".
42. **Version:** 0.5.0 for Phase 5.
43. **ANIM-5 implementation:** the card's background is its own layer (`CardShell` surface) sharing a `layoutId` with the sheet's surface. While its sheet is open the card keeps its place in the timeline with the content faded out, so nothing jumps. Plan-editor sheets (no card to come from) still slide up from the bottom.
44. **ANIM-10 scope:** parallax only on the live Today poster (not History, sheets or editors), ±5 px.
45. **Under Reduce Motion** the card → sheet morph is replaced by a plain fade, and the ring fill and check drawing happen at once (MotionConfig alone would still animate pathLength, which isn't a transform).
46. **Version:** 1.0.0 — all phases of SPEC.md are complete.
47. **Dark theme (owner request after Phase 6, not in SPEC.md).** A Dark / Light toggle in Settings → Appearance; **dark is the default**.
    - **Look:** a deep forest → near-black gradient with a soft green glow at the top and a faint gold glow bottom-right, the linen texture in light ink, and light-green accents.
    - **How:** components only use the palette tokens, and `:root[data-theme='dark']` re-maps them. --cream becomes the dark background and --forest a light green, so "forest pill + cream text" turns into "light-green pill + dark text" and stays readable. Small extra tokens: field, rim, track, scrim, toast, glass. The crop screen is always dark. Light is the original cream poster, unchanged.
    - **Storage:** the choice is stored in Settings (so backups carry it) and mirrored to localStorage. An inline script in `index.html` sets `data-theme` and the status-bar metas before first paint, so there's no flash.
    - **Status bar:** this deviates from IOS-5 for dark only. A dark background needs white status-bar text, so dark uses `black-translucent`; light keeps `default`. iOS reads this meta when the installed app launches, so after switching theme the status bar follows on the next launch (noted in Settings). The manifest background / theme colour is now the dark background, so the launch splash is dark.
    - **Frosted strip:** the strip under the status bar is now frosted glass (instead of solid cream), so it blends with both themes.
    - **Version:** 1.1.0.
