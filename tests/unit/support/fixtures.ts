/**
 * Node helpers for testing the build tools on throwaway copies: the real sources are never built in place, so these
 * tests never touch a package's dist (another build may be reading it) and can plant broken input freely.
 */
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** The repository root. */
export const REPO = fileURLToPath(new URL("../../../", import.meta.url));

export interface Run {
  status: number | null;
  stdout: string;
  stderr: string;
}

/** Runs a Node script and collects what it printed. */
export function node(script: string, args: string[] = [], cwd = dirname(script)): Run {
  const r = spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

/** A fresh temporary folder, removed by the returned function. */
export function tempDir(prefix: string): { dir: string; remove: () => void } {
  const dir = mkdtempSync(join(tmpdir(), `blip-${prefix}-`));
  return { dir, remove: () => rmSync(dir, { recursive: true, force: true }) };
}

/** Reads, changes and writes back a JSON file. */
export function editJson(file: string, change: (json: any) => void): void {
  const json = JSON.parse(readFileSync(file, "utf8"));
  change(json);
  writeFileSync(file, JSON.stringify(json, null, 2));
}

/** A copy of @jaatster/blip-tokens' build: its script, resolver and sources (no dist). */
export function tokensCopy(): { dir: string; build: (...args: string[]) => Run; remove: () => void } {
  const { dir, remove } = tempDir("tokens");
  const from = join(REPO, "packages/tokens");
  for (const part of ["scripts", "src", "blip.resolver.json", "contrast.json"]) cpSync(join(from, part), join(dir, part), { recursive: true });
  return { dir, remove, build: (...args) => node(join(dir, "scripts/build.mjs"), args, dir) };
}

/**
 * A copy of @jaatster/blip-icons laid out as in the repo (packages/icons under a root with node_modules and the base
 * tsconfig), so the whole build can run: esbuild and tsc resolve through a link to the repo's node_modules.
 * `sources` replaces src/*.icons; leave it out to keep the real icon set. `extra` adds files to src.
 */
export function iconsCopy(options: { sources?: Record<string, string>; extra?: Record<string, string> } = {}): {
  dir: string;
  pkg: string;
  build: () => Run;
  remove: () => void;
} {
  const { dir, remove } = tempDir("icons");
  const from = join(REPO, "packages/icons");
  const pkg = join(dir, "packages/icons");
  mkdirSync(join(pkg, "docs"), { recursive: true });
  for (const part of ["scripts", "package.json", "tsconfig.json"]) cpSync(join(from, part), join(pkg, part), { recursive: true });
  cpSync(join(from, "docs/icons.md"), join(pkg, "docs/icons.md"));
  cpSync(join(REPO, "tsconfig.base.json"), join(dir, "tsconfig.base.json"));
  symlinkSync(join(REPO, "node_modules"), join(dir, "node_modules"), "dir");
  if (options.sources) {
    mkdirSync(join(pkg, "src"), { recursive: true });
    cpSync(join(from, "src/element.ts"), join(pkg, "src/element.ts"));
    for (const [name, text] of Object.entries(options.sources)) writeFileSync(join(pkg, "src", name), text);
  } else cpSync(join(from, "src"), join(pkg, "src"), { recursive: true });
  for (const [name, text] of Object.entries(options.extra ?? {})) writeFileSync(join(pkg, "src", name), text);
  return { dir, pkg, remove, build: () => node(join(pkg, "scripts/build.mjs"), [], pkg) };
}
