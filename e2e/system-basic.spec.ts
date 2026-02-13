import { test, expect } from '@playwright/test';
import { authenticateDemo } from './helpers/authHelper';

test.describe('🏁 System Basic - Verificación Estructural', () => {

    test('SYS-001: Navegación básica entre secciones principales', async ({ page }) => {
        console.log('🚀 [SYS-001] Iniciando navegación básica...');

        // 1. Landing
        await page.goto('/');
        await expect(page).toHaveTitle(/AI Code Mentor/);
        console.log('✅ Landing cargada');

        // 2. Login (Auto)
        await authenticateDemo(page);
        console.log('✅ Autenticación completada');

        // 3. Panel de Control
        await page.goto('/panel-de-control');
        await expect(page.locator('h1:has-text("Panel de Control")')).toBeVisible();
        console.log('✅ Panel de Control cargado');

        // 4. Módulos
        await page.goto('/modulos');
        await expect(page.locator('h1:has-text("Estructura Curricular")').or(page.locator('h1:has-text("Módulos")'))).toBeVisible();
        console.log('✅ Módulos cargados');

        // 5. Portfolio (ProtectedRoute may show loading screen before rendering content)
        await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1:has-text("Gestión de Portfolio")')).toBeVisible({ timeout: 30000 });
        console.log('✅ Portfolio cargado');
    });

    test('SYS-002: Verificación de Sidebar y Navegación Interna', async ({ page }) => {
        await authenticateDemo(page);
        await page.goto('/panel-de-control');

        // Verificar que el sidebar esté presente (buscar por links)
        const sidebarLinks = [
            { text: 'Panel', href: '/panel-de-control' },
            { text: 'Módulos', href: '/modulos' },
            { text: 'Portfolio', href: '/portfolio' }
        ];

        for (const link of sidebarLinks) {
            // El sidebar puede tener el texto en botones o anchors
            const navItem = page.locator(`nav >> text=${link.text}`).first();
            await expect(navItem).toBeVisible();
        }
        console.log('✅ Sidebar visible con links correctos');
    });

});
