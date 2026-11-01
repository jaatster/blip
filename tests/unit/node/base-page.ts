/**
 * A real Chromium page for the base-* and scheme-* tests, for what only a browser shows: the default text size,
 * prefers-contrast, ligatures, the cascade layers, and the scheme change frame by frame.
 *
 * Everything comes from the sources, never from a package's dist (another build may be writing it): the tokens are
 * built in a temporary copy, core's CSS is bundled from src, core's JavaScript is bundled from src with esbuild. The
 * page is served from http://pp.test/ by request routing, so fonts and stylesheets load as on a site.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";
import { chromium, type Browser, type BrowserContextOptions, type Page } from "playwright";
import { REPO, node, tempDir, tokensCopy } from "../support/fixtures.ts";

export const ORIGIN = "http://pp.test";
const TYPES: Record<string, string> = { ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".ttf": "font/ttf", ".svg": "image/svg+xml" };

export interface Assets {
  tokensCss: string;
  coreCss: string;
  layersCss: string;
  coreJs: string;
}

/** Builds the tokens, bundles core's CSS and JavaScript. Takes a few seconds. */
export async function assets(): Promise<Assets> {
  const tokens = tokensCopy();
  const out = tempDir("core-css");
  try {
    const run = tokens.build();
    if (run.status !== 0) throw new Error(`The tokens did not build:\n${run.stderr || run.stdout}`);
    const css = node(join(REPO, "scripts/bundle-css.mjs"), [join(REPO, "packages/core/src/css/index.css"), join(out.dir, "core.css")], REPO);
    if (css.status !== 0) throw new Error(`core.css did not bundle:\n${css.stderr || css.stdout}`);
    const js = await build({ entryPoints: [join(REPO, "packages/core/src/js/index.ts")], bundle: true, format: "esm", target: "es2022", write: false, logLevel: "silent" });
    return {
      tokensCss: readFileSync(join(tokens.dir, "dist/css/tokens.css"), "utf8"),
      coreCss: readFileSync(join(out.dir, "core.css"), "utf8"),
      layersCss: readFileSync(join(REPO, "packages/core/src/css/layers.css"), "utf8"),
      coreJs: js.outputFiles[0]!.text,
    };
  } finally {
    tokens.remove();
    out.remove();
  }
}

export const launch = (): Promise<Browser> => chromium.launch();

/**
 * Opens body (the inside of <body>) at http://pp.test/ under head (the inside of <head>, after the charset). In head,
 * /tokens.css, /core.css, /layers.css and /core.js are the built assets; any other path is a file of the repository
 * (/packages/font/font.css). `routes` adds or replaces paths; `before` runs on the page before it loads (a clock, an
 * init script, a CDP setting).
 */
export async function open(
  browser: Browser,
  a: Assets,
  { head = "", body = "", html = 'lang="en"', routes = {}, context = {}, before }: { head?: string; body?: string; html?: string; routes?: Record<string, string>; context?: BrowserContextOptions; before?: (page: Page) => Promise<void> } = {},
): Promise<Page> {
  const page = await (await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1, ...context })).newPage();
  await before?.(page);
  const files: Record<string, [string, string]> = {
    "/": [`<!doctype html><html ${html}><head><meta charset="utf-8">${head}</head><body>${body}</body></html>`, "text/html"],
    "/tokens.css": [a.tokensCss, "text/css"],
    "/core.css": [a.coreCss, "text/css"],
    "/layers.css": [a.layersCss, "text/css"],
    "/core.js": [a.coreJs, "text/javascript"],
    ...Object.fromEntries(Object.entries(routes).map(([k, v]) => [k, [v, k.endsWith(".js") ? "text/javascript" : "text/css"]])),
  };
  await page.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    const file = files[path];
    if (file) return route.fulfill({ body: file[0], contentType: file[1] });
    try {
      return route.fulfill({ body: readFileSync(join(REPO, path)), contentType: TYPES[path.slice(path.lastIndexOf("."))] ?? "application/octet-stream" });
    } catch {
      return route.fulfill({ status: 404, body: "" });
    }
  });
  await page.goto(`${ORIGIN}/`);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return page;
}

/** The stylesheets of a Blip page, in order. */
export const STYLES = '<link rel="stylesheet" href="/packages/font/font.css"><link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/core.css">';

/** WCAG 2.2 contrast of two colours as CSS gives them (#RRGGBB or rgb()). */
export function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, bl] = rgb(c).map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

export function rgb(c: string): number[] {
  const s = c.trim();
  if (s.startsWith("#")) return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const m = s.match(/[\d.]+/g);
  if (!m) throw new Error(`Not a colour: "${c}"`);
  return m.slice(0, 3).map(Number);
}
