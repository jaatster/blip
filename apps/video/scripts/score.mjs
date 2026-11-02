// "Press Start", the video's theme: 150 BPM in C major, cozy and bouncy, 41 bars (65.6 s), one bar per 1.6 s. Each line below is a bar of
// sixteenth notes: a note starts a sound, "-" holds it, "." rests. The scenes in src/ use the same bar numbers.
import { BAR, STEP, Track, midi } from "./chip.mjs";

export const BARS = 41;
export const SECONDS = BARS * BAR + 2;

// Cozy and upbeat: warm seventh chords, soft off-beat stabs over a walking triangle bass, a music box on the
// eighths, a round lead you could hum, brushed drums and a light shuffle.
const CHORD = {
  Cmaj7: { root: "C2", stab: ["E4", "G4", "B4"], box: ["C5", "E5", "G5", "B5"] },
  Am7: { root: "A2", stab: ["C4", "E4", "G4"], box: ["A4", "C5", "E5", "G5"] },
  Fmaj7: { root: "F2", stab: ["A3", "C4", "E4"], box: ["F4", "A4", "C5", "E5"] },
  Em7: { root: "E2", stab: ["B3", "D4", "G4"], box: ["E4", "G4", "B4", "D5"] },
  G: { root: "G2", stab: ["B3", "D4", "G4"], box: ["G4", "B4", "D5", "G5"] },
};

const HOOK = [
  "E5 - - D5 - - C5 - D5 - E5 - G5 - - -",
  "A5 - - G5 - - E5 - C5 - D5 - E5 - - -",
  "F5 - - E5 - - C5 - A4 - C5 - F5 - E5 -",
  "D5 - - - - - B4 - D5 - - - . . . .",
  "E5 - - D5 - - C5 - D5 - E5 - G5 - A5 -",
  "B5 - - A5 - - G5 - E5 - G5 - - - . .",
  "A5 - - G5 - - F5 - E5 - F5 - A5 - G5 -",
  "D5 - - E5 - - D5 - B4 - - - G4 - - -",
];
const HOOK_CHORDS = ["Cmaj7", "Am7", "Fmaj7", "G", "Cmaj7", "Em7", "Fmaj7", "G"];
const GROOVE_CHORDS = ["Cmaj7", "Am7", "Fmaj7", "G"];

const DRUMS = {
  kick: "x . . . . . . . x . . x . . . .",
  rim: ". . . . x . . . . . . . x . . .",
  shaker: ". . x . . . x . . . x . . . x .",
  fill: ". . . . x . . . . . x . x . x x",
};

/** The shuffle: every second sixteenth comes a little late. */
const SWING = 0.022;

const steps = (line) => line.trim().split(/\s+/);

export function song() {
  const T = (o) => new Track(SECONDS, o);
  const lead = T({ gain: 0.36, lowpass: 3200, echo: { time: 3 * STEP, feedback: 0.32, mix: 0.3 } });
  const low = T({ gain: 0.22, lowpass: 1800 });
  const keys = T({ gain: 0.2, pan: -0.3, lowpass: 2200 });
  const box = T({ gain: 0.13, pan: 0.35, lowpass: 5000, echo: { time: 3 * STEP, feedback: 0.3, mix: 0.3 } });
  const bass = T({ gain: 0.5, lowpass: 1200 });
  const kick = T({ gain: 0.6, lowpass: 2500 });
  const rim = T({ gain: 0.22, highpass: 600, lowpass: 7000 });
  const shaker = T({ gain: 0.11, pan: 0.25, highpass: 5000 });
  const splash = T({ gain: 0.1, pan: -0.15, highpass: 4000 });
  const at = (bar, step = 0) => bar * BAR + step * STEP + (step % 2 ? SWING : 0);

  /** The lead: a round square wave, each note held for its dashes, with a soft triangle an octave under it. */
  function melody(bar, line) {
    const s = steps(line);
    for (let i = 0; i < 16; i++) {
      if (s[i] === "-" || s[i] === ".") continue;
      let len = 1;
      while (s[i + len] === "-") len++;
      const seconds = len * STEP - 0.02;
      lead.note(at(bar, i), seconds, s[i], {
        wave: "pulse", duty: 0.5, attack: 0.012, decay: 0.18, sustain: 0.55, release: 0.08,
        vibrato: seconds > 0.25 ? { delay: 0.18, depth: 12, rate: 5 } : null,
      });
      low.note(at(bar, i), seconds, midi(s[i]) - 12, { wave: "tri", attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.08 });
    }
  }
  /** Off-beat chord stabs, short and soft: the bounce. */
  function stabs(bar, chord, from = 0, to = 16, vel = 0.7) {
    for (const i of [2, 6, 10, 14]) {
      if (i < from || i >= to) continue;
      for (const n of CHORD[chord].stab) keys.note(at(bar, i), 0.09, n, { wave: "pulse", duty: 0.25, vel: vel / 2, attack: 0.004, decay: 0.06, sustain: 0.3, release: 0.04 });
    }
  }
  /** A music box on the eighths: up the chord and back. */
  function musicBox(bar, chord, from = 0, to = 16, vel = 0.6) {
    const order = [0, 1, 2, 3, 2, 1, 2, 3];
    for (let i = from; i < to; i += 2) {
      box.note(at(bar, i), 0.12, CHORD[chord].box[order[i / 2]], { wave: "pulse", duty: 0.125, vel, attack: 0.002, decay: 0.09, sustain: 0.15, release: 0.12 });
    }
  }
  /** A walking bass: root, fifth, a pickup into the octave, fifth. */
  function bassline(bar, chord, from = 0, to = 16) {
    const r = midi(CHORD[chord].root);
    for (const [i, n, len] of [[0, r, 0.3], [4, r + 7, 0.3], [7, r + 12, 0.08], [8, r + 12, 0.3], [12, r + 7, 0.3]]) {
      if (i < from || i >= to) continue;
      bass.note(at(bar, i), len, n, { wave: "tri4", attack: 0.004, decay: 0.25, sustain: 0.6, release: 0.04 });
    }
  }
  function drums(bar, { fill = false } = {}) {
    steps(DRUMS.kick).forEach((s, i) => s === "x" && kick.kick(at(bar, i), i ? 0.75 : 1));
    steps(fill ? DRUMS.fill : DRUMS.rim).forEach((s, i) => s === "x" && rimHit(at(bar, i), fill && i >= 12 ? 0.6 + (i - 12) * 0.12 : 1));
    for (let i = 0; i < 16; i++) {
      const loud = steps(DRUMS.shaker)[i] === "x";
      shaker.noise(at(bar, i), 0.05, { rate: 16000, vel: loud ? 1 : 0.35, decay: loud ? 0.03 : 0.012 });
    }
  }
  function rimHit(t, vel = 1) {
    rim.noise(t, 0.12, { rate: 7000, vel: vel * 0.8, decay: 0.035 });
    rim.note(t, 0.03, "G4", { wave: "tri", vel: vel * 0.5, attack: 0.001, decay: 0.015, sustain: 0, release: 0.01 });
  }
  const splashAt = (bar) => splash.noise(at(bar), 1.2, { rate: 22000, decay: 0.35, vel: 0.8 });
  /** A full bar of the band: stabs, music box, bass and drums under `chord`. */
  function band(bar, chord, { fill = false, sparkle = true } = {}) {
    stabs(bar, chord);
    if (sparkle) musicBox(bar, chord);
    bassline(bar, chord);
    drums(bar, { fill });
  }

  // ---------------------------------------------------------------- 0-4: Press start

  // Bars 0-1: the screen comes on and PRESS START waits; a music box alone, then a soft bass and a heartbeat kick.
  musicBox(0, "Cmaj7", 0, 16, 0.5);
  musicBox(1, "Am7", 0, 16, 0.6);
  bass.note(at(1), 1.5, "A2", { wave: "tri", vel: 0.5, attack: 0.05, decay: 0.6, sustain: 0.6, release: 0.1 });
  for (const step of [0, 8]) kick.kick(at(1, step), 0.4);
  // Bar 2: start is pressed and the letters drop; stabs come in and a bell run climbs into the drop.
  stabs(2, "Fmaj7", 0, 8);
  stabs(2, "G", 8, 16);
  bass.note(at(2), 0.75, "F2", { wave: "tri4", attack: 0.003, decay: 0.3, sustain: 0.7, release: 0.05 });
  bassline(2, "G", 8, 16);
  ["G4", "A4", "B4", "D5", "E5", "G5", "A5", "B5"].forEach((n, i) =>
    box.note(at(2, 8 + i), 0.1, n, { wave: "pulse", duty: 0.125, vel: 0.5 + i * 0.05, attack: 0.002, decay: 0.08, sustain: 0.2, release: 0.1 }),
  );
  for (const i of [12, 14, 15]) rimHit(at(2, i), 0.6);
  // Bars 3-4: the drop. The title is up and the tagline types; the hook's first two bars.
  splashAt(3);
  band(3, HOOK_CHORDS[0]);
  melody(3, HOOK[0]);
  band(4, HOOK_CHORDS[1]);
  melody(4, HOOK[1]);

  // ---------------------------------------------------------------- 5-8: One pixel (no lead: the scene's own sounds)

  splashAt(5);
  GROOVE_CHORDS.forEach((chord, i) => band(5 + i, chord, { fill: i === 3 }));

  // ---------------------------------------------------------------- 9-16: 88 components (the hook)

  splashAt(9);
  splashAt(13);
  HOOK.forEach((line, i) => {
    band(9 + i, HOOK_CHORDS[i], { fill: i === 7 });
    melody(9 + i, line);
  });

  // ---------------------------------------------------------------- 17-40: the other scenes (to come; the groove and hook for now)

  for (let b = 17; b < BARS; b += 12) {
    splashAt(b);
    GROOVE_CHORDS.forEach((chord, i) => b + i < BARS && band(b + i, chord, { fill: i === 3 }));
    if (b + 4 < BARS) splashAt(b + 4);
    HOOK.forEach((line, i) => {
      if (b + 4 + i >= BARS) return;
      band(b + 4 + i, HOOK_CHORDS[i], { fill: i === 7 });
      melody(b + 4 + i, line);
    });
  }

  return [lead, low, keys, box, bass, kick, rim, shaker, splash];
}
