/**
 * Time on the music's grid. Blip's beat is 400 ms, so the theme is 150 BPM; at 50 fps a beat is 20 frames, a bar
 * 80 (1.6 s), a sixteenth 5, and Blip's 40 ms frame is exactly two video frames.
 */
export const FPS = 50;
export const BEAT = 20;
export const BAR = 4 * BEAT;
export const STEP = BEAT / 4;
/** One of Blip's frames (40 ms), in video frames. */
export const TICK = 2;

/** Frames to bar `bar`, beat `beat`, sixteenth `step` (each counted from 0). */
export const at = (bar: number, beat = 0, step = 0) => bar * BAR + beat * BEAT + step * STEP;

/** `n` Blip pixels, for styles. */
export const p = (n: number) => `calc(${n} * var(--blip-pixel))`;

/** Blip's frames since `from`, whole: motion steps a Blip frame at a time. */
export const ticks = (frame: number, from: number) => Math.floor((frame - from) / TICK);

/** A repeatable random series. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
