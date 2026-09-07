const { defineConfig } = require('playwright/test');

module.exports = defineConfig({
  // The E2E suite lives beside the frontend so CI runs the tests checked into
  // the frontend workspace after starting the real API and preview server.
  testDir: './e2e',
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
