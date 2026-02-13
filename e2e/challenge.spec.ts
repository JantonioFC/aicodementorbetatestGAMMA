import { test, expect } from '@playwright/test';

test.describe('🧩 Challenge Page (Onboarding)', () => {

    test.beforeEach(async ({ page }) => {
        // [DEBUG] Capture console logs and errors
        page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
        page.on('pageerror', err => console.log(`[BROWSER ERROR]: ${err.message}`));

        await page.goto('/challenge');
        await page.waitForLoadState('domcontentloaded');
    });

    test('should load the challenge interface', async ({ page }) => {
        await expect(page).toHaveTitle(/Desafíos/);
        await expect(page.getByText('Fix the Bug')).toBeVisible();
        await expect(page.getByText(/SyntaxError/)).toBeVisible();
    });

    test('should compile Python code and fail with original bug', async ({ page }) => {
        // Click Run without changes (button text is "Run Protocol")
        // force: true bypasses cookie banner overlay that intercepts pointer events
        await page.getByText('Run Protocol').click({ force: true });

        // Check for error output
        await expect(page.getByText('SyntaxError').first()).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Entry Granted')).not.toBeVisible();
    });

    test('should pass validation when syntax is fixed', async ({ page }) => {
        // Fix the code in the textarea
        // Original: print "Hello " + name
        // Fixed:    print("Hello " + name)

        const fixedCode = 'def greet(name):\n    print("Hello " + name)  # Fixed!';

        await page.locator('textarea').fill(fixedCode);

        // Wait for potential React state update / debounce
        await page.waitForTimeout(500);

        // Click Run (button text is "Run Protocol")
        // force: true bypasses cookie banner overlay that intercepts pointer events
        await page.getByText('Run Protocol').click({ force: true });

        // Verify success state
        // Increase timeout as Python execution simulation takes 800ms + network jitter
        await expect(page.getByText('Entry Granted')).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('TEST PASSED')).toBeVisible({ timeout: 15000 });
    });

});
