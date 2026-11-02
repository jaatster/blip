// "Press Start", the video's theme: 150 BPM in C major, 40 bars (64 s), one bar per 1.6 s. Each line below is a bar of
// sixteenth notes: a note starts a sound, "-" holds it, "." rests. The scenes in src/ use the same bar numbers.
import { BAR, STEP, Track, midi } from "./chip.mjs";

export const BARS = 40;
export const SECONDS = BARS * BAR + 2;

const CHORD = {
  C: { root: "C2", arp: ["C4", "E4", "G4", "C5"] },
  Cmaj7: { root: "C2", arp: ["C4", "E4", "G4", "B4"] },
  G: { root: "G2", arp: ["B3", "D4", "G4", "B4"] },
  Am: { root: "A2", arp: ["A3", "C4", "E4", "A4"] },
  F: { root: "F2", arp: ["A3", "C4", "F4", "A4"] },
};

const HOOK = [
  "G5 - - E5 - - G5 - C6 - - - B5 - G5 -",
  "D6 - - B5 - - G5 - D6 - - - C6 - B5 -",
  "C6 - - A5 - - E5 - A5 - - - B5 - C6 -",
  "D6 - - C6 - - A5 - F5 - - - G5 - A5 -",
  "G5 - - E5 - - G5 - C6 - - - D6 - E6 -",
  "D6 - - B5 - - D6 - G6 - - - F6 - D6 -",
  "C6 - - A5 - - C6 - F6 - - - E6 - C6 -",
  "D6 - B5 - G5 - B5 - D6 - - - . . . .",
];
const HOOK_CHORDS = ["C", "G", "Am", "F", "C", "G", "F", "G"];
const GROOVE_CHORDS = ["C", "Am", "F", "G"];

const DRUMS = {
  kick: "x . . . . . x . x . . . . . . .",
  snare: ". . . . x . . . . . . . x . . .",
  hat: "x . x . x . x . x . x . x . x .",
  fill: ". . . . x . . . . . x . x x x x",
  short: ". . . . x . . . . . . . x . x x",
};

const steps = (line) => line.trim().split(/\s+/);

export function song() {
  const T = (o) => new Track(SECONDS, o);
  const lead = T({ gain: 0.42, lowpass: 6000, echo: { time: 3 * STEP, feedback: 0.3, mix: 0.25 } });
  const arp = T({ gain: 0.2, pan: -0.35, lowpass: 4500, echo: { time: 3 * STEP, feedback: 0.2, mix: 0.18 } });
  const intro = T({ gain: 0.24, pan: 0.2, lowpass: 1800, echo: { time: 3 * STEP, feedback: 0.35, mix: 0.3 } });
  const bass = T({ gain: 0.55, lowpass: 2500 });
  const kick = T({ gain: 0.85 });
  const snare = T({ gain: 0.38, highpass: 150 });
  const hat = T({ gain: 0.2, pan: 0.25, highpass: 7000 });
  const crash = T({ gain: 0.26, pan: -0.15, highpass: 5000 });
  const riser = T({ gain: 0.18, highpass: 2000 });
  const at = (bar, step = 0) => bar * BAR + step * STEP;

  /** A melody line: each note held for its dashes, cut 15 ms short so repeated notes still speak. */
  function melody(track, bar, line, { shift = -12, ...opts } = {}) {
    const s = steps(line);
    for (let i = 0; i < 16; i++) {
      if (s[i] === "-" || s[i] === ".") continue;
      let len = 1;
      while (s[i + len] === "-") len++;
      const seconds = len * STEP - 0.015;
      track.note(at(bar, i), seconds, midi(s[i]) + shift, {
        wave: "pulse", duty: 0.25, attack: 0.005, decay: 0.12, sustain: 0.6, release: 0.05,
        vibrato: seconds > 0.25 ? { delay: 0.15, depth: 15, rate: 6 } : null, ...opts,
      });
    }
  }
  function arpeggio(track, bar, chord, from = 0, to = 16, vel = 0.55) {
    const notes = CHORD[chord].arp;
    for (let i = from; i < to; i++) {
      track.note(at(bar, i), 0.08, notes[i % 4], { wave: "pulse", duty: 0.125, vel, attack: 0.002, decay: 0.05, sustain: 0.25, release: 0.02 });
    }
  }
  function bassline(bar, chord, from = 0, to = 16) {
    const r = midi(CHORD[chord].root);
    const pattern = [r, r + 12, r, r + 12, r, r + 12, r + 7, r + 12];
    for (let i = from; i < to; i += 2) {
      bass.note(at(bar, i), 0.16, pattern[i / 2], { wave: "tri4", attack: 0.003, decay: 0.2, sustain: 0.8, release: 0.02 });
    }
  }
  function drums(bar, { fill = null, kicks = DRUMS.kick, hats = true } = {}) {
    steps(kicks).forEach((s, i) => s === "x" && kick.kick(at(bar, i)));
    steps(fill ? DRUMS[fill] : DRUMS.snare).forEach((s, i, all) => {
      if (s !== "x") return;
      const rising = fill && i >= 10 ? 0.55 + (i - 10) * 0.09 : 1;
      snareHit(at(bar, i), rising);
    });
    if (hats) steps(DRUMS.hat).forEach((s, i) => s === "x" && hat.noise(at(bar, i), 0.06, { rate: 22000, vel: i % 4 === 0 ? 1 : 0.55, decay: 0.022 }));
  }
  function snareHit(t, vel = 1) {
    snare.noise(t, 0.2, { rate: 9000, vel: vel * 0.9, decay: 0.08 });
    snare.note(t, 0.05, "D3", { wave: "tri", vel: vel * 0.6, slide: "A2", attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 });
  }
  const crashAt = (bar) => crash.noise(at(bar), 1.6, { rate: 25000, decay: 0.6 });

  // ---------------------------------------------------------------- 0-3: Press start

  // Bar 0: the screen comes on and PRESS START blinks; a soft arpeggio, far away.
  arpeggio(intro, 0, "Cmaj7", 0, 16, 0.6);
  kick.kick(at(0), 0.5);
  // Bar 1: start is pressed and the letters drop; the arpeggio climbs, a snare roll and a riser lift into the drop.
  arpeggio(intro, 1, "F", 0, 8, 0.7);
  arpeggio(arp, 1, "G", 8, 16, 0.45);
  bass.note(at(1), 0.75, "F2", { wave: "tri4", attack: 0.003, decay: 0.3, sustain: 0.7, release: 0.05 });
  bassline(1, "G", 8, 16);
  for (let i = 8; i < 16; i++) snareHit(at(1, i), 0.2 + (i - 8) * 0.11);
  riser.noise(at(1, 8), 0.8, { rate: 24000, rise: true });
  // Bars 2-3: the drop. The title is up and the tagline types; the hook's first two bars.
  for (const [b, chord] of [[2, "C"], [3, "G"]]) {
    arpeggio(arp, b, chord);
    bassline(b, chord);
    melody(lead, b, HOOK[b - 2]);
  }
  crashAt(2);
  drums(2);
  drums(3, { fill: "short" });

  // ---------------------------------------------------------------- 4-7: One pixel (no lead: the scene's own sounds)

  GROOVE_CHORDS.forEach((chord, i) => {
    arpeggio(arp, 4 + i, chord);
    bassline(4 + i, chord);
    drums(4 + i, { fill: i === 3 ? "fill" : null });
  });
  crashAt(4);

  // ---------------------------------------------------------------- 8-15: 88 components (the hook)

  HOOK.forEach((line, i) => {
    arpeggio(arp, 8 + i, HOOK_CHORDS[i]);
    bassline(8 + i, HOOK_CHORDS[i]);
    melody(lead, 8 + i, line);
    drums(8 + i, { fill: i === 3 ? "short" : i === 7 ? "fill" : null });
  });
  crashAt(8);
  crashAt(12);

  // ---------------------------------------------------------------- 16-39: the other scenes (to come; the groove and hook for now)

  for (let b = 16; b < BARS; b += 12) {
    GROOVE_CHORDS.forEach((chord, i) => {
      arpeggio(arp, b + i, chord);
      bassline(b + i, chord);
      drums(b + i, { fill: i === 3 ? "fill" : null });
    });
    crashAt(b);
    HOOK.forEach((line, i) => {
      if (b + 4 + i >= BARS) return;
      arpeggio(arp, b + 4 + i, HOOK_CHORDS[i]);
      bassline(b + 4 + i, HOOK_CHORDS[i]);
      melody(lead, b + 4 + i, line);
      drums(b + 4 + i, { fill: i === 7 ? "fill" : null });
    });
    if (b + 4 < BARS) crashAt(b + 4);
  }

  return [lead, arp, intro, bass, kick, snare, hat, crash, riser];
}
