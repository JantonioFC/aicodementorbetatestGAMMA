/**
 * HELPER DE AUTENTICACIÓN E2E - VERSIÓN 7.0 (SYSTEMATIC DEBUGGING FIX)
 * 
 * ROOT CAUSE ANALYSIS (v7.0):
 * El problema era que authenticateDemo navegaba directamente a la ruta protegida,
 * lo que generaba un ciclo: AuthGate loading → 401 → redirect /login → login → 
 * redirect /panel-de-control → segundo goto a ruta → AuthGate loading otra vez.
 * 
 * En dev mode, cada navegación dispara Fast Refresh (~18s), haciendo que el flujo
 * completo exceda el timeout de 60s.
 * 
 * SOLUCIÓN: 
 * 1. Ir directamente a /login primero (evita el redirect innecesario)
 * 2. Hacer login
 * 3. Esperar a que AuthGate se estabilice en 'authenticated'
 * 4. Luego navegar a la ruta destino
 * 
 * @version v7.0 - Systematic Debugging Fix
 */

import { Page } from '@playwright/test';

export const TEST_CONFIG = {
    DEMO_EMAIL: 'demo@aicodementor.com',
    DEMO_PASSWORD: 'demo123',

    LOAD_TIMEOUT: 10000,
    NAVIGATION_TIMEOUT: 15000,

    PAGES: {
        HOME: 'http://localhost:3000',
        PANEL: 'http://localhost:3000/panel-de-control',
        MODULOS: 'http://localhost:3000/modulos',
        SANDBOX: 'http://localhost:3000/sandbox',
        PORTFOLIO: 'http://localhost:3000/portfolio',
        ANALITICAS: 'http://localhost:3000/analiticas',
    }
};

/**
 * AUTENTICACIÓN OPTIMIZADA
 * 
 * Flujo: /login → fill form → submit → wait authenticated → navigate to target
 * 
 * @param {Page} page - Instancia de Playwright
 * @param {string} targetPath - Ruta destino (default: /panel-de-control)
 */
export async function authenticateDemo(page: Page, targetPath: string = '/panel-de-control') {
    console.log(`🔐 [AUTH] Starting auth flow → target: ${targetPath}`);

    // Step 1: Check if already authenticated (cookies from previous test in same context)
    const existingCookies = await page.context().cookies();
    const hasAuthCookie = existingCookies.some(c => c.name === 'ai-code-mentor-auth');

    if (hasAuthCookie) {
        console.log('🍪 [AUTH] Auth cookie already exists, navigating directly...');
        await page.goto(targetPath, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await waitForAuthGate(page);
        console.log(`✅ [AUTH] Already authenticated. URL: ${page.url()}`);
        return;
    }

    // Step 2: Go directly to /login (skip the redirect chain)
    console.log('🔒 [AUTH] No auth cookie. Going to /login directly...');
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Step 3: Wait for login form AND for submit button to be enabled
    // AuthGate lets login page render now, but useAuth's checkSession still runs.
    // The submit button is disabled={isLoading || authLoading} — we must wait for authLoading to resolve.
    await page.waitForSelector('form', { state: 'visible', timeout: 30000 });

    // Wait for submit button to be enabled (authLoading -> false after checkSession cycle completes)
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: 'visible', timeout: 30000 });

    // Wait until button is NOT disabled
    await page.waitForFunction(
        () => {
            const btn = document.querySelector('button[type="submit"]');
            return btn && !btn.hasAttribute('disabled');
        },
        { timeout: 30000 }
    );
    console.log('✅ [AUTH] Login form ready, button enabled');

    // Step 4: Fill credentials and submit
    await page.fill('input[type="email"]', TEST_CONFIG.DEMO_EMAIL);
    await page.fill('input[type="password"]', TEST_CONFIG.DEMO_PASSWORD);

    // Intercept login response for diagnostics
    const loginResponsePromise = page.waitForResponse(
        resp => resp.url().includes('/api/auth/login') && resp.request().method() === 'POST',
        { timeout: 15000 }
    );

    await submitButton.click();
    console.log('🔒 [AUTH] Form submitted. Waiting for API response...');

    // Step 5: Verify login API response
    try {
        const loginResponse = await loginResponsePromise;
        const status = loginResponse.status();
        console.log(`🔒 [AUTH] Login API responded: HTTP ${status}`);

        if (status !== 200) {
            const body = await loginResponse.text();
            console.log(`❌ [AUTH] Login failed: ${body}`);
            throw new Error(`Login failed with status ${status}`);
        }
    } catch (e) {
        if (e instanceof Error && e.message.startsWith('Login failed')) throw e;
        console.log('⚠️ [AUTH] Login response not captured (Fast Refresh race)');
    }

    // Step 6: Wait for authState to become 'authenticated' in the browser
    try {
        await page.waitForFunction(
            () => {
                // Check if the auth gate shows authenticated
                const el = document.body.innerText;
                // Wait for either: redirect happened, or page shows authenticated content
                return !window.location.pathname.includes('/login') ||
                    el.includes('Panel de Control') ||
                    el.includes('panel-de-control');
            },
            { timeout: 10000 }
        );
    } catch {
        // If redirect didn't happen in 10s (Fast Refresh issue), that's fine - we'll navigate manually
        console.log('⚠️ [AUTH] Login redirect didn\'t complete (Fast Refresh issue), navigating manually');
    }

    // Step 7: Verify cookies were set
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'ai-code-mentor-auth');
    console.log(`🍪 [AUTH] Cookies: ${cookies.length}, Auth: ${authCookie ? 'SET' : 'MISSING'}`);

    // Step 8: Navigate directly to target (don't wait for client-side redirect)
    console.log(`🚀 [AUTH] Navigating to target: ${targetPath}`);
    // Wait for any Fast Refresh to settle
    await page.waitForTimeout(1000);
    try {
        await page.goto(targetPath, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (e) {
        // Retry once if ERR_ABORTED (Fast Refresh race)
        console.log('⚠️ [AUTH] Navigation failed, retrying...');
        await page.waitForTimeout(2000);
        await page.goto(targetPath, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    // Step 9: Wait for AuthGate to settle
    await waitForAuthGate(page);

    console.log(`✅ [AUTH] Auth flow complete. URL: ${page.url()}`);
}

/**
 * Wait for AuthGate to resolve (loading screen disappears)
 */
async function waitForAuthGate(page: Page) {
    try {
        // Check if loading indicator is present
        const loadingIndicator = page.locator('text=/Sincronizando|Verificando acceso|Verificando autenticación/i');

        // Give it a moment to appear
        const isLoading = await loadingIndicator.isVisible({ timeout: 3000 }).catch(() => false);

        if (isLoading) {
            console.log('⏳ [AUTH] Waiting for AuthGate to resolve...');
            await loadingIndicator.waitFor({ state: 'detached', timeout: 30000 });
            console.log('✅ [AUTH] AuthGate resolved');
        }
    } catch {
        // Loading screen may have already disappeared or never appeared
    }
}

/**
 * Cleanup (No-op en local first)
 */
export async function cleanupAuth(page: Page) {
    await page.evaluate(() => {
        // @ts-ignore
        delete window.PLAYWRIGHT_TEST;
    });
}
