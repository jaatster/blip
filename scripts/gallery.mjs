#!/usr/bin/env node
// Writes specimen/gallery.json: every component stylesheet and example fragment in the packages, for the gallery
// page (specimen/gallery.html). Run it after adding a component.
import { readdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const pkgs = readdirSync("packages").filter((p) => existsSync(join("packages", p, "package.json")));
const css = [], js = [], examples = [];
for (const p of ["components", "game", "blocks", "effects", "sound", ...pkgs].filter((v, i, a) => a.indexOf(v) === i)) {
  const src = join("packages", p, "src");
  if (existsSync(src) && !["core", "tokens"].includes(p)) for (const f of readdirSync(src).sort()) if (f.endsWith(".css") && !f.startsWith("_")) css.push(`/${src}/${f}`);
  // One module per source file, loaded on its own, so one unfinished file never breaks the rest.
  if (existsSync(src) && !["core", "tokens", "react"].includes(p)) for (const f of readdirSync(src).sort()) {
    if (f.endsWith(".ts") && f !== "index.ts" && !f.startsWith("_") && !f.endsWith(".d.ts") && !f.endsWith(".test.ts")) js.push(`/packages/${p}/dist/${f.replace(/\.ts$/, ".js")}`);
  }
  const ex = join("packages", p, "examples");
  if (existsSync(ex)) for (const f of readdirSync(ex).sort()) if (f.endsWith(".html")) examples.push({ pkg: p, name: f.replace(/\.html$/, ""), url: `/${ex}/${f}` });
}
writeFileSync("specimen/gallery.json", JSON.stringify({ css, js, examples }, null, 2) + "\n");
console.log(`gallery: ${examples.length} examples, ${css.length} stylesheets, ${js.length} scripts`);
