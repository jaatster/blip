// The Blip docs: a static site. Blip's own files are served as built (scripts/prepare.mjs stages them in
// public/blip) and wired with an import map, so pages load only the CSS and element modules they use.
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { addSections } from "./scripts/search-sections.mjs";
import { rebase } from "./scripts/rebase.mjs";

export default defineConfig({
  // Where the docs live: their address, for canonical links and the social card. A deploy under a path sets
  // BLIP_DOCS_BASE ("/blip"), and the build's root paths get it once written (scripts/rebase.mjs).
  site: "https://jaatster.com/blip",
  trailingSlash: "always",
  // A deploy builds elsewhere (scripts/deploy-docs.mjs), so the local preview of dist/ keeps working.
  outDir: process.env.BLIP_DOCS_OUT || "./dist",
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
          if (process.env.BLIP_DOCS_BASE) {
            const b = rebase(fileURLToPath(dir), process.env.BLIP_DOCS_BASE);
            logger.info(`rebase: ${b.changed} of ${b.files} files now under ${b.base}/`);
          }
        },
      },
    },
  ],
});
