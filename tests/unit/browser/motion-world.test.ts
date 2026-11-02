/**
 * The world pauses at once when less motion is asked for, on the page (data-blip-motion="reduce" on <html>, which the
 * motion toggle sets) or on the device, and carries on from where it stopped: drifting clouds stop where they are and
 * drift on from there; a flock of birds, a shooting star or a flaring star goes at once; the layers come back to rest
 * without a slide; nothing new starts while it is paused.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, inject, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { provide } from "@jaatster/blip-core";
import motionCss from "../../../packages/core/src/css/motion.css?raw";
import worldCss from "../../../packages/effects/src/world.css?raw";
import { mount } from "../support/dom.ts";

const html = document.documentElement;
let style: HTMLStyleElement;
let restore: () => void = () => undefined;
beforeAll(async () => {
  await import("../../../packages/effects/src/world.ts");
});
beforeEach(() => {
  style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + motionCss + worldCss }));
  restore = provide({ seed: 42, clock: () => new Date(2026, 5, 21, 12, 0) });
  vi.useFakeTimers();
});
afterEach(async () => {
  vi.useRealTimers();
  delete html.dataset.blipMotion;
  style.remove();
  restore();
  await commands.emulateMedia("no-preference");
});

/** A world in a 640 x 320 box. */
const world = (attributes: string) => mount(`<div style="position:relative;width:640px;height:320px"><blip-world ${attributes}></blip-world></div>`);
/** The sprites over the sky of one size: clouds 38 x 16, sparkles 5 x 5, birds 5 x 3, a shooting star 10 x 5. */
const sprites = (box: Element, w: number, h: number) => [...box.querySelectorAll<HTMLCanvasElement>(".blip-world-things canvas")].filter((c) => c.width === w && c.height === h);
const clouds = (box: Element) => sprites(box, 38, 16).map((c) => `${c.style.translate}${c.hidden ? " hidden" : ""}`);
/** Lets the world's watch on <html> run (a mutation observer: a microtask). */
const settle = () => Promise.resolve();
/** Steps the clock a frame at a time until test() holds (at most `ms`). */
const until = (test: () => boolean, ms: number) => {
  for (let t = 0; t < ms && !test(); t += 40) vi.advanceTimersByTime(40);
  return test();
};

describe("<blip-world> and less motion asked for on the page", () => {
  it("stops the drifting clouds where they are, at once, and they drift on from there", async () => {
    const box = world(`scheme="day" clouds`);
    const start = clouds(box);
    // 640 px at the 2 px pixel is the TV's 320-pixel picture: its four clouds, none twice.
    expect(start).toHaveLength(4);
    vi.advanceTimersByTime(4000);
    const moved = clouds(box);
    expect(moved).not.toEqual(start);
    html.dataset.blipMotion = "reduce";
    await settle();
    expect(clouds(box)).toEqual(moved);
    vi.advanceTimersByTime(20_000);
    expect(clouds(box)).toEqual(moved);
    // Back: drawn again for moving, each cloud where it stopped, then on.
    delete html.dataset.blipMotion;
    await settle();
    expect(clouds(box)).toEqual(moved);
    vi.advanceTimersByTime(4000);
    expect(clouds(box)).not.toEqual(moved);
  });

  it("draws drifting clouds where a moving world has them when it is drawn paused, so carrying on never jumps", async () => {
    html.dataset.blipMotion = "reduce";
    const paused = clouds(world(`scheme="day" clouds`));
    delete html.dataset.blipMotion;
    await settle();
    expect(paused).toHaveLength(4);
    expect(paused).toEqual(clouds(world(`scheme="day" clouds`)));
  });

  it("lets a flock go at once, brings the layers to rest without a slide, and starts nothing new while paused", async () => {
    const box = world(`scheme="day" events parallax clouds="none"`);
    // The first flock comes 5 to 15 seconds in.
    expect(until(() => sprites(box, 5, 3).length === 3, 16_000)).toBe(true);
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 0, clientY: 100 }));
    const layers = [...box.querySelectorAll<HTMLElement>(".blip-world-stage > *")];
    const x = () => layers.map((l) => l.style.getPropertyValue("--_blip-world-x"));
    expect(x()).not.toEqual(["0", "0", "0", "0", "0", "0"]);
    html.dataset.blipMotion = "reduce";
    await settle();
    expect(sprites(box, 5, 3)).toHaveLength(0);
    expect(x()).toEqual(["0", "0", "0", "0", "0", "0"]);
    expect(layers.map((l) => getComputedStyle(l).transitionProperty)).toEqual(Array(6).fill("none"));
    // The pointer no longer slides them, and no flock comes.
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 600, clientY: 100 }));
    expect(x()).toEqual(["0", "0", "0", "0", "0", "0"]);
    vi.advanceTimersByTime(300_000);
    expect(sprites(box, 5, 3)).toHaveLength(0);
  });

  it("puts out a flaring star and lets a shooting star go, at once", async () => {
    const box = world(`scheme="night" stars events clouds="none"`);
    const lit = () => sprites(box, 5, 5).filter((c) => !c.hidden);
    expect(until(() => lit().length > 0, 3000)).toBe(true);
    html.dataset.blipMotion = "reduce";
    await settle();
    expect(lit()).toHaveLength(0);
    vi.advanceTimersByTime(30_000);
    expect(lit()).toHaveLength(0);
    delete html.dataset.blipMotion;
    await settle();
    const shooting = () => sprites(box, 10, 5).filter((c) => !c.hidden);
    expect(until(() => shooting().length > 0, 130_000)).toBe(true);
    html.dataset.blipMotion = "reduce";
    await settle();
    expect(sprites(box, 10, 5)).toHaveLength(0);
  });
});

describe("<blip-world> and the device's reduced motion turned on", () => {
  it("brings the layers to rest at once, as the page's setting does", async () => {
    vi.useRealTimers();
    const box = world(`scheme="day" parallax clouds="none"`);
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 0, clientY: 100 }));
    const layers = [...box.querySelectorAll<HTMLElement>(".blip-world-stage > *")];
    const x = () => layers.map((l) => l.style.getPropertyValue("--_blip-world-x"));
    expect(x()).not.toEqual(["0", "0", "0", "0", "0", "0"]);
    await commands.emulateMedia("reduce");
    await expect.poll(x).toEqual(["0", "0", "0", "0", "0", "0"]);
  });
});
