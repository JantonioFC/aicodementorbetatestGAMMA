import { test, expect } from '@playwright/test';
import { setupPortfolioTest, switchToTab, expectTabToBeActive } from './helpers/portfolio-helpers';

/**
 * TEST M-219.1: Caracterización de Portfolio
 * Objetivo: Verificar que la UI de Portfolio carga y permite navegar entre tabs
 */

test.describe('📊 Portfolio - Caracterización de UI', () => {

    test.beforeEach(async ({ page }) => {
        // Usar helper tipado para setup completo
        await setupPortfolioTest(page);
    });

    test('PORT-001: Debe mostrar el encabezado correcto y tabs iniciales', async ({ page }) => {
        console.log('🚀 [PORT-001] Verificando UI inicial de Portfolio...');

        // Título principal
        await expect(page.locator('h1:has-text("Gestión de Portfolio")')).toBeVisible();

        // Verificar tabs (Radix UI)
        await expect(page.locator('button:has-text("Export Portfolio")')).toBeVisible();
        await expect(page.locator('button:has-text("Gestión de Ciclos")')).toBeVisible();

        // El tab por defecto debe ser "Export Portfolio" (tiene degradado azul)
        await expectTabToBeActive(page, 'Export Portfolio');

        console.log('✅ UI inicial de Portfolio validada');
    });

    test('PORT-002: Debe permitir navegar entre tabs de Portfolio', async ({ page }) => {
        console.log('🚀 [PORT-002] Navegando entre tabs...');

        // 1. Cambiar a Gestión de Ciclos
        await switchToTab(page, 'Gestión de Ciclos');
        await expectTabToBeActive(page, 'Gestión de Ciclos');

        // Verificar contenido de Ciclos
        await expect(page.locator('h2:has-text("Sistema de Reset de Ciclo")')).toBeVisible({ timeout: 10000 });

        // 2. Volver a Export Portfolio
        await switchToTab(page, 'Export Portfolio');
        await expectTabToBeActive(page, 'Export Portfolio');

        // Verificar contenido de Export
        await expect(page.locator('h3:has-text("Exportar Datos")')).toBeVisible({ timeout: 10000 });

        console.log('✅ Navegación entre tabs funcional');
    });

    test('PORT-003: Debe mostrar widgets de resumen', async ({ page }) => {
        console.log('🚀 [PORT-003] Verificando widgets de resumen...');

        // En el tab de Export, debe haber widgets
        const widgets = [
            'Total Lecciones',
            'Minutos Totales',
            'Pomodoros'
        ];

        for (const label of widgets) {
            await expect(page.locator(`text=${label}`)).toBeVisible();
        }

        console.log('✅ Widgets de resumen encontrados');
    });

});
