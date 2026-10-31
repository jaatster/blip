/**
 * Blip's Storybook. The stories and docs pages are generated from the packages' examples and docs
 * (scripts/generate.mjs, run by the dev, build and test scripts); the interaction tests live in src/interactions.
 */
import type { StorybookConfig } from "@storybook/html-vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { reducedMotionSwitch } from "./reduced-motion.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../..");

const config: StorybookConfig = {
  framework: { name: "@storybook/html-vite", options: {} },
  stories: ["../src/**/*.mdx", "../src/**/*.stories.ts"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  // The fonts, for Storybook's own UI (manager-head.html); the stories get them through @jaatster/blip-font.
  staticDirs: [{ from: "../../../packages/font/dist", to: "/blip-fonts" }],
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  docs: { defaultName: "Docs" },
  async viteFinal(config) {
    config.plugins = [...(config.plugins ?? []), reducedMotionSwitch()];
    // Vite's default CSS minifier (Lightning CSS) cannot parse newer syntax Blip uses, such as
    // `@container anchored(fallback: flip-block)`; esbuild minifies it and leaves what it does not know alone.
    config.build = { ...config.build, cssMinify: "esbuild" };
    // The examples and docs are read from packages/ (outside this app).
    config.server = { ...config.server, fs: { ...config.server?.fs, allow: [...(config.server?.fs?.allow ?? []), repo] } };
    return config;
  },
};

export default config;
