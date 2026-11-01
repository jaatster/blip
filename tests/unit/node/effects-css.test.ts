/**
 * The effects kit's CSS keeps its motion rules and stays off paper: nothing loops for ever (anything that blinks,
 * flickers or sweeps stops, as DESIGN.md's states and motion ask, under five seconds), the CRT is a dither of opaque
 * ink and never a translucent wash, and the world, the CRT and the glint do not print.
 */
import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { REPO } from "../support/fixtures.ts";
import { css, media } from "../support/effects-css.ts";

const SRC = join(REPO, "packages/effects/src");
const read = (file: string) => css("effects", file);

describe("effects CSS", () => {
  const files = readdirSync(SRC).filter((f) => f.endsWith(".css"));

  it("never animates for ever", () => {
    for (const f of files) expect(read(f), f).not.toMatch(/\binfinite\b/);
  });

  it("draws the CRT in opaque ink: a dither, never a wash or a fade", () => {
    const crt = read("crt.css");
    // Masks cut ink in or out whole (their stops are hard edges); nothing is see-through or fades.
    expect(crt).not.toMatch(/color-mix|rgba|hsla|opacity/);
    expect(crt).toMatch(/\.blip-crt\[data-flicker\]::after\s*\{\s*animation:[^;]*\s6;/);
  });

  it("stops the caret, the glint and the flicker after a few beats", () => {
    const text = read("text.css");
    expect(text).toMatch(/blip-blink calc\(2 \* var\(--blip-duration-beat\)\) steps\(1, jump-end\) 6;/);
    expect(text).toMatch(/blip-glint-move [^,]*var\(--blip-glint-count, 1\)/);
    expect(text).toMatch(/blip-glint-show [^;]*var\(--blip-glint-count, 1\)/);
  });

  it("masks the glint with the box's own mask, so it shares the box's seam-free overlaps", () => {
    const glint = /\.blip-glint \{[^}]*\}/.exec(read("text.css"))![0];
    expect(glint).toMatch(/mask-image: var\(--blip-shape-inner\);/);
    expect(glint).toMatch(/mask-size: var\(--blip-box-mask-size\);/);
    expect(glint).toMatch(/mask-position: var\(--blip-box-mask-position\);/);
  });

  it("keeps the world, the CRT and the glint off paper, and prints a typewriter's whole text", () => {
    expect(media(read("world.css"), "print")).toMatch(/blip-world\s*\{\s*display:\s*none/);
    expect(media(read("crt.css"), "print")).toMatch(/\.blip-crt::before,\s*\.blip-crt::after\s*\{\s*display:\s*none/);
    const text = media(read("text.css"), "print");
    expect(text).toMatch(/\.blip-glint\s*\{\s*display:\s*none/);
    expect(text).toMatch(/\.blip-typewriter-rest\s*\{\s*visibility:\s*visible/);
  });

  it("slides the world's layers through registered numbers, rounded to whole world pixels", () => {
    const world = read("world.css");
    expect(world).toMatch(/@property --_blip-world-x \{ syntax: "<number>"; inherits: false; initial-value: 0; \}/);
    expect(world).toMatch(/@property --_blip-world-y \{ syntax: "<number>"; inherits: false; initial-value: 0; \}/);
    expect(world).toMatch(/translate: calc\(round\(var\(--_blip-world-x\), 1\) \* var\(--_blip-world-px\)\) calc\(round\(var\(--_blip-world-y\), 1\) \* var\(--_blip-world-px\)\);/);
    expect(world).not.toMatch(/transition:\s*translate/);
  });
});
