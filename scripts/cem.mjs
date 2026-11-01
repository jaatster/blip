#!/usr/bin/env node
/**
 * Writes custom-elements.json for every package with Web Components, using custom-elements-manifest.config.mjs.
 *
 *   pnpm cem             analyse and write
 *   pnpm cem --check     analyse and fail if a written manifest is out of date (CI)
 *   pnpm cem --check game effects    only those packages (scripts/qa.mjs checks one item's)
 *
 * Each manifest is checked as it is made: every element needs a tag name and a summary or description, and every
 * event a name. Problems are listed together, with the module to fix.
 * Also importable: analyse("game") returns a package's manifest without writing it (the React generator uses it).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { cli } from "@custom-elements-manifest/analyzer/cli.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = join(ROOT, "custom-elements-manifest.config.mjs");
export const PACKAGES = ["elements", "game", "effects", "icons"];

/** A package's manifest, analysed from its sources (nothing written). */
export async function analyse(pkg) {
  const manifest = await cli({ argv: ["analyze", "--config", CONFIG, "--quiet"], cwd: join(ROOT, "packages", pkg), noWrite: true });
  return manifest;
}

/** What is wrong with a manifest, as lines naming the module. */
export function problems(pkg, manifest) {
  const out = [];
  for (const mod of manifest.modules) {
    for (const d of mod.declarations ?? []) {
      if (!d.customElement) continue;
      const at = `packages/${pkg}/${mod.path}: ${d.name}`;
      if (!d.tagName) out.push(`${at} has no tag name. Register it with BlipElement.define("chu-…", ${d.name}) or add @tag.`);
      if (!d.summary && !d.description) out.push(`${at} has no description. Add a JSDoc comment above the class.`);
      for (const e of d.events ?? []) if (!e.name) out.push(`${at} has an event without a name. Write @fires {Type} chu-name - What it means.`);
      for (const a of d.attributes ?? []) if (!a.type) out.push(`${at}: attribute "${a.name}" has no type. Write @attr {string} ${a.name} - What it does.`);
    }
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes("--check");
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const unknown = only.filter((p) => !PACKAGES.includes(p));
  if (unknown.length) {
    console.error(`cem: no elements in ${unknown.join(", ")}. Packages with elements: ${PACKAGES.join(", ")}.`);
    process.exit(2);
  }
  const issues = [];
  const stale = [];
  for (const pkg of only.length ? only : PACKAGES) {
    const manifest = await analyse(pkg);
    issues.push(...problems(pkg, manifest));
    const file = join(ROOT, "packages", pkg, "custom-elements.json");
    const json = `${JSON.stringify(manifest, null, 2)}\n`;
    const elements = manifest.modules.flatMap((m) => (m.declarations ?? []).filter((d) => d.customElement).map((d) => d.tagName));
    if (check) {
      if (!existsSync(file) || readFileSync(file, "utf8") !== json) stale.push(`packages/${pkg}/custom-elements.json`);
    } else writeFileSync(file, json);
    console.log(`${`@jaatster/blip-${pkg}`.padEnd(22)} ${String(elements.length).padStart(2)} elements  ${elements.join(" ")}`);
  }
  if (issues.length) console.error(`\ncem: ${issues.length} problem${issues.length > 1 ? "s" : ""}:\n  ${issues.join("\n  ")}`);
  if (stale.length) console.error(`\ncem: out of date (run pnpm cem and commit):\n  ${stale.join("\n  ")}`);
  if (issues.length || stale.length) process.exit(1);
}
