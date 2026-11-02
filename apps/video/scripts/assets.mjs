// Makes the video's assets in public/: Blip's two faces (fonts/, copied from @jaatster/blip-font: Studio's dev server
// can't serve the files font.css points at), Blip's own sounds, made by @jaatster/blip-sound's synth() exactly as the
// browser makes them (sfx/<name>.wav, and pitched copies sfx/<name>@<semitones>.wav), and the theme (music/theme.wav).
//
//   pnpm --filter @jaatster/blip-video assets
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { SR, master, wav } from "./chip.mjs";
import { SECONDS, song } from "./score.mjs";

// The sound package imports Blip's element base class, which only a browser has: a stand-in is enough for synth().
globalThis.HTMLElement ??= class {};
const { SOUNDS, synth } = await import("@jaatster/blip-sound");

const RATE = 22050;
/** One gain for every sound, so they keep the loudness they have relative to each other. */
const GAIN = 8;
const out = new URL("../public/", import.meta.url);
mkdirSync(new URL("sfx/", out), { recursive: true });
mkdirSync(new URL("music/", out), { recursive: true });
mkdirSync(new URL("fonts/", out), { recursive: true });

const require = createRequire(import.meta.url);
for (const face of ["pixel-bop.woff2", "pixelify-sans.woff2"]) {
  copyFileSync(require.resolve(`@jaatster/blip-font/${face}`), new URL(`fonts/${face}`, out));
}

/** Played faster by `rate`, as the browser's playbackRate does it: higher and shorter. */
function resample(x, rate) {
  const y = new Float32Array(Math.floor(x.length / rate));
  for (let i = 0; i < y.length; i++) {
    const p = i * rate, j = Math.floor(p), f = p - j;
    y[i] = (x[j] ?? 0) * (1 - f) + (x[j + 1] ?? 0) * f;
  }
  return y;
}

// Pitched copies, kept in the theme's key: step (A to D) climbs the A minor scale, which is C major's; coins climb the
// major scale as <blip-counter chain> does.
const PITCHED = {
  step: [0, 2, 3, 5, 7, 8, 10, 12],
  jump: [0, 3, 5, 7],
  coin: [0, 2, 4, 5, 7, 9, 11, 12],
  select: [0, 5, 7, 12],
  blip: [0, 3, 5, 7],
  // C major's jingle on F and on G, for the chords it lands on.
  success: [5, 7],
};

let count = 0;
for (const [name, notes] of Object.entries(SOUNDS)) {
  const base = synth(notes).map((v) => v * GAIN);
  writeFileSync(new URL(`sfx/${name}.wav`, out), wav([base], RATE));
  count++;
  for (const semis of PITCHED[name] ?? []) {
    if (!semis) continue;
    writeFileSync(new URL(`sfx/${name}@${semis}.wav`, out), wav([resample(base, 2 ** (semis / 12))], RATE));
    count++;
  }
}

const t0 = performance.now();
writeFileSync(new URL("music/theme.wav", out), wav(master(song(), SECONDS), SR));
console.log(`2 faces, ${count} sounds and the theme (${SECONDS.toFixed(1)} s) in ${Math.round(performance.now() - t0)} ms`);
