/**
 * @jaatster/blip-sound: the TV's chip sounds (the TV spec §7, PixelSounds.java), made in the browser. Soft triangle
 * waves (the blip voice is a pulse), a 6 ms fade-in, a cosine fade-out over each note's second half, and a gentle
 * one-pole low-pass at about 2 kHz, rendered once into AudioBuffers. No audio files.
 *
 * Off until enabled, on a press or a key (browsers start audio only then):
 *
 *   button.onclick = () => enableSound();      // registers as Blip's sound sink: elements' sounds now play
 *   play("coin");                               // or services.sound().play("coin") from @jaatster/blip-core
 *   disableSound();
 *
 * Remembering the choice across visits is opt-in: rememberSound() once at start-up. Sound never depends on
 * prefers-reduced-motion.
 */
import { provide, services, type SoundSink } from "@jaatster/blip-core";

export type SoundName = "step" | "look" | "jump" | "coin" | "open" | "back" | "bump" | "blip" | "success" | "error" | "select";
/** A note: frequency (Hz), length and start (s), volume 0 to 1, the frequency it slides to (0: none), triangle (1) or pulse (0). */
export type Note = readonly [freq: number, length: number, at: number, volume: number, slide: number, triangle: 0 | 1];

/** Every sound, by name. The first eight are the TV's; success, error and select are made the same way. */
export const SOUNDS: Readonly<Record<SoundName, readonly Note[]>> = {
  step: [[440, 0.045, 0, 0.6, 0, 1], [587, 0.05, 0.045, 0.5, 0, 1]],
  look: [[392, 0.05, 0, 0.5, 523, 1]],
  jump: [[220, 0.11, 0, 0.8, 440, 1]],
  coin: [[784, 0.08, 0, 0.8, 0, 1], [1047, 0.3, 0.08, 0.8, 0, 1]],
  open: [[523, 0.06, 0, 0.7, 0, 1], [784, 0.09, 0.06, 0.7, 0, 1]],
  back: [[440, 0.07, 0, 0.7, 0, 1], [330, 0.1, 0.06, 0.7, 0, 1]],
  bump: [[110, 0.09, 0, 0.9, 70, 1]],
  blip: [[470, 0.045, 0, 0.45, 540, 0]],
  success: [[523, 0.06, 0, 0.7, 0, 1], [659, 0.06, 0.06, 0.7, 0, 1], [784, 0.06, 0.12, 0.7, 0, 1], [1047, 0.22, 0.18, 0.7, 0, 1]],
  error: [[294, 0.08, 0, 0.8, 0, 1], [220, 0.18, 0.09, 0.8, 175, 1]],
  select: [[659, 0.04, 0, 0.55, 0, 1], [880, 0.07, 0.04, 0.5, 0, 1]],
};

/** The rate the TV renders at, which also sets its low-pass (one pole, 0.45: about 2.1 kHz). */
const RATE = 22050;
/** At most this many sounds at once, as the TV's SoundPool. */
const VOICES = 4;

/** A sound's samples at 22 050 Hz, -1 to 1: exactly PixelSounds.samples. */
export function synth(notes: readonly Note[]): Float32Array<ArrayBuffer> {
  const end = Math.max(...notes.map((n) => n[2] + n[1] + 0.02));
  const count = Math.trunc(end * RATE), mix = new Float32Array(count), attack = Math.trunc(0.006 * RATE);
  for (const [f, length, at, vol, to, tri] of notes) {
    const start = Math.trunc(at * RATE), len = Math.trunc(length * RATE);
    let phase = 0;
    for (let i = 0; i < len && start + i < count; i++) {
      const t = i / len;
      phase += (to > 0 ? f + (to - f) * t : f) / RATE;
      const frac = phase - Math.floor(phase), wave = tri ? 1 - 4 * Math.abs(frac - 0.5) : frac < 0.5 ? 1 : -1;
      // 6 ms fade in (no click), then a smooth cosine fade out over the second half.
      const env = i < attack ? i / attack : t < 0.5 ? 1 : 0.5 + 0.5 * Math.cos((Math.PI * (t - 0.5)) / 0.5);
      mix[start + i]! += wave * env * vol * 0.1;
    }
  }
  let y = 0;
  for (let i = 0; i < count; i++) mix[i] = y += 0.45 * (mix[i]! - y);
  return mix;
}

let ctx: AudioContext | undefined;
let out: GainNode | undefined;
const buffers: Partial<Record<SoundName, AudioBuffer>> = {};
let playing: AudioBufferSourceNode[] = [];
let before: SoundSink | undefined;
let on = false;
let key: string | undefined;
/** Waiting for the person's next click, key or touch to bring remembered sound back. */
let pending: AbortController | undefined;

const sink: SoundSink = { play: (name, options) => play(name as SoundName, options) };
const save = (value: string) => {
  try {
    if (key) localStorage.setItem(key, value);
  } catch {
    /* storage off: nothing to remember */
  }
};

/**
 * Turns sound on: makes the audio context (call it from a press or a key), renders the sounds once, and registers
 * them as Blip's sound sink. Resolves true when audio is running.
 */
export async function enableSound(options: { volume?: number } = {}): Promise<boolean> {
  ctx ??= new AudioContext({ latencyHint: "interactive" });
  if (!out) {
    out = ctx.createGain();
    out.connect(ctx.destination);
    for (const [name, notes] of Object.entries(SOUNDS) as [SoundName, Note[]][]) {
      const samples = synth(notes), b = ctx.createBuffer(1, samples.length, RATE);
      b.copyToChannel(samples, 0);
      buffers[name] = b;
    }
  }
  out.gain.value = Math.max(0, Math.min(1, options.volume ?? 1));
  if (!on) {
    before = services.sound();
    provide({ sound: sink });
    on = true;
  }
  save("on");
  await ctx.resume().catch(() => {});
  return ctx.state === "running";
}

/** Turns sound off: Blip is silent again (or back to the sink it had before). */
export function disableSound(): void {
  pending?.abort();
  if (on) provide({ sound: before ?? { play() {} } });
  on = false;
  playing.forEach((s) => s.stop());
  void ctx?.suspend().catch(() => {});
  save("off");
}

/** Whether sound is on. */
export const soundOn = (): boolean => on;

/**
 * Remembers the person's choice in localStorage from now on (under key), and if they had sound on last time, turns it
 * on again at their next click, key or touch. Returns what they chose last time, or null.
 */
export function rememberSound(storageKey = "blip:sound"): "on" | "off" | null {
  key = storageKey;
  let last: string | null = null;
  try {
    last = localStorage.getItem(key);
  } catch {
    /* storage off */
  }
  if (last === "on" && !on) {
    // Audio starts only on a real activation (a click, a key, the end of a touch); keep listening until it runs.
    const stop = (pending = new AbortController()), start = () => void enableSound().then((running) => running && stop.abort());
    for (const type of ["click", "keydown", "touchend"]) addEventListener(type, start, { signal: stop.signal, capture: true });
  }
  return last === "on" || last === "off" ? last : null;
}

/**
 * Plays a sound if sound is on. rate plays it faster and higher or slower and lower (0.5 to 2, an octave each way),
 * as the voice does per letter; volume is 0 to 1.
 */
export function play(name: SoundName, options: { rate?: number; volume?: number } = {}): void {
  const buffer = buffers[name];
  if (!on || !ctx || !out || !buffer || ctx.state !== "running") return;
  const source = ctx.createBufferSource(), gain = ctx.createGain();
  source.buffer = buffer;
  source.playbackRate.value = Math.max(0.5, Math.min(2, options.rate ?? 1));
  gain.gain.value = Math.max(0, Math.min(1, options.volume ?? 1));
  source.connect(gain).connect(out);
  if (playing.length >= VOICES) playing.shift()!.stop();
  playing.push(source);
  source.onended = () => (playing = playing.filter((s) => s !== source));
  source.start();
}
