// Serves the built docs under a path: BLIP_DOCS_BASE, "/blip" on jaatster.com. The sources write root paths
// ("/components/button/", "/blip/core/core.css"), so a local build serves at "/" unchanged; for a deploy, every root
// path to the site's own top-level names gets the prefix in the HTML, the docs' own scripts and styles, and the JSON
// (search, the shadcn registry). The packages' files in /blip hold no root paths, so they are left alone.
//
// Usage: rebase(distDir, "/blip") after the build (astro.config.mjs runs it when BLIP_DOCS_BASE is set).

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

export function rebase(dir, base) {
  base = "/" + base.replace(/^\/+|\/+$/g, "");
  // The site's own names at its root: its sections, folders and files (components, blip, js, og.png, search.json…).
  const names = readdirSync(dir).filter((n) => n !== "index.html" && n !== "404.html").map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // A root path to one of them, after a quote, a bracket, an equals sign, a comma or a space, and ending at a slash,
  // a quote, ? # ) , or a space.
  const named = new RegExp(`(?<=["'\`(=,\\s])/(?=(?:${names.join("|")})(?:[/"'\`?#),\\s]|$))`, "g");
  // The home page itself ("/", "/#kits"): in HTML attributes and as a JSON value (search's entry for it), never in
  // scripts, where "/" is as often a separator. And the prefetch rule for every page.
  const home = /(?<=\s(?:href|src|action|content)=["'])\/(?=["'#?])/g;
  const homeValue = /(?<=":\s*")\/(?=["#?])/g;
  const files = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) { if (relative(dir, p) !== "blip") walk(p); }
      else if ([".html", ".css", ".js", ".json", ".mjs"].includes(extname(n))) files.push(p);
    }
  };
  walk(dir);
  let changed = 0;
  for (const f of files) {
    const before = readFileSync(f, "utf8");
    let after = before.replace(named, `${base}/`);
    if (f.endsWith(".html")) after = after.replace(home, `${base}/`).replaceAll('"href_matches":"/*"', `"href_matches":"${base}/*"`);
    if (f.endsWith(".json")) after = after.replace(homeValue, `${base}/`);
    if (after !== before) { writeFileSync(f, after); changed++; }
  }
  return { files: files.length, changed, base };
}
