import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '../tests/e2e',
  testMatch: /full-system\.spec\.(js|mjs)$/,
  timeout: 30_000,
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
});
