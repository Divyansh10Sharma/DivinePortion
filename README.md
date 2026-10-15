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
Four sections in the tab bar:
- **Today:** your current meals as a poster, with the **total macros on top** (kcal · protein · carbs · fat · fibre, plus the total with the free-slot snack). The gear (top right) opens **Settings**.
- **Plans:** **Save current meals as a plan**, give it a name, and it appears as a card. Tap a card to see that plan; **Use this plan** makes it your current meals (after a confirmation — save the current meals first if you want to keep them).
- **Meals:** edit the current meals — name, time, photo, badge, note, free slot with its kcal budget. Drag **⋮⋮** to reorder, swipe left to delete (Undo for 5 s). Inside a meal, **Add from Your items** lets you search your items, tap one, type the grams and **Add** (you can add several in a row). Tap an item in the meal to change its grams or remove it.
- **Items ("Your items"):** every food you use, one row each — **Name · Kcal · Protein · Carbs · Fats · Fiber, per 100 g**. **Add** creates one; tap a row to edit or delete it. Editing an item updates it in your current meals (saved plans keep the values they were saved with).

Also:
- **Photos:** one per meal (in the meal editor), from the camera or the library, framed on the **Move and scale** screen.
- **Settings** (gear on Today): Dark / Light theme, the three poster footer items, backup export / import, storage status and version.
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
- [ ] **Notch clearance:** nothing is hidden under the notch on Today, Plans, Meals, Items, Settings, or in any sheet, dialog or the crop screen.
- [ ] **Home-indicator clearance:** the tab bar, the bottom of every sheet, the toast and the crop buttons sit above the home indicator bar.
- [ ] **No whole-page rubber-band:** pulling down at the top or up at the bottom of a screen bounces only that screen's content; the tab bar and status-bar strip never move.
- [ ] **Background stays put under sheets:** with a meal editor or the item picker open, swiping on the sheet's list doesn't scroll the screen behind it.

**Inputs**
- [ ] **No zoom on focus:** tapping any field (item name and macros, grams, meal fields, plan name, search, footer text) never zooms the page.
- [ ] **Decimal keypad:** number fields (macros per 100 g, grams, free-slot budget) open the decimal keypad; both "1.5" and "1,5" work.

**Offline & data**
- [ ] **Offline launch:** with Airplane Mode on, close the app from the app switcher and reopen it. Everything works, including fonts, icons and photos.
- [ ] **Data survives relaunch:** add an item to Your items and to a meal, close the app from the app switcher, reopen. Both are still there.
- [ ] **Data survives phone restart:** restart the iPhone, open Plate. Meals, Your items, saved plans and photos are all there.
- [ ] **Storage status:** Settings → About → Storage shows "persistent" or "may be evicted" (either is fine; just note which).

**Your items, meals & plans**
- [ ] **Your items:** Items → **Add** → name + macros per 100 g → **Add item**; it appears as a row. Tap it, change a value, **Save changes**; meals using it update on Today.
- [ ] **Pick into a meal:** Meals → a meal → **Add from Your items** → search → tap an item → grams → **Add**; Today shows it with the right kcal.
- [ ] **Saved plans:** Plans → **Save current meals as a plan** → name → **Save**; the card appears. Change a meal, then tap the card → **Use this plan** → **Use plan**; Today shows the saved version again.

**Animation**
- [ ] **Sheets:** meal editor, item picker and saved-plan view slide up smoothly; dragging the handle down closes them.
- [ ] **Counting numbers:** after adding an item to a meal, Today's totals count up smoothly.
- [ ] **Parallax:** scrolling Today makes meal photos drift slightly inside their frames.
- [ ] **Reduced motion:** turn on iPhone **Settings → Accessibility → Motion → Reduce Motion**. Movement becomes simple fades (no sliding, scaling, parallax or drawing). Turn it off again.

**Plan editing**
- [ ] **Drag reorder by touch:** in Meals, drag a meal by its **⋮⋮** handle to a new position. Scrolling the list by swiping anywhere else still works normally.
- [ ] **Drag reorder items:** same inside a meal's item list.
- [ ] **Swipe-delete + undo:** swipe a meal or item left to delete it, then tap **Undo** within 5 seconds. It comes back in the same place.

**Photos**
- [ ] **Camera upload:** Meals → a meal → **Add photo** → **Take Photo** → **Use Photo** → crop → **Use photo**. The photo shows.
- [ ] **Library upload:** **Replace photo** → **Photo Library** → pick a photo → crop. The photo shows.
- [ ] **Photo orientation correct:** photos taken upright and sideways both appear the right way up.
- [ ] **Crop:** drag and pinch on the crop screen; the saved photo matches what was in the circle. **Cancel** keeps the old photo.

**Backup**
- [ ] **Export via share sheet to Files:** Settings → **Export backup** → **Save backup file** → **Save to Files** → iCloud Drive → **Save**. "Last backup" changes to **Today**.
- [ ] **Import back:** Settings → **Import backup** → pick that file → the summary shows the right number of meals, items, saved plans and photos → **Replace** → everything is as before.

**Updates**
- [ ] **App update after redeploy:** after pushing a change, open Plate, wait ~5 s, close and reopen. **Settings → Version** shows the new version, and no data is lost.

## Project layout
```
assets/            index.js (`AppIcon` = which image is the app icon) + the icon images
scripts/           generate-icons.mjs
public/            generated icons (apple-touch-icon, pwa-192/512, maskable, favicon.png) — built, not committed
src/
  db/              Dexie schema v2 (db.ts), seed data (seed.ts), plan writes (plan.ts), Your items + saved plans (library.ts),
                   photos.ts, settings.ts, backup.ts (export / import)
  lib/             types, nutrition math, Your items logic + v1 migration (library.ts), plan editing (planEdit.ts),
                   images.ts, crop.ts, backup.ts (file format + validation), formatting,
                   storage persistence, SW update policy, UI locks
  components/      poster/, timeline/, cards/, sheets/, inputs/, anim/, icons/, nav/,
                   plan/ (meal & item editors), items/ (item form, item picker), dnd/, toast/, dialog/, photos/
  screens/         Today, Plans, Meals, Items, Settings
  hooks/           useActiveTab, planSync (savePlan), backupFlow (export / share state), scrollContainer (parallax)
  styles/          index.css (Tailwind v4, palette tokens, linen texture, iOS shell rules)
```
