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

        // Wait for React hydration before interacting with the textarea
        const textarea = page.locator('textarea');
        await expect(textarea).toBeEditable({ timeout: 10000 });

        // Use native value setter to bypass React controlled input issues
        // (Playwright's fill() can concatenate instead of replacing on React controlled textareas)
        await textarea.evaluate((el: HTMLTextAreaElement, value: string) => {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
            nativeSetter.call(el, value);
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }, fixedCode);

        // Verify React state updated (auto-retries until value matches)
        await expect(textarea).toHaveValue(fixedCode);

        // Click Run (button text is "Run Protocol")
        // force: true bypasses cookie banner overlay that intercepts pointer events
        await page.getByText('Run Protocol').click({ force: true });

        // Verify success state
        // Use Promise.all to check both before the 1500ms redirect to /signup destroys the page
        await Promise.all([
            expect(page.getByText('Entry Granted')).toBeVisible({ timeout: 15000 }),
            expect(page.getByText('TEST PASSED')).toBeVisible({ timeout: 15000 }),
        ]);
    });

});
