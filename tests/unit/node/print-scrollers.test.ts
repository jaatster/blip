/**
 * Paper cannot scroll. Measured in Chromium under print media: an open dialog prints its whole body, grown past any
 * height it is held to (an inline max-block-size too), and a tab row too long for its box prints wrapped, every tab
 * inside the box, without the buttons that scroll it. On screen both still scroll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright";
import { boxAssets, boxPage, launch, type BoxAssets } from "./box-page.ts";

let browser: Browser;
let assets: BoxAssets;
beforeAll(async () => {
  assets = boxAssets();
  browser = await launch();
}, 60_000);
afterAll(() => browser?.close());

const text = Array.from({ length: 12 }, (_, i) => `<p>Line ${i + 1}: the double jump no longer drops you through thin floors.</p>`).join("");

describe("print: an open dialog prints its whole body", () => {
  const body = `<dialog class="blip-box blip-dialog" open data-blip-static id="held" aria-label="Notes" style="max-block-size:calc(110*var(--blip-pixel))">
      <header class="blip-dialog-header"><h2 class="blip-dialog-title">Notes</h2></header>
      <div class="blip-dialog-body" id="held-body">${text}</div>
    </dialog>
    <dialog class="blip-box blip-dialog" id="modal" aria-label="Notes">
      <header class="blip-dialog-header"><h2 class="blip-dialog-title">Notes</h2></header>
      <div class="blip-dialog-body" id="modal-body">${text}${text}</div>
      <footer class="blip-dialog-footer"><button class="blip-box blip-button">Close</button></footer>
    </dialog>`;
  const measure = (page: Page, id: string) => page.$eval(`#${id}`, (b) => {
    const d = b.closest("dialog")!.getBoundingClientRect(), r = b.getBoundingClientRect();
    return { scrolls: b.scrollHeight > b.clientHeight + 1, overflow: getComputedStyle(b).overflowY, inside: r.bottom <= d.bottom + 0.5 && r.top >= d.top - 0.5 };
  });

  it("on screen, a body taller than its dialog scrolls", async () => {
    const page = await boxPage(browser, assets, { body, components: ["dialog", "button"], scheme: "day", context: { viewport: { width: 800, height: 600 } } });
    await page.$eval("#modal", (d: HTMLDialogElement) => d.showModal());
    for (const id of ["held-body", "modal-body"]) expect((await measure(page, id)).scrolls, id).toBe(true);
    await page.context().close();
  });

  it("on paper, it does not scroll and its dialog holds all of it", async () => {
    const page = await boxPage(browser, assets, { body, components: ["dialog", "button"], scheme: "day", context: { viewport: { width: 800, height: 600 } } });
    await page.$eval("#modal", (d: HTMLDialogElement) => d.showModal());
    await page.emulateMedia({ media: "print" });
    for (const id of ["held-body", "modal-body"]) expect(await measure(page, id), id).toEqual({ scrolls: false, overflow: "visible", inside: true });
    await page.context().close();
  });
});

describe("print: a tab row prints wrapped", () => {
  const tabs = Array.from({ length: 8 }, (_, i) => `<button class="blip-box blip-tab" data-variant="soft" role="tab" aria-selected="${i === 0}">World ${i + 1}</button>`).join("");
  const row = (overflow: boolean, id: string) => `<div class="blip-tabs" data-variant="soft" ${overflow ? "data-overflow" : ""} id="${id}" style="inline-size:300px">
      <div class="blip-tabs-list" role="tablist" aria-label="Worlds">${tabs}</div>
      <span class="blip-box blip-tabs-scroll" data-dir="start" data-variant="soft" aria-hidden="true"><span></span></span>
      <span class="blip-box blip-tabs-scroll" data-dir="end" data-variant="soft" aria-hidden="true"><span></span></span>
    </div>`;
  // With the element's data-overflow (it keeps it when it cannot measure again before printing), and without (no script).
  const body = `${row(true, "marked")}<div style="block-size:40px"></div>${row(false, "plain")}`;
  const measure = (page: Page, id: string) => page.$eval(`#${id}`, (t) => {
    const list = t.querySelector<HTMLElement>(".blip-tabs-list")!, box = t.getBoundingClientRect();
    const out = [...list.children].filter((tab) => { const r = tab.getBoundingClientRect(); return r.left < box.left - 8 || r.right > box.right + 8; }).length;
    return {
      scrolls: list.scrollWidth > list.clientWidth + 1,
      tabsOutside: out,
      // A new row starts left of where the last tab started.
      rows: 1 + [...list.children].filter((tab, i, all) => i > 0 && tab.getBoundingClientRect().left < all[i - 1]!.getBoundingClientRect().left).length,
      buttons: [...t.querySelectorAll(".blip-tabs-scroll")].map((b) => getComputedStyle(b).display).join(" "),
    };
  });

  it("on screen, the row scrolls (behind its buttons when the element marks it)", async () => {
    const page = await boxPage(browser, assets, { body, components: ["tabs"], scheme: "day" });
    expect(await measure(page, "marked")).toMatchObject({ scrolls: true, rows: 1, buttons: "grid grid" });
    expect(await measure(page, "plain")).toMatchObject({ scrolls: true, rows: 1, buttons: "none none" });
    await page.context().close();
  });

  it("on paper, every tab is inside the box, on as many rows as it takes, and the buttons are gone", async () => {
    const page = await boxPage(browser, assets, { body, components: ["tabs"], scheme: "day" });
    await page.emulateMedia({ media: "print" });
    for (const id of ["marked", "plain"]) {
      const m = await measure(page, id);
      expect(m, id).toMatchObject({ scrolls: false, tabsOutside: 0, buttons: "none none" });
      expect(m.rows, id).toBeGreaterThan(1);
    }
    await page.context().close();
  });
});
