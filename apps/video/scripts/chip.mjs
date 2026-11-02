// A small chip synthesiser for the video's music, in the voice of @jaatster/blip-sound: pulse and triangle waves, a
// noise channel for drums, soft envelopes and a gentle low-pass. Tracks render into mono buffers, then each is
// filtered, given an echo and panned into the stereo mix.

export const SR = 44100;
export const BPM = 150;
/** A sixteenth note, in seconds: 0.1 at 150 BPM. */
export const STEP = 60 / BPM / 4;
export const BAR = 16 * STEP;

const NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** "C5", "F#3", "Bb4" to a MIDI note number. */
export function midi(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`not a note: ${name}`);
  return 12 * (Number(m[3]) + 1) + NAMES[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}
export const hz = (note) => 440 * 2 ** (((typeof note === "number" ? note : midi(note)) - 69) / 12);

/** PolyBLEP: rounds a hard edge off over one sample, so high pulse notes don't alias into hiss. */
function blep(t, dt) {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
}

/** Attack, then a fall to sustain, held to the note's end, then a release: the level at time t (seconds). */
function envelope(t, length, { attack = 0.004, decay = 0.08, sustain = 0.7, release = 0.03 }) {
  const held = t < attack ? t / attack : sustain + (1 - sustain) * Math.exp(-(t - attack) / decay);
  if (t <= length) return held;
  const atEnd = length < attack ? length / attack : sustain + (1 - sustain) * Math.exp(-(length - attack) / decay);
  return Math.max(0, atEnd * (1 - (t - length) / release));
}

export class Track {
  constructor(seconds, { gain = 1, pan = 0, lowpass = 0, highpass = 0, echo = null } = {}) {
    this.buf = new Float32Array(Math.ceil(seconds * SR));
    Object.assign(this, { gain, pan, lowpass, highpass, echo });
  }

  /**
   * A pitched note: wave "pulse" (duty), "tri" (smooth) or "tri4" (the 4-bit stepped triangle of a game console),
   * from `at` for `length` seconds. slide bends to another note over the note; vibrato wobbles a held note.
   */
  note(at, length, note, { wave = "pulse", duty = 0.25, vel = 1, slide = null, vibrato = null, ...env } = {}) {
    const f0 = hz(note), f1 = slide == null ? f0 : hz(slide), release = env.release ?? 0.03;
    const start = Math.round(at * SR), count = Math.round((length + release) * SR);
    let phase = 0;
    for (let i = 0; i < count && start + i < this.buf.length; i++) {
      const t = i / SR;
      let f = slide == null ? f0 : f0 * (f1 / f0) ** Math.min(1, t / length);
      if (vibrato && t > vibrato.delay) f *= 2 ** ((vibrato.depth / 1200) * Math.sin(2 * Math.PI * vibrato.rate * (t - vibrato.delay)));
      const dt = f / SR;
      phase += dt;
      phase -= Math.floor(phase);
      let v;
      if (wave === "pulse") {
        v = phase < duty ? 1 : -1;
        v += blep(phase, dt);
        v -= blep((phase - duty + 1) % 1, dt);
      } else {
        v = 1 - 4 * Math.abs(phase - 0.5);
        if (wave === "tri4") v = Math.round((v + 1) * 7.5) / 7.5 - 1;
      }
      this.buf[start + i] += v * vel * envelope(t, length, env);
    }
  }

  /** Noise from a 15-bit shift register clocked at `rate` Hz (short: the metallic 93-step loop), decaying over `decay` s. */
  noise(at, length, { rate = 12000, short = false, vel = 1, decay = 0.08, attack = 0.001, rise = false } = {}) {
    const start = Math.round(at * SR), count = Math.round(length * SR);
    let lfsr = 1, clock = 0, out = 1;
    for (let i = 0; i < count && start + i < this.buf.length; i++) {
      clock += rate / SR;
      while (clock >= 1) {
        clock -= 1;
        const bit = (lfsr ^ (lfsr >> (short ? 6 : 1))) & 1;
        lfsr = (lfsr >> 1) | (bit << 14);
        out = lfsr & 1 ? 1 : -1;
      }
      const t = i / SR;
      const env = rise ? (t / length) ** 2 : Math.min(1, t / attack) * Math.exp(-t / decay);
      this.buf[start + i] += out * vel * env;
    }
  }

  /** A kick: a triangle diving from 160 Hz to 45 Hz, with a click of noise on top. */
  kick(at, vel = 1) {
    const start = Math.round(at * SR), count = Math.round(0.3 * SR);
    let phase = 0;
    for (let i = 0; i < count && start + i < this.buf.length; i++) {
      const t = i / SR, f = 45 + 115 * Math.exp(-t / 0.03);
      phase = (phase + f / SR) % 1;
      this.buf[start + i] += (1 - 4 * Math.abs(phase - 0.5)) * vel * Math.exp(-t / 0.11);
    }
    this.noise(at, 0.006, { rate: 20000, vel: vel * 0.35, decay: 0.002 });
  }

  /** Filters, echo and pan: adds this track into the stereo mix. */
  mixInto(L, R) {
    const x = this.buf;
    if (this.lowpass) onePole(x, this.lowpass, false);
    if (this.highpass) onePole(x, this.highpass, true);
    const angle = ((this.pan + 1) / 2) * (Math.PI / 2), gl = Math.cos(angle) * this.gain, gr = Math.sin(angle) * this.gain;
    for (let i = 0; i < x.length && i < L.length; i++) { L[i] += x[i] * gl; R[i] += x[i] * gr; }
    if (this.echo) {
      // Ping-pong: the first repeat on the left, the next on the right, each darker and quieter.
      const { time, feedback, mix } = this.echo, d = Math.round(time * SR);
      const wet = new Float32Array(x.length);
      for (let i = d; i < x.length; i++) wet[i] = x[i - d] + feedback * wet[i - d];
      onePole(wet, 3500, false);
      for (let i = 0; i < wet.length && i + d < L.length; i++) {
        L[i] += wet[i] * mix * this.gain;
        R[i + d] += wet[i] * mix * this.gain * feedback * 2;
      }
    }
  }
}

function onePole(x, cutoff, high) {
  const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    y += a * (x[i] - y);
    x[i] = high ? x[i] - y : y;
  }
}

/** Mixes tracks to stereo, rounds the peaks gently and sets the loudest sample to `peak`. */
export function master(tracks, seconds, peak = 0.89) {
  const n = Math.ceil(seconds * SR), L = new Float32Array(n), R = new Float32Array(n);
  for (const t of tracks) t.mixInto(L, R);
  let top = 0;
  for (let i = 0; i < n; i++) {
    L[i] = Math.tanh(L[i] * 1.2) / 1.2;
    R[i] = Math.tanh(R[i] * 1.2) / 1.2;
    top = Math.max(top, Math.abs(L[i]), Math.abs(R[i]));
  }
  const k = top ? peak / top : 1;
  for (let i = 0; i < n; i++) { L[i] *= k; R[i] *= k; }
  return [L, R];
}

/** 16-bit PCM WAV of one or more channels at `rate`. */
export function wav(channels, rate = SR) {
  const n = channels[0].length, c = channels.length, data = Buffer.alloc(44 + n * c * 2);
  data.write("RIFF", 0); data.writeUInt32LE(36 + n * c * 2, 4); data.write("WAVE", 8);
  data.write("fmt ", 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(c, 22);
  data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * c * 2, 28); data.writeUInt16LE(c * 2, 32); data.writeUInt16LE(16, 34);
  data.write("data", 36); data.writeUInt32LE(n * c * 2, 40);
  for (let i = 0, o = 44; i < n; i++) {
    for (let ch = 0; ch < c; ch++, o += 2) data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(channels[ch][i] * 32767))), o);
  }
  return data;
}
