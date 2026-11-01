/**
 * <chu-pager>: a WAI-ARIA carousel that never moves by itself. It names the region and the slides, adds the
 * previous and next buttons, keeps the current dot in step with the track (swiped, or moved by a button, a key or a
 * dot), makes the slides out of view inert, and says which slide is showing with chu-page.
 */
import { describe, expect, it } from "vitest";
import type { BlipPager, PageDetail } from "../../../packages/elements/src/pager.ts";
import "../../../packages/elements/src/pager.ts";
import { mount, press } from "../support/dom.ts";

// The pager's own CSS is not loaded here: just enough of it to make the track a row of 200 px slides.
const PAGER = `
  <chu-pager aria-label="Worlds" style="display:block;width:200px">
    <div class="chu-pager-track" style="display:grid;grid-auto-flow:column;grid-auto-columns:100%;overflow:auto hidden;width:200px">
      <section class="chu-pager-slide" id="pg-a">Meadow <a href="#x">Play</a></section>
      <section class="chu-pager-slide" id="pg-b">Caves</section>
      <section class="chu-pager-slide" id="pg-c" aria-label="Sky islands">Sky</section>
    </div>
    <div class="chu-pager-dots">
      <a class="chu-pager-dot" href="#pg-a" aria-current="true" aria-label="Meadow"></a>
      <a class="chu-pager-dot" href="#pg-b" aria-label="Caves"></a>
      <a class="chu-pager-dot" href="#pg-c" aria-label="Sky islands"></a>
    </div>
  </chu-pager>`;

const pages = (el: Element) => {
  const seen: number[] = [];
  el.addEventListener("chu-page", (e) => seen.push((e as CustomEvent<PageDetail>).detail.index));
  return seen;
};
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));
const current = (pager: BlipPager) => [...pager.querySelectorAll(".chu-pager-dot")].findIndex((d) => d.getAttribute("aria-current") === "true");

describe("<chu-pager>", () => {
  it("is a carousel of labelled slides, with a polite track and buttons at the ends of the dots", () => {
    const pager = mount<BlipPager>(PAGER);
    expect(pager.getAttribute("role")).toBe("region");
    expect(pager.getAttribute("aria-roledescription")).toBe("carousel");
    expect(pager.track!.getAttribute("aria-live")).toBe("polite");
    expect(pager.track!.tabIndex).toBe(0);
    expect(pager.slides.map((s) => [s.getAttribute("role"), s.getAttribute("aria-roledescription"), s.getAttribute("aria-label")])).toEqual([
      ["group", "slide", "1 of 3"],
      ["group", "slide", "2 of 3"],
      ["group", "slide", "Sky islands"],
    ]);
    const dots = pager.querySelector(".chu-pager-dots")!;
    const prev = dots.firstElementChild as HTMLButtonElement;
    const next = dots.lastElementChild as HTMLButtonElement;
    expect([prev.className, prev.getAttribute("aria-label"), prev.getAttribute("aria-disabled")]).toEqual(["chu-box chu-button chu-pager-prev", "Previous slide", "true"]);
    expect([next.getAttribute("aria-label"), next.getAttribute("aria-disabled"), next.getAttribute("aria-controls")]).toEqual(["Next slide", "false", pager.track!.id]);
    expect(pager.slides.map((s) => s.inert)).toEqual([false, true, true]);
  });

  it("moves with its buttons in steps, then shows the slide: its dot, the ends, the others inert", async () => {
    const pager = mount<BlipPager>(PAGER);
    const seen = pages(pager);
    pager.querySelector<HTMLButtonElement>(".chu-pager-next")!.click();
    expect(pager.index).toBe(1);
    expect(current(pager)).toBe(1);
    expect(pager.slides.map((s) => s.inert)).toEqual([true, false, true]);
    await wait(300);
    expect(pager.track!.scrollLeft).toBe(200);
    pager.querySelector<HTMLButtonElement>(".chu-pager-next")!.click();
    await wait(300);
    expect(pager.querySelector(".chu-pager-next")!.getAttribute("aria-disabled")).toBe("true");
    pager.querySelector<HTMLButtonElement>(".chu-pager-next")!.click();
    expect(seen).toEqual([1, 2]);
  });

  it("keeps the dot in step as the track is swiped", async () => {
    const pager = mount<BlipPager>(PAGER);
    const seen = pages(pager);
    pager.track!.scrollLeft = 390;
    await wait(100);
    expect(pager.index).toBe(2);
    expect(current(pager)).toBe(2);
    expect(seen).toEqual([2]);
  });

  it("a dot moves there without following the link; the arrow keys, Home and End move along", async () => {
    const pager = mount<BlipPager>(PAGER);
    const seen = pages(pager);
    const dots = [...pager.querySelectorAll<HTMLElement>(".chu-pager-dot")];
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    dots[2]!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(pager.index).toBe(2);
    dots[2]!.focus();
    expect(press("ArrowLeft")).toBe(true);
    expect(pager.index).toBe(1);
    expect(document.activeElement).toBe(dots[1]);
    press("Home");
    expect(pager.index).toBe(0);
    press("End");
    expect(pager.index).toBe(2);
    pager.track!.focus();
    press("ArrowLeft");
    expect(pager.index).toBe(1);
    expect(seen).toEqual([2, 1, 0, 2, 1]);
    await wait(300);
  });

  it("index moves without an event; it never moves by itself", async () => {
    const pager = mount<BlipPager>(PAGER);
    const seen = pages(pager);
    pager.index = 1;
    await wait(1000);
    expect(pager.index).toBe(1);
    expect(pager.track!.scrollLeft).toBe(200);
    expect(seen).toEqual([]);
  });
});
