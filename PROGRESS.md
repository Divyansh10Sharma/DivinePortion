# PROGRESS.md

**Current phase:** Phase 2 complete — waiting for the owner's go-ahead for Phase 3.

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

## Requirement status

| ID | Status | Notes |
|---|---|---|
| IOS-1 | ✅ | `index.html` viewport meta with `viewport-fit=cover` |
| IOS-2 | ✅ | Scroll containers pad top/bottom with `env(safe-area-inset-*)`, root pads left/right, tab bar pads bottom; a solid cream strip sits under the status bar so scrolled content never collides with it |
| IOS-3 | ✅ | `assets/icon-source.svg` → `npm run icons` (sharp) → `public/apple-touch-icon.png` (180, flattened, no alpha), `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png` (art in 80% safe zone), `favicon.svg` |
| IOS-4 | ✅ | Both capable metas; manifest `display: standalone` |
| IOS-5 | ✅ | Status bar `default`, `theme-color` `#F6F1E7`, title "Plate" |
| IOS-6 | ✅ | html/body locked (`overflow:hidden`, `overscroll-behavior:none`), each tab is its own `.scroll-area`. An open bottom sheet holds a UI lock; while it does, the screen behind gets `overflow-y: hidden`, and the sheet's own content area is `overscroll-behavior: contain` |
| IOS-7 | ✅ | Global CSS: inputs/selects/textareas `font-size: max(16px, 1rem)` (no input overrides it). Every numeric input uses `inputMode="decimal"`; `NumberInput` accepts both `1.5` and `1,5` |
| IOS-8 | ✅ | Tap highlight off, `user-select: none` on chrome/buttons (inputs re-enabled), `touch-action: manipulation` on buttons |
| IOS-9 | ✅ | Workbox precaches JS/CSS/HTML/SVG/PNG/woff2 (33 entries, about 1.1 MB). Verified: production preview reloads with full UI and fonts while offline |
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
| LOG-1 | ✅ | `ensureDayLog(localDateKey())` creates a deep-copied snapshot of plan + targets on the first open of the day (rw transaction). The date is re-checked every minute, at local midnight, and on `visibilitychange` → visible (`useNow`). Never uses `toISOString()` (unit-tested in IST) |
| LOG-2 | ✅ | "Mark eaten" on each card ticks every item (incl. extras). The "Eaten" button opens an inline "Keep / Mark as not eaten" choice. Animation per ANIM-3 |
| LOG-3 | ✅ | The meal sheet ticks/unticks each item, and has an "amount eaten" field per item (blank = planned; typing an amount ticks the item). Status none / partial / eaten is derived on every change |
| LOG-4 | ✅ | "Add an extra item (today only)" in the sheet: name, amount, unit, kcal, optional P/C/F/fibre. Stored in `DayLog.extraItems`; the plan is untouched. Shown on the card as "+ name · today" |
| LOG-5 | ⚠️ | Free-slot sheet: name, kcal, optional P/C/F/fibre, multiple entries, remove; budget remaining / over (terracotta). **The optional photo comes in Phase 4**, whose checklist covers photos for free-slot entries |
| LOG-6 | ✅ | Targets panel table: Eaten vs Planned for kcal · P · C · F · Fibre. Planned kcal includes the free-slot budget |
| LOG-7 | ✅ | Four rings (Calories of 2363, Protein / Fat / Fibre minimums) with the §4.4 colours and a check when met, plus a one-line text warning so colour isn't the only signal. Uses `DayLog.targetsSnapshot` |
| LOG-8 | ⏳ | Phase 5 (Settings) |
| §4.4 | ✅ (today) | kcal terracotta when eaten > target. Minimums are projected (eaten + unticked planned items of non-free-slot meals): terracotta if short, forest + check once met, olive in between. Seed day starts with fat "on course for 39g" as intended. The History part comes in Phase 5 |
| HIST-1 … HIST-3 | ⏳ | Phase 3 / 5 |
| PLAN-1 … PLAN-10 | ⏳ | Phase 3. PLAN-3's icon registry (10 icons incl. apple/bowl/cup/sparkle) already exists in `src/components/icons/registry.ts` |
| PHOTO-1 … PHOTO-4, PHOTO-6 | ⏳ | Phase 4 |
| PHOTO-5 | ✅ | `PlatePlaceholder` SVG: porcelain plate (rim, inner shadow, gold line) on linen |
| SET-1 … SET-6 | ⏳ | Phase 5 |
| SET-7 | ⚠️ | Storage status + version already shown in Settings; the full Settings screen comes in Phase 5 |
| NAV-1 | ✅ | Frosted cream glass (`-webkit-backdrop-filter` too), gold hairline, safe-area bottom, active tab forest + sliding indicator |
| NAV-2 | ✅ | State-based tabs with optional `#history` / `#plan` / `#settings` hash (`replaceState`, no router) |
| ANIM-1 | ✅ (basic) | Timeline line scaleY from top, cards fade + rise with 70ms stagger |
| ANIM-2 | ✅ (basic) | `AnimatedNumber`: spring-driven motion value rendered rounded (header kcal/protein, totals bar, rings, Eaten/Planned table, sheet totals) |
| ANIM-3 | ✅ (basic) | When a meal becomes eaten (from the card or the sheet): the check draws itself (pathLength), the card settles 1 → 0.975 → 1, and a green ripple expands from the timeline dot |
| ANIM-4 | ✅ (basic) | `ProgressRing`: pathLength spring fill; colour changes via a CSS transition |
| ANIM-5 | ✅ (basic) | The meal photo flies from the card into the sheet header and back (`layoutId`). A whole-card expand is left for the Phase 6 polish |
| ANIM-6 | ✅ (basic) | Sheet springs up and the backdrop fades. Drag the handle/header down to dismiss (distance > 110px or velocity > 600px/s); dragging up past the top rubber-bands (elastic 0.05). Esc / backdrop tap closes |
| ANIM-11 | ✅ | `<MotionConfig reducedMotion="user">` at the root; `AnimatedNumber` jumps and the settle is skipped under reduced motion. Verified with emulated reduced motion: no errors |
| ANIM-7 … ANIM-10, ANIM-12 | ⏳ | Phases 3–6 (everything so far animates only transform / opacity / SVG stroke) |

Unit tests (Vitest, 46 passing):
- `src/lib/nutrition.test.ts`: scaling, compatibility, eaten value, meal status, planned totals, display rounding.
- `src/db/seed.test.ts`: §4.3 per-meal and day totals, seed only when empty.
- `src/lib/dayLog.test.ts` (runs in IST): local date vs `toISOString` at 04:45, midnight rollover, deep-copy day creation, whole / partial meals (with and without a base), over-eating, extras, free slot entries and budget, §4.4 projections, next meal.
- `src/db/dayLogs.test.ts`: create once, later plan changes don't leak into an existing day, the next day snapshots the new plan.
- `src/lib/format.test.ts`: decimal parsing (`1,5` / `1.5`), display rounding.

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
