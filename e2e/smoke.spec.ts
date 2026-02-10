/**
 * SMOKE TEST - VERIFICACIÓN BÁSICA DE DESPLIEGUE
 * 
 * Valida que la página principal carga y elementos críticos son visibles.
 * Se ejecuta en CI para confirmación rápida de salud del sistema.
 */

import { test, expect } from '@playwright/test';

test.describe('💨 Smoke Test - Verificación de Salud', () => {

    test('Landing page carga correctamente', async ({ page }) => {
        console.log('🚀 Iniciando Smoke Test en página principal...');

        // Navegar a la raíz
        await page.goto('/');

        // Validar título de la página
        const title = await page.title();
        console.log(`📄 Título detectado: "${title}"`);
        expect(title).toContain('AI Code Mentor');

        // Validar encabezado principal - Usar wait para asegurar hidratación
        const mainHeading = page.locator('h1:has-text("SYSTEM_LEARNING")');
        await mainHeading.waitFor({ state: 'visible', timeout: 15000 });
        await expect(mainHeading).toBeVisible();
        await expect(mainHeading).toContainText('SYSTEM_LEARNING');

        // Validar botón de acción principal (CTA)
        const ctaButton = page.getByRole('button', { name: /INITIALIZE_PLATFORM/i });
        await expect(ctaButton).toBeVisible();

        console.log('✅ Smoke Test completado: Elementos críticos visibles.');
    });

});
