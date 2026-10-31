// The Blip docs: a static site. Blip's own files are served as built (scripts/prepare.mjs stages them in
// public/pp) and wired with an import map, so pages load only the CSS and element modules they use.
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://jaatster.com/blip",
  trailingSlash: "always",
  compressHTML: true,
  devToolbar: { enabled: false },
  build: { format: "directory", inlineStylesheets: "never" },
  vite: { server: { fs: { allow: ["../.."] } } },
});
