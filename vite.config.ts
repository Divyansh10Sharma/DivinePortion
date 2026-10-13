import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// Splash / UI colour: the default (dark) theme's background.
const APP_BG = '#0F1A14';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // IOS-11: new versions install automatically; the actual page reload is
      // deferred by src/lib/swUpdate.ts so it never interrupts an open sheet/editor.
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Plate — Meal Plan',
        short_name: 'Plate',
        description: 'Personal meal plan & calorie log. All data stays on this device.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: APP_BG,
        theme_color: APP_BG,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // IOS-9: precache the whole app shell incl. self-hosted fonts and icons.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
