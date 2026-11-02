// The video's theme, in four candidate styles: 150 BPM (Blip's 400 ms beat) in C major (the key Blip's sounds are
// tuned to), 41 bars (65.6 s), one bar per 1.6 s. Each line below is a bar of sixteenth notes: a note starts a sound,
// "-" holds it, "." rests. Every style keeps the same bars, which the scenes in src/ are timed to:
//   0-1 the intro (PRESS START waits), 2 the build (start is pressed, the letters drop), 3-4 the drop and the hook's
//   first two bars, 5-8 the groove with no lead (One pixel), 9-16 the hook (88 components), 17-40 the rest.
// `BLIP_THEME=<name>` picks one (town, bouncy, mellow, sunny); sunny, the one chosen, by default.
import { BAR, STEP, Track, midi } from "./chip.mjs";

export const BARS = 41;
export const SECONDS = BARS * BAR + 2;

const steps = (line) => line.trim().split(/\s+/);
const at = (bar, step = 0) => bar * BAR + step * STEP;

/** Plays a bar of `line` on `track`: each note held for its dashes, cut `gap` seconds short. */
function play(track, bar, line, { shift = 0, gap = 0.03, staccato = 1, ...opts } = {}) {
  const s = steps(line);
  if (s.length !== 16) throw new Error(`a bar is 16 steps, not ${s.length}: ${line}`);
  for (let i = 0; i < 16; i++) {
    if (s[i] === "-" || s[i] === ".") continue;
    let len = 1;
    while (s[i + len] === "-") len++;
    track.note(at(bar, i), Math.max(0.04, len * STEP * staccato - gap), midi(s[i]) + shift, opts);
  }
}

/**
 * The four styles. Each gives its chords (a root for the bass and three tones for the comping), the hook (eight bars,
 * with a chord a bar), the groove's four chords, a run up into the drop, and its band: what the lead, the comping,
 * the bass and the drums play in a bar.
 */
const THEMES = {
  // A Game Boy town: a soft square lead, broken chords on a second square, an oom-pah bass, a kick and a tick.
  town: {
    chords: {
      C: ["C3", "G2", "C4", "E4", "G4"], Em: ["E2", "B2", "B3", "E4", "G4"], F: ["F2", "C3", "A3", "C4", "F4"],
      G: ["G2", "D3", "B3", "D4", "G4"], Am: ["A2", "E3", "A3", "C4", "E4"], Dm: ["D3", "A2", "A3", "D4", "F4"],
    },
    hook: [
      "G5 - E5 - C5 - E5 - G5 - - - A5 - G5 -",
      "E5 - - - B4 - D5 - E5 - G5 - E5 - - -",
      "F5 - A5 - G5 - F5 - E5 - - - F5 - G5 -",
      "D5 - - - B4 - - - G4 - A4 - B4 - - -",
      "C5 - E5 - G5 - E5 - C5 - - - E5 - G5 -",
      "A5 - - - E5 - - - C5 - E5 - A5 - G5 -",
      "F5 - - - D5 - E5 - F5 - A5 - G5 - F5 -",
      "E5 - - - D5 - - - B4 - - - D5 - - -",
    ],
    hookChords: ["C", "Em", "F", "G", "C", "Am", "Dm", "G"],
    groove: ["C", "Am", "F", "G"],
    run: ["G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"],
    band(T) {
      const lead = T({ gain: 0.34, lowpass: 2600 });
      const comp = T({ gain: 0.16, pan: -0.2, lowpass: 2200 });
      const bass = T({ gain: 0.5, lowpass: 1000 });
      const kick = T({ gain: 0.4, lowpass: 1500 });
      const tick = T({ gain: 0.06, pan: 0.2, highpass: 3000, lowpass: 8000 });
      return {
        tracks: [lead, comp, bass, kick, tick],
        lead: (bar, line) => play(lead, bar, line, { wave: "pulse", duty: 0.5, attack: 0.008, decay: 0.25, sustain: 0.55, release: 0.06 }),
        run: (bar, i, n) => lead.note(at(bar, i), STEP - 0.02, n, { wave: "pulse", duty: 0.5, vel: 0.6 + i * 0.05, decay: 0.1, sustain: 0.5 }),
        comp(bar, [, , a, b, c], from, to, vel = 1) {
          const notes = [a, c, b, c];
          for (let i = from; i < to; i += 2) comp.note(at(bar, i), 0.14, notes[(i / 2) % 4], { wave: "pulse", duty: 0.5, vel, decay: 0.1, sustain: 0.35, release: 0.05 });
        },
        bass(bar, [root, fifth], from, to) {
          for (const [i, n] of [[0, root], [4, fifth], [8, root], [12, fifth]]) if (i >= from && i < to) bass.note(at(bar, i), 0.28, n, { wave: "tri", decay: 0.3, sustain: 0.6, release: 0.05 });
        },
        drums(bar) {
          for (const i of [0, 8]) kick.kick(at(bar, i), 0.8);
          for (const i of [4, 12]) tick.noise(at(bar, i), 0.04, { rate: 10000, decay: 0.015 });
        },
      };
    },
  },

  // Bouncy and cheerful: short, hopping lead notes, chord stabs on two and four, a bass that jumps octaves in eighths,
  // and a plain kick, snare and hat beat.
  bouncy: {
    chords: {
      C: ["C2", "G2", "E4", "G4", "C5"], G: ["G2", "D3", "D4", "G4", "B4"], Am: ["A2", "E3", "C4", "E4", "A4"],
      F: ["F2", "C3", "C4", "F4", "A4"],
    },
    hook: [
      "C5 . C5 . E5 . G5 . A5 - G5 - E5 - . .",
      "D5 . D5 . G5 . B4 . D5 - - - . . . .",
      "C5 . C5 . E5 . A5 . G5 - E5 - C5 - . .",
      "F5 . E5 . D5 . C5 . D5 - - - . . . .",
      "E5 . E5 . G5 . A5 . G5 - E5 - G5 - . .",
      "B4 . D5 . G5 . F5 . E5 - D5 - . . . .",
      "A5 . A5 . G5 . F5 . E5 - F5 - G5 - . .",
      "D5 - - - E5 - - - D5 - - - . . . .",
    ],
    hookChords: ["C", "G", "Am", "F", "C", "G", "F", "G"],
    groove: ["C", "G", "Am", "F"],
    run: ["C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6"],
    band(T) {
      const lead = T({ gain: 0.32, lowpass: 2800 });
      const comp = T({ gain: 0.15, pan: -0.25, lowpass: 2400 });
      const bass = T({ gain: 0.48, lowpass: 1400 });
      const kick = T({ gain: 0.55, lowpass: 2000 });
      const snare = T({ gain: 0.16, highpass: 400, lowpass: 7000 });
      const hat = T({ gain: 0.05, pan: 0.25, highpass: 5000 });
      return {
        tracks: [lead, comp, bass, kick, snare, hat],
        lead: (bar, line) => play(lead, bar, line, { wave: "pulse", duty: 0.5, attack: 0.004, decay: 0.12, sustain: 0.5, release: 0.04 }),
        run: (bar, i, n) => lead.note(at(bar, i), 0.06, n, { wave: "pulse", duty: 0.5, vel: 0.55 + i * 0.05, decay: 0.05, sustain: 0.4 }),
        comp(bar, [, , ...tones], from, to, vel = 1) {
          for (const i of [4, 12]) if (i >= from && i < to) for (const n of tones) comp.note(at(bar, i), 0.12, n, { wave: "pulse", duty: 0.5, vel: vel * 0.6, decay: 0.08, sustain: 0.3, release: 0.04 });
        },
        bass(bar, [root], from, to) {
          const r = midi(root);
          for (let i = from; i < to; i += 2) bass.note(at(bar, i), 0.12, i % 4 ? r + 12 : r, { wave: "tri4", decay: 0.15, sustain: 0.6, release: 0.03 });
        },
        drums(bar) {
          for (const i of [0, 8, 10]) kick.kick(at(bar, i), i === 10 ? 0.6 : 0.9);
          for (const i of [4, 12]) snare.noise(at(bar, i), 0.15, { rate: 8000, decay: 0.05 });
          for (let i = 0; i < 16; i += 2) hat.noise(at(bar, i), 0.03, { rate: 18000, decay: 0.012, vel: i % 4 ? 1 : 0.6 });
        },
      };
    },
  },

  // Mellow: slow-feeling, with long held chords on a soft square, a warm low lead, a bass in half notes and a
  // half-time beat, so the 150 BPM feels like 75.
  mellow: {
    chords: {
      Fmaj7: ["F2", "C3", "A3", "C4", "E4"], Em7: ["E2", "B2", "G3", "B3", "D4"], Dm7: ["D2", "A2", "F3", "A3", "C4"],
      Cmaj7: ["C2", "G2", "E3", "G3", "B3"], G: ["G2", "D3", "B3", "D4", "G4"],
    },
    hook: [
      "A5 - - - - - G5 - E5 - - - C5 - - -",
      "D5 - - - - - E5 - G5 - - - - - - -",
      "F5 - - - - - E5 - D5 - - - A4 - - -",
      "B4 - - - C5 - - - E5 - - - - - - -",
      "A5 - - - - - G5 - A5 - C6 - - - - -",
      "B5 - - - - - G5 - E5 - - - D5 - - -",
      "C6 - - - - - A5 - F5 - - - E5 - - -",
      "D5 - - - - - - - . . . . . . . .",
    ],
    hookChords: ["Fmaj7", "Em7", "Dm7", "Cmaj7", "Fmaj7", "Em7", "Dm7", "G"],
    groove: ["Fmaj7", "Em7", "Dm7", "Cmaj7"],
    run: ["E4", "G4", "A4", "C5", "D5", "E5", "G5", "A5"],
    band(T) {
      const lead = T({ gain: 0.42, lowpass: 2200, echo: { time: 6 * STEP, feedback: 0.25, mix: 0.2 } });
      const comp = T({ gain: 0.1, pan: -0.15, lowpass: 1600 });
      const bass = T({ gain: 0.5, lowpass: 900 });
      const kick = T({ gain: 0.5, lowpass: 1500 });
      const snare = T({ gain: 0.12, highpass: 300, lowpass: 5000 });
      const hat = T({ gain: 0.035, pan: 0.2, highpass: 5000 });
      return {
        tracks: [lead, comp, bass, kick, snare, hat],
        lead(bar, line) {
          play(lead, bar, line, { shift: -12, wave: "pulse", duty: 0.5, vel: 0.6, attack: 0.02, decay: 0.4, sustain: 0.6, release: 0.12 });
          play(lead, bar, line, { shift: -12, wave: "tri", vel: 0.6, attack: 0.02, decay: 0.4, sustain: 0.6, release: 0.12 });
        },
        run: (bar, i, n) => lead.note(at(bar, i), STEP, midi(n) - 12, { wave: "tri", vel: 0.7 + i * 0.04, decay: 0.15, sustain: 0.5 }),
        comp(bar, [, , ...tones], from, to, vel = 1) {
          const len = (to - from) * STEP - 0.05;
          for (const n of tones) comp.note(at(bar, from), len, n, { wave: "pulse", duty: 0.5, vel: vel * 0.6, attack: 0.08, decay: 0.6, sustain: 0.7, release: 0.2 });
        },
        bass(bar, [root, fifth], from, to) {
          for (const [i, n] of [[0, root], [8, fifth]]) if (i >= from && i < to) bass.note(at(bar, i), 0.7, n, { wave: "tri", attack: 0.01, decay: 0.5, sustain: 0.7, release: 0.1 });
        },
        drums(bar) {
          for (const i of [0, 6]) kick.kick(at(bar, i), i ? 0.6 : 0.9);
          snare.noise(at(bar, 8), 0.2, { rate: 7000, decay: 0.07 });
          for (let i = 0; i < 16; i += 2) hat.noise(at(bar, i), 0.03, { rate: 15000, decay: 0.01 });
        },
      };
    },
  },

  // Sunny pop: an uplifting run of chords (four, five, three, six), chords on every beat, an eighth-note bass, a
  // lead doubled an octave down, and a clap on two and four.
  sunny: {
    chords: {
      F: ["F2", "F2", "A3", "C4", "F4"], G: ["G2", "G2", "B3", "D4", "G4"], Em: ["E2", "E2", "G3", "B3", "E4"],
      Am: ["A2", "A2", "A3", "C4", "E4"], C: ["C3", "C3", "C4", "E4", "G4"],
    },
    hook: [
      "C5 - F5 - A5 - - - G5 - F5 - G5 - - -",
      "B4 - D5 - G5 - - - F5 - E5 - D5 - - -",
      "E5 - G5 - B5 - - - A5 - G5 - E5 - - -",
      "C5 - - - E5 - - - A5 - - - - - - -",
      "A5 - - - G5 - F5 - G5 - - - A5 - - -",
      "B5 - - - A5 - G5 - A5 - - - B5 - - -",
      "G5 - - - E5 - C5 - E5 - - - G5 - - -",
      "C5 - - - - - - - . . . . . . . .",
    ],
    hookChords: ["F", "G", "Em", "Am", "F", "G", "C", "C"],
    groove: ["F", "G", "Em", "Am"],
    run: ["G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"],
    band(T) {
      const lead = T({ gain: 0.3, lowpass: 2700 });
      const low = T({ gain: 0.18, lowpass: 1500 });
      const comp = T({ gain: 0.12, pan: -0.25, lowpass: 2200 });
      const bass = T({ gain: 0.45, lowpass: 1200 });
      const kick = T({ gain: 0.55, lowpass: 2000 });
      const clap = T({ gain: 0.14, highpass: 600, lowpass: 7000 });
      const hat = T({ gain: 0.045, pan: 0.25, highpass: 5000 });
      return {
        tracks: [lead, low, comp, bass, kick, clap, hat],
        lead(bar, line) {
          play(lead, bar, line, { wave: "pulse", duty: 0.5, attack: 0.006, decay: 0.2, sustain: 0.55, release: 0.06 });
          play(low, bar, line, { shift: -12, wave: "tri", attack: 0.006, decay: 0.2, sustain: 0.6, release: 0.06 });
        },
        run: (bar, i, n) => lead.note(at(bar, i), STEP - 0.02, n, { wave: "pulse", duty: 0.5, vel: 0.55 + i * 0.05, decay: 0.08, sustain: 0.5 }),
        comp(bar, [, , ...tones], from, to, vel = 1) {
          for (let i = from; i < to; i += 4) for (const n of tones) comp.note(at(bar, i), 0.16, n, { wave: "pulse", duty: 0.5, vel: vel * 0.6, decay: 0.1, sustain: 0.35, release: 0.05 });
        },
        bass(bar, [root], from, to) {
          for (let i = from; i < to; i += 2) bass.note(at(bar, i), 0.14, root, { wave: "tri4", decay: 0.15, sustain: 0.6, release: 0.03 });
        },
        drums(bar) {
          for (const i of [0, 6, 8]) kick.kick(at(bar, i), i === 6 ? 0.6 : 0.9);
          for (const i of [4, 12]) {
            clap.noise(at(bar, i), 0.12, { rate: 9000, decay: 0.04 });
            clap.noise(at(bar, i) + 0.012, 0.12, { rate: 9000, decay: 0.04, vel: 0.6 });
          }
          for (let i = 2; i < 16; i += 4) hat.noise(at(bar, i), 0.04, { rate: 16000, decay: 0.015 });
        },
      };
    },
  },
};

export const THEME_NAMES = Object.keys(THEMES);

export function song(name = process.env.BLIP_THEME ?? "sunny") {
  const theme = THEMES[name];
  if (!theme) throw new Error(`no theme "${name}": ${THEME_NAMES.join(", ")}`);
  const band = theme.band((o) => new Track(SECONDS, o));
  const chord = (name) => theme.chords[name];
  const full = (bar, name) => {
    band.comp(bar, chord(name), 0, 16);
    band.bass(bar, chord(name), 0, 16);
    band.drums(bar);
  };

  // Bars 0-1: the screen comes on and PRESS START waits; the comping alone, then the bass.
  const [g0, g1, g2, g3] = theme.groove;
  band.comp(0, chord(g0), 0, 16, 0.8);
  band.comp(1, chord(g1), 0, 16, 0.9);
  band.bass(1, chord(g1), 0, 16);
  // Bar 2: start is pressed and the letters drop; the lead runs up into the drop.
  band.comp(2, chord(g2), 0, 8);
  band.bass(2, chord(g2), 0, 8);
  band.bass(2, chord(g3), 8, 16);
  theme.run.forEach((n, i) => band.run(2, 8 + i, n));
  // Bars 3-4: the drop, with the hook's first two bars.
  for (const i of [0, 1]) {
    full(3 + i, theme.hookChords[i]);
    band.lead(3 + i, theme.hook[i]);
  }
  // Bars 5-8: the groove, without the lead.
  theme.groove.forEach((name, i) => full(5 + i, name));
  // Bars 9-16: the hook.
  theme.hook.forEach((line, i) => {
    full(9 + i, theme.hookChords[i]);
    band.lead(9 + i, line);
  });
  // Bars 17-40: the other scenes (to come): the groove and the hook again.
  for (let b = 17; b < BARS; b += 12) {
    theme.groove.forEach((name, i) => b + i < BARS && full(b + i, name));
    theme.hook.forEach((line, i) => {
      if (b + 4 + i >= BARS) return;
      full(b + 4 + i, theme.hookChords[i]);
      band.lead(b + 4 + i, line);
    });
  }
  return band.tracks;
}
