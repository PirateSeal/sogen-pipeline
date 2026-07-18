import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environmentMatchGlobs: [['web/src/**/*.test.tsx', 'jsdom']],
    include: ['tests/**/*.test.ts', 'web/src/**/*.test.tsx'],
    coverage: { include: ['src/**/*.ts', 'web/src/**/*.{ts,tsx}'] },
  },
});
