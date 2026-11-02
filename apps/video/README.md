# Blip's announcement video

Made with [Remotion](https://www.remotion.dev) from Blip's real packages: the components, the game kit and the
effects render as themselves, their CSS animations stepped to the frame. 1920 x 1080 at 50 fps (Blip's 40 ms frame is
two video frames), 480 x 270 Blip pixels of four CSS pixels each; render at `--scale=2` for 4K.

```sh
pnpm --filter @jaatster/blip-video studio                      # preview, scrub, render from the UI
pnpm --filter @jaatster/blip-video render Test out/test.mp4     # or any composition
```

- `scripts/assets.mjs` makes `public/`: Blip's two faces, Blip's sounds from `@jaatster/blip-sound`'s own `synth()`,
  and the theme. Both commands run it first.
- `scripts/score.mjs` is the theme, "Press Start": 150 BPM (Blip's 400 ms beat) in C major, written as bars of
  sixteenths. `scripts/chip.mjs` is the synthesiser that plays it.
- `src/lib/grid.ts` puts time on the music: a beat is 20 frames, a bar 80. `<Beat>` (`src/lib/Beat.tsx`) shows its
  children from a frame and holds every CSS animation inside them at the right moment, so any frame renders the same.
- `src/scenes/` holds one scene per file; `Test` plays the first two.
