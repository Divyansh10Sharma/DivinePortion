# Plate

A personal meal-planning and calorie-logging PWA that installs on the iPhone home screen and runs full-screen and offline. All data stays on the device (IndexedDB). No backend, no login.

The full specification is in [SPEC.md](SPEC.md); status and decisions are tracked in [PROGRESS.md](PROGRESS.md).

## Requirements
- Node.js **20.19+** (or 22.12+) and npm
- Windows PowerShell (all commands below work there)

## Run (Windows PowerShell)
```powershell
npm install
npm run dev            # http://localhost:5173
npm run test           # unit tests (Vitest)
npm run build; npm run preview   # production build incl. service worker, http://localhost:4173
```

Other scripts:
| Script | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint |
| `npm run icons` | Generates `public/*.png` icons (home screen, manifest, favicon) from the image named in `assets/index.js`. Runs automatically before `dev` and `build` |

## Using it
- **Today** shows today's plan as a poster. Each day gets its own log (a copy of the plan), created the first time the app opens that day; it also rolls over at midnight if the app stays open.
- **Mark eaten** on a card logs the whole meal; tap **Eaten** again to undo.
- **Tap a card**: it expands into its sheet. Tick single items, type the amount you actually ate, or add an extra item for today only. Drag the sheet down to close it.
- **Free Slot → Log snack** records what you ate; the card shows the budget remaining or over.
- The rings at the top track calories and the protein / fat / fibre minimums. Terracotta means over, or on course to fall short.
- **Plan** tab: edit the plan title, then tap a meal to change its name, time, icon, photo, badge, note and free-slot budget, and its items.
  - Drag **⋮⋮** to reorder meals and items; swipe left to delete (an Undo toast appears for 5 seconds).
  - In an item, add a **base** (per 100 g / 100 ml / piece). Changing the amount then recalculates the values; typing a value makes them manual, and **Recalculate from base** switches back.
  - Changes apply from today onward. If you've already logged something today, leaving the Plan tab asks whether to apply them to today too. Past days never change.
- **Photos:** add one to any meal or item (in its editor), or to an extra / snack entry, from the camera or the library. A **Move and scale** screen lets you drag and pinch to frame it in the circle; tap **Use photo**. Photos are compressed on the phone and stored only on the device.
- **History:** a month calendar with a dot per logged day (green = targets met, terracotta = over calories or a minimum missed, grey = nothing eaten logged, olive = today), plus a list. Tap a day to see its poster exactly as logged.
- **Settings:** daily targets (apply from today), the three poster footer items, backup, reset today's log, storage status and version.
- **Appearance:** dark gradient theme by default; switch to the original cream **Light** theme in Settings → Appearance. On the installed app the status-bar colour follows after the next launch.
- The iPhone's **Reduce Motion** setting is respected: movement becomes simple fades.

## Changing the app icon
1. Put the new image in `assets/` (PNG or JPEG; square is best, other shapes are centre-cropped).
2. In `assets/index.js`, point `AppIcon` at it, e.g. `export const AppIcon = './MyIcon.png';`
3. Commit and push. The build regenerates every icon (iPhone home screen, app, maskable, favicon); if the path is wrong the build stops with a clear error.

iOS keeps the home-screen icon it saw when Plate was added, so on the iPhone: back up (Settings → Export backup → Save to Files), remove Plate from the Home Screen, add it again from Safari, then Settings → Import backup.

## Backup (do this regularly)
iOS can clear the data of a home-screen app that isn't used for a while, and the installed app's data is separate from Safari.
1. **Settings → Export backup**, then tap **Save backup file**.
2. In the share sheet choose **Save to Files**, then **iCloud Drive** (e.g. a "Plate" folder), then **Save**.
3. To restore: **Settings → Import backup**, pick the `plate-backup-YYYY-MM-DD.json` file, check the summary (days, photos, dates), then tap **Replace**. Everything in the app is replaced by the backup.

If you haven't backed up for more than 7 days, a reminder appears on Today (you can hide it for a day).

## Preview at iPhone size
Chrome → F12 → Toggle device toolbar (**Ctrl+Shift+M**) → choose **iPhone 12 Pro** (390×844, same as the 13 Pro).
DevTools doesn't emulate the notch, safe areas or standalone mode.

Optional real-device layout check: `npm run dev -- --host`, then open the LAN address it prints on the iPhone (same Wi-Fi; allow Node through Windows Firewall when asked). The service worker doesn't run there because it isn't HTTPS. Testing the installed app needs the deployed HTTPS site.

## Deploy

Both configs are included and set the same cache headers: `sw.js`, `index.html` and `manifest.webmanifest` are served with `Cache-Control: no-cache` (so updates are picked up), and the content-hashed `/assets/*` files are cached for a year (`immutable`).

### Vercel (what this project uses)
**Git integration (recommended):**
1. Push to GitHub (`Divyansh10Sharma/DivinePortion`, branch `main`).
2. On vercel.com: **Add New → Project → Import** the repo. Vercel detects Vite and reads `vercel.json` (build `npm run build`, output `dist`). Click **Deploy**.
3. From then on, every push to `main` deploys to production automatically. Check **Deployments** → the newest entry should be **Ready**.

**CLI (alternative):**
```powershell
npm i -g vercel
vercel login
vercel          # preview URL
vercel --prod   # production URL
```

### Netlify (alternative)
`netlify.toml` sets the build command, publish directory and headers.
```powershell
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --dir=dist          # draft URL to test
netlify deploy --prod --dir=dist   # production URL
```
Or connect the Git repo in the Netlify dashboard (build command `npm run build`, publish directory `dist`).

### Getting an update onto the iPhone
After a deploy, open Plate from the Home Screen, wait ~5 seconds, close it from the app switcher and open it again (repeat once if needed). **Settings → Version** shows the running version. Updates never reload the app while a sheet or editor is open.

## Install on iPhone
1. Open the production HTTPS URL in **Safari** (not Chrome).
2. Let it load fully once (this caches it for offline).
3. Tap **Share** → **Add to Home Screen** → check the name is **Plate** → **Add**.
4. Launch from the home-screen icon. It opens standalone, with no browser bars.
5. Test offline: turn on Airplane Mode and launch again. It must still work.
6. First thing: **Settings → Export backup → Save backup file → Save to Files** (iCloud Drive).

> iOS keeps installed-PWA data separate from Safari tabs, and can evict it if the app isn't used for a long time. Always use the Home Screen app, and export backups regularly.

## iPhone QA checklist
Run on the iPhone 13 Pro with the **installed Home Screen app** after each deploy that matters. Tick each one.

**Launch & shell**
- [ ] **Standalone launch:** opening from the Home Screen icon shows the cream splash/app, not Safari.
- [ ] **No browser chrome:** no address bar or Safari toolbar on any screen.
- [ ] **Status bar readable:** in Dark, white status-bar text over the dark top strip; in Light (after switching and relaunching), dark text on cream. Check on every tab.
- [ ] **Theme toggle:** Settings → Appearance → Light switches the whole app at once; close and reopen, and it stays Light with no dark flash. Switch back to Dark.
- [ ] **Notch clearance:** nothing is hidden under the notch on Today, History, Plan, Settings, or in any sheet, dialog or the crop screen.
- [ ] **Home-indicator clearance:** the tab bar, the bottom of every sheet, the toast and the crop buttons sit above the home indicator bar.
- [ ] **No whole-page rubber-band:** pulling down at the top or up at the bottom of a screen bounces only that screen's content; the tab bar and status-bar strip never move.
- [ ] **Background stays put under sheets:** with a meal sheet open, swiping on the sheet's list doesn't scroll the poster behind it.

**Inputs**
- [ ] **No zoom on focus:** tapping any field (snack name, kcal, amounts, plan fields, targets, footer text) never zooms the page.
- [ ] **Decimal keypad:** number fields (kcal, amounts, macros, targets) open the decimal keypad; both "1.5" and "1,5" work.

**Offline & data**
- [ ] **Offline launch:** with Airplane Mode on, close the app from the app switcher and reopen it. Everything works, including fonts, icons and photos.
- [ ] **Data survives relaunch:** log a meal, close the app from the app switcher, reopen. Still logged.
- [ ] **Data survives phone restart:** restart the iPhone, open Plate. Plan, today's log, history and photos are all there.
- [ ] **Midnight rollover with the app left open:** leave Plate open (or in the background) across midnight. On returning, Today is a fresh day, and yesterday appears in History with its log intact.
- [ ] **Storage status:** Settings → About → Storage shows "persistent" or "may be evicted" (either is fine; just note which).

**Logging & animation**
- [ ] **Eaten animation smoothness:** tap **Mark eaten**. The check draws itself, the card settles, and a green ripple spreads from the timeline dot, all without stutter.
- [ ] **Card → sheet:** tapping a card expands it smoothly into the sheet, and dragging the sheet down shrinks it back into the card.
- [ ] **Counting numbers & rings:** after logging, the totals count up and the rings fill smoothly.
- [ ] **Parallax:** scrolling Today makes meal photos drift slightly inside their frames.
- [ ] **Reduced motion:** turn on iPhone **Settings → Accessibility → Motion → Reduce Motion**. Movement becomes simple fades (no sliding, scaling, parallax or drawing). Turn it off again.

**Plan editing**
- [ ] **Drag reorder by touch:** in Plan, drag a meal by its **⋮⋮** handle to a new position. Scrolling the list by swiping anywhere else still works normally.
- [ ] **Drag reorder items:** same inside a meal's item list.
- [ ] **Swipe-delete + undo:** swipe a meal or item left to delete it, then tap **Undo** within 5 seconds. It comes back in the same place.

**Photos**
- [ ] **Camera upload:** Plan → a meal → **Add photo** → **Take Photo** → **Use Photo** → crop → **Use photo**. The photo shows.
- [ ] **Library upload:** **Replace photo** → **Photo Library** → pick a photo → crop. The photo shows.
- [ ] **Photo orientation correct:** photos taken upright and sideways both appear the right way up.
- [ ] **Crop:** drag and pinch on the crop screen; the saved photo matches what was in the circle. **Cancel** keeps the old photo.

**Backup**
- [ ] **Export via share sheet to Files:** Settings → **Export backup** → **Save backup file** → **Save to Files** → iCloud Drive → **Save**. "Last backup" changes to **Today**.
- [ ] **Import back:** Settings → **Import backup** → pick that file → the summary shows the right number of days and photos → **Replace** → everything is as before.

**Updates**
- [ ] **App update after redeploy:** after pushing a change, open Plate, wait ~5 s, close and reopen. **Settings → Version** shows the new version, and no data is lost.

## Project layout
```
assets/            index.js (`AppIcon` = which image is the app icon) + the icon images
scripts/           generate-icons.mjs
public/            generated icons (apple-touch-icon, pwa-192/512, maskable, favicon.png) — built, not committed
src/
  db/              Dexie schema (db.ts), seed data (seed.ts), day logs (dayLogs.ts), plan writes (plan.ts), photos.ts,
                   settings.ts, backup.ts (export / import)
  lib/             types, nutrition math, day-log logic (dayLog.ts), plan editing (planEdit.ts), images.ts, crop.ts,
                   backup.ts (file format + validation),
                   PLAN-9 merge (planMerge.ts), local dates, formatting,
                   storage persistence, SW update policy, UI locks
  components/      poster/, timeline/, cards/, rings/, sheets/, inputs/, anim/, icons/, nav/,
                   plan/ (meal & item editors), dnd/ (sortable, swipe-to-delete), toast/, dialog/, photos/
  screens/         Today, History, Plan, Settings
  hooks/           useActiveTab, useToday (local date + rollover), useLogActions, planSync (PLAN-9 prompt state),
                   backupFlow (export / share state), scrollContainer (parallax)
  styles/          index.css (Tailwind v4, palette tokens, linen texture, iOS shell rules)
```
