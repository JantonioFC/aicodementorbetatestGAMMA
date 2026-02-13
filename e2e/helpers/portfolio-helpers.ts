/**
 * Portfolio Test Helpers - WITH AUTH MOCK
 * Misión 219.0.2 - Tests con Autenticación Mockeada
 */

import { Page, expect } from '@playwright/test';
import { authenticateDemo } from './authHelper';

/**
 * Setup completo para tests de Portfolio
 * Usa login real via authenticateDemo (probado en CI)
 */
export async function setupPortfolioTest(page: Page, options: any = {}) {
    const url = '/portfolio';

    // Usar login real que funciona en CI
    await authenticateDemo(page, url);

    // After login, the app may redirect to /panel-de-control instead of /portfolio
    // Ensure we're on the correct page
    if (!page.url().includes('/portfolio')) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    // Esperar a que el componente principal esté visible (ProtectedRoute may show loading first)
    await page.waitForSelector('h1:has-text("Gestión de Portfolio")', {
        timeout: 30000,
        state: 'visible'
    });

    console.log('✅ [TEST] Portfolio test setup completo');
}

/**
 * Mock de API de exportación de portfolio
 */
export async function mockExportPortfolioAPI(page: Page, options: { shouldSucceed?: boolean; delay?: number } = {}) {
    const {
        shouldSucceed = true,
        delay = 0
    } = options;

    await page.route('**/api/export-portfolio', async (route) => {
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        if (shouldSucceed) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    downloadUrl: 'http://example.com/portfolio-test.pdf',
                    metadata: {
                        format: 'pdf',
                        size: 102400,
                        pages: 10,
                        sections: 6
                    }
                })
            });
        } else {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'Export failed - Test error'
                })
            });
        }
    });
}

/**
 * Mock de API de reset de sistema
 */
export async function mockResetSystemAPI(page: Page, options: { shouldSucceed?: boolean; delay?: number } = {}) {
    const {
        shouldSucceed = true,
        delay = 0
    } = options;

    await page.route('**/api/reset-system', async (route) => {
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        if (shouldSucceed) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    archiveUrl: 'http://example.com/archive-test.zip',
                    preResetExportUrl: 'http://example.com/backup-test.zip',
                    newCycleId: 'cycle-test-123',
                    metadata: {
                        previousEntries: 10,
                        newEntries: 0
                    }
                })
            });
        } else {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'Reset failed - Test error'
                })
            });
        }
    });
}

/**
 * Verificar que el tab especificado esté activo
 * CORRECCIÓN MISIÓN 219.2: Usar .last() para seleccionar tab real (no sidebar)
 */
export async function expectTabToBeActive(page: Page, tabName: string) {
    // Hay DOS botones con el mismo texto: uno en sidebar, otro en tabs
    // Usamos .last() para seleccionar el tab real (el segundo botón)
    const tab = page.locator(`button:has-text("${tabName}")`).last();
    await expect(tab).toHaveClass(/from-blue-500/); // Tiene degradado azul cuando activo
}

/**
 * Cambiar al tab especificado
 * CORRECCIÓN MISIÓN 219.4: Usar JavaScript directo para bypasear portal bloqueador
 */
export async function switchToTab(page: Page, tabName: string) {
    // Hay DOS botones con el mismo texto: uno en sidebar, otro en tabs
    // Usamos .last() para seleccionar el tab real (el segundo botón)
    const tabButton = page.locator(`button:has-text("${tabName}")`).last();

    // Esperar a que el tab sea visible
    await tabButton.waitFor({ state: 'visible', timeout: 10000 });

    // SOLUCIÓN: Usar JavaScript para hacer el click y bypasear el portal bloqueador
    // El <nextjs-portal> intercepta eventos de pointer pero no puede bloquear JavaScript
    await tabButton.evaluate(node => (node as HTMLElement).click());

    // Esperar a que el tab cambie de estado (debe tener la clase activa)
    await expect(tabButton).toHaveClass(/from-blue-500/, { timeout: 5000 });

    await page.waitForTimeout(300); // Pequeña pausa para animaciones
}

/**
 * Utility: Esperar a que el elemento esté visible con timeout personalizado
 */
export async function waitForVisible(page: Page, selector: string, timeout: number = 5000) {
    await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Utility: Click y esperar navegación
 */
export async function clickAndWait(page: Page, selector: string) {
    await page.click(selector);
    await page.waitForTimeout(300); // Pequeña pausa para animaciones
}
