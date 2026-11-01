#!/usr/bin/env node
// Screenshots pages of the local server with Playwright, for visual checks.
// Usage: node scripts/shoot.mjs <out-dir> <path[?query]>=<name> ... [--width 1280] [--height 900] [--full] [--scale 1]

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const outDir = args[0];
const shots = args.slice(1).filter((a, i, all) => a.includes("=") && !all[i - 1]?.startsWith("--"));
const width = Number(opt("width", 1280)), height = Number(opt("height", 900)), scale = Number(opt("scale", 1));
const base = opt("base", "http://localhost:4173");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: process.env.CHU_BROWSER ?? "chrome" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
for (const s of shots) {
  const cut = s.lastIndexOf("="), path = s.slice(0, cut), name = s.slice(cut + 1);
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const file = join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: args.includes("--full") });
  console.log(file);
}
await browser.close();
if (errors.length) console.log("Page errors:\n  " + errors.join("\n  "));
