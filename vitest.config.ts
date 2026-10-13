import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts so tests don't load the PWA/Tailwind plugins.
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('test'),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
