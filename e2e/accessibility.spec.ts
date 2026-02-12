
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { authenticateDemo } from './helpers/authHelper';

test.describe('Accessibility Tests', () => {
    test('Landing Page should be accessible', async ({ page }) => {
        await page.goto('/');

        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
    });

    test('Login Page should be accessible', async ({ page }) => {
        await page.goto('/login');

        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
    });

    test('Dashboard should be accessible (Authenticated)', async ({ page }) => {
        // Use helper to perform login
        await authenticateDemo(page, '/panel-de-control');

        // Verify we are on dashboard before scanning
        await expect(page).toHaveURL(/panel-de-control/);

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        expect(results.violations).toEqual([]);
    });

    test('Sandbox should be accessible (Authenticated)', async ({ page }) => {
        await authenticateDemo(page, '/sandbox');
        await expect(page).toHaveURL(/sandbox/);

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        expect(results.violations).toEqual([]);
    });
});
