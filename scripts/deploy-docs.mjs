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
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "/blip";
const OUT = join(ROOT, "deploy/.out");
const run = (cmd, args, env = {}) => execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } });

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
// Built straight into the folder it is served from, leaving apps/docs/dist (the local preview) as it is.
const site = join(OUT, BASE.slice(1));
run(process.execPath, [join(ROOT, "scripts/heavy.mjs"), "pnpm --filter @jaatster/blip-docs build"], { BLIP_DOCS_BASE: BASE, BLIP_DOCS_OUT: site });
// What changes only with a deploy (the packages' CSS, JS and fonts, the docs' own styles and scripts) moves into a
// folder named after its contents, v/<hash>/, and the pages point there: browsers keep it a year without asking
// again (_headers), and the next deploy's changes arrive under a new name. Pages themselves are always asked for.
const FIXED = ["blip", "css", "js"];
const files = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? files(join(d, n)) : [join(d, n)]));
const hash = createHash("sha256");
for (const f of FIXED.flatMap((d) => files(join(site, d))).sort()) hash.update(relative(site, f)).update(readFileSync(f));
const version = hash.digest("hex").slice(0, 10);
mkdirSync(join(site, "v", version), { recursive: true });
for (const d of FIXED) renameSync(join(site, d), join(site, "v", version, d));
const packages = join(site, "v", version, "blip"); // the packages' files hold no root paths (rebase.mjs)
for (const f of files(site).filter((f) => !f.startsWith(packages) && [".html", ".css", ".js", ".mjs", ".json"].includes(extname(f)))) {
  const before = readFileSync(f, "utf8");
  const after = FIXED.reduce((s, d) => s.replaceAll(`${BASE}/${d}/`, `${BASE}/v/${version}/${d}/`), before);
  if (after !== before) writeFileSync(f, after);
}
// Pages: fresh for a minute (a page fetched on hover opens at once), then shown from the cache while a fresh copy is
// fetched, for a day. The fixed files: a year, never asked for again.
writeFileSync(join(OUT, "_headers"), [
  `${BASE}/*`, "  Cache-Control: public, max-age=60, stale-while-revalidate=86400",
  `${BASE}/v/*`, "  ! Cache-Control", "  Cache-Control: public, max-age=31536000, immutable", "",
].join("\n"));
console.log(`deploy: fixed files under ${BASE}/v/${version}/`);

// A missing page gets the docs' own 404 (the nearest 404.html up the tree).
cpSync(join(site, "404.html"), join(OUT, "404.html"));
console.log(`deploy: staged ${OUT}`);
// Always with the config, so wrangler never guesses a project from the folder it runs in.
if (!process.argv.includes("--dry")) execFileSync("npx", ["wrangler", "deploy", "--config", "wrangler.toml"], { cwd: join(ROOT, "deploy/cloudflare"), stdio: "inherit" });
