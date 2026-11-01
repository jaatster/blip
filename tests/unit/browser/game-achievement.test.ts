/**
 * The achievement toast's title and its description sit the system's gap apart, two pixels (4 px at the default pixel,
 * 6 px at 3), so the two lines never crowd; the reward line keeps its own two.
 */
import { afterEach, beforeEach, describe, expect, inject, it } from "vitest";
import achievementCss from "../../../packages/game/src/achievement.css?raw";
import { mount } from "../support/dom.ts";

let style: HTMLStyleElement;
beforeEach(() => {
  style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + achievementCss }));
});
afterEach(() => style.remove());

describe("achievement", () => {
  for (const pixel of [2, 3, 4]) {
    it(`puts two pixels between the title and the description at a ${pixel} px pixel`, () => {
      const card = mount(`<div data-blip-pixel="${pixel}"><div class="blip-box blip-achievement">
        <span class="blip-box blip-achievement-icon"></span>
        <p class="blip-achievement-label">Achievement unlocked</p>
        <p class="blip-achievement-title">Early bird</p>
        <p class="blip-achievement-text">Catch a falling star before sunrise.</p>
        <p class="blip-achievement-reward">+50</p>
      </div></div>`);
      const box = (sel: string) => card.querySelector(sel)!.getBoundingClientRect();
      expect(box(".blip-achievement-text").top - box(".blip-achievement-title").bottom).toBeCloseTo(2 * pixel, 1);
      expect(box(".blip-achievement-reward").top - box(".blip-achievement-text").bottom).toBeCloseTo(2 * pixel, 1);
    });
  }
});
