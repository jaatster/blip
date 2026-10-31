/**
 * What the test page loads, read from the packages on disk (the same rules as scripts/gallery.mjs, so the cascade
 * order matches the gallery and the docs): every component and kit stylesheet, every element module, and every
 * example fragment. Nothing to keep in step by hand: a new example is a new test.
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface Example {
  /** The package folder: components, game, blocks, effects, font, icons. */
  pkg: string;
  /** The file name without .html: tabs, landing. */
  name: string;
  /** Served from the repo root. */
  url: string;
}
export interface Manifest {
  css: string[];
  js: string[];
  examples: Example[];
}

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(): Manifest {
  const packages = join(ROOT, "packages");
  const pkgs = readdirSync(packages).filter((p) => existsSync(join(packages, p, "package.json")));
  const css: string[] = [];
  const js: string[] = [];
  const examples: Example[] = [];
  for (const p of ["components", "game", "blocks", "effects", "sound", ...pkgs].filter((v, i, a) => a.indexOf(v) === i)) {
    if (!pkgs.includes(p)) continue;
    const src = join(packages, p, "src");
    if (existsSync(src) && !["core", "tokens"].includes(p)) {
      for (const f of readdirSync(src).sort()) if (f.endsWith(".css") && !f.startsWith("_")) css.push(`/packages/${p}/src/${f}`);
    }
    if (existsSync(src) && !["core", "tokens", "react"].includes(p)) {
      for (const f of readdirSync(src).sort()) {
        if (f.endsWith(".ts") && f !== "index.ts" && !f.startsWith("_") && !f.endsWith(".d.ts") && !f.endsWith(".test.ts")) {
          const dist = `packages/${p}/dist/${f.replace(/\.ts$/, ".js")}`;
          if (!existsSync(join(ROOT, dist))) throw new Error(`${dist} is missing. Build the packages first: pnpm -r --filter "./packages/**" run build`);
          js.push(`/${dist}`);
        }
      }
    }
    const ex = join(packages, p, "examples");
    if (existsSync(ex)) for (const f of readdirSync(ex).sort()) if (f.endsWith(".html")) examples.push({ pkg: p, name: f.replace(/\.html$/, ""), url: `/packages/${p}/examples/${f}` });
  }
  return { css, js, examples };
}

export const manifest: Manifest = read();
export const examples: Example[] = manifest.examples;

/** Examples that change their layout on a phone: also shot at 390 wide. */
export const RESPONSIVE = ["app-bar", "bottom-bar", "sidebar", "table", "grid", "landing", "hero"];

export const id = (e: Example): string => `${e.pkg}/${e.name}`;
