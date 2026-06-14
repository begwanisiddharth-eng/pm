import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Dedicated, throwaway database for e2e so the dev database is never touched.
const E2E_DB = path.join(process.cwd(), "..", "backend", "e2e.db");

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  // Serial: tests share one backend database, so avoid concurrent board writes.
  // The e2e database is reset by the test:e2e npm script before this config runs.
  workers: 1,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "uv run uvicorn app.main:app --host 127.0.0.1 --port 8000",
      cwd: "../backend",
      url: "http://127.0.0.1:8000/api/health",
      env: { PM_DB_PATH: E2E_DB },
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
