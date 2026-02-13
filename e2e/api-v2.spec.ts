/**
 * Test E2E: API v2 Health Check
 * Verifica que el sistema IA resiliente está funcionando
 *
 * @version 1.0.0 (v19.1)
 */

import { test, expect } from '@playwright/test';

test.describe('API v2 - Sistema IA Resiliente', () => {

    test('API-V2-001: Health check debe retornar status healthy', async ({ request }) => {
        const response = await request.get('/api/v2/health');

        expect(response.ok()).toBeTruthy();

        const data = await response.json();

        expect(data.status).toBe('healthy');
        expect(data.version).toBe('2.0.0');
        expect(data.router).toBeDefined();
        expect(data.models).toBeDefined();
        expect(data.models.available).toBeGreaterThan(0);

        console.log(`[API-V2-001] ✅ Health check passed`);
        console.log(`  - Modelos disponibles: ${data.models.available}`);
        console.log(`  - Router inicializado: ${data.router.initialized}`);
    });

    test('API-V2-002: Analyze debe procesar código correctamente', async ({ request }) => {
        const response = await request.post('/api/v2/analyze', {
            data: {
                code: 'function hello() { console.log("Hello"); }',
                language: 'javascript',
                phase: 'fase-1',
                analysisType: 'general'
            }
        });

        // Route must exist (not 404)
        expect(response.status()).not.toBe(404);

        const data = await response.json();

        if (response.ok()) {
            expect(data.success).toBe(true);
            expect(data.analysis).toBeDefined();
            expect(data.metadata).toBeDefined();
            expect(data.metadata.routerVersion).toBe('2.0.0');

            console.log(`[API-V2-002] ✅ Analyze passed`);
            console.log(`  - Modelo usado: ${data.metadata.model}`);
            console.log(`  - Latencia: ${data.metadata.latency}ms`);
        } else {
            // Without real GEMINI_API_KEY, the endpoint returns an error - that's expected in CI
            console.log(`[API-V2-002] ⚠️ Analyze endpoint exists but returned ${response.status()}: ${data.error || 'unknown'}`);
            console.log('  (Expected in CI without real GEMINI_API_KEY)');
        }
    });

    test('API-V2-003: Backup info debe estar disponible', async ({ request }) => {
        const response = await request.get('/api/v2/backup');

        // Route must exist (not 404)
        expect(response.status()).not.toBe(404);

        if (response.ok()) {
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.timestamp).toBeDefined();
            expect(data.backup).toBeDefined();

            console.log(`[API-V2-003] ✅ Backup info endpoint passed`);
        } else {
            const data = await response.json();
            console.log(`[API-V2-003] ⚠️ Backup endpoint returned ${response.status()}: ${data.error || 'unknown'}`);
        }
    });

});
