/**
 * Every story as a test, in Chromium (Playwright's build): it renders, its play function runs, and axe checks it to
 * WCAG 2.2 AA (parameters.a11y.test). Twice: in Day with full motion, and in Night with reduced motion, so the dark
 * scheme is checked too and the interaction paths hold when motion is off. `pnpm --filter @blip/storybook test`
 * generates the stories first.
 */
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const configDir = fileURLToPath(new URL("./.storybook", import.meta.url));

const project = (name: string, globals: Record<string, string | number>) => ({
  plugins: [storybookTest({ configDir, initialGlobals: globals, storybookScript: "pnpm dev --ci", storybookUrl: "http://localhost:6006" })],
  test: {
    name,
    setupFiles: ["./src/lib/vitest-setup.ts"],
    testTimeout: 20_000,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" as const }],
      viewport: { width: 1280, height: 900 },
    },
  },
});

export default defineConfig({
  test: {
    api: { port: 63510, strictPort: false },
    projects: [
      project("day", { scheme: "day", pixel: 2, motion: "full" }),
      project("night, reduced motion", { scheme: "night", pixel: 2, motion: "reduce" }),
    ],
  },
});
