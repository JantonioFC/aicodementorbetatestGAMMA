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
        const fixedCode = 'def greet(name):\n    print("Hello " + name)  # Fixed!';

        // Dismiss cookie banner so it doesn't intercept clicks
        await page.getByText('Aceptar').click().catch(() => {});

        // Wait for React hydration
        const textarea = page.locator('textarea');
        await expect(textarea).toBeEditable({ timeout: 10000 });

        // Replace textarea content using real keyboard actions
        // (Playwright's fill() concatenates on React controlled textareas)
        await textarea.click();
        await page.keyboard.press('Control+a');
        await page.keyboard.insertText(fixedCode);

        // Verify React processed the change
        await expect(textarea).toHaveValue(fixedCode);

        // Click Run
        await page.getByText('Run Protocol').click();

        // Verify success state before the 1500ms redirect to /signup destroys the page
        await Promise.all([
            expect(page.getByText('Entry Granted')).toBeVisible({ timeout: 15000 }),
            expect(page.getByText('TEST PASSED')).toBeVisible({ timeout: 15000 }),
        ]);
    });

});
