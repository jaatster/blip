/**
 * The effects' canvases at fractional device pixel ratios (Windows at 125% and 175%, phones at 2.625): a burst's
 * sprite pixel and a transition's cells are whole numbers of device pixels, and their canvases sit on whole device
 * pixels, so nothing is drawn between device pixels. The ratio is stubbed here; on screens at those ratios the same
 * rules leave no blended device pixel in a screenshot.
 */
import { afterEach, beforeEach, describe, expect, inject, it } from "vitest";
import base from "../../../packages/core/src/css/base.css?raw";
import { burst } from "../../../packages/effects/src/burst.ts";
import { transition } from "../../../packages/effects/src/transitions.ts";
import { mount } from "../support/dom.ts";

let style: HTMLStyleElement;
beforeEach(() => {
  // Core's base caps canvases at 100% of their container: an effect's canvas must not be squeezed by it.
  style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + base }));
});
afterEach(() => {
  style.remove();
  delete (window as { devicePixelRatio?: number }).devicePixelRatio;
  delete (document as { startViewTransition?: unknown }).startViewTransition;
});
const ratio = (dpr: number) => Object.defineProperty(window, "devicePixelRatio", { value: dpr, configurable: true });
const whole = (css: number, dpr: number) => Math.abs(css * dpr - Math.round(css * dpr)) < 0.01;
/** The canvas an effect has put in the top layer. */
const overlaid = () => [...document.querySelectorAll<HTMLCanvasElement>("body > div[aria-hidden] > canvas")].at(-1)!;

describe("burst", () => {
  for (const dpr of [1.25, 1.75, 2.625]) {
    it(`draws sprite pixels of whole device pixels, on whole device pixels, at ${dpr}`, async () => {
      ratio(dpr);
      const target = mount(`<button style="position:absolute;left:100.3px;top:50.45px;width:41px;height:23px">Coin</button>`);
      const done = burst(target, { kind: "coin" });
      const c = overlaid();
      const unit = parseFloat(c.style.width) / c.width;
      expect(Math.round(unit * dpr)).toBe(Math.round(2 * dpr));
      expect(whole(unit, dpr)).toBe(true);
      expect(whole(parseFloat(c.style.left), dpr) && whole(parseFloat(c.style.top), dpr)).toBe(true);
      await done;
    });
  }
});

describe("transition", () => {
  for (const kind of ["dissolve", "dither"] as const) {
    for (const dpr of [1.25, 1.75, 2.625]) {
      it(`covers the screen in cells of whole device pixels at ${dpr} (${kind}, without view transitions)`, async () => {
        ratio(dpr);
        Object.defineProperty(document, "startViewTransition", { value: undefined, configurable: true });
        const done = transition(() => {}, { kind });
        const c = overlaid();
        const cell = parseFloat(c.style.width) / c.width;
        expect(whole(cell, dpr)).toBe(true);
        // It covers the whole screen, and the page's cap on canvases does not squeeze its cells.
        expect(parseFloat(c.style.width)).toBeGreaterThanOrEqual(innerWidth);
        expect(parseFloat(getComputedStyle(c).width)).toBeCloseTo(parseFloat(c.style.width), 1);
        await done;
      });
    }
  }
});
