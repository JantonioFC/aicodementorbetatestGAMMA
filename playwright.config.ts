import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    retries: isCI ? 2 : 0,
    workers: isCI ? 1 : undefined,

    reporter: isCI
        ? [
            ['list'],
            ['html', { outputFolder: 'playwright-report', open: 'never' }],
            ['junit', { outputFile: 'playwright-results.xml' }]
        ]
        : [['list']],

    timeout: 60000,

    use: {
        headless: isCI || process.env.HEADLESS === 'true',
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        actionTimeout: 60000,
        navigationTimeout: 120000,
    },

    expect: {
        timeout: 30000,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        command: isCI ? 'cd .next/standalone && E2E_TEST_MODE=true node server.js' : 'E2E_TEST_MODE=true npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120000,
    },
});
