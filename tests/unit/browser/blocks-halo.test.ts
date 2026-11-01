/**
 * Text on the world wears a one-pixel halo in the page colour, so it reads where it crosses a snowy peak, the moon or
 * a cloud: the hero's lead and note, and the call to action's text and note on the world (not in a box, where there is
 * no world behind it). Checked by Day and at Night, at the default pixel and at 3.
 */
import { afterEach, beforeEach, describe, expect, inject, it } from "vitest";
import ctaCss from "../../../packages/blocks/src/cta.css?raw";
import heroCss from "../../../packages/blocks/src/hero.css?raw";
import { mount } from "../support/dom.ts";

let style: HTMLStyleElement;
beforeEach(() => {
  // The blocks' shared world palette (_world.css) is not needed for the halo.
  const own = (text: string) => text.replace(/@import[^;]*;/g, "");
  style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + own(heroCss) + own(ctaCss) }));
});
afterEach(() => style.remove());

/** The eight offsets of a one-pixel halo, in CSS pixels, and its colour. */
function halo(el: Element): { offsets: string[]; colours: Set<string> } {
  const shadows = getComputedStyle(el).textShadow.split(/,(?![^(]*\))/).map((s) => s.trim());
  const offsets = shadows.map((s) => s.replace(/rgba?\([^)]*\)\s*/, "").split(/\s+/).slice(0, 2).join(" ")).sort();
  return { offsets, colours: new Set(shadows.map((s) => /rgba?\([^)]*\)/.exec(s)?.[0] ?? "")) };
}
const ring = (p: number) => [[-p, -p], [0, -p], [p, -p], [-p, 0], [p, 0], [-p, p], [0, p], [p, p]].map(([x, y]) => `${x}px ${y}px`).sort();

describe("the halo on text over the world", () => {
  for (const [scheme, bg] of [["day", "rgb(244, 247, 255)"], ["night", "rgb(23, 23, 23)"]]) {
    for (const pixel of [2, 3]) {
      it(`rings the hero's lead and note, and the call to action's text and note, by ${scheme} at a ${pixel} px pixel`, () => {
        const root = mount(`<div data-blip-scheme="${scheme}" data-blip-pixel="${pixel}">
          <section class="blip-hero"><div class="blip-hero-inner"><p class="blip-hero-lead">Lead</p><p class="blip-hero-note">Note</p></div></section>
          <section class="blip-cta"><p class="blip-cta-text">Text</p><p class="blip-cta-note">Note</p></section>
        </div>`);
        for (const sel of [".blip-hero-lead", ".blip-hero-note", ".blip-cta-text", ".blip-cta-note"]) {
          const { offsets, colours } = halo(root.querySelector(sel)!);
          expect(offsets, sel).toEqual(ring(pixel));
          expect([...colours], sel).toEqual([bg]);
        }
      });
    }
  }

  it("leaves a call to action in a box without one: there is no world behind it", () => {
    const box = mount(`<section class="blip-box blip-cta" data-variant="soft"><p class="blip-cta-text">Text</p><p class="blip-cta-note">Note</p></section>`);
    for (const sel of [".blip-cta-text", ".blip-cta-note"]) expect(getComputedStyle(box.querySelector(sel)!).textShadow).toBe("none");
  });
});
