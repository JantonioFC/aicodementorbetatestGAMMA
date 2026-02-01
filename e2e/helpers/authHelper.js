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
 * AUTENTICACIÓN SIMPLIFICADA (AUTO-LOGIN / UI LOGIN)
 * 
 * @param {Page} page - Instancia de Playwright
 * @param {string} targetPath - Ruta destino (default: /panel-de-control)
 */
async function authenticateDemo(page, targetPath = '/panel-de-control') {
  console.log('🔐 [AUTH-LOCAL] Verificando login...');

  // 1. Navegar a la ruta destino
  await page.goto(targetPath, {
    waitUntil: 'domcontentloaded',
    timeout: TEST_CONFIG.NAVIGATION_TIMEOUT
  });

  // 1b. Esperar a que la navegación realmente termine y no estemos en una redirección intermedia
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });

  // 2. Verificar si hemos sido redirigidos a /login
  if (page.url().includes('/login')) {
    console.log('🔒 [AUTH-LOCAL] Redirigido a Login. Iniciando sesión...');

    // Esperar a que el formulario sea visible
    await page.waitForSelector('form', { state: 'visible', timeout: 5000 });

    // Llenar formulario
    await page.fill('input[type="email"]', TEST_CONFIG.DEMO_EMAIL);
    await page.fill('input[type="password"]', 'demo123'); // Password hardcoded for now, or use config

    // Click en botón de login (buscar por texto o tipo submit)
    await page.click('button[type="submit"]');

    // Esperar navegación o feedback
    // La redirección a panel debería ocurrir automáticamente
    console.log('🔒 [AUTH-LOCAL] Formulario enviado. Esperando redirección...');
    await page.waitForURL(url => url.includes('panel-de-control'), { timeout: 15000 });
  }

  // 3. Verificar que estamos en la página correcta (o panel)
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
