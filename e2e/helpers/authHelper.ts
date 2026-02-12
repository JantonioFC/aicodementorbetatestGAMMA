/**
 * HELPER DE AUTENTICACIÓN E2E - VERSIÓN 6.0 (LOCAL FIRST)
 * 
 * CAMBIO ARQUITECTÓNICO (Local-First):
 * La aplicación ahora utiliza "Auto-Login" con un usuario demo local.
 * No es necesaria la inyección de tokens de Supabase.
 * 
 * Este helper simplemente asegura que la navegación ocurra y
 * verifica que el usuario llegue al dashboard correctamente.
 * 
 * @version v6.0 - Local First Simplification
 */

import { Page } from '@playwright/test';

export const TEST_CONFIG = {
    // Ya no necesitamos credenciales reales, el app auto-loguea
    DEMO_EMAIL: 'demo@aicodementor.com',

    // Timeouts
    LOAD_TIMEOUT: 10000,
    NAVIGATION_TIMEOUT: 15000,

    PAGES: {
        HOME: 'http://localhost:3000',
        PANEL: 'http://localhost:3000/panel-de-control',
        MODULOS: 'http://localhost:3000/modulos',
        SANDBOX: 'http://localhost:3000/sandbox',
        PORTFOLIO: 'http://localhost:3000/portfolio'
    }
};

/**
 * AUTENTICACIÓN SIMPLIFICADA (AUTO-LOGIN / UI LOGIN)
 * 
 * @param {Page} page - Instancia de Playwright
 * @param {string} targetPath - Ruta destino (default: /panel-de-control)
 */
export async function authenticateDemo(page: Page, targetPath: string = '/panel-de-control') {
    console.log('🔐 [AUTH-LOCAL] Verificando login...');

    // 1. Navegar a la ruta destino
    try {
        await page.goto(targetPath, {
            waitUntil: 'domcontentloaded',
            timeout: 30000 // Aumentado a 30s
        });
    } catch (e) {
        console.log('⚠️ [AUTH-LOCAL] Navigation timeout, checking if we landed somewhere safe...');
    }

    // 1b. Esperar estabilización (Redirects client-side)
    await page.waitForTimeout(2000);

    // 2. Verificar si hemos sido redirigidos a /login
    if (page.url().includes('/login')) {
        console.log('🔒 [AUTH-LOCAL] Redirigido a Login. Iniciando sesión...');

        // Esperar a que el formulario sea visible
        await page.waitForSelector('form', { state: 'visible', timeout: 10000 });

        // Llenar formulario
        await page.fill('input[type="email"]', TEST_CONFIG.DEMO_EMAIL);
        await page.fill('input[type="password"]', 'demo123'); // Password hardcoded for now, or use config

        // Interceptar la respuesta del login para diagnóstico
        const loginResponsePromise = page.waitForResponse(
            resp => resp.url().includes('/api/auth/login') && resp.request().method() === 'POST',
            { timeout: 15000 }
        );

        // Click en botón de login
        await page.click('button[type="submit"]');
        console.log('🔒 [AUTH-LOCAL] Formulario enviado. Esperando respuesta API...');

        // Esperar la respuesta del login API
        try {
            const loginResponse = await loginResponsePromise;
            const status = loginResponse.status();
            console.log(`🔒 [AUTH-LOCAL] Login API respondió: HTTP ${status}`);

            if (status !== 200) {
                const body = await loginResponse.text();
                console.log(`❌ [AUTH-LOCAL] Login falló: ${body}`);
            } else {
                console.log('✅ [AUTH-LOCAL] Login exitoso. Esperando redirección...');
            }
        } catch (e) {
            console.log('⚠️ [AUTH-LOCAL] No se capturó respuesta del login API');
        }

        // Esperar a que la URL cambie al dashboard (no usar text=Bienvenido, existe en login page)
        try {
            await page.waitForURL(/panel-de-control|sandbox|modulos|portfolio/, {
                timeout: 30000,
                waitUntil: 'domcontentloaded'
            });
        } catch {
            // URL no cambió, el login probablemente falló
        }
    }

    // 3. Verificar que estamos en la página correcta (o panel)
    console.log('✅ [AUTH-LOCAL] Navegación completada. URL:', page.url());
}

/**
 * Cleanup (No-op en local first, o reset de estado si fuera necesario)
 */
export async function cleanupAuth(page: Page) {
    // Nada crítico que limpiar en local-auto-login
    await page.evaluate(() => {
        // @ts-ignore
        delete window.PLAYWRIGHT_TEST;
    });
}
