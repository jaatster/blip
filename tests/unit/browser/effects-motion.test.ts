/**
 * The effects' motion stops and stays still with reduced motion: the typewriter's caret holds still while it types
 * and blinks six beats once done, the glint sweeps twice, and the CRT's flicker steps between the scanlines' fields
 * (no opacity) for six beats. The CRT's scanlines are a dither of opaque ink, never a translucent wash.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, inject, it } from "vitest";
import { commands } from "vitest/browser";
import motionCss from "../../../packages/core/src/css/motion.css?raw";
import crtCss from "../../../packages/effects/src/crt.css?raw";
import textCss from "../../../packages/effects/src/text.css?raw";
import type { BlipTypewriter } from "../../../packages/effects/src/text.ts";
import { mount } from "../support/dom.ts";

let style: HTMLStyleElement;
beforeAll(async () => {
  await import("../../../packages/effects/src/text.ts");
});
beforeEach(() => {
  style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + motionCss + textCss + crtCss }));
});
afterEach(async () => {
  style.remove();
  await commands.emulateMedia("no-preference");
});

const after = (el: Element) => getComputedStyle(el, "::after");

describe("the typewriter's caret", () => {
  it("holds still while it types, then blinks six beats and stays shown", () => {
    const line = mount<BlipTypewriter>(`<chu-typewriter caret>Ready, player one?</chu-typewriter>`);
    const typed = line.querySelector(".chu-typewriter-typed")!;
    expect(after(typed).animationName).toBe("none");
    expect(after(typed).opacity).toBe("1");
    line.finish();
    expect(after(typed).animationName).toBe("chu-blink");
    expect(after(typed).animationIterationCount).toBe("6");
  });

  it("is still and shown with reduced motion", async () => {
    await commands.emulateMedia("reduce");
    const line = mount<BlipTypewriter>(`<chu-typewriter caret>Ready, player one?</chu-typewriter>`);
    const typed = line.querySelector(".chu-typewriter-typed")!;
    expect(line.querySelector(".chu-typewriter-rest")!.textContent).toBe("");
    expect(after(typed).animationName).toBe("none");
    expect(after(typed).opacity).toBe("1");
  });
});

describe("the glint", () => {
  it("sweeps once, at once, and is done in under half a second", () => {
    const box = mount(`<div class="chu-box" style="width:56px;height:56px"><span class="chu-glint"></span></div>`);
    const glint = box.firstElementChild!;
    expect(after(glint).animationIterationCount).toBe("1, 1");
    // A 4.5 s cycle started 4.1 s in: the sweep's five frames come first, and then the animation is over.
    expect(after(glint).animationDuration.split(", ").map(parseFloat)).toEqual([4.5, 4.5]);
    expect(after(glint).animationDelay.split(", ").map(parseFloat)).toEqual([-4.1, -4.1]);
  });

  it("sweeps as often as --chu-glint-count asks, 4.5 s apart, and not at all with reduced motion", async () => {
    const box = mount(`<div class="chu-box" style="width:56px;height:56px;--chu-glint-count:3"><span class="chu-glint"></span></div>`);
    expect(after(box.firstElementChild!).animationIterationCount).toBe("3, 3");
    await commands.emulateMedia("reduce");
    await expect.poll(() => after(box.firstElementChild!).animationName).toBe("none");
  });
});

describe("the CRT", () => {
  it("draws its scanlines in opaque ink through a dither, not a translucent wash", () => {
    const crt = mount(`<div class="chu-crt" style="width:100px;height:60px"></div>`);
    const lines = after(crt);
    expect(lines.opacity).toBe("1");
    // Ink, opaque (#1A1530 by Day; at Night, the palette's own).
    expect(lines.backgroundColor).toBe("rgb(26, 21, 48)");
    expect(lines.maskImage).toContain("conic-gradient");
    expect(crtCss).not.toMatch(/color-mix|rgba\(|opacity:\s*0\./);
  });

  it("flickers by stepping the scanlines to the other rows, for six beats, never by fading", () => {
    const crt = mount(`<div class="chu-crt" data-flicker style="width:100px;height:60px"></div>`);
    expect(after(crt).animationName).toBe("chu-crt-flicker");
    expect(after(crt).animationIterationCount).toBe("6");
    expect(after(crt).animationTimingFunction).toBe("steps(1)");
    const flicker = document.getAnimations().find((a) => (a as CSSAnimation).animationName === "chu-crt-flicker")!;
    // Chromium names the mask's position by its longhands (webkitMaskPositionX and Y).
    const props = flicker.effect!.getKeyframes().flatMap((k) => Object.keys(k));
    expect(props.some((p) => /maskposition/i.test(p))).toBe(true);
    expect(props.filter((p) => !/^(offset|easing|composite|computedOffset)$/.test(p) && !/maskposition/i.test(p))).toEqual([]);
  });

  it("holds still with reduced motion", async () => {
    await commands.emulateMedia("reduce");
    const crt = mount(`<div class="chu-crt" data-flicker style="width:100px;height:60px"></div>`);
    await expect.poll(() => after(crt).animationName).toBe("none");
  });
});
