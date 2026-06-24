import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  timeout: 30_000,

  /* ── Snapshot threshold for visual regression (0.2% diff allowed) ───── */
  expect: {
    toHaveScreenshot: {
      threshold: 0.02,
      animations: 'disabled',
    },
  },

  /* ── Start Vite dev server before tests ──────────────────────────────── */
  webServer: {
    command: 'npx vite --port 3099',
    url: 'http://localhost:3099',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },

  use: {
    baseURL: 'http://localhost:3099',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* ── Three projects: Chrome, Firefox, WebKit (Safari) ────────────────── */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // Requires `npx playwright install msedge` (PowerShell/network-dependent on Windows):
    // {
    //   name: 'edge',
    //   use: { ...devices['Desktop Edge'] },
    // },
  ],
});
