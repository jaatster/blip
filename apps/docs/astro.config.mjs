// The Blip docs: a static site. Blip's own files are served as built (scripts/prepare.mjs stages them in
// public/chu) and wired with an import map, so pages load only the CSS and element modules they use.
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { addSections } from "./scripts/search-sections.mjs";

export default defineConfig({
  site: "https://jaatster.com/blip",
  trailingSlash: "always",
  compressHTML: true,
  devToolbar: { enabled: false },
  build: { format: "directory", inlineStylesheets: "never" },
  vite: { server: { fs: { allow: ["../.."] } } },
  integrations: [
    {
      // Once every page is written, search learns each page's headings (scripts/search-sections.mjs).
      name: "blip-docs-search",
      hooks: {
        "astro:build:done": ({ dir, logger }) => {
          const r = addSections(fileURLToPath(dir));
          logger.info(`search: ${r?.sections ?? 0} headings on ${r?.pages ?? 0} pages`);
        },
      },
    },
  ],
});
