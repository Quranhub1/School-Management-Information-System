const { defineConfig } = require('playwright/test');

module.exports = defineConfig({
  // The E2E suite lives at the repository root so it can validate the
  // complete API + frontend integration rather than only frontend internals.
  testDir: '../tests/e2e',
  testMatch: '**/*.spec.{js,mjs,cjs}',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: 'line',
  use: {
    browserName: 'chromium',
    baseURL: process.env.FRONTEND_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
});
