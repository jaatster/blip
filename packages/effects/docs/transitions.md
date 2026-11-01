---
name: Transitions
package: "@jaatster/blip-effects"
css: transitions.css
element: null
react: null
status: beta
---

# Transitions

Full-screen changes in whole pixels: the TV's ink **dissolve**, a **dither** through the Bayer matrix, and a
**mosaic**. Use one when the whole screen changes: a new page, a new level, opening and closing a game.

## Usage

```js
import { transition } from "@jaatster/blip-effects/transitions";

await transition(() => router.show("/level-2"), { kind: "dissolve" });   // dissolve (default), dither, mosaic
```

The update runs once, behind the effect, and may be async. With the View Transitions API the old and new screens are
snapshots, masked (the dissolve and the dither) or filtered (the mosaic) frame by frame; without it, ink covers the
screen from an overlay (in the top layer, over dialogs too, taking the pointer) while it changes, and a mosaic
dissolves instead. Cells are whole numbers of device pixels, so their edges stay crisp on a 125% or 175% screen. The
promise resolves when the new screen is fully shown and rejects if the update throws.

Between pages (cross-document view transitions), with no script, opt in on both pages:

```html
<html data-pp-transition>
<style>@view-transition { navigation: auto; }</style>
```

The old page fills with ink through the Bayer matrix and the new one clears out of it, eight steps each. (This one
is CSS alone, so its cells are two pixels in CSS pixels; `transition()`'s own dither draws whole device pixels.)

## Variants

| `kind` | What happens | Time |
|---|---|---|
| `dissolve` | A grid of ink cells (about 64 across, each a whole number of pixels) fills the screen in random order in nine frames, then clears in a new random order. | 18 x 30 ms |
| `dither` | The same with two-pixel cells through the 4 x 4 Bayer matrix: an ordered dither of ink, two levels a frame. | 16 x 30 ms |
| `mosaic` | The screen breaks into blocks of 2, 3, 4, 6, 8 and 12 pixels, changes at the coarsest, then comes back into focus. Each block shows one sample of the picture; nothing is blurred. | 12 x 40 ms |

## States

| State | Behaviour |
|---|---|
| Reduced motion, or a hidden tab | The update runs at once; no effect. |
| `signal` aborted | The effect stops where it is; the update still runs exactly once. |
| A new transition starts | The running one is skipped (view transitions) and the new one runs. |

## Accessibility

- A transition never blocks input for more than about half a second.
- Move focus to the new screen's heading or main region after the update, as for any route change.
- The ink is `--pp-ink`; the dissolve's frames are short and never flash.

## Do and don't

- **Do** use the dissolve for the big moments: opening an app, a new level, a new page.
- **Do** keep the update fast; a view transition holds the old screen until it is done.
- **Don't** use full-screen transitions for small changes (a tab, a filter); move only what changed.

## API

| | |
|---|---|
| `transition(update, { kind, signal })` | Runs `update` behind a transition. Returns a promise. |
| `html[data-pp-transition]` | Opts a page's view transitions into the CSS dither (also for view transitions other code starts). |
| `html[data-pp-transition-run]` | Set by `transition()` while it runs. |
| `--pp-duration-dissolve-frame`, `--pp-duration-frame` | Frame times (30 and 40 ms; 0 with reduced motion). |
