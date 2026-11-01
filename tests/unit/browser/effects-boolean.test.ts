/**
 * A boolean attribute written "false" is off, as frameworks write it for false on an element that is defined later:
 * the effects' flags read it so (the typewriter's blips and caret, the world's parallax), and their properties write
 * "" for true and take the attribute away for false.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, inject, it } from "vitest";
import { provide } from "@blip/core";
import motionCss from "../../../packages/core/src/css/motion.css?raw";
import textCss from "../../../packages/effects/src/text.css?raw";
import worldCss from "../../../packages/effects/src/world.css?raw";
import type { BlipTypewriter } from "../../../packages/effects/src/text.ts";
import type { BlipWorld } from "../../../packages/effects/src/world.ts";
import { mount } from "../support/dom.ts";

let style: HTMLStyleElement;
let restore: () => void = () => undefined;
beforeAll(async () => {
  await import("../../../packages/effects/src/text.ts");
  await import("../../../packages/effects/src/world.ts");
});
beforeEach(() => {
  style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + motionCss + textCss + worldCss }));
});
afterEach(() => {
  style.remove();
  restore();
});

describe("flags written \"false\"", () => {
  it("reads blips and caret written \"false\" as off: no blips, no caret", async () => {
    const played: string[] = [];
    restore = provide({ sound: { play: (name) => void played.push(name) } });
    const line = mount<BlipTypewriter>(`<blip-typewriter blips="false" caret="false">Hello there.</blip-typewriter>`);
    expect(line.blips).toBe(false);
    expect(line.caret).toBe(false);
    expect(getComputedStyle(line.querySelector(".blip-typewriter-typed")!, "::after").content).toBe("none");
    await new Promise((r) => setTimeout(r, 300));
    expect(played).toEqual([]);
  });

  it("writes \"\" for true and takes the attribute away for false", () => {
    const line = mount<BlipTypewriter>(`<blip-typewriter caret="false">Hi.</blip-typewriter>`);
    line.caret = true;
    expect(line.getAttribute("caret")).toBe("");
    expect(getComputedStyle(line.querySelector(".blip-typewriter-typed")!, "::after").content).not.toBe("none");
    line.caret = false;
    expect(line.hasAttribute("caret")).toBe(false);
  });

  it("does not slide a world whose parallax is \"false\"", () => {
    const box = mount(`<div style="position:relative;width:400px;height:200px"><blip-world scheme="day" parallax="false" clouds="none"></blip-world></div>`);
    const world = box.firstElementChild as BlipWorld;
    expect(world.parallax).toBe(false);
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 0, clientY: 100 }));
    const x = [...box.querySelectorAll<HTMLElement>(".blip-world-stage > *")].map((l) => l.style.getPropertyValue("--_blip-world-x"));
    expect(x.every((v) => v === "0")).toBe(true);
    world.parallax = true;
    expect(world.getAttribute("parallax")).toBe("");
  });

  it("keeps a world's clouds still when clouds is \"false\", as when it is left out", () => {
    const drift = mount(`<div style="position:relative;width:400px;height:200px"><blip-world scheme="day" clouds></blip-world></div>`);
    expect(drift.querySelectorAll(".blip-world-things canvas").length).toBeGreaterThan(0);
    const still = mount(`<div style="position:relative;width:400px;height:200px"><blip-world scheme="day" clouds="false"></blip-world></div>`);
    expect(still.querySelectorAll(".blip-world-things canvas")).toHaveLength(0);
  });
});
