/**
 * A boolean attribute written "false" is off, as frameworks write it for false on an element that is defined later:
 * a counter with quiet="false" is still announced, and a dialogue with voice="false" stays silent.
 */
import { afterEach, describe, expect, it } from "vitest";
import { provide } from "@blip/core";
import "../../../packages/game/src/hud.ts";
import "../../../packages/game/src/dialogue.ts";
import { mount } from "../support/dom.ts";

let restore: () => void = () => undefined;
afterEach(() => restore());

describe("game flags written \"false\"", () => {
  it("announces a counter whose quiet is \"false\"", async () => {
    const counter = mount(`<blip-counter value="1" label="Coins" quiet="false"></blip-counter>`);
    counter.setAttribute("value", "2");
    const live = counter.querySelector("[aria-live]")!;
    await expect.poll(() => live.textContent, { timeout: 3000 }).toContain("2");
  });

  it("keeps a counter whose quiet is present silent", async () => {
    const counter = mount(`<blip-counter value="1" label="Coins" quiet></blip-counter>`);
    const live = counter.querySelector("[aria-live]")!;
    const before = live.textContent;
    counter.setAttribute("value", "2");
    await new Promise((r) => setTimeout(r, 1300));
    expect(live.textContent).toBe(before);
  });

  it("does not voice a dialogue whose voice is \"false\", and voices one whose voice is present", async () => {
    const played: string[] = [];
    restore = provide({ sound: { play: (name) => void played.push(name) } });
    mount(`<blip-dialogue class="blip-box blip-dialogue" voice="false"><div class="blip-dialogue-text"><p>Hello there.</p></div></blip-dialogue>`);
    await new Promise((r) => setTimeout(r, 400));
    expect(played).toEqual([]);
    mount(`<blip-dialogue class="blip-box blip-dialogue" voice><div class="blip-dialogue-text"><p>Hello there.</p></div></blip-dialogue>`);
    await expect.poll(() => played.length, { timeout: 2000 }).toBeGreaterThan(0);
    expect(new Set(played)).toEqual(new Set(["blip"]));
  });
});
