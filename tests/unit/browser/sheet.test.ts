/**
 * <chu-sheet>: it opens at the first height data-snap lists, the handle steps through the heights (a click, Enter)
 * and says which with aria-expanded, a drag follows the pointer in whole pixels and lets go at the nearest height,
 * a drag or flick down past the lowest closes it (reason "drag"), the body only pulls it down with a finger at its
 * top, the click that ends a drag is not a press, and Escape still closes it.
 */
import { afterEach, beforeEach, describe, expect, inject, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import boxCss from "../../../packages/core/src/css/box.css?raw";
import dialogCss from "../../../packages/components/src/dialog.css?raw";
import drawerCss from "../../../packages/components/src/drawer.css?raw";
import sheetCss from "../../../packages/components/src/sheet.css?raw";
import type { BlipSheet } from "../../../packages/elements/src/sheet.ts";
import "../../../packages/elements/src/sheet.ts";
import { mount } from "../support/dom.ts";

let style: HTMLStyleElement;
beforeEach(async () => {
  const css = [boxCss, dialogCss, drawerCss, sheetCss].map((c) => c.replace(/@import[^;]+;/g, "")).join("\n");
  // As core's base.css: border-box.
  style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: `${inject("tokensCss")}*, *::before, *::after { box-sizing: border-box; }\n${css}` }));
  // No slide and heights at once, so each test reads the end of a move. (Reduced motion: the slide is CSS.)
  document.documentElement.dataset.chuMotion = "reduce";
  await commands.emulateMedia("reduce");
});
afterEach(async () => {
  await commands.emulateMedia("no-preference");
  style.remove();
  delete document.documentElement.dataset.chuMotion;
});

const settle = (ms = 0) => new Promise((done) => setTimeout(done, ms));
const body = Array.from({ length: 30 }, (_, i) => `<p>Line ${i + 1}</p>`).join("");
function sheet(snap: string | null = "half full", handle = true): { el: BlipSheet; d: HTMLDialogElement; handle: HTMLButtonElement; body: HTMLElement } {
  const el = mount<BlipSheet>(`<chu-sheet>
    <dialog class="chu-box chu-drawer chu-sheet" ${snap === null ? "" : `data-snap="${snap}"`} aria-labelledby="sh-t">
      <header class="chu-dialog-header">
        ${handle ? '<button class="chu-box chu-sheet-handle" type="button" data-variant="ghost" aria-label="Resize"><span></span></button>' : ""}
        <h2 class="chu-dialog-title" id="sh-t">Route</h2>
      </header>
      <div class="chu-dialog-body">${body}</div>
    </dialog></chu-sheet>`);
  const d = el.querySelector("dialog")!;
  return { el, d, handle: d.querySelector(".chu-sheet-handle")!, body: d.querySelector(".chu-dialog-body")! };
}
const height = (d: HTMLDialogElement) => d.getBoundingClientRect().height;
const top = (d: HTMLDialogElement) => d.getBoundingClientRect().top;

/** A pointer pressing at the middle of el, moving by each dy (one move each), and letting go, after a pause or not. */
async function drag(el: Element, moves: number[], { type = "mouse", pause = 150, end = "pointerup" } = {}) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  let y = r.top + r.height / 2;
  const init = (): PointerEventInit => ({ pointerId: 5, pointerType: type, isPrimary: true, button: 0, clientX: x, clientY: y, bubbles: true, cancelable: true, composed: true });
  el.dispatchEvent(new PointerEvent("pointerdown", init()));
  for (const dy of moves) {
    y += dy;
    el.dispatchEvent(new PointerEvent("pointermove", init()));
  }
  if (pause) await settle(pause);
  el.dispatchEvent(new PointerEvent(end, init()));
  el.dispatchEvent(new MouseEvent("click", init()));
  await settle();
}

describe("chu-sheet", () => {
  it("opens at its first height and steps through them with the handle", async () => {
    const { el, d, handle } = sheet();
    const seen: unknown[] = [];
    el.addEventListener("chu-change", (e) => seen.push((e as CustomEvent).detail));
    expect(el.snaps).toEqual(["half", "full"]);
    el.show();
    expect(el.snap).toBe("half");
    expect(d.dataset.chuSnap).toBe("half");
    expect(height(d)).toBe(300);
    expect(handle.getAttribute("aria-expanded")).toBe("false");
    handle.click();
    await settle();
    expect(el.snap).toBe("full");
    // The screen less 8 pixels at the top.
    expect(height(d)).toBe(600 - 16);
    expect(handle.getAttribute("aria-expanded")).toBe("true");
    handle.click();
    await settle();
    expect(el.snap).toBe("half");
    expect(seen).toEqual([{ value: "full" }, { value: "half" }]);
  });

  it("steps with Enter on the handle, which is a real, named button", async () => {
    const { el, handle } = sheet();
    el.show();
    handle.focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(el.snap).toBe("full");
    expect(handle.localName).toBe("button");
    expect(handle.getAttribute("aria-label")).toBe("Resize");
  });

  it("is as tall as its content with no data-snap, and opens where snap was set while closed", async () => {
    const { el, d, handle } = sheet(null);
    expect(el.snaps).toEqual(["content"]);
    el.show();
    expect(d.style.blockSize).toBe("");
    expect(handle.hasAttribute("aria-expanded")).toBe(false);
    await el.close();
    const two = sheet("40% full");
    two.el.snap = "full";
    two.el.show();
    expect(two.el.snap).toBe("full");
    two.el.snap = "40%";
    await settle();
    expect(height(two.d)).toBe(240);
  });

  it("follows a drag in whole pixels and lets go at the nearest height", async () => {
    const { el, d, handle } = sheet();
    el.show();
    const r = handle.getBoundingClientRect();
    const init = (y: number): PointerEventInit => ({ pointerId: 5, pointerType: "mouse", button: 0, clientX: r.left + 5, clientY: y, bubbles: true });
    handle.dispatchEvent(new PointerEvent("pointerdown", init(r.top + 5)));
    handle.dispatchEvent(new PointerEvent("pointermove", init(r.top - 5)));
    expect(d.hasAttribute("data-chu-dragging")).toBe(true);
    handle.dispatchEvent(new PointerEvent("pointermove", init(r.top - 106.3)));
    expect(height(d)).toBe(402);
    expect(height(d) % 2).toBe(0);
    await settle(150);
    handle.dispatchEvent(new PointerEvent("pointerup", init(r.top - 106.3)));
    await settle();
    expect(d.hasAttribute("data-chu-dragging")).toBe(false);
    expect(el.snap).toBe("half");
    // Past half way to full, it goes to full; the click that ends the drag does not step it on.
    await drag(handle, [-10, -200]);
    expect(el.snap).toBe("full");
  });

  it("drags from the title bar, but not from its buttons", async () => {
    const { el, d } = sheet();
    el.show();
    const title = d.querySelector(".chu-dialog-title")!;
    await drag(title, [-10, -250]);
    expect(el.snap).toBe("full");
  });

  it("slides down below its lowest height, and closes past half of it (reason drag)", async () => {
    const { el, d, handle } = sheet();
    const closed: unknown[] = [];
    el.addEventListener("chu-close", (e) => closed.push((e as CustomEvent).detail.reason));
    el.show();
    const at = top(d);
    const r = handle.getBoundingClientRect();
    handle.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 5, button: 0, clientX: r.left + 5, clientY: r.top + 5, bubbles: true }));
    handle.dispatchEvent(new PointerEvent("pointermove", { pointerId: 5, button: 0, clientX: r.left + 5, clientY: r.top + 25, bubbles: true }));
    handle.dispatchEvent(new PointerEvent("pointermove", { pointerId: 5, button: 0, clientX: r.left + 5, clientY: r.top + 125, bubbles: true }));
    expect(height(d)).toBe(300);
    expect(top(d) - at).toBe(100);
    await settle(150);
    handle.dispatchEvent(new PointerEvent("pointerup", { pointerId: 5, button: 0, clientX: r.left + 5, clientY: r.top + 125, bubbles: true }));
    await settle();
    expect(el.open).toBe(true);
    expect(top(d)).toBe(at);
    await drag(handle, [10, 170]);
    await settle(50);
    expect(el.open).toBe(false);
    expect(closed).toEqual(["drag"]);
    expect(d.style.blockSize).toBe("");
  });

  it("goes on to the next height on a flick, and closes on a flick down from the lowest", async () => {
    const { el, handle } = sheet();
    el.show();
    await drag(handle, [-10, -30], { pause: 0 });
    expect(el.snap).toBe("full");
    await drag(handle, [10, 30], { pause: 0 });
    expect(el.snap).toBe("half");
    await drag(handle, [10, 30], { pause: 0 });
    await settle(50);
    expect(el.open).toBe(false);
  });

  it("can be kept open: chu-before-close cancelled puts it back", async () => {
    const { el, handle } = sheet();
    el.addEventListener("chu-before-close", (e) => e.preventDefault());
    el.show();
    await drag(handle, [10, 280]);
    await settle();
    expect(el.open).toBe(true);
    expect(el.snap).toBe("half");
  });

  it("pulls down from the body only with a finger, and only at its top", async () => {
    const { el, d, body } = sheet("half full", false);
    el.show();
    const p = body.querySelector("p")!;
    // A mouse there selects text.
    await drag(p, [10, 200]);
    expect(el.open).toBe(true);
    // Scrolled down, a finger scrolls the body.
    body.scrollTop = 40;
    await drag(p, [10, 200], { type: "touch" });
    expect(el.open).toBe(true);
    // Pushing up from the top scrolls too.
    body.scrollTop = 0;
    await drag(p, [-10, -200], { type: "touch" });
    expect(el.snap).toBe("half");
    // At the top, a finger pulling down moves the sheet.
    await drag(p, [10, 200], { type: "touch" });
    await settle(50);
    expect(el.open).toBe(false);
    expect(d.hasAttribute("data-chu-dragging")).toBe(false);
  });

  it("goes back where it was when the browser takes the pointer", async () => {
    const { el, d, handle } = sheet();
    el.show();
    await drag(handle, [-10, -200], { end: "pointercancel" });
    expect(el.snap).toBe("half");
    expect(height(d)).toBe(300);
  });

  it("still closes with Escape", async () => {
    const { el, handle } = sheet();
    const closed: unknown[] = [];
    el.addEventListener("chu-close", (e) => closed.push((e as CustomEvent).detail.reason));
    el.show();
    handle.focus();
    await userEvent.keyboard("{Escape}");
    await settle(50);
    expect(el.open).toBe(false);
    expect(closed).toEqual(["escape"]);
  });
});
