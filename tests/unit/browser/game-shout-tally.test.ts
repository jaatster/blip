/**
 * The game kit's shout, tally and canvas sprites: shouts queue one at a time and are said once each; the tally counts
 * up, lands its stars, says its result and can be skipped, and shows it at once with less motion asked for; canvas
 * sprites are painted in the token colours, facing either way.
 */
import { afterEach, beforeEach, describe, expect, inject, it } from "vitest";
import { commands } from "vitest/browser";
import "../../../packages/game/src/sprites.ts";
import "../../../packages/game/src/shout.ts";
import "../../../packages/game/src/tally.ts";
import { spriteCanvas } from "../../../packages/game/src/canvas.ts";
import { pixels } from "../../../packages/game/src/sprites.ts";
import shoutCss from "../../../packages/game/src/shout.css?raw";
import tallyCss from "../../../packages/game/src/tally.css?raw";
import { mount } from "../support/dom.ts";
import type { BlipShout } from "../../../packages/game/src/shout.ts";
import type { BlipTally } from "../../../packages/game/src/tally.ts";

let style: HTMLStyleElement;
beforeEach(async () => {
  await commands.emulateMedia("no-preference");
  style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + shoutCss + tallyCss }));
});
afterEach(async () => {
  style.remove();
  await commands.emulateMedia("no-preference");
});

const lines = (el: Element) => [...el.querySelectorAll(".blip-shout-line")].map((l) => l.textContent);

describe("blip-shout", () => {
  it("shows the words, says them, and takes them away", async () => {
    const shout = mount<BlipShout>(`<div style="position:relative;height:200px"><blip-shout></blip-shout></div>`).firstElementChild as BlipShout;
    const done = shout.shout("Checkpoint!", { tone: "success", hold: 50 });
    await expect.poll(() => shout.querySelector(".blip-shout-line")).toBeTruthy();
    const line = shout.querySelector<HTMLElement>(".blip-shout-line")!;
    expect(line.dataset.pop).toBe("Checkpoint!");
    expect(line.dataset.tone).toBe("success");
    expect(line.getAttribute("aria-hidden")).toBe("true");
    await expect.poll(() => shout.querySelector('[role="status"]')?.textContent).toBe("Checkpoint!");
    await done;
    expect(lines(shout)).toEqual([]);
  });

  it("shows one shout at a time, in the order they came", async () => {
    const shout = mount<BlipShout>(`<blip-shout></blip-shout>`);
    const seen: string[][] = [];
    const watch = setInterval(() => seen.push(lines(shout) as string[]), 10);
    shout.shout("Ready?", { hold: 40 });
    await shout.shout("Go!", { hold: 40 });
    clearInterval(watch);
    expect(seen.every((l) => l.length <= 1)).toBe(true);
    expect([...new Set(seen.flat())]).toEqual(["Ready?", "Go!"]);
  });

  it("clears every shout at once", () => {
    const shout = mount<BlipShout>(`<blip-shout></blip-shout>`);
    shout.shout("Hurry up!", { hold: 5000 });
    shout.shout("Level clear!");
    shout.clear();
    expect(lines(shout)).toEqual([]);
  });
});

const TALLY = `<blip-tally stars="2" max="3" best>
  <dl class="blip-tally-rows">
    <div class="blip-tally-row"><dt>Coins</dt><dd class="blip-tally-value blip-pop" data-pop="420">420</dd></div>
    <div class="blip-tally-row" data-total><dt>Score</dt><dd class="blip-tally-value blip-pop" data-value="4600" data-pop="4,600">4,600</dd></div>
  </dl>
  <p class="blip-tally-best"><span class="blip-tag">New best!</span></p>
</blip-tally>`;

describe("blip-tally", () => {
  it("draws the stars earned and the empty ones, as a named picture", () => {
    const tally = mount<BlipTally>(TALLY);
    const stars = tally.querySelector(".blip-tally-stars")!;
    expect([...stars.querySelectorAll("blip-sprite")].map((s) => s.getAttribute("name"))).toEqual(["star", "star", "star-empty"]);
    expect(stars.getAttribute("role")).toBe("img");
    expect(stars.getAttribute("aria-label")).toBe("2 of 3 stars");
    tally.stars = 3;
    expect(stars.querySelectorAll('blip-sprite[name="star"]')).toHaveLength(3);
  });

  it("counts up from nothing to the values, then says the result once", async () => {
    const tally = mount<BlipTally>(TALLY);
    const values = () => [...tally.querySelectorAll(".blip-tally-value")].map((v) => v.textContent);
    let done = false;
    tally.addEventListener("blip-done", () => (done = true));
    const playing = tally.play();
    expect(values()).toEqual(["0", "0"]);
    expect(tally.querySelector<HTMLElement>(".blip-tally-best")!.hidden).toBe(true);
    await playing;
    expect(done).toBe(true);
    expect(values()).toEqual(["420", "4,600"]);
    expect(tally.querySelector<HTMLElement>(".blip-tally-best")!.hidden).toBe(false);
    expect(tally.querySelector('[role="status"]')!.textContent).toBe("2 of 3 stars. Score 4,600. New best!");
  });

  it("skips to the end on a key, and the key does nothing else", async () => {
    const tally = mount<BlipTally>(TALLY);
    const playing = tally.play();
    const key = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    document.body.dispatchEvent(key);
    await playing;
    expect(key.defaultPrevented).toBe(true);
    expect(tally.querySelector(".blip-tally-value")!.textContent).toBe("420");
  });

  it("shows the result at once with less motion asked for", async () => {
    await commands.emulateMedia("reduce");
    const tally = mount<BlipTally>(TALLY.replace(" best", ""));
    let done = false;
    tally.addEventListener("blip-done", () => (done = true));
    tally.play();
    expect(done).toBe(true);
    expect(tally.querySelector(".blip-tally-value")!.textContent).toBe("420");
    expect(tally.querySelector<HTMLElement>(".blip-tally-best")!.hidden).toBe(true);
  });
});

describe("canvas sprites", () => {
  const rgb = (c: HTMLCanvasElement, x: number, y: number) => {
    const [r, g, b, a] = c.getContext("2d")!.getImageData(x, y, 1, 1).data;
    return a ? `rgb(${r}, ${g}, ${b})` : "clear";
  };
  const token = (name: string) => {
    const probe = document.body.appendChild(document.createElement("i"));
    probe.style.color = `var(--blip-${name})`;
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  };

  it("paints a sprite pixel for pixel in the token colours", () => {
    const coin = spriteCanvas("coin")!;
    const rows = pixels("coin")!;
    expect([coin.width, coin.height]).toEqual([rows[0]!.length, rows.length]);
    const ink = rows[0]!.indexOf("o");
    expect(rgb(coin, ink, 0)).toBe(token("ink"));
    expect(rgb(coin, 0, 0)).toBe("clear");
    expect(spriteCanvas("no-such-sprite")).toBeUndefined();
  });

  it("paints your own map in its tone, with an ink outline, and faces it the other way", () => {
    const art = { map: "lcc/css", tone: "green" };
    const right = spriteCanvas(art)!, left = spriteCanvas(art, { flip: true })!;
    expect([right.width, right.height]).toEqual([5, 4]);
    expect(rgb(right, 1, 1)).toBe(token("candy-green-light"));
    expect(rgb(right, 3, 2)).toBe(token("candy-green-shade"));
    expect(rgb(right, 0, 1)).toBe(token("ink"));
    expect(rgb(left, 3, 1)).toBe(token("candy-green-light"));
    expect(rgb(spriteCanvas(art, { tone: "accent" })!, 2, 1)).toBe(token("accent"));
  });
});
