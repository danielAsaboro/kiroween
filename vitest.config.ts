import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['skeleton/**/*.test.ts', 'apps/**/*.test.ts'],
    passWithNoTests: true,
  },
});
