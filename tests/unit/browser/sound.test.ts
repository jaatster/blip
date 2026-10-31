/**
 * @jaatster/blip-sound's synthesiser and the dialogue's voice: the same notes always make the same samples, and the game
 * kit's dialogue voices a letter at the same pitch as the sound package.
 */
import { describe, expect, it } from "vitest";
import { SOUNDS, synth, type SoundName } from "../../../packages/sound/src/sound.ts";
import { voiceRate } from "../../../packages/sound/src/voice.ts";
import { blipRate } from "../../../packages/game/src/dialogue.ts";

const RATE = 22050;

describe("synth", () => {
  it("makes the same samples from the same notes", () => {
    for (const name of Object.keys(SOUNDS) as SoundName[]) expect(synth(SOUNDS[name]), name).toEqual(synth(SOUNDS[name]));
  });

  it("lasts as long as its notes, plus 20 ms", () => {
    // coin: 80 ms, then a 300 ms note starting at 80 ms.
    expect(synth(SOUNDS.coin).length).toBe(Math.trunc((0.08 + 0.3 + 0.02) * RATE));
  });

  it("stays inside -1 to 1, starts silent and fades out (no clicks)", () => {
    for (const name of Object.keys(SOUNDS) as SoundName[]) {
      const samples = synth(SOUNDS[name]);
      let peak = 0;
      for (const s of samples) peak = Math.max(peak, Math.abs(s));
      expect(Number.isFinite(peak), name).toBe(true);
      expect(peak, name).toBeLessThanOrEqual(1);
      expect(peak, name).toBeGreaterThan(0.01);
      expect(Math.abs(samples[0]!), name).toBeLessThan(0.001);
      expect(Math.abs(samples.at(-1)!), name).toBeLessThan(0.01);
    }
  });
});

describe("blipRate (the dialogue's voice)", () => {
  it("voices every letter as voiceRate does, in every mood", () => {
    for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZabcxyz0123456789") {
      for (const mood of ["plain", "happy", "sleepy"]) expect(blipRate(c, mood), `${c} ${mood}`).toBeCloseTo(voiceRate(c, mood), 12);
    }
  });

  it("scales by the voice's base pitch", () => {
    expect(blipRate("a", "plain", 1.1)).toBeCloseTo(voiceRate("a") * 1.1, 12);
  });
});
