import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  outputDir: ".playwright-output",
  webServer: {
    command: "node scripts/serve.mjs",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  },
  use: {
    baseURL: "http://127.0.0.1:4173/",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "wide-1440x900",
      use: { viewport: { width: 1440, height: 900 } }
    },
    {
      name: "mobile-390x844",
      use: { viewport: { width: 390, height: 844 } }
    }
  ]
});
