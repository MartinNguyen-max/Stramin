import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // Desktop + iPhone, since Stramin is mobile first (NFR-2).
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
    { name: "iphone", use: { ...devices["iPhone 15"] } },
  ],
  // Starts the app automatically. CI tests the production build.
  webServer: {
    command: isCI ? "pnpm build && pnpm start" : "pnpm dev",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
