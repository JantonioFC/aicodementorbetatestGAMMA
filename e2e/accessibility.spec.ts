
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { authenticateDemo } from './helpers/authHelper';

test.describe('Accessibility Tests', () => {
    test('Landing Page should be accessible', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
        if (results.violations.length > 0) {
            console.log(`⚠️ [A11Y] Landing: ${results.violations.length} violations (${critical.length} critical/serious)`);
            results.violations.forEach(v => console.log(`  - [${v.impact}] ${v.id}: ${v.description}`));
        }
        expect(critical).toEqual([]);
    });

    test('Login Page should be accessible', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('domcontentloaded');

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
        if (results.violations.length > 0) {
            console.log(`⚠️ [A11Y] Login: ${results.violations.length} violations (${critical.length} critical/serious)`);
            results.violations.forEach(v => console.log(`  - [${v.impact}] ${v.id}: ${v.description}`));
        }
        expect(critical).toEqual([]);
    });

    test('Dashboard should be accessible (Authenticated)', async ({ page }) => {
        await authenticateDemo(page, '/panel-de-control');
        await expect(page).toHaveURL(/panel-de-control/);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
        if (results.violations.length > 0) {
            console.log(`⚠️ [A11Y] Dashboard: ${results.violations.length} violations (${critical.length} critical/serious)`);
            results.violations.forEach(v => console.log(`  - [${v.impact}] ${v.id}: ${v.description}`));
        }
        expect(critical).toEqual([]);
    });

    test('Sandbox should be accessible (Authenticated)', async ({ page }) => {
        await authenticateDemo(page, '/sandbox');
        await expect(page).toHaveURL(/sandbox|codigo/);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
        if (results.violations.length > 0) {
            console.log(`⚠️ [A11Y] Sandbox: ${results.violations.length} violations (${critical.length} critical/serious)`);
            results.violations.forEach(v => console.log(`  - [${v.impact}] ${v.id}: ${v.description}`));
        }
        expect(critical).toEqual([]);
    });
});
