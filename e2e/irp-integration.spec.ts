/**
 * TEST E2E - INTEGRACIÓN IRP (API ROUTE)
 * Misión: Verificar migración de Microservicio a API Next.js
 *
 * Valida que los nuevos endpoints integrados respondan correctamente
 * en el puerto 3000, reemplazando la funcionalidad del puerto 3001.
 */

import { test, expect } from '@playwright/test';
import { authenticateDemo } from './helpers/authHelper';

test.describe('IRP Integration Tests (Integrated Architecture)', () => {

    // URL base integrada en Next.js (Puerto 3000)
    const BASE_URL = '/api/v1/irp';

    /**
     * Helper: Authenticate via browser and extract the real auth cookie
     * for use with API requests. This ensures the JWT secret matches.
     */
    async function getAuthCookie(page: import('@playwright/test').Page): Promise<string> {
        await authenticateDemo(page);
        const cookies = await page.context().cookies();
        const authCookie = cookies.find(c => c.name === 'ai-code-mentor-auth');
        if (!authCookie) throw new Error('Auth cookie not found after login');
        return authCookie.value;
    }

    test('IRP-001: Health Check del servicio integrado', async ({ page, request }) => {
        console.log('[TEST] Verificando /health...');
        const token = await getAuthCookie(page);
        const response = await request.get(`${BASE_URL}/health`, {
            headers: { 'Cookie': `ai-code-mentor-auth=${token}` }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();

        expect(body.status).toBe('healthy');
        expect(body.aiAvailable).toBeDefined();
        console.log('[TEST] ✅ Health Check OK:', body);
    });

    test('IRP-002: Historial de Revisiones (Endpoint Migrado)', async ({ page, request }) => {
        console.log('[TEST] Verificando /reviews/history...');
        const token = await getAuthCookie(page);
        const response = await request.get(`${BASE_URL}/reviews/history`, {
            headers: { 'Cookie': `ai-code-mentor-auth=${token}` }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();

        expect(Array.isArray(body.reviews)).toBe(true);
        expect(typeof body.total).toBe('number');
        console.log(`[TEST] ✅ Historial obtenido: ${body.reviews.length} revisiones`);
    });

    test('IRP-003: Estadísticas de Administrador (Endpoint Migrado)', async ({ page, request }) => {
        console.log('[TEST] Verificando /admin/stats...');
        const token = await getAuthCookie(page);
        const response = await request.get(`${BASE_URL}/admin/stats`, {
            headers: { 'Cookie': `ai-code-mentor-auth=${token}` }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();

        expect(body.total_reviews).toBeDefined();
        expect(body.pending_reviews).toBeDefined();
        console.log('[TEST] ✅ Stats obtenidos:', body);
    });

    test('IRP-004: Navegación UI a Peer Review', async ({ page }) => {
        console.log('[TEST] Verificando navegación a /peer-review...');

        // Navegar (puede redirigir a /login por ProtectedRoute)
        await page.goto('/peer-review');

        // Esperar a que ProtectedRoute procese y redirija (client-side redirect)
        await page.waitForTimeout(3000);
        await page.waitForLoadState('domcontentloaded');

        const url = page.url();
        const title = await page.title();
        console.log(`[TEST] URL actual: ${url}`);
        console.log(`[TEST] Título: ${title}`);

        // Validar que NO estamos en 404
        expect(title).not.toContain('404');
        expect(title).not.toContain('Not Found');

        // Si redirige a login es aceptable (significa que la ruta existe y está protegida)
        if (url.includes('/login')) {
            console.log('[TEST] ℹ️ Redirigido a login (Comportamiento correcto para ruta protegida)');
        } else {
            console.log('[TEST] ✅ Acceso permitido a página Peer Review');
        }
    });

});
