/**
 * TEST E2E - INTEGRACIÓN IRP (API ROUTE)
 * Misión: Verificar migración de Microservicio a API Next.js
 *
 * Valida que los nuevos endpoints integrados respondan correctamente
 * en el puerto 3000, reemplazando la funcionalidad del puerto 3001.
 */

import { test, expect } from '@playwright/test';
import * as jwt from 'jsonwebtoken';

test.describe('IRP Integration Tests (Integrated Architecture)', () => {

    // URL base integrada en Next.js (Puerto 3000)
    const BASE_URL = '/api/v1/irp';

    // Generate a valid JWT using the same secret as the CI server
    const JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret-minimum-32-chars';
    const VALID_TOKEN = jwt.sign(
        {
            sub: '00000000-0000-0000-0000-000000000001',
            email: 'demo@aicodementor.com',
            aud: 'authenticated',
            role: 'authenticated',
            v: 1
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    test('IRP-001: Health Check del servicio integrado', async ({ request }) => {
        console.log('[TEST] Verificando /health...');
        const response = await request.get(`${BASE_URL}/health`, {
            headers: { 'Authorization': `Bearer ${VALID_TOKEN}` }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();

        expect(body.status).toBe('healthy');
        // Verificar que reporte disponibilidad de IA (true o false, pero presente)
        expect(body.aiAvailable).toBeDefined();
        console.log('[TEST] ✅ Health Check OK:', body);
    });

    test('IRP-002: Historial de Revisiones (Endpoint Migrado)', async ({ request }) => {
        console.log('[TEST] Verificando /reviews/history...');
        const response = await request.get(`${BASE_URL}/reviews/history`, {
            headers: { 'Authorization': `Bearer ${VALID_TOKEN}` }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();

        // Verificar estructura de respuesta
        expect(Array.isArray(body.reviews)).toBe(true);
        expect(typeof body.total).toBe('number');
        console.log(`[TEST] ✅ Historial obtenido: ${body.reviews.length} revisiones`);
    });

    test('IRP-003: Estadísticas de Administrador (Endpoint Migrado)', async ({ request }) => {
        console.log('[TEST] Verificando /admin/stats...');
        const response = await request.get(`${BASE_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${VALID_TOKEN}` }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();

        expect(body.total_reviews).toBeDefined();
        expect(body.pending_reviews).toBeDefined();
        expect(body.completed_this_week).toBeDefined();
        console.log('[TEST] ✅ Stats obtenidos:', body);
    });

    test('IRP-004: Navegación UI a Peer Review', async ({ page }) => {
        console.log('[TEST] Verificando navegación a /peer-review...');

        // Navegar
        await page.goto('/peer-review');

        // Esperar a que cargue
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
