/**
 * MISIÓN 188: SUITE DE PRUEBAS E2E - AI CODE MENTOR
 * MISIÓN 274: INYECCIÓN HÍBRIDA VERDADERA (Cookie + Storage)
 * 
 * OBJETIVO PRIMARIO: Validar integridad completa de la plataforma
 * TECNOLOGÍA: Playwright (Microsoft E2E Framework)
 * DIRECTIVA: Integridad funcional y estabilidad de rama main - MÁXIMA PRIORIDAD
 */

import { test, expect, Page, Response } from '@playwright/test';
import { authenticateDemo } from './helpers/authHelper';
import { mockSandboxResponse } from './fixtures/mockSandboxResponse';

// CONFIGURACIONES GLOBALES
const TEST_CONFIG = {
    // Credenciales de demo
    DEMO_EMAIL: 'demo@aicodementor.com',
    DEMO_PASSWORD: 'demo123',

    // Timeouts personalizados por tipo de operación
    API_TIMEOUT: 15000,              // APIs rápidas (GET, POST de datos locales)
    AI_GENERATION_TIMEOUT: 45000,    // Operaciones de IA generativa
    NAVIGATION_TIMEOUT: 10000,       // Navegación entre páginas

    // URLs críticas
    BASE_URL: 'http://localhost:3000',
    PAGES: {
        HOME: '/',
        PANEL: '/panel-de-control',
        ANALITICAS: '/analiticas',
        MODULOS: '/modulos',
        SANDBOX: '/codigo'
    }
};

/**
 * UTILIDADES AUXILIARES - PRINCIPIO DE REUTILIZACIÓN
 */
class E2EHelpers {
    /**
     * Helper robusto de API - Captura TODA respuesta
     */
    static async waitForAPI(page: Page, urlPattern: string, timeout = TEST_CONFIG.API_TIMEOUT): Promise<Response> {
        const response = await page.waitForResponse(
            response => response.url().includes(urlPattern),
            { timeout }
        );
        return response;
    }

    static async safeClick(page: Page, selector: string, timeout = 5000) {
        await page.waitForSelector(selector, { timeout });
        await page.click(selector);
    }

    static async safeType(page: Page, selector: string, text: string, timeout = 5000) {
        await page.waitForSelector(selector, { timeout });
        await page.fill(selector, text);
    }

    /**
     * Verificación flexible de títulos HTML
     */
    static async verifyPageTitle(page: Page, expectedTitle: string) {
        const title = await page.title();
        const titleContainsExpected = title.includes(expectedTitle) ||
            title.toLowerCase().includes(expectedTitle.toLowerCase());

        if (!titleContainsExpected) {
            console.log(`❌ Título esperado: "${expectedTitle}"`);
            console.log(`❌ Título real: "${title}"`);
        }

        expect(titleContainsExpected).toBeTruthy();
    }
}

/**
 * GRUPO DE PRUEBAS: AUTENTICACIÓN
 */
test.describe('🔐 AUTENTICACIÓN - Suite de Pruebas', () => {

    test('AUTH-001: Debe autenticar con acceso demo rápido', async ({ page }) => {
        console.log('🚀 [M-274] Iniciando test de autenticación...');

        // Enable browser console logging
        page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

        // Inyección híbrida explícita
        await authenticateDemo(page);

        // Navegar al panel para verificar autenticación
        if (!page.url().includes('panel-de-control')) {
            await page.goto(TEST_CONFIG.PAGES.PANEL);
        }

        // Verificar que un elemento clave del Panel sea visible
        await expect(page.locator('h1:has-text("Panel de Control")')).toBeVisible({ timeout: 30000 });

        // Verificar el título
        await E2EHelpers.verifyPageTitle(page, 'Panel de Control - AI Code Mentor');

        console.log('✅ [M-274] Autenticación híbrida verificada exitosamente');
    });

    // SKIPPED: Logout not applicable in Local-First Auto-Login Architecture
    test.skip('AUTH-002: Debe cerrar sesión correctamente', async ({ page }) => {
        console.log('🚪 [M-274] Iniciando test de logout...');

        await authenticateDemo(page);

        // Navegar al panel
        await page.goto(TEST_CONFIG.PAGES.PANEL);
        await page.waitForLoadState('load', { timeout: 10000 });

        const logoutButton = page.locator('button:has-text("Cerrar Sesión")').first();
        await expect(logoutButton).toBeVisible({ timeout: 10000 });

        await logoutButton.click({ force: true });

        // Verificación de logout
        await expect(page).toHaveURL(/\/$/);
        await expect(page.locator('h1:has-text("AI Code Mentor")')).toBeVisible({ timeout: 15000 });
        console.log('✅ Logout exitoso confirmado');
    });
});

/**
 * GRUPO DE PRUEBAS: PANEL DE CONTROL
 */
test.describe('📊 PANEL DE CONTROL - Validación de Widgets', () => {

    test.beforeEach(async ({ page }) => {
        await authenticateDemo(page);
        await page.goto(TEST_CONFIG.PAGES.PANEL);
        await page.waitForLoadState('load', { timeout: 10000 });
    });

    test('PANEL-001: Debe cargar Dashboard Unificado y Sidebar de Sistema', async ({ page }) => {
        console.log('📈 Verificando Dashboard Unificado...');

        const dashboardTitle = page.locator('h2:has-text("Dashboard Unificado")');
        await expect(dashboardTitle).toBeVisible({ timeout: 15000 });

        const tabs = ['Dashboard Unificado', 'Sandbox', 'Sistema'];
        for (const tab of tabs) {
            await expect(page.getByRole('tab', { name: tab })).toBeVisible();
        }
    });
});

/**
 * GRUPO DE PRUEBAS: ANALÍTICAS
 */
test.describe('📊 ANALÍTICAS - Suite de Pruebas', () => {

    test.beforeEach(async ({ page }) => {
        await authenticateDemo(page);
        await page.goto(TEST_CONFIG.PAGES.ANALITICAS, { waitUntil: 'load', timeout: 30000 });
        // Wait for React hydration and ProtectedRoute auth check
        await expect(page).toHaveURL(/.*\/analiticas/);
        await expect(page.locator('h1:has-text("Analíticas Detalladas")')).toBeVisible({ timeout: 30000 });
    });

    test('ANALITICAS-001: Debe cargar Dashboard de Progreso', async ({ page }) => {
        console.log('📈 Verificando widget de progreso en /analiticas...');

        // Verify the main tab buttons are present (always rendered regardless of data)
        const tabSelectors = [
            'text=Dashboard de Progreso',
            'text=Maestría',
            'text=Logros'
        ];

        for (const selector of tabSelectors) {
            await expect(page.locator(selector).first()).toBeVisible({ timeout: 30000 });
        }
    });
});

/**
 * GRUPO DE PRUEBAS: CURRÍCULO
 */
test.describe('📚 CURRÍCULO - Navegación y Carga de Datos', () => {

    test.beforeEach(async ({ page }) => {
        await authenticateDemo(page);
        await page.goto(TEST_CONFIG.PAGES.MODULOS, { timeout: 30000 });
        await page.waitForLoadState('load', { timeout: 10000 });
    });

    test('MODULOS-001: Debe cargar resumen del currículo', async ({ page }) => {
        console.log('📖 Verificando carga de resumen del currículo...');

        const summaryPromise = E2EHelpers.waitForAPI(page, '/api/v1/curriculum/summary');
        await page.reload({ timeout: 30000 });

        const summaryResponse = await summaryPromise;
        expect(summaryResponse.status()).toBe(200);

        await expect(page.locator('text=Estructura Curricular').or(page.locator('text=Ecosistema 360')).first()).toBeVisible({ timeout: 15000 });
    });
});

/**
 * GRUPO DE PRUEBAS: GENERACIÓN DE LECCIONES (CORE LOOP)
 */
test.describe('🎯 GENERACIÓN DE LECCIONES - Core Loop', () => {

    test.beforeEach(async ({ page }) => {
        await authenticateDemo(page);
        await page.goto(TEST_CONFIG.PAGES.MODULOS);
        await page.waitForLoadState('load', { timeout: 10000 });
    });

    test.skip('LESSON-001: Debe generar lección completa via clic en pomodoro', async ({ page }) => {
        console.log('🍅 Iniciando test del Core Loop...');

        const pomodoroElement = page.locator('[data-pomodoro], .pomodoro-button, button:has-text("Pomodoro")').first();

        if (await pomodoroElement.isVisible({ timeout: 10000 })) {
            const generateLessonPromise = page.waitForResponse(
                response => response.url().includes('/api/generate-lesson') && response.status() === 200,
                { timeout: TEST_CONFIG.AI_GENERATION_TIMEOUT }
            );

            await pomodoroElement.click();

            const generateLessonResponse = await generateLessonPromise;
            expect(generateLessonResponse.status()).toBe(200);

            await expect(page.locator('[data-testid="lesson-content"], .lesson-output, .generated-lesson')).toBeVisible({
                timeout: 10000
            });
        }
    });
});

/**
 * GRUPO DE PRUEBAS: SANDBOX DE APRENDIZAJE
 */
test.describe('🔬 SANDBOX DE APRENDIZAJE - Generación Libre', () => {

    test.beforeEach(async ({ page }) => {
        await authenticateDemo(page);
    });

    test.skip('SANDBOX-001: Debe generar lección desde texto libre', async ({ page }) => {
        console.log('🔬 [M-18] Verificando Sandbox de Aprendizaje...');

        await page.route('**/api/sandbox/generate', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockSandboxResponse)
            });
        });

        await page.goto(TEST_CONFIG.PAGES.SANDBOX, { timeout: 30000 });

        const inputElement = page.locator('#sandbox-input');
        await expect(inputElement).toBeVisible({ timeout: 30000 });

        await inputElement.fill('Explícame los conceptos básicos de JavaScript ES6.');

        const generateButton = page.locator('button:has-text("Generar Lección Interactiva")');
        await generateButton.click({ force: true });

        const sandboxPromise = page.waitForResponse(
            response => response.url().includes('/api/sandbox/generate') && response.status() === 200,
            { timeout: 10000 }
        );

        const sandboxResponse = await sandboxPromise;
        expect(sandboxResponse.status()).toBe(200);

        await expect(page.locator('#sandbox-result, [data-testid="sandbox-result"]')).toBeVisible({
            timeout: 10000
        });
    });
});

/**
 * SMOKE TEST GENERAL
 */
test.describe('🚀 SMOKE TEST - Verificación General del Sistema', () => {

    test('SMOKE-001: Verificación completa de salud del sistema', async ({ page }) => {
        console.log('🚀 [M-274] Ejecutando Smoke Test completo...');

        // 1. Homepage accessible
        await page.goto(TEST_CONFIG.PAGES.HOME, { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveTitle(/Aprende|AI Code Mentor/, { timeout: 30000 });

        // 2. Autenticación
        await authenticateDemo(page);

        // 3. Dashboard carga
        await page.goto(TEST_CONFIG.PAGES.PANEL, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1:has-text("Panel de Control")')).toBeVisible({ timeout: 30000 });

        // 4. Analíticas accesible
        await page.goto(TEST_CONFIG.PAGES.ANALITICAS, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1:has-text("Analíticas Detalladas")')).toBeVisible({ timeout: 30000 });

        // 5. Módulos accesible
        await page.goto(TEST_CONFIG.PAGES.MODULOS, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });

        // 6. Sandbox accesible
        await page.goto(TEST_CONFIG.PAGES.SANDBOX, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('#sandbox-input').or(page.locator('button:has-text("Generar")'))).toBeVisible({ timeout: 30000 });

        console.log('🎉 SMOKE TEST COMPLETADO EXITOSAMENTE');
    });
});
