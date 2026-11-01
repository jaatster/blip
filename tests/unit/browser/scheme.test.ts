/**
 * Schemes: setScheme sets one; autoScheme follows the clock (a provided one here), switching Day, Sunset and Night
 * at 6:00, 17:00 and 19:00, checking every minute. The first scheme comes at once; a later change runs behind a view
 * transition whose new picture comes in through an ordered dither (tests/unit/node/scheme-change.test.ts films it and
 * measures every text pair at every step).
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, inject, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { autoScheme, provide, setScheme } from "@jaatster/blip-core";
import base from "../../../packages/core/src/css/base.css?raw";
import { mount } from "../support/dom.ts";

// The tokens and core's base styles, which switch the browser's own cross-fade off while the dither runs.
let styles: HTMLStyleElement;
beforeAll(() => void document.head.append((styles = Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + base }))));
afterAll(() => styles.remove());

/** Resolves with the next scheme announced on el. */
const announced = (el: Element) =>
  new Promise<string>((resolve) => el.addEventListener("pp-scheme-change", (e) => resolve((e as CustomEvent<{ scheme: string }>).detail.scheme), { once: true }));
/** Resolves once no view transition runs. */
const settled = async () => {
  while (document.activeViewTransition) await document.activeViewTransition.finished;
};
/** The dither's animation on the new picture, if one runs. */
const dither = () => document.getAnimations().find((a) => (a.effect as KeyframeEffect | null)?.pseudoElement === "::view-transition-new(root)");

describe("setScheme", () => {
  it("sets data-pp-scheme on the page, or on one section", () => {
    const section = mount("<section></section>");
    setScheme("night", section);
    expect(section.dataset.ppScheme).toBe("night");
    const before = document.documentElement.dataset.ppScheme;
    setScheme("sunset");
    expect(document.documentElement.dataset.ppScheme).toBe("sunset");
    if (before === undefined) delete document.documentElement.dataset.ppScheme;
    else document.documentElement.dataset.ppScheme = before;
  });
});

describe("autoScheme", () => {
  let time = new Date(2026, 5, 21, 16, 58);
  let restore: () => void;
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout"] });
    time = new Date(2026, 5, 21, 16, 58);
    restore = provide({ clock: () => time });
  });
  afterEach(async () => {
    restore();
    vi.useRealTimers();
    await settled();
    await commands.emulateMedia("no-preference");
  });

  it("sets the scheme for the provided clock at once, without a fade", () => {
    const section = mount("<section></section>");
    const stop = autoScheme(section);
    expect(section.dataset.ppScheme).toBe("day");
    expect(section.hasAttribute("data-pp-scheme-auto")).toBe(true);
    expect(section.hasAttribute("data-pp-scheme-fade")).toBe(false);
    stop();
  });

  it("sets the first scheme at once even over another one", () => {
    const section = mount('<section data-pp-scheme="night"></section>');
    const stop = autoScheme(section);
    expect(section.dataset.ppScheme).toBe("day");
    expect(document.activeViewTransition).toBeFalsy();
    stop();
  });

  it("checks the clock every minute and dithers to the next scheme, announcing it", async () => {
    const section = mount("<section></section>");
    const changes: string[] = [];
    section.addEventListener("pp-scheme-change", (e) => changes.push((e as CustomEvent<{ scheme: string }>).detail.scheme));
    const stop = autoScheme(section);
    expect(changes).toEqual(["day"]);
    time = new Date(2026, 5, 21, 16, 59);
    vi.advanceTimersByTime(60_000);
    expect(changes).toEqual(["day"]);

    time = new Date(2026, 5, 21, 17, 0);
    let next = announced(section);
    vi.advanceTimersByTime(60_000);
    expect(section.hasAttribute("data-pp-scheme-fade")).toBe(true);
    expect(document.documentElement.hasAttribute("data-pp-scheme-dither")).toBe(true);
    expect(await next).toBe("sunset");
    expect(section.dataset.ppScheme).toBe("sunset");
    await settled();
    expect(document.documentElement.hasAttribute("data-pp-scheme-dither")).toBe(false);

    time = new Date(2026, 5, 21, 19, 0);
    next = announced(section);
    vi.advanceTimersByTime(60_000);
    expect(await next).toBe("night");
    expect(changes).toEqual(["day", "sunset", "night"]);
    stop();
  });

  it("dithers a quarter, a half and three quarters of the pixels, a frame each, and never fades", async () => {
    const section = mount("<section></section>");
    const stop = autoScheme(section);
    time = new Date(2026, 5, 21, 17, 0);
    vi.advanceTimersByTime(60_000);
    await document.activeViewTransition!.ready;
    const a = dither()!;
    expect(a).toBeDefined();
    const effect = a.effect as KeyframeEffect;
    // Three frames of the tokens' 40 ms.
    expect(effect.getTiming()).toMatchObject({ duration: 120, easing: "steps(3)" });
    // As the browser writes them: one cell of each 2 x 2 tile, then two on the diagonal, then three.
    const css = (value: string) => Object.assign(document.createElement("i").style, { maskImage: value }).maskImage;
    expect(effect.getKeyframes().map((k) => k.maskImage)).toEqual(
      ["conic-gradient(#000 25%, #0000 0)", "repeating-conic-gradient(#000 0 25%, #0000 0 50%)", "conic-gradient(#000 75%, #0000 0)", "none"].map(css),
    );
    // Nothing on the pictures fades: the dither is the only animation, and it animates nothing but the mask.
    const animated = document.getAnimations().filter((x) => (x.effect as KeyframeEffect | null)?.pseudoElement?.match(/^::view-transition-(old|new)/));
    expect(animated).toEqual([a]);
    expect(effect.getKeyframes().flatMap((k) => Object.keys(k)).filter((p) => !["offset", "computedOffset", "easing", "composite", "maskImage"].includes(p))).toEqual([]);
    stop();
  });

  it("comes at once with reduced motion", async () => {
    await commands.emulateMedia("reduce");
    const section = mount("<section></section>");
    const stop = autoScheme(section);
    time = new Date(2026, 5, 21, 17, 0);
    const next = announced(section);
    vi.advanceTimersByTime(60_000);
    expect(await next).toBe("sunset");
    if (document.activeViewTransition) {
      await document.activeViewTransition.ready.catch(() => undefined);
      expect(dither()?.effect?.getTiming().duration ?? 0).toBe(0);
    }
    stop();
  });

  it("comes at once while another view transition runs, and leaves that one be", async () => {
    const section = mount("<section></section>");
    const stop = autoScheme(section);
    const other = document.startViewTransition(() => undefined);
    await other.updateCallbackDone;
    time = new Date(2026, 5, 21, 17, 0);
    vi.advanceTimersByTime(60_000);
    expect(section.dataset.ppScheme).toBe("sunset");
    expect(document.activeViewTransition).toBe(other);
    stop();
  });

  it("does not fade with fade: false", () => {
    const section = mount("<section></section>");
    const stop = autoScheme(section, { fade: false });
    time = new Date(2026, 5, 21, 17, 30);
    vi.advanceTimersByTime(60_000);
    expect(section.dataset.ppScheme).toBe("sunset");
    expect(section.hasAttribute("data-pp-scheme-fade")).toBe(false);
    expect(document.activeViewTransition).toBeFalsy();
    stop();
  });

  it("stops following the clock when stopped, and clears its marks", async () => {
    const section = mount("<section></section>");
    const stop = autoScheme(section);
    time = new Date(2026, 5, 21, 17, 0);
    const next = announced(section);
    vi.advanceTimersByTime(60_000);
    expect(await next).toBe("sunset");
    stop();
    expect(section.hasAttribute("data-pp-scheme-auto")).toBe(false);
    expect(section.hasAttribute("data-pp-scheme-fade")).toBe(false);
    time = new Date(2026, 5, 21, 23, 0);
    vi.advanceTimersByTime(5 * 60_000);
    expect(section.dataset.ppScheme).toBe("sunset");
  });
});
