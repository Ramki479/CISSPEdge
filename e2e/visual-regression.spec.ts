import { test, expect, type Page } from '@playwright/test';

/* ─── App uses HashRouter, so pages are at /#/... ─────────────────────────── */

const PAGES = [
  { hash: '/#/dashboard', name: 'dashboard', label: 'Dashboard' },
  { hash: '/#/skills-assessment', name: 'skills-assessment', label: 'Skills' },
  { hash: '/#/test', name: 'test-engine', label: 'Test' },
  { hash: '/#/analytics', name: 'analytics', label: 'Analytics' },
  { hash: '/#/recommendations', name: 'recommendations', label: 'Learn' },
  { hash: '/#/flashcards', name: 'flashcards', label: 'Flashcards' },
  { hash: '/#/notes', name: 'notes', label: 'Notes' },
  { hash: '/#/study-planner', name: 'study-planner', label: 'Planner' },
  { hash: '/#/knowledge-map', name: 'knowledge-map', label: 'Map' },
  { hash: '/#/review', name: 'review', label: 'Review' },
  { hash: '/#/settings', name: 'settings', label: 'Settings' },
] as const;

/* ─── Check if onboarding is showing (fresh DB) vs. actual page ───────────── */

async function isOnboardingVisible(page: Page): Promise<boolean> {
  return page.getByText('Select Your Level').isVisible().catch(() => false);
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

async function collectErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Visual Regression — Full-Page Screenshots
   ═══════════════════════════════════════════════════════════════════════════ */

test.describe('Visual regression — all pages', () => {
  for (const { hash, name, label } of PAGES) {
    test(`${label} (${name}) matches its visual snapshot`, async ({ page }) => {
      const errors = await collectErrors(page);

      // Navigate via hash — HashRouter needs the #/ prefix
      await page.goto(hash, { waitUntil: 'networkidle' });

      // Wait for framer-motion animations to finish (loading → content)
      await page.waitForTimeout(4_000);

      // The page should show either the expected page content or onboarding
      const hasLabel = await page.getByText(label).isVisible().catch(() => false);
      const hasOnboarding = await isOnboardingVisible(page);

      // Body must have substantial text content (not blank)
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
      expect(bodyText!.trim().length).toBeGreaterThan(50);

      // Accept either the actual page or onboarding as valid states
      expect(hasLabel || hasOnboarding).toBeTruthy();

      // Full-page screenshot — this is the key assertion that catches
      // contrast regressions (text colors) and layout shifts.
      //
      // To regenerate baselines (e.g. after intentional UI changes):
      //   npx playwright test e2e/visual-regression.spec.ts --update-snapshots
      //
      // Global defaults (animations: disabled, threshold: 0.02) are set
      // in playwright.config.ts under expect.toHaveScreenshot.
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
      });

      expect(
        errors,
        `Console errors on ${hash}: ${errors.join(', ')}`,
      ).toEqual([]);
    });
  }
});
