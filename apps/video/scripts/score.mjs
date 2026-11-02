// "Press Start", the video's theme: 150 BPM in C major, a Game Boy town theme in spirit, 41 bars (65.6 s), one bar per 1.6 s. Each line below is a bar of
// sixteenth notes: a note starts a sound, "-" holds it, "." rests. The scenes in src/ use the same bar numbers.
import { BAR, STEP, Track } from "./chip.mjs";

export const BARS = 41;
export const SECONDS = BARS * BAR + 2;

// A Game Boy town theme in spirit: two soft square channels (a lead, and broken chords under it), the wave
// channel's bass going oom-pah in quarters, and only a soft kick and a tick for drums. Major chords, a straight beat,
// a melody that steps rather than leaps and stays in the middle, no vibrato and no echo.
const CHORD = {
  C: { root: "C3", fifth: "G2", broken: ["C4", "G4", "E4", "G4"] },
  F: { root: "F2", fifth: "C3", broken: ["F4", "C5", "A4", "C5"] },
  G: { root: "G2", fifth: "D3", broken: ["G4", "D5", "B4", "D5"] },
  Am: { root: "A2", fifth: "E3", broken: ["A4", "E5", "C5", "E5"] },
  Dm: { root: "D3", fifth: "A2", broken: ["D4", "A4", "F4", "A4"] },
};

const HOOK = [
  "E5 - G5 - C5 - - - E5 - F5 - G5 - - -",
  "A5 - - - F5 - G5 - A5 - G5 - F5 - - -",
  "G5 - - - D5 - E5 - F5 - E5 - D5 - - -",
  "E5 - - - C5 - - - . . . . G4 - - -",
  "A4 - C5 - E5 - - - D5 - C5 - A4 - - -",
  "F5 - - - A5 - G5 - F5 - E5 - F5 - - -",
  "G5 - - - B4 - C5 - D5 - - - E5 - D5 -",
  "C5 - - - - - - - . . . . . . . .",
];
const HOOK_CHORDS = ["C", "F", "G", "C", "Am", "F", "G", "C"];
const GROOVE_CHORDS = ["C", "Am", "Dm", "G"];

const steps = (line) => line.trim().split(/\s+/);

export function song() {
  const T = (o) => new Track(SECONDS, o);
  const lead = T({ gain: 0.34, lowpass: 2500 });
  const harmony = T({ gain: 0.16, pan: -0.2, lowpass: 2100 });
  const bass = T({ gain: 0.5, lowpass: 1000 });
  const kick = T({ gain: 0.4, lowpass: 1500 });
  const tick = T({ gain: 0.065, pan: 0.2, highpass: 3000, lowpass: 8000 });
  const at = (bar, step = 0) => bar * BAR + step * STEP;

  /** The lead: a soft square, each note held for its dashes and cut a little short, as a Game Boy's would be. */
  function melody(bar, line) {
    const s = steps(line);
    for (let i = 0; i < 16; i++) {
      if (s[i] === "-" || s[i] === ".") continue;
      let len = 1;
      while (s[i + len] === "-") len++;
      lead.note(at(bar, i), len * STEP - 0.03, s[i], { wave: "pulse", duty: 0.5, attack: 0.008, decay: 0.25, sustain: 0.55, release: 0.06 });
    }
  }
  /** Broken chords in eighths on the second square, a soft 50% one: root, fifth, third, fifth. */
  function broken(bar, chord, from = 0, to = 16, vel = 1) {
    for (let i = from; i < to; i += 2) {
      harmony.note(at(bar, i), 0.14, CHORD[chord].broken[(i / 2) % 4], { wave: "pulse", duty: 0.5, vel, attack: 0.004, decay: 0.1, sustain: 0.35, release: 0.05 });
    }
  }
  /** The wave channel's bass: root and fifth, oom-pah, a quarter each. */
  function bassline(bar, chord, from = 0, to = 16) {
    const { root, fifth } = CHORD[chord];
    for (const [i, n] of [[0, root], [4, fifth], [8, root], [12, fifth]]) {
      if (i >= from && i < to) bass.note(at(bar, i), 0.28, n, { wave: "tri", attack: 0.005, decay: 0.3, sustain: 0.6, release: 0.05 });
    }
  }
  /** A soft kick on one and three, a tick on two and four. */
  function drums(bar) {
    for (const i of [0, 8]) kick.kick(at(bar, i), 0.8);
    for (const i of [4, 12]) tick.noise(at(bar, i), 0.04, { rate: 10000, decay: 0.015 });
  }
  function band(bar, chord) {
    broken(bar, chord);
    bassline(bar, chord);
    drums(bar);
  }

  // ---------------------------------------------------------------- 0-4: Press start

  // Bars 0-1: the screen comes on and PRESS START waits; the broken chords alone, then the bass comes in.
  broken(0, "C", 0, 16, 0.8);
  broken(1, "F", 0, 8, 0.9);
  broken(1, "G", 8, 16, 0.9);
  bassline(1, "F", 0, 8);
  bassline(1, "G", 8, 16);
  // Bar 2: start is pressed and the letters drop; the lead runs up the scale into the drop.
  broken(2, "Am", 0, 8);
  bassline(2, "Am", 0, 8);
  bass.note(at(2, 8), 0.7, "G2", { wave: "tri", attack: 0.005, decay: 0.4, sustain: 0.6, release: 0.05 });
  ["G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"].forEach((n, i) =>
    lead.note(at(2, 8 + i), STEP - 0.02, n, { wave: "tri", vel: 0.7 + i * 0.04, attack: 0.008, decay: 0.1, sustain: 0.5, release: 0.04 }),
  );
  for (const i of [12]) tick.noise(at(2, i), 0.04, { rate: 10000, decay: 0.015 });
  // Bars 3-4: the drop. The title is up and the tagline types; the hook's first two bars.
  band(3, HOOK_CHORDS[0]);
  melody(3, HOOK[0]);
  band(4, HOOK_CHORDS[1]);
  melody(4, HOOK[1]);

  // ---------------------------------------------------------------- 5-8: One pixel (no lead: the scene's own sounds)

  GROOVE_CHORDS.forEach((chord, i) => band(5 + i, chord));

  // ---------------------------------------------------------------- 9-16: 88 components (the hook)

  HOOK.forEach((line, i) => {
    band(9 + i, HOOK_CHORDS[i]);
    melody(9 + i, line);
  });

  // ---------------------------------------------------------------- 17-40: the other scenes (to come; the groove and hook for now)

  for (let b = 17; b < BARS; b += 12) {
    GROOVE_CHORDS.forEach((chord, i) => b + i < BARS && band(b + i, chord));
    HOOK.forEach((line, i) => {
      if (b + 4 + i >= BARS) return;
      band(b + 4 + i, HOOK_CHORDS[i]);
      melody(b + 4 + i, line);
    });
  }

  return [lead, harmony, bass, kick, tick];
}
