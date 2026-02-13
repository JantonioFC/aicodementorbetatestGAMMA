
import { test, expect } from '@playwright/test';

// Skip visual regression tests in CI - baseline snapshots must be generated locally first
test.describe('Visual Regression', () => {
    test.skip(!!process.env.CI, 'Visual regression tests require local baseline snapshots');

    test.beforeEach(async ({ page }) => {
        // Go to home page before each test
        await page.goto('/');
    });

    test('Landing Page - Desktop', async ({ page }) => {
        // Wait for hydration/rendering
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.getByText('SYSTEM_LEARNING')).toBeVisible();

        // Take snapshot of the full page
        await expect(page).toHaveScreenshot('landing-desktop.png', {
            fullPage: true,
            maxDiffPixelRatio: 0.05 // Allow small rendering differences
        });
    });

    test('Landing Page - Mobile View', async ({ page }) => {
        // Set viewport to mobile size
        await page.setViewportSize({ width: 375, height: 667 });

        // Reload to trigger any responsive logic if needed
        await page.reload();
        await expect(page.locator('h1')).toBeVisible();

        // Take snapshot
        await expect(page).toHaveScreenshot('landing-mobile.png', {
            fullPage: true
        });
    });

    test('Auth Modal - Login State', async ({ page }) => {
        // Click on "INITIALIZE_PLATFORM" which triggers login modal for guest
        // Ensure we are in desktop for this test
        await page.setViewportSize({ width: 1280, height: 720 });

        await page.getByRole('button', { name: /INITIALIZE_PLATFORM/i }).click();

        // Wait for modal
        const modal = page.locator('.fixed.inset-0.z-50'); // Modal overlay class from LandingClient code
        await expect(modal).toBeVisible();
        await expect(page.getByText('Iniciar Sesión')).toBeVisible();

        // Take snapshot of the modal area only? Or full page with modal?
        // Full page with modal overlay is good.
        await expect(page).toHaveScreenshot('auth-modal-login.png');
    });
});
