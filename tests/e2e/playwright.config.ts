import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '.',
    testMatch: '**/*.spec.ts',
    fullyParallel: false,
    workers: 1,
    retries: 1,
    timeout: 30000,
    expect: { timeout: 10000 },
    use: {
        baseURL: 'http://localhost:8888',
        screenshot: 'only-on-failure',
        video: 'off',
        trace: 'on-first-retry',
        locale: 'th-TH',
    },
    reporter: [['html', { open: 'never' }], ['list']],
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
});
