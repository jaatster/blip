/**
 * The blocks' CSS on paper: the hero's and the call to action's sky bands and ground (the world's, which stays off
 * paper) do not print, nor does the footer's ground edge, while a plan's check and dash marks do.
 */
import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { REPO } from "../support/fixtures.ts";
import { css, media } from "../support/effects-css.ts";

const SRC = join(REPO, "packages/blocks/src");
const read = (file: string) => css("blocks", file);

describe("blocks CSS", () => {
  it("never animates for ever", () => {
    for (const f of readdirSync(SRC).filter((f) => f.endsWith(".css"))) expect(read(f), f).not.toMatch(/\binfinite\b/);
  });

  it("leaves the world's sky bands and ground off paper", () => {
    const hero = media(read("hero.css"), "print"), cta = media(read("cta.css"), "print");
    expect(hero).toMatch(/\.chu-hero\s*\{\s*background:\s*none/);
    expect(hero).toMatch(/\.chu-hero-ground,\s*\.chu-hero-scenery\s*\{\s*display:\s*none/);
    expect(cta).toMatch(/\.chu-cta:not\(\.chu-box\)\s*\{\s*background:\s*none/);
    expect(cta).toMatch(/\.chu-cta-ground\s*\{\s*display:\s*none/);
    expect(media(read("footer.css"), "print")).toMatch(/\.chu-footer::before,\s*\.chu-footer::after\s*\{\s*display:\s*none/);
  });

  it("prints a plan's check and dash marks", () => {
    expect(media(read("pricing.css"), "print")).toMatch(/\.chu-plan-features > li::before\s*\{\s*print-color-adjust:\s*exact/);
  });
});
