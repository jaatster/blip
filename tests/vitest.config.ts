/**
 * Unit tests for Blip: `pnpm --filter @jaatster/blip-tests test`.
 *
 * Two projects:
 *   unit-node     Node. The build tools (tokens, icons), run on temporary copies of their sources, and the pure
 *                 functions (seeded random numbers, services, schemes, the blip voice, diagnostics).
 *   unit-browser  Chromium through Playwright (Vitest browser mode). Everything that needs a real DOM: timelines,
 *                 reduced motion, the shared controllers, PixelElement, the world's drawing.
 *
 * Tests import the TypeScript sources, so no package has to be built first. `@jaatster/blip-core` is pointed at its
 * source too, so a kit's source (effects, game, sound) and the test share one core, and `provide()` reaches both.
 */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { emulateMedia } from "./unit/support/commands.ts";

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit-node",
          environment: "node",
          include: ["unit/node/**/*.test.ts"],
        },
      },
      {
        resolve: {
          alias: [{ find: /^@blip\/core$/, replacement: at("../packages/core/src/js/index.ts") }],
        },
        test: {
          name: "unit-browser",
          include: ["unit/browser/**/*.test.ts"],
          // The tokens, built from source into a temporary folder, for the tests that read colours from CSS.
          globalSetup: ["unit/support/tokens-setup.ts"],
          // Its own port, clear of Storybook's Vitest run (63315 and up).
          api: { port: 63410 },
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({ contextOptions: { reducedMotion: "no-preference" } }),
            instances: [{ browser: "chromium" }],
            viewport: { width: 800, height: 600 },
            screenshotFailures: false,
            commands: { emulateMedia },
          },
        },
      },
    ],
  },
});
