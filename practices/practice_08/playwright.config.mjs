import { defineConfig } from '@playwright/test';

const port = 4178;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: { baseURL, browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: baseURL,
    env: { N8N_WEBHOOK_URL: '', N8N_WEBHOOK_SECRET: '' },
  },
});
