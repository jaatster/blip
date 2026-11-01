/**
 * Opens one example on the test page (tests/page/example.html, as the visual and accessibility projects do) under a
 * condition: a scheme, a text direction and language, the browser's default text size, extra fixture pages. Fails on
 * any script error or failed request, and waits until the page has stopped changing.
 */
import { expect, type ConsoleMessage, type Page, type Request } from "@playwright/test";
import { join } from "node:path";
import { manifest, id, ROOT, type Example } from "../../page/manifest.js";

export type Scheme = "day" | "sunset" | "night";
export const SCHEMES: Scheme[] = ["day", "sunset", "night"];

/** Pages of this project's own, loaded like examples (served from the repo root). */
export const fixture = (name: string): Example => ({ pkg: "conditions", name, url: `/tests/conditions/fixtures/${name}.html` });
export const FIXTURES_DIR = join(ROOT, "tests/conditions/fixtures");

export interface OpenOptions {
  scheme?: Scheme;
  /** Set on <html> before the example goes in, with lang (right to left: "rtl" and "ar"). */
  dir?: "ltr" | "rtl";
  lang?: string;
  /** The browser's default text size in px (chrome://settings/fonts), through CDP Page.setFontSizes. */
  fontSize?: number;
}

const prepared = new WeakSet<Page>();

export async function open(page: Page, example: Example, { scheme = "day", dir, lang, fontSize }: OpenOptions = {}): Promise<void> {
  const errors: string[] = [];
  const onError = (e: Error) => errors.push(`page error: ${e.message}`);
  const onConsole = (m: ConsoleMessage) => {
    if (m.type() === "error") errors.push(`console error: ${m.text()}`);
  };
  const onFailed = (r: Request) => {
    if (r.failure()?.errorText !== "net::ERR_ABORTED") errors.push(`request failed: ${r.url()} (${r.failure()?.errorText})`);
  };
  page.on("pageerror", onError);
  page.on("console", onConsole);
  page.on("requestfailed", onFailed);
  try {
    if (!prepared.has(page)) {
      prepared.add(page);
      // The packages' manifest, plus this project's fixtures, so example.js can load either.
      const m = { ...manifest, examples: [...manifest.examples, ...(example.pkg === "conditions" ? [example] : [])] };
      await page.addInitScript((m) => {
        (window as unknown as { __PP_MANIFEST__: unknown }).__PP_MANIFEST__ = m;
      }, m);
      // dir and lang on <html> as soon as it exists: before the example's elements connect.
      await page.addInitScript(() => {
        const q = new URLSearchParams(location.search);
        const set = () => {
          const html = document.documentElement;
          if (!html) return false;
          if (q.get("dir")) html.dir = q.get("dir")!;
          if (q.get("lang")) html.lang = q.get("lang")!;
          return true;
        };
        if (!set()) {
          const watch = new MutationObserver(() => set() && watch.disconnect());
          watch.observe(document, { childList: true });
        }
      });
    }
    if (fontSize) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Page.enable");
      await cdp.send("Page.setFontSizes", { fontSizes: { standard: fontSize, fixed: Math.round((fontSize * 13) / 16) } });
    }
    const q = new URLSearchParams({ example: id(example), scheme });
    if (dir) q.set("dir", dir);
    if (lang ?? (dir === "rtl" ? "ar" : undefined)) q.set("lang", lang ?? "ar");
    await page.goto(`/tests/page/example.html?${q}`);
    await page.locator("body[data-ready]").waitFor({ state: "attached", timeout: 15_000 }).catch(() => undefined);
    expect(errors, `${id(example)} (${scheme}) logged errors while loading`).toEqual([]);
    await expect(page.locator("body"), `${id(example)} (${scheme}) never became ready`).toHaveAttribute("data-ready", "");
  } finally {
    page.off("pageerror", onError);
    page.off("console", onConsole);
    page.off("requestfailed", onFailed);
  }
}

/** Waits for two frames and a quiet spell (no DOM changes for `quiet` ms, at most `max`): after a resize, a state
    change, a scheme switch. */
export async function settle(page: Page, quiet = 120, max = 2000): Promise<void> {
  await page.evaluate(
    ([quiet, max]) =>
      new Promise<void>((resolve) => {
        let timer = setTimeout(done, quiet);
        const cap = setTimeout(done, max);
        const watch = new MutationObserver(() => {
          clearTimeout(timer);
          timer = setTimeout(done, quiet);
        });
        watch.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
        function done() {
          watch.disconnect();
          clearTimeout(timer);
          clearTimeout(cap);
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }
      }),
    [quiet, max] as const,
  );
}

/** Grows the viewport to the whole page (up to `cap` px tall), so every part of the example is on screen, measured
    and shot in one piece. */
export async function fitViewport(page: Page, width: number, cap = 4000): Promise<{ width: number; height: number }> {
  const height = Math.min(cap, await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight)));
  await page.setViewportSize({ width, height: Math.max(height, 200) });
  await settle(page);
  // Growing it can change the height again (vh units, a world that fills the screen); take the second reading.
  const again = Math.min(cap, await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight)));
  if (again > height) {
    await page.setViewportSize({ width, height: again });
    await settle(page);
  }
  return { width, height: Math.max(again, height, 200) };
}
