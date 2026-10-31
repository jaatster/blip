/**
 * @jaatster/blip-core's motion helpers against a real browser: reduced motion follows the person's setting (emulated
 * here as Playwright does), durations come from the tokens, and the pixel is read from CSS.
 */
import { afterEach, beforeAll, describe, expect, inject, it } from "vitest";
import { commands } from "vitest/browser";
import { duration, pixel, reducedMotion, steps } from "@jaatster/blip-core";

let tokens: HTMLStyleElement;
beforeAll(() => {
  tokens = Object.assign(document.createElement("style"), { textContent: inject("tokensCss") });
});
afterEach(async () => {
  tokens.remove();
  document.documentElement.removeAttribute("data-pp-pixel");
  await commands.emulateMedia("no-preference");
});

describe("reducedMotion", () => {
  it("follows the person's setting, live", async () => {
    expect(reducedMotion()).toBe(false);
    await commands.emulateMedia("reduce");
    await expect.poll(reducedMotion).toBe(true);
    await commands.emulateMedia("no-preference");
    await expect.poll(reducedMotion).toBe(false);
  });
});

describe("steps", () => {
  it("is a steps() easing with whole, positive counts", () => {
    expect(steps(4)).toBe("steps(4, jump-end)");
    expect(steps(2.6)).toBe("steps(3, jump-end)");
    expect(steps(0)).toBe("steps(1, jump-end)");
    expect(steps(-3)).toBe("steps(1, jump-end)");
  });
});

describe("duration", () => {
  it("reads a duration token from CSS", () => {
    document.head.append(tokens);
    expect(duration("frame", 999)).toBe(40);
    expect(duration("glide", 999)).toBe(160);
  });

  it("is 0 for every token under reduced motion (the tokens zero them)", async () => {
    document.head.append(tokens);
    await commands.emulateMedia("reduce");
    await expect.poll(() => duration("frame", 999)).toBe(0);
    expect(duration("glide", 999)).toBe(0);
  });

  it("falls back without the tokens, and is 0 with reduced motion", async () => {
    expect(duration("frame", 40)).toBe(40);
    await commands.emulateMedia("reduce");
    await expect.poll(() => duration("frame", 40)).toBe(0);
  });

  it("reads seconds as well as milliseconds", () => {
    const el = document.body.appendChild(document.createElement("div"));
    el.style.setProperty("--pp-duration-test", "0.25s");
    expect(duration("test", 0, el)).toBe(250);
    el.remove();
  });
});

describe("pixel", () => {
  it("is 2 CSS px by default, and follows data-pp-pixel on the page or a section", () => {
    document.head.append(tokens);
    expect(pixel()).toBe(2);
    const section = document.body.appendChild(document.createElement("section"));
    section.dataset.ppPixel = "4";
    expect(pixel(section)).toBe(4);
    document.documentElement.dataset.ppPixel = "3";
    expect(pixel()).toBe(3);
    section.remove();
  });

  it("falls back to 2 without the tokens", () => {
    expect(pixel()).toBe(2);
  });
});
