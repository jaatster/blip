/**
 * A real Chromium page for the box-* tests, for what only a browser shows: how boxes land on device pixels, what a
 * box's states compute to in each scheme, in forced colours and on paper.
 *
 * Everything comes from the sources, never from a package's dist (another build may be writing it): the tokens are
 * built in a temporary copy and core's CSS is bundled from src. The page is served from http://chu.test/ by request
 * routing: /tokens.css and /core.css are those, any other path is a file of the repository, so a component's
 * stylesheet loads from /packages/components/src/<name>.css with its own imports.
 */
import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium, type Browser, type BrowserContextOptions, type Page } from "playwright";
import { REPO, node, tempDir, tokensCopy } from "../support/fixtures.ts";

const ORIGIN = "http://chu.test";

export interface BoxAssets {
  tokensCss: string;
  coreCss: string;
}

/** Builds the tokens and bundles core's CSS. Takes a second or two. */
export function boxAssets(): BoxAssets {
  const tokens = tokensCopy();
  const out = tempDir("box-css");
  try {
    const run = tokens.build();
    if (run.status !== 0) throw new Error(`The tokens did not build:\n${run.stderr || run.stdout}`);
    const css = node(join(REPO, "scripts/bundle-css.mjs"), [join(REPO, "packages/core/src/css/index.css"), join(out.dir, "core.css")], REPO);
    if (css.status !== 0) throw new Error(`core.css did not bundle:\n${css.stderr || css.stdout}`);
    return { tokensCss: readFileSync(join(tokens.dir, "dist/css/tokens.css"), "utf8"), coreCss: readFileSync(join(out.dir, "core.css"), "utf8") };
  } finally {
    tokens.remove();
    out.remove();
  }
}

export const launch = (): Promise<Browser> => chromium.launch();

/**
 * Opens body under the tokens, core and the named components' stylesheets, in a scheme (none: the page's default).
 * `context` sets the device pixel ratio, forced colours and so on.
 */
export async function boxPage(
  browser: Browser,
  a: BoxAssets,
  { body, components = [], scheme, style = "", context = {} }: { body: string; components?: string[]; scheme?: string; style?: string; context?: BrowserContextOptions },
): Promise<Page> {
  const page = await (await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1, reducedMotion: "reduce", ...context })).newPage();
  const links = ["/tokens.css", "/core.css", ...components.map((c) => `/packages/components/src/${c}.css`)].map((href) => `<link rel="stylesheet" href="${href}">`).join("");
  const html = `<!doctype html><html lang="en"${scheme ? ` data-chu-scheme="${scheme}"` : ""}><head><meta charset="utf-8">${links}<style>body{margin:0}${style}</style></head><body>${body}</body></html>`;
  await page.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/") return route.fulfill({ contentType: "text/html", body: html });
    if (path === "/tokens.css") return route.fulfill({ contentType: "text/css", body: a.tokensCss });
    if (path === "/core.css") return route.fulfill({ contentType: "text/css", body: a.coreCss });
    try {
      return route.fulfill({ contentType: extname(path) === ".css" ? "text/css" : "application/octet-stream", body: readFileSync(join(REPO, path)) });
    } catch {
      return route.fulfill({ status: 404, body: "" });
    }
  });
  await page.goto(`${ORIGIN}/`, { waitUntil: "load" });
  return page;
}

/** WCAG contrast between two computed colours ("rgb(…)"). */
export function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, b2] = (c.match(/[\d.]+/g) ?? []).slice(0, 3).map((v) => {
      const s = Number(v) / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b2!;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}
