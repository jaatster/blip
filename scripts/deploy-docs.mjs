#!/usr/bin/env node
// Builds the docs for jaatster.com/blip and uploads them to the "blip" Cloudflare Pages project.
//
//   node scripts/deploy-docs.mjs            build under /blip, stage, upload (needs `wrangler login`)
//   node scripts/deploy-docs.mjs --dry      build and stage only: deploy/.out/ is what would go up
//
// The build's root paths get the /blip prefix (apps/docs/scripts/rebase.mjs), and it is built into deploy/.out/blip,
// leaving apps/docs/dist alone. The files go up inside that blip/ folder, so blip.pages.dev/blip/ and jaatster.com/blip/ (the Worker in deploy/cloudflare) serve the same
// paths. The project's root sends visitors to /blip/.

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "/blip";
const OUT = join(ROOT, "deploy/.out");
const run = (cmd, args, env = {}) => execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } });

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
// Built straight into the folder it is served from, leaving apps/docs/dist (the local preview) as it is.
const site = join(OUT, BASE.slice(1));
run(process.execPath, [join(ROOT, "scripts/heavy.mjs"), "pnpm --filter docs build"], { CHU_DOCS_BASE: BASE, CHU_DOCS_OUT: site });
// Anything outside /blip lands on the docs; a missing page under it gets the docs' own 404 (Pages looks up the tree).
writeFileSync(join(OUT, "_redirects"), `/ ${BASE}/ 302\n`);
cpSync(join(site, "404.html"), join(OUT, "404.html"));
console.log(`deploy: staged ${OUT}`);
if (!process.argv.includes("--dry")) run("npx", ["wrangler", "pages", "deploy", OUT, "--project-name", "blip", "--branch", "main", "--commit-dirty=true"]);
