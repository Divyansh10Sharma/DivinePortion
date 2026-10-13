# PROGRESS.md

**Current phase:** Phase 1 complete — waiting for the owner's go-ahead for Phase 2.

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

## Requirement status

| ID | Status | Notes |
|---|---|---|
| IOS-1 | ✅ | `index.html` viewport meta with `viewport-fit=cover` |
| IOS-2 | ✅ | Scroll containers pad top/bottom with `env(safe-area-inset-*)`, root pads left/right, tab bar pads bottom; a solid cream strip sits under the status bar so scrolled content never collides with it |
| IOS-3 | ✅ | `assets/icon-source.svg` → `npm run icons` (sharp) → `public/apple-touch-icon.png` (180, flattened, no alpha), `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png` (art in 80% safe zone), `favicon.svg` |
| IOS-4 | ✅ | Both capable metas; manifest `display: standalone` |
| IOS-5 | ✅ | Status bar `default`, `theme-color` `#F6F1E7`, title "Plate" |
| IOS-6 | ⚠️ | html/body locked (`overflow:hidden`, `overscroll-behavior:none`), each tab is its own `.scroll-area`. Bottom-sheet scroll lock has nowhere to go yet because there are no sheets; it comes with the first sheet in Phase 2 (via `useUiLock`) |
| IOS-7 | ✅ | Global CSS: inputs/selects/textareas `font-size: max(16px, 1rem)`. No inputs exist yet; `inputMode="decimal"` will be applied as numeric inputs are added (Phase 2/3) |
| IOS-8 | ✅ | Tap highlight off, `user-select: none` on chrome/buttons (inputs re-enabled), `touch-action: manipulation` on buttons |
| IOS-9 | ✅ | Workbox precaches JS/CSS/HTML/SVG/PNG/woff2 (33 entries, about 1.1 MB). Verified: production preview reloads with full UI and fonts while offline |
| IOS-10 | ✅ | `navigator.storage.persist()` on launch (best effort); Settings shows "Storage: persistent / may be evicted" |
| IOS-11 | ✅ | `registerType: 'autoUpdate'`; `src/lib/swUpdate.ts` defers the reload while any UI lock (sheet/editor) is open, and only reloads while the app is backgrounded or within 5s of launch |
| HOME-1 | ✅ | Header, timeline, totals bar, footer |
| HOME-2 | ✅ | Live `plannedWithSnack` kcal → 2363, with leaf flourishes |
| HOME-3 | ✅ | Pill strip, protein live from items → 143g |
| HOME-4 | ✅ | Time + icon node, plate frame (placeholder), name, items with right-aligned grey macros, bold subtotal, top-right forest pill |
| HOME-5 | ✅ | Dashed olive border, porcelain, "~130 kcal", hint |
| HOME-6 | ✅ | Item note inline italic; meal badge as terracotta uppercase pill |
| HOME-7 | ✅ | Meals-only line (2233 · 143 · 325 · 39 · 58) + "With snack: 2363 kcal" |
| HOME-8 | ✅ | Three columns, gold hairlines, from `settings.footerItems` |
| HOME-9 | ⏳ | Phase 2 |
| LOG-1 … LOG-8 | ⏳ | Phase 2 (LOG-8 in Phase 5) |
| HIST-1 … HIST-3 | ⏳ | Phase 3 / 5 |
| PLAN-1 … PLAN-10 | ⏳ | Phase 3. PLAN-3's icon registry (10 icons incl. apple/bowl/cup/sparkle) already exists in `src/components/icons/registry.ts` |
| PHOTO-1 … PHOTO-4, PHOTO-6 | ⏳ | Phase 4 |
| PHOTO-5 | ✅ | `PlatePlaceholder` SVG: porcelain plate (rim, inner shadow, gold line) on linen |
| SET-1 … SET-6 | ⏳ | Phase 5 |
| SET-7 | ⚠️ | Storage status + version already shown in Settings; the full Settings screen comes in Phase 5 |
| NAV-1 | ✅ | Frosted cream glass (`-webkit-backdrop-filter` too), gold hairline, safe-area bottom, active tab forest + sliding indicator |
| NAV-2 | ✅ | State-based tabs with optional `#history` / `#plan` / `#settings` hash (`replaceState`, no router) |
| ANIM-1 | ✅ (basic) | Timeline line scaleY from top, cards fade + rise with 70ms stagger |
| ANIM-11 | ✅ | `<MotionConfig reducedMotion="user">` at the root |
| ANIM-2 … ANIM-10, ANIM-12 | ⏳ | Phases 2–6 (Phase 1 animates only transform/opacity) |

Unit tests (Vitest, 24 passing): `src/lib/nutrition.test.ts` (scaling, compatibility, eaten value, meal status, planned totals, display rounding), `src/db/seed.test.ts` (§4.3 per-meal and day totals, seed-only-when-empty using fake-indexeddb).

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
