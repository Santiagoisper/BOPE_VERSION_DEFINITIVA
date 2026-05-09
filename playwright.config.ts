import { defineConfig, devices } from "@playwright/test";

const uiPort = process.env.E2E_UI_PORT ?? "3000";
const uiOrigin = process.env.E2E_UI_URL ?? `http://127.0.0.1:${uiPort}`;

/**
 * E2E BOPE Command Center.
 * - UI: Vite (pnpm dev:ui) en E2E_UI_URL; proxy /api → BOPE_COMMAND_CENTER_API_URL (3100).
 * - API debe estar accesible; en local: levantar el server antes o usar reuseExistingServer.
 */
export default defineConfig({
  testDir: "./e2e",
  testIgnore: /example\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: uiOrigin,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "pnpm --dir apps/bope-command-center dev",
    url: uiOrigin,
    env: { ...process.env, PORT: uiPort },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
