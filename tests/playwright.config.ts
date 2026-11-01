/**
 * Visual regression and accessibility scans of every example, on tests/page/example.html (time frozen, randomness
 * seeded, reduced motion), served from the repo root. Build the packages first.
 *
 *   pnpm --filter @blip/tests test:visual          compare with the baselines in visual/__screenshots__/<platform>
 *   pnpm --filter @blip/tests test:visual:update   write new baselines (review them before committing)
 *   pnpm --filter @blip/tests test:a11y            axe, WCAG 2.2 AA, every example in Day and Night
 *   pnpm --filter @blip/tests test:conditions      every example under real conditions, measured, not shot:
 *                                                       contrast as rendered, seams at 125% to 262.5%, forced colours,
 *                                                       right to left, long words, other scripts, print and motion
 *                                                       (conditions/README.md; one lane: add its file name)
 *
 * Baselines are per platform (font rasterising differs): Linux CI keeps its own, made in CI or in the Playwright
 * Docker image.
 */
import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.BLIP_TEST_PORT ?? 4180);

export default defineConfig({
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]] : [["list"]],
  outputDir: "test-results",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Playwright's own Chromium (pinned to this Playwright version), not the system Chrome, so pixels repeat.
    browserName: "chromium",
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "UTC",
  },
  expect: {
    // Zero tolerance: the same build on the same platform draws the same pixels.
    toHaveScreenshot: { maxDiffPixels: 0, threshold: 0, animations: "disabled", caret: "hide", scale: "css" },
  },
  snapshotPathTemplate: "{testDir}/__screenshots__/{platform}/{arg}{ext}",
  webServer: {
    command: `node ../scripts/serve.mjs --port ${PORT}`,
    url: `http://localhost:${PORT}/tests/page/example.html`,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
  },
  projects: [
    { name: "visual", testDir: "./visual" },
    { name: "a11y", testDir: "./a11y" },
    { name: "conditions", testDir: "./conditions" },
  ],
});
