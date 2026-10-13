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
| `npm run icons` | Regenerates `public/*.png` icons from `assets/icon-source.svg` (only needed after editing the SVG) |

## Using it (current features)
- **Today** shows today's plan as a poster. Each day gets its own log (a copy of the plan), created the first time the app opens that day.
- **Mark eaten** on a card logs the whole meal; tap **Eaten** again to undo.
- **Tap a card** to open its sheet: tick single items, type the amount you actually ate, or add an extra item for today only.
- **Free Slot → Log snack** records what you ate; the card shows the budget remaining or over.
- The rings at the top track calories and the protein / fat / fibre minimums. Terracotta means over, or on course to fall short.
- **Plan** tab: edit the plan title, then tap a meal to change its name, time, icon, badge, note and free-slot budget, and its items.
  - Drag **⋮⋮** to reorder meals and items; swipe left to delete (an Undo toast appears for 5 seconds).
  - In an item, add a **base** (per 100 g / 100 ml / piece). Changing the amount then recalculates the values; typing a value makes them manual, and **Recalculate from base** switches back.
  - Changes apply from today onward. If you've already logged something today, leaving the Plan tab asks whether to apply them to today too. Past days never change.

## Preview at iPhone size
Chrome → F12 → Toggle device toolbar (**Ctrl+Shift+M**) → choose **iPhone 12 Pro** (390×844, same as the 13 Pro).
DevTools doesn't emulate the notch, safe areas or standalone mode.

Optional real-device layout check: `npm run dev -- --host`, then open the LAN address it prints on the iPhone (same Wi-Fi; allow Node through Windows Firewall when asked). The service worker doesn't run there because it isn't HTTPS. Testing the installed app needs the deployed HTTPS site.

## Deploy (Netlify)
`netlify.toml` is included. It sets the build command, the publish dir, and cache headers (`sw.js`, `index.html` and the manifest use `no-cache`; hashed `/assets/*` are immutable).
```powershell
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --dir=dist          # draft URL to test
netlify deploy --prod --dir=dist   # production URL
```
Or connect the Git repo in the Netlify dashboard (build command `npm run build`, publish directory `dist`).

## Deploy (Vercel)
`vercel.json` is included, with the same build settings and cache headers as `netlify.toml`.

**Git integration (recommended):** on vercel.com go to Add New → Project, then import `Divyansh10Sharma/DivinePortion`. Vercel detects Vite automatically (build `npm run build`, output `dist`). After that, every push to `main` deploys to production.

**CLI:**
```powershell
npm i -g vercel
vercel login
vercel          # preview URL
vercel --prod   # production URL
```

## Install on iPhone
1. Open the production HTTPS URL in **Safari**.
2. Let it load fully once (this caches it for offline).
3. Share → **Add to Home Screen** → name "Plate" → Add.
4. Launch from the home-screen icon. It opens standalone, with no browser bars.
5. Test offline: turn on Airplane Mode and launch again. It must still work.
6. Once backups exist (Phase 5): Settings → Export, and save the file to Files/iCloud.

> iOS keeps installed-PWA data separate from Safari tabs, and can evict it if the app isn't used for a long time. Export backups regularly.

## Project layout
```
assets/            icon-source.svg (single icon source)
scripts/           generate-icons.mjs
public/            generated icons, favicon
src/
  db/              Dexie schema (db.ts), seed data (seed.ts), day logs (dayLogs.ts), plan writes (plan.ts)
  lib/             types, nutrition math, day-log logic (dayLog.ts), plan editing (planEdit.ts),
                   PLAN-9 merge (planMerge.ts), local dates, formatting,
                   storage persistence, SW update policy, UI locks
  components/      poster/, timeline/, cards/, rings/, sheets/, inputs/, anim/, icons/, nav/,
                   plan/ (meal & item editors), dnd/ (sortable, swipe-to-delete), toast/, dialog/
  screens/         Today, Plan, Settings, placeholders
  hooks/           useActiveTab, useToday (local date + rollover), useLogActions, planSync (PLAN-9 prompt state)
  styles/          index.css (Tailwind v4, palette tokens, linen texture, iOS shell rules)
```
