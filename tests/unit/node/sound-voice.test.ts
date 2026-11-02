/**
 * @jaatster/blip-sound's blip voice: each letter has its own pitch step, so a word always sounds the same; vowels sit a
 * step up; happy is higher, sleepy lower.
 */
import { describe, expect, it } from "vitest";
import { voiceRate, voiced } from "../../../packages/sound/src/voice.ts";

const LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"];

describe("voiceRate", () => {
  it("gives a letter the same rate every time (a word always sounds the same)", () => {
    const word = (w: string, mood?: string) => [...w].map((c) => voiceRate(c, mood));
    expect(word("Starfall Meadow")).toEqual(word("Starfall Meadow"));
    expect(word("Bramble", "happy")).toEqual(word("Bramble", "happy"));
  });

  it("does not care about case", () => {
    for (const c of LETTERS) expect(voiceRate(c.toLowerCase()), c).toBe(voiceRate(c));
  });

  it("puts each letter on one of five steps, 3% apart", () => {
    const steps = new Set(LETTERS.filter((c) => !"AEIOU".includes(c)).map((c) => voiceRate(c).toFixed(4)));
    expect([...steps].sort()).toEqual(["0.9400", "0.9700", "1.0000", "1.0300", "1.0600"]);
  });

  it("sits vowels a step (x1.12) above the consonant on the same step", () => {
    // A letter's step comes from its code mod 5, so A and F (and E and J...) share one.
    for (const [vowel, consonant] of [["A", "F"], ["E", "J"], ["I", "N"], ["O", "T"], ["U", "Z"]]) {
      expect(voiceRate(vowel!) / voiceRate(consonant!), vowel).toBeCloseTo(1.12, 10);
    }
  });

  it("is higher when happy and lower when sleepy, by the same factor for every letter", () => {
    for (const c of LETTERS) {
      expect(voiceRate(c, "happy") / voiceRate(c), c).toBeCloseTo(1.18, 10);
      expect(voiceRate(c, "sleepy") / voiceRate(c), c).toBeCloseTo(0.8, 10);
      expect(voiceRate(c, "plain"), c).toBe(voiceRate(c));
    }
  });

  it("treats an unknown mood as plain, and never returns NaN", () => {
    expect(voiceRate("k", "grumpy")).toBe(voiceRate("k"));
    for (const c of ["", " ", "!", "é", "Ж", "😀"]) {
      const rate = voiceRate(c);
      expect(Number.isFinite(rate), JSON.stringify(c)).toBe(true);
      expect(rate).toBeGreaterThan(0.7);
      expect(rate).toBeLessThan(1.5);
    }
  });
});

describe("voiced", () => {
  it("voices letters and digits in any script", () => {
    for (const c of ["a", "Z", "7", "é", "ß", "Ж", "λ", "あ"]) expect(voiced(c), c).toBe(true);
  });

  it("keeps spaces, punctuation and symbols silent", () => {
    for (const c of [" ", ".", ",", "!", "?", "…", "-", "'", "😀", "\n"]) expect(voiced(c), JSON.stringify(c)).toBe(false);
  });
});
