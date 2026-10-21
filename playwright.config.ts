import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: ['**/layout.spec.ts'],
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'tablet',
      testIgnore: ['**/layout.spec.ts'],
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'mobile',
      testIgnore: ['**/layout.spec.ts'],
      use: {
        viewport: { width: 360, height: 640 },
        isMobile: true,
      },
    },
    {
      name: 'layout',
      testMatch: ['**/layout.spec.ts'],
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: 'npm run preview',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
});
