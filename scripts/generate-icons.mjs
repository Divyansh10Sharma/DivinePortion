// Generates all PWA / iOS icons from assets/icon-source.svg (IOS-3).
// Run with: npm run icons   (outputs are committed in public/, so this is only needed after editing the SVG)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'assets', 'icon-source.svg');
const out = path.join(root, 'public');
const CREAM = '#F6F1E7';

await mkdir(out, { recursive: true });
const svg = await readFile(source);

/** Full-bleed icon: the SVG already has a cream background. flatten() guarantees no alpha (iOS shows black behind transparency). */
async function plain(size, file) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .flatten({ background: CREAM })
    .png()
    .toFile(path.join(out, file));
}

/** Maskable icon: the plate is shrunk into the central ~80% safe zone so Android masks never crop it. */
async function maskable(size, file) {
  const inner = Math.round(size * 0.8);
  const art = await sharp(svg, { density: 384 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: CREAM } })
    .composite([{ input: art, gravity: 'center' }])
    .flatten({ background: CREAM })
    .png()
    .toFile(path.join(out, file));
}

await plain(180, 'apple-touch-icon.png');
await plain(192, 'pwa-192.png');
await plain(512, 'pwa-512.png');
await maskable(512, 'pwa-maskable-512.png');
await writeFile(path.join(out, 'favicon.svg'), svg);

console.log('Icons written to public/');
