/** Opens one example on the test page and waits until it is ready; fails on any script error or failed request. */
import { expect, type ConsoleMessage, type Page, type Request } from "@playwright/test";
import { manifest, id, type Example } from "./manifest.js";

export type Scheme = "day" | "sunset" | "night";

const seeded = new WeakSet<Page>();

export async function openExample(page: Page, example: Example, scheme: Scheme): Promise<void> {
  const errors: string[] = [];
  const onError = (e: Error) => errors.push(`page error: ${e.message}`);
  const onConsole = (m: ConsoleMessage) => {
    if (m.type() === "error") errors.push(`console error: ${m.text()}`);
  };
  // A request cut short by the next navigation is not a failure of this page.
  const onFailed = (r: Request) => {
    if (r.failure()?.errorText !== "net::ERR_ABORTED") errors.push(`request failed: ${r.url()} (${r.failure()?.errorText})`);
  };
  page.on("pageerror", onError);
  page.on("console", onConsole);
  page.on("requestfailed", onFailed);
  try {
    if (!seeded.has(page)) {
      seeded.add(page);
      await page.addInitScript((m) => {
        (window as unknown as { __CHU_MANIFEST__: unknown }).__CHU_MANIFEST__ = m;
      }, manifest);
    }
    await page.goto(`/tests/page/example.html?example=${encodeURIComponent(id(example))}&scheme=${scheme}`);
    await page.locator("body[data-ready]").waitFor({ state: "attached", timeout: 15_000 }).catch(() => undefined);
    expect(errors, `${id(example)} (${scheme}) logged errors while loading`).toEqual([]);
    await expect(page.locator("body"), `${id(example)} (${scheme}) never became ready`).toHaveAttribute("data-ready", "");
  } finally {
    page.off("pageerror", onError);
    page.off("console", onConsole);
    page.off("requestfailed", onFailed);
  }
}
