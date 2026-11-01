/**
 * <chu-refresh>: a touch pull from the top steps the content down in whole pixels, flips the arrow past the line,
 * and on release sends chu-refresh, holds the loader until the promises handed to waitUntil() settle, says
 * "Refreshing" then "Updated", and steps back. A pull below the line, a scroller that is not at the top, a sideways
 * swipe and a mouse drag refresh nothing; refresh() does the same as a pull.
 */
import { afterEach, beforeEach, describe, expect, inject, it } from "vitest";
import refreshCss from "../../../packages/components/src/refresh.css?raw";
import type { BlipRefresh, RefreshDetail } from "../../../packages/elements/src/refresh.ts";
import "../../../packages/elements/src/refresh.ts";
import { mount } from "../support/dom.ts";

let style: HTMLStyleElement;
beforeEach(() => {
  style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + refreshCss }));
  document.documentElement.dataset.chuMotion = "reduce";
});
afterEach(() => {
  style.remove();
  delete document.documentElement.dataset.chuMotion;
});

const make = () =>
  mount<BlipRefresh>(`<chu-refresh class="chu-refresh" style="block-size:200px"><div class="chu-refresh-scroller" tabindex="0" aria-label="Scores">${"<p style='block-size:60px;margin:0'>Score</p>".repeat(10)}</div></chu-refresh>`);
const pull = (el: Element) => parseFloat((el as HTMLElement).style.getPropertyValue("--_chu-pull") || "0");
const status = (el: Element) => el.querySelector(".chu-refresh-status")!.textContent;

/** One finger: down, then each move as an offset from where it went down, then up (or cancelled). */
function finger(el: Element, moves: [number, number][], end: "touchend" | "touchcancel" | null = "touchend") {
  const target = el.querySelector(".chu-refresh-scroller p") ?? el;
  const at = (dx: number, dy: number) => new Touch({ identifier: 1, target, clientX: 100 + dx, clientY: 50 + dy });
  const send = (type: string, t: Touch, down = true) => {
    const e = new TouchEvent(type, { touches: down ? [t] : [], changedTouches: [t], bubbles: true, cancelable: true, composed: true });
    target.dispatchEvent(e);
    return e;
  };
  send("touchstart", at(0, 0));
  const events = moves.map(([dx, dy]) => send("touchmove", at(dx, dy)));
  const last = moves.at(-1) ?? [0, 0];
  if (end) send(end, at(...last), false);
  return events;
}
const tick = (ms = 0) => new Promise((done) => setTimeout(done, ms));

describe("chu-refresh", () => {
  it("adds its arrow, its loader and a polite live region", () => {
    const el = make();
    const indicator = el.querySelector(".chu-refresh-indicator")!;
    expect(indicator.getAttribute("aria-hidden")).toBe("true");
    expect(indicator.querySelector(".chu-refresh-arrow")).not.toBe(null);
    expect(indicator.querySelector(".chu-loader")).not.toBe(null);
    expect(el.querySelector(".chu-refresh-status")!.getAttribute("role")).toBe("status");
    expect(el.scroller).toBe(el.querySelector(".chu-refresh-scroller"));
  });

  it("follows a pull in whole pixels and flips the arrow past the line", () => {
    const el = make();
    finger(el, [[0, 5], [0, 81.4]], null);
    expect(pull(el)).toBe(40);
    expect(el.getAttribute("data-chu-pull")).toBe("pulling");
    expect(el.querySelector(".chu-refresh-label")!.textContent).toBe("Pull to refresh");
    finger(el, [], "touchend");
    const [first, mid, last] = finger(el, [[0, 5], [0, 81.4], [0, 121]], null);
    expect(first!.defaultPrevented).toBe(true);
    expect(mid!.defaultPrevented).toBe(true);
    expect(pull(el)).toBe(60);
    expect(el.getAttribute("data-chu-pull")).toBe("ready");
    expect(last!.defaultPrevented).toBe(true);
    expect(el.querySelector(".chu-refresh-label")!.textContent).toBe("Release to refresh");
  });

  it("refreshes on release past the line, waits for the promise, says so, and steps back", async () => {
    const el = make();
    let finish!: () => void;
    const asked: RefreshDetail[] = [];
    el.addEventListener("chu-refresh", (e) => {
      const d = (e as CustomEvent<RefreshDetail>).detail;
      asked.push(d);
      d.waitUntil(new Promise<void>((done) => (finish = done)));
    });
    finger(el, [[0, 4], [0, 60], [0, 130]]);
    expect(asked).toHaveLength(1);
    expect(el.refreshing).toBe(true);
    expect(el.getAttribute("data-chu-pull")).toBe("refreshing");
    expect(el.scroller!.getAttribute("aria-busy")).toBe("true");
    expect(status(el)).toBe("Refreshing");
    await tick(450);
    // Still waiting on the promise: the loader stays.
    expect(el.refreshing).toBe(true);
    expect(pull(el)).toBe(48);
    expect(() => asked[0]!.waitUntil(Promise.resolve())).toThrow();
    finish();
    await tick(10);
    expect(el.refreshing).toBe(false);
    expect(status(el)).toBe("Updated");
    expect(el.scroller!.hasAttribute("aria-busy")).toBe(false);
    expect(el.hasAttribute("data-chu-pull")).toBe(false);
    expect(pull(el)).toBe(0);
  });

  it("steps back without refreshing below the line, away from the top, sideways or cancelled", () => {
    const el = make();
    let asked = 0;
    el.addEventListener("chu-refresh", () => asked++);
    finger(el, [[0, 4], [0, 30]]);
    expect(pull(el)).toBe(0);
    finger(el, [[0, 4], [0, 200]], "touchcancel");
    expect(pull(el)).toBe(0);
    finger(el, [[30, 4], [40, 200]]);
    expect(pull(el)).toBe(0);
    el.scroller!.scrollTop = 120;
    const [move] = finger(el, [[0, 4], [0, 200]]);
    expect(move!.defaultPrevented).toBe(false);
    expect(asked).toBe(0);
  });

  it("is for touch: a mouse drag does nothing", () => {
    const el = make();
    let asked = 0;
    el.addEventListener("chu-refresh", () => asked++);
    const s = el.scroller!;
    const opts = (y: number) => ({ clientX: 100, clientY: y, bubbles: true, cancelable: true, pointerType: "mouse", pointerId: 1, isPrimary: true, buttons: 1 });
    s.dispatchEvent(new PointerEvent("pointerdown", opts(10)));
    s.dispatchEvent(new MouseEvent("mousedown", opts(10)));
    for (const y of [40, 120, 200]) {
      s.dispatchEvent(new PointerEvent("pointermove", opts(y)));
      s.dispatchEvent(new MouseEvent("mousemove", opts(y)));
    }
    s.dispatchEvent(new PointerEvent("pointerup", opts(200)));
    s.dispatchEvent(new MouseEvent("mouseup", opts(200)));
    expect(pull(el)).toBe(0);
    expect(el.hasAttribute("data-chu-pull")).toBe(false);
    expect(asked).toBe(0);
  });

  it("refresh() does what a pull does, once at a time, and a canceled chu-refresh does nothing", async () => {
    const el = make();
    let asked = 0;
    el.addEventListener("chu-refresh", () => asked++);
    const a = el.refresh();
    expect(el.refresh()).toBe(a);
    expect(status(el)).toBe("Refreshing");
    await a;
    expect(asked).toBe(1);
    expect(status(el)).toBe("Updated");

    el.addEventListener("chu-refresh", (e) => e.preventDefault());
    await el.refresh();
    expect(asked).toBe(2);
    expect(status(el)).toBe("Updated");
    expect(el.scroller!.hasAttribute("aria-busy")).toBe(false);
  });

  it("says nothing is updated when the work fails", async () => {
    const el = make();
    el.addEventListener("chu-refresh", (e) => (e as CustomEvent<RefreshDetail>).detail.waitUntil(Promise.reject(new Error("offline"))));
    await el.refresh();
    expect(status(el)).toBe("");
    expect(el.refreshing).toBe(false);
  });
});
