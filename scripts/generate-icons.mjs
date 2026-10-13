// Generates all PWA / iOS icons from the image named by `AppIcon` in assets/index.js (IOS-3).
// Runs automatically before `npm run build` and `npm run dev` (npm "pre" scripts), so the
// generated files in public/ are not committed — changing AppIcon and pushing is enough.
// Manual run: npm run icons
import { access, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = path.join(root, 'assets');
const out = path.join(root, 'public');
const BACKGROUND = '#0F1A14'; // dark theme background — fills transparent pixels (iOS shows black there otherwise)

const { AppIcon } = await import(pathToFileURL(path.join(assetsDir, 'index.js')).href);
if (typeof AppIcon !== 'string' || AppIcon.trim() === '') {
  throw new Error('assets/index.js must export AppIcon, e.g. export const AppIcon = "./MyIcon.png";');
}
const source = path.resolve(assetsDir, AppIcon);
try {
  await access(source);
} catch {
  throw new Error(`AppIcon points to ${path.relative(root, source)}, which does not exist.`);
}
const meta = await sharp(source).metadata();
if (meta.width !== meta.height) {
  console.warn(`AppIcon is ${meta.width}×${meta.height}, not square — it will be centre-cropped.`);
}

await mkdir(out, { recursive: true });

/** Square, centre-cropped, full-bleed icon with no alpha channel. */
async function icon(size, file, { palette = false } = {}) {
  await sharp(source)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .flatten({ background: BACKGROUND })
    // Palette PNGs are ~60% smaller and look the same at icon sizes; they're precached for offline (IOS-9).
    .png(palette ? { palette: true, quality: 90, effort: 10, dither: 1 } : { compressionLevel: 9 })
    .toFile(path.join(out, file));
}

// The iPhone home-screen icon stays full colour (it's small anyway) for the best quality.
await icon(180, 'apple-touch-icon.png');
await icon(192, 'pwa-192.png', { palette: true });
await icon(512, 'pwa-512.png', { palette: true });
await icon(512, 'pwa-maskable-512.png', { palette: true }); // full-bleed; the mask trims only the edges
await icon(64, 'favicon.png', { palette: true });

console.log(`Icons generated from assets/${path.relative(assetsDir, source).replaceAll('\\', '/')}`);
