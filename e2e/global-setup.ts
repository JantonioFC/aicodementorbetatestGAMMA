import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || process.env.CI_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || process.env.CI_USER_PASSWORD;
const STORAGE_STATE_PATH = '.auth/storageState.json';

async function globalSetup(config: FullConfig) {
    console.log('\n🚀 [M-268 GlobalSetup] Iniciando login de UI real...');

    if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
        console.warn('⚠️ [M-268 GlobalSetup] Credenciales no configuradas. Saltando setup real.');
        return;
    }

    const authDir = path.dirname(STORAGE_STATE_PATH);
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    const browser = await chromium.launch({
        headless: !!process.env.CI
    });

    const page = await browser.newPage();

    try {
        await page.goto('http://localhost:3000/login', { timeout: 30000 });
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });

        await page.fill('input[type="email"]', TEST_USER_EMAIL);
        await page.fill('input[type="password"]', TEST_USER_PASSWORD);

        const loginButton = page.locator('button:has-text("Iniciar Sesión"), button:has-text("Acceso Demo")').first();
        await loginButton.click();

        await page.waitForURL('**/panel-de-control', { timeout: 15000 });
        await page.context().storageState({ path: STORAGE_STATE_PATH });

        console.log(`✅ [M-268 GlobalSetup] Estado de autenticación guardado en ${STORAGE_STATE_PATH}`);
    } catch (error: any) {
        console.error('\n❌ [M-268 GlobalSetup] FALLO EL LOGIN GLOBAL:', error.message);
    } finally {
        await browser.close();
    }
}

export default globalSetup;
