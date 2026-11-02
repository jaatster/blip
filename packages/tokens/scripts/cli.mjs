#!/usr/bin/env node
// blip-tokens: builds a theme's tokens.css through the same checks as Blip's own palette. A theme is a
// DTCG 2025.10 resolver whose contexts list Blip's files and the theme's own (the docs' palette maker exports
// one); what it leaves out (the foundation set, the resolution order, a modifier) is Blip's.
//
// Usage: blip-tokens <theme.resolver.json> [--out <file.css>] [--check]

import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { readTokens, formatProblems, formatReport, tokensCss } from "./tokens.mjs";

const USAGE = `Usage: blip-tokens <theme.resolver.json> [--out <file.css>] [--check]

Builds tokens.css for a Blip theme, after the checks Blip's own colours pass: every text pair at WCAG 2.2
AA in every scheme, the focus ring against the page, labels on the candies and on a disabled control's dither.
On a problem it prints its code, the file and place, and how to fix it, and writes nothing.

  --out <file.css>   where to write (default: beside the resolver, <name>.css)
  --check            check only, write nothing
`;

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  process.stdout.write(USAGE);
  process.exit(0);
}
let resolver, out;
const check = args.includes("--check");
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--check") continue;
  if (a === "--out") {
    out = args[++i];
    if (!out) fail("--out needs a file name.");
  } else if (a.startsWith("-")) fail(`Unknown option "${a}".`);
  else if (resolver) fail(`One theme at a time: "${resolver}" and "${a}".`);
  else resolver = a;
}
if (!resolver) fail("Name the theme's resolver, the .resolver.json file the palette maker exports.");

function fail(message) {
  process.stderr.write(`blip-tokens: ${message}\n\n${USAGE}`);
  process.exit(1);
}

const file = resolve(resolver);
const model = readTokens({ resolverFile: file, base: process.cwd(), theme: true });
if (model.problems.length) {
  process.stderr.write(formatProblems(model.problems));
  process.exit(1);
}
console.log(formatReport(model));
if (check) process.exit(0);

const target = resolve(out ?? join(dirname(file), `${basename(file).replace(/(\.resolver)?\.json$/, "")}.css`));
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, tokensCss(model, `Blip tokens with the theme in ${basename(file)}. Built by blip-tokens: do not edit.`));
console.log(`Wrote ${relative(process.cwd(), target)}: load it instead of @jaatster/blip-tokens/tokens.css.`);
