#!/usr/bin/env node
// Builds a CSS package: every src/*.css (not starting with _) is a component. Writes dist/<name>.css (all of them,
// in file order), one dist file per component, minified copies, and a gzip size report.
// Usage (from a package): node ../../scripts/build-css-package.mjs <bundle-name>
import { readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync, mkdirSync } from "node:fs";

const name = process.argv[2];
if (!name) { console.error("Usage: build-css-package.mjs <bundle-name>"); process.exit(1); }
const bundler = join(dirname(fileURLToPath(import.meta.url)), "bundle-css.mjs");
const files = existsSync("src") ? readdirSync("src").filter((f) => f.endsWith(".css") && !f.startsWith("_")).sort() : [];
mkdirSync("dist", { recursive: true });
writeFileSync("dist/.index.css", files.map((f) => `@import "../src/${f}";`).join("\n") + "\n");
const pairs = ["dist/.index.css", `dist/${name}.css`, ...files.flatMap((f) => [`src/${f}`, `dist/${f}`])];
execFileSync("node", [bundler, ...pairs], { stdio: "inherit" });
