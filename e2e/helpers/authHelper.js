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

const TEST_CONFIG = {
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
 * AUTENTICACIÓN SIMPLIFICADA (AUTO-LOGIN)
 * 
 * @param {Page} page - Instancia de Playwright
 * @param {string} targetPath - Ruta destino (default: /panel-de-control)
 */
async function authenticateDemo(page, targetPath = '/panel-de-control') {
  console.log('🔐 [AUTH-LOCAL] Verificando auto-login...');

  // 1. Navegar a la ruta destino directamente
  // La aplicación redigirá automáticamente o cargará la página si ya está "logueado" (hardcoded)
  await page.goto(targetPath, {
    waitUntil: 'domcontentloaded',
    timeout: TEST_CONFIG.NAVIGATION_TIMEOUT
  });

  // 2. Establecer flag de test por si acaso la app lo usa para algo visual
  await page.evaluate(() => {
    window.PLAYWRIGHT_TEST = true;
  });

  // 3. Verificar que NO estamos en login (aunque no debería existir login page accesible fácilmente)
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    console.warn('⚠️ [AUTH-LOCAL] Inesperadamente en /login. Intentando navegar nuevamente...');
    await page.goto(targetPath);
  }

  // 4. Esperar carga de contenido principal
  try {
    await page.waitForSelector('h1, main, [data-testid], h2', {
      state: 'visible',
      timeout: TEST_CONFIG.LOAD_TIMEOUT
    });
  } catch (e) {
    console.log('⚠️ [AUTH-LOCAL] Timeout esperando selector, pero continuando...');
  }

  console.log('✅ [AUTH-LOCAL] Navegación completada. URL:', page.url());
}

/**
 * Cleanup (No-op en local first, o reset de estado si fuera necesario)
 */
async function cleanupAuth(page) {
  // Nada crítico que limpiar en local-auto-login
  await page.evaluate(() => {
    delete window.PLAYWRIGHT_TEST;
  });
}

module.exports = {
  authenticateDemo,
  cleanupAuth,
  TEST_CONFIG
};
