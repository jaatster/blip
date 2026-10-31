#!/usr/bin/env node
// Bundles a CSS entry by inlining its relative @imports, and writes a minified copy and a size report.
// No dependencies. Usage: node scripts/bundle-css.mjs <entry.css> <out.css> [<entry> <out> ...]

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { gzipSync } from "node:zlib";

const IMPORT_RE = /@import\s+(?:url\()?["']([^"']+)["']\)?\s*;/g;

function inline(file, seen = new Set()) {
  const path = resolve(file);
  if (seen.has(path)) return "";
  seen.add(path);
  let css;
  try {
    css = readFileSync(path, "utf8");
  } catch {
    console.error(`bundle-css: cannot read ${relative(process.cwd(), path)}.\n  Fix: check the @import path.`);
    process.exit(1);
  }
  return css.replace(IMPORT_RE, (whole, href) => {
    if (/^(https?:)?\/\//.test(href) || href.startsWith("@")) return whole;
    return inline(resolve(dirname(path), href), seen);
  });
}

/** A conservative minifier: comments and redundant whitespace only, strings left alone. */
function minify(css) {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end < 0 ? css.length : end + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c) j += css[j] === "\\" ? 2 : 1;
      out += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    out += c;
    i++;
  }
  return out
    .replace(/\s+/g, " ")
    .replace(/\s*([{};>,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim() + "\n";
}

const args = process.argv.slice(2);
if (!args.length || args.length % 2) {
  console.error("Usage: node scripts/bundle-css.mjs <entry.css> <out.css> [<entry> <out> ...]");
  process.exit(1);
}
for (let k = 0; k < args.length; k += 2) {
  const [entry, out] = [args[k], args[k + 1]];
  const css = inline(entry);
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, css);
  const min = minify(css);
  const minOut = out.replace(/\.css$/, ".min.css");
  writeFileSync(minOut, min);
  console.log(`${relative(process.cwd(), out)}: ${css.length} B, min ${min.length} B, gzip ${gzipSync(min, { level: 9 }).length} B`);
}
