/**
 * CONFIGURACIÓN E2E - ECOSISTEMA 360
 */

export const TEST_CONFIG = {
    TEST_USER_EMAIL: 'e2e-test@example.com',
    TEST_USER_ID: '11111111-1111-1111-1111-111111111111',

    DEMO_EMAIL: 'demo@aicodementor.com',
    DEMO_PASSWORD: 'demo123',

    MOCK_TOKEN: 'E2E_MOCK_TOKEN_FOR_TESTING_PURPOSES_ONLY_V5',
    E2E_MOCK_TOKEN: 'E2E_MOCK_TOKEN_FOR_TESTING_PURPOSES_ONLY_V5',

    E2E_TOKEN_KEY: 'sb-localhost-auth-token',

    LOGIN_TIMEOUT: 60000,
    REDIRECT_TIMEOUT: 90000,
    LOAD_TIMEOUT: 30000,
    API_TIMEOUT: 45000,
    NAVIGATION_TIMEOUT: 60000,

    PAGES: {
        HOME: 'http://localhost:3000',
        LOGIN: 'http://localhost:3000/login',
        PANEL: 'http://localhost:3000/panel-de-control',
        MODULOS: 'http://localhost:3000/modulos',
        SANDBOX: 'http://localhost:3000/sandbox',
        PORTFOLIO: 'http://localhost:3000/portfolio'
    }
};

export const TEST_USER_EMAIL = TEST_CONFIG.TEST_USER_EMAIL;
export const TEST_USER_ID = TEST_CONFIG.TEST_USER_ID;
export const MOCK_TOKEN = TEST_CONFIG.MOCK_TOKEN;
export const E2E_MOCK_TOKEN = TEST_CONFIG.E2E_MOCK_TOKEN;
export const E2E_TOKEN_KEY = TEST_CONFIG.E2E_TOKEN_KEY;
