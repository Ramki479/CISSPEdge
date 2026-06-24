import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/* ─── Helper: collect console errors during a page visit ─────────────────── */

async function visitAndCheck(
  page: Page,
  url: string,
  expectedText?: string,
): Promise<string[]> {
  const consoleErrors: string[] = [];

  // Set up listeners BEFORE navigation so no early errors are missed
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`[PAGE] ${err.message}`);
  });

  const response = await page.goto(url, { waitUntil: 'networkidle' });
  expect(response).not.toBeNull();

  // Wait for React to mount and initial animations to settle
  await page.waitForTimeout(1_500);

  // If the page is expected to show specific text, wait for it
  if (expectedText) {
    await expect(page.getByText(expectedText).first()).toBeVisible({
      timeout: 10_000,
    });
  }

  // Assert: zero console errors
  expect(
    consoleErrors,
    `Console errors on ${url}:\n${consoleErrors.join('\n')}`,
  ).toEqual([]);

  return consoleErrors;
}

/* ─── Check if the page shows onboarding (fresh DB) vs. dashboard ────────── */

async function isOnboardingVisible(page: Page): Promise<boolean> {
  return page.getByText('Select Your Level').isVisible().catch(() => false);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Root Initialization
   ═══════════════════════════════════════════════════════════════════════════ */

test.describe('Root initialization', () => {
  test('app loads without console errors and renders onboarding or dashboard', async ({ page }) => {
    // Set up console listeners BEFORE navigation
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // Navigate — the app shows the loading screen, then renders either
    // the Onboarding page or the Dashboard.
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for React mount + loading animation + routing
    await page.waitForTimeout(4_000);

    // After loading completes, we should see a page (any page)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();

    // Verify the app rendered something meaningful
    const pageText = bodyText ?? '';
    const hasContent =
      pageText.includes('CISSP') ||
      pageText.includes('Dashboard') ||
      pageText.includes('Level') ||
      pageText.includes('Initializing');

    expect(hasContent).toBeTruthy();

    expect(
      consoleErrors,
      `Console errors on root:\n${consoleErrors.join('\n')}`,
    ).toEqual([]);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Error Boundary: Catches IndexedDB failures
   ═══════════════════════════════════════════════════════════════════════════ */

test.describe('Error boundary', () => {
  async function createBlockedIndexedDBContext(
    browser: import('@playwright/test').Browser,
  ): Promise<BrowserContext> {
    const context = await browser.newContext();

    // Block IndexedDB before any page scripts run
    await context.addInitScript(() => {
      Object.defineProperty(window, 'indexedDB', {
        get: () => undefined,
        configurable: true,
      });
    });

    return context;
  }

  test('shows the error boundary fallback when IndexedDB is unavailable', async ({
    browser,
  }) => {
    const context = await createBlockedIndexedDBContext(browser);
    const page = await context.newPage();

    // Set up console listeners
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // Navigate — the app should crash when trying to access Dexie,
    // and the ErrorBoundary in main.tsx should catch it.
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3_000);

    // The ErrorBoundary fallback should be visible.
    // Check for specific fallback UI elements:
    const hasRetry = await page.getByText('Retry').isVisible().catch(() => false);
    const hasReload = await page.getByText('Reload').isVisible().catch(() => false);
    const hasRetrievalError = await page.getByText('Retrieval Error').isVisible().catch(() => false);

    // At least one of these should be present — proves the ErrorBoundary
    // caught the crash instead of showing a blank white screen.
    expect(hasRetry || hasReload || hasRetrievalError).toBeTruthy();

    await context.close();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Core Page Rendering — handles both onboarded and non-onboarded states
   ═══════════════════════════════════════════════════════════════════════════ */

test.describe('Core pages render without errors', () => {
  async function pageOrOnboarding(
    page: Page,
    url: string,
    pageHeading: string,
  ): Promise<void> {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1_500);

    // The app should render either the requested page or the onboarding
    // screen (if the DB is fresh). Accept both — the key assertion is
    // zero console errors.
    const hasPageHeading = await page.getByText(pageHeading).isVisible().catch(() => false);
    const hasOnboarding = await isOnboardingVisible(page);

    // The body must have content (no blank screen) and one of the
    // expected states must be visible.
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(hasPageHeading || hasOnboarding).toBeTruthy();

    expect(
      errors,
      `Console errors on ${url}:\n${errors.join('\n')}`,
    ).toEqual([]);
  }

  test('Dashboard loads and shows the main interface', async ({ page }) => {
    await pageOrOnboarding(page, '/dashboard', 'Dashboard');
  });

  test('Practice / test engine loads', async ({ page }) => {
    await pageOrOnboarding(page, '/test?mode=quick-practice', 'Test');
  });

  test('Analytics page loads', async ({ page }) => {
    await pageOrOnboarding(page, '/analytics', 'Analytics');
  });

  test('Flashcards page loads', async ({ page }) => {
    await pageOrOnboarding(page, '/flashcards', 'Flashcards');
  });

  test('Notes page loads', async ({ page }) => {
    await pageOrOnboarding(page, '/notes', 'Notes');
  });

  test('Study Planner page loads', async ({ page }) => {
    await pageOrOnboarding(page, '/study-planner', 'Planner');
  });

  test('Knowledge Map page loads', async ({ page }) => {
    await pageOrOnboarding(page, '/knowledge-map', 'Map');
  });

  test('Question Review page loads', async ({ page }) => {
    await pageOrOnboarding(page, '/review', 'Review');
  });

  test('Recommendations page loads', async ({ page }) => {
    await pageOrOnboarding(page, '/recommendations', 'Coach');
  });

  test('Settings page loads', async ({ page }) => {
    await pageOrOnboarding(page, '/settings', 'Settings');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Navigation smoke test
   ═══════════════════════════════════════════════════════════════════════════ */

test.describe('Navigation smoke test', () => {
  test('navigates between pages without console errors', async ({ page }) => {
    const errors: string[] = [];

    // Listeners BEFORE first navigation
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    // Start at dashboard
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1_500);

    // Visit several pages in sequence via navigation
    const pages = ['/analytics', '/flashcards', '/notes', '/settings'];
    for (const path of pages) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
    }

    expect(
      errors,
      `Console errors during navigation:\n${errors.join('\n')}`,
    ).toEqual([]);
  });
});
