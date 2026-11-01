/**
 * The game kit's CSS keeps its motion rules and prints sensibly: nothing loops for ever, the stage's sky, ground and
 * the achievement's sparkles stay off paper, and the pictures that carry meaning (a bar's fill, the D-pad, the way
 * between level tiles) print though paper drops backgrounds.
 */
import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { REPO } from "../support/fixtures.ts";
import { css, media } from "../support/effects-css.ts";

const SRC = join(REPO, "packages/game/src");
const read = (file: string) => css("game", file);

describe("game CSS", () => {
  it("never animates for ever", () => {
    for (const f of readdirSync(SRC).filter((f) => f.endsWith(".css"))) expect(read(f), f).not.toMatch(/\binfinite\b/);
  });

  it("leaves the stage's sky and ground and the achievement's sparkles off paper", () => {
    const stage = media(read("stage.css"), "print");
    expect(stage).toMatch(/\.pp-stage\s*\{\s*background:\s*none/);
    expect(stage).toMatch(/\.pp-stage-ground\s*\{\s*display:\s*none/);
    expect(media(read("achievement.css"), "print")).toMatch(/\.pp-achievement-sparkles\s*\{\s*display:\s*none/);
  });

  it("prints the pictures that carry meaning", () => {
    expect(media(read("hud.css"), "print")).toMatch(/\.pp-hud-bar-fill,\s*\.pp-hud-bar-fill::before\s*\{\s*print-color-adjust:\s*exact/);
    expect(media(read("prompt.css"), "print")).toMatch(/\.pp-prompt-dpad::before,\s*\.pp-prompt-dpad::after\s*\{\s*print-color-adjust:\s*exact/);
    expect(media(read("level.css"), "print")).toMatch(/\.pp-level-path\s*\{\s*print-color-adjust:\s*exact/);
  });
});
