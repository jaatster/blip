#!/usr/bin/env node
// Screenshots with Playwright's Chromium (the tests workspace's).
//
//   node scripts/shoot.mjs        (pnpm shoot) the social card: specimen/press.html at 1200 x 630, device scale 1, in
//                                 Night and Day, saved as apps/docs/public/og.png and og-day.png. The page freezes
//                                 time and seeds randomness as the tests do and motion is reduced, so the same build
//                                 gives the same bytes. Uses the server on :4173 if it serves this checkout, else
//                                 starts scripts/serve.mjs for the run.
//   node scripts/shoot.mjs <out-dir> <path[?query]>=<name> ... [--width 1280] [--height 900] [--full] [--scale 1] [--base url]
//                                 pages of the local server, for visual checks.

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(join(ROOT, "tests/package.json"))("playwright");
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };

/** The social cards: [press.html's query, the file in apps/docs/public]. */
const CARDS = [["", "og.png"], ["?scheme=day", "og-day.png"]];

if (!args.length) await press();
else await adhoc();

async function press() {
  const { base, stop } = await server();
  const browser = await chromium.launch();
  const out = join(ROOT, "apps/docs/public");
  try {
    // As tests/playwright.config.ts: Playwright's own Chromium, scale 1, reduced motion, en-US, UTC.
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC" });
    const errors = watch(page);
    for (const [query, name] of CARDS) {
      await page.goto(`${base}/specimen/press.html${query}`);
      await page.locator("body[data-ready]").waitFor({ state: "attached", timeout: 15_000 });
      if (errors.length) throw new Error(`press.html${query} logged errors:\n  ${errors.join("\n  ")}`);
      const file = join(out, name);
      await page.screenshot({ path: file, animations: "disabled", caret: "hide" });
      console.log(`shoot: ${relative(ROOT, file)}`);
    }
  } finally {
    await browser.close();
    stop();
  }
}

/** The repo's static server: the one on :4173 if it serves this checkout's press.html, else one started for the run. */
async function server() {
  const mine = readFileSync(join(ROOT, "specimen/press.html"), "utf8");
  const serves = async (base) => (await fetch(`${base}/specimen/press.html`).then((r) => (r.ok ? r.text() : ""), () => "")) === mine;
  if (await serves("http://localhost:4173")) return { base: "http://localhost:4173", stop: () => {} };
  const port = Number(process.env.BLIP_SHOOT_PORT ?? 4181), base = `http://localhost:${port}`;
  const child = spawn(process.execPath, [join(ROOT, "scripts/serve.mjs"), "--port", String(port)], { stdio: "ignore" });
  for (let i = 0; i < 100 && !(await serves(base)); i++) await new Promise((r) => setTimeout(r, 100));
  if (!(await serves(base))) throw new Error(`shoot: could not start scripts/serve.mjs on port ${port} (BLIP_SHOOT_PORT picks another).`);
  return { base, stop: () => child.kill() };
}

function watch(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("requestfailed", (r) => r.failure()?.errorText !== "net::ERR_ABORTED" && errors.push(`request failed: ${r.url()}`));
  return errors;
}

async function adhoc() {
  const outDir = args[0];
  const shots = args.slice(1).filter((a, i, all) => a.includes("=") && !all[i - 1]?.startsWith("--"));
  const width = Number(opt("width", 1280)), height = Number(opt("height", 900)), scale = Number(opt("scale", 1));
  const base = opt("base", "http://localhost:4173");
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: process.env.BLIP_BROWSER ?? "chrome" }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: "reduce" });
  const errors = watch(page);
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
}
