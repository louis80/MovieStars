import { defineConfig, devices } from "@playwright/test";

// Set PW_CHROME_PATH to use an installed Chrome instead of Playwright's download.
const executablePath = process.env.PW_CHROME_PATH;

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:4173",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [{ name: "phone", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: "VITE_SAMPLE_DATA=true npm run build && npm run preview -- --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
});
