#!/usr/bin/env node
// Builds the docs for jaatster.com/blip and uploads them as the "blip" Cloudflare Worker's static files.
//
//   node scripts/deploy-docs.mjs            build under /blip, stage, upload (needs `wrangler login`)
//   node scripts/deploy-docs.mjs --dry      build and stage only: deploy/.out/ is what would go up
//
// The build's root paths get the /blip prefix (apps/docs/scripts/rebase.mjs), and it is built into deploy/.out/blip,
// leaving apps/docs/dist alone. deploy/cloudflare/wrangler.toml routes jaatster.com/blip* to those files, the
// blip/ folder matching the path.

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
run(process.execPath, [join(ROOT, "scripts/heavy.mjs"), "pnpm --filter docs build"], { BLIP_DOCS_BASE: BASE, BLIP_DOCS_OUT: site });
// A missing page gets the docs' own 404 (the nearest 404.html up the tree).
cpSync(join(site, "404.html"), join(OUT, "404.html"));
console.log(`deploy: staged ${OUT}`);
// Always with the config, so wrangler never guesses a project from the folder it runs in.
if (!process.argv.includes("--dry")) execFileSync("npx", ["wrangler", "deploy", "--config", "wrangler.toml"], { cwd: join(ROOT, "deploy/cloudflare"), stdio: "inherit" });
