/**
 * Swappable services: the clock, random numbers and sound. Blip never reads Date.now() or Math.random()
 * directly, so tests and screenshots can freeze time and seed randomness, and apps can route sound.
 *
 *   provide({ clock: () => new Date("2026-01-01T19:30"), seed: 42 });
 */
export interface SoundSink {
  play(name: string, options?: { rate?: number; volume?: number }): void;
}
export interface Services {
  /** The current time. */
  clock: () => Date;
  /** A number in [0, 1). */
  random: () => number;
  /** Where chip sounds go; silent unless @jaatster/blip-sound is installed and enabled. */
  sound: SoundSink;
}

const silent: SoundSink = { play() {} };
let current: Services = { clock: () => new Date(), random: Math.random, sound: silent };

/** A small fast seeded generator (mulberry32), so a seed always gives the same sequence. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Replaces some services. Returns a function that puts the previous ones back. */
export function provide(next: Partial<Services> & { seed?: number }): () => void {
  const previous = current;
  const { seed, ...rest } = next;
  current = { ...current, ...rest, ...(seed !== undefined ? { random: seeded(seed) } : {}) };
  return () => {
    current = previous;
  };
}

export const services = {
  now: (): Date => current.clock(),
  random: (): number => current.random(),
  /** A whole number in [min, max]. */
  between: (min: number, max: number): number => min + Math.floor(current.random() * (max - min + 1)),
  sound: (): SoundSink => current.sound,
};
