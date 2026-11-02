---
name: Shout
package: "@jaatster/blip-game"
css: shout.css
element: blip-shout
react: Shout
status: beta
---

# Shout

Big POP words across a game for a moment: "Ready?", "Go!", "Checkpoint!", "Hurry up!", "Level clear!". Each drops
in six pixels, a pixel a frame, stays, then dithers away, and the next waits its turn. Each is said to screen readers
as it shows.

## Usage

```html
<section class="blip-stage" data-frame>
  <canvas>…</canvas>
  <blip-shout></blip-shout>
</section>
```

```js
await shout.shout("Ready?");                         // resolves once it has gone
shout.shout("Go!", { hold: 300 });
shout.shout("Hurry up!", { tone: "warning", hold: 1500 });
```

Put it inside the game's positioned frame: it fills the frame and centres its words, and never takes a click. Shouts
queue, so a checkpoint reached during "Go!" waits for it.

The markup it makes, for a line shown for good (a "Paused" over a frozen game, or the docs):

```html
<div class="blip-shout">
  <p class="blip-shout-line blip-display blip-pop" data-pop="Level clear!">Level clear!</p>
</div>
```

## Anatomy

1. **Shout** (`blip-shout`, `.blip-shout`): fills its positioned container and centres its line.
2. **Line** (`.blip-shout-line`): Pixel Bop in POP, at scale 2, or 3 where the shout is 600 px wide or more.

## Variants

| Attribute | Values | |
|---|---|---|
| `data-tone` (on a line, or `tone` in `shout()`) | the accent (default), `success`, `warning`, `danger`, a candy name | The POP's tint and drop, as on any POP. |
| `data-scale` (on a line, or `scale` in `shout()`) | 1 to 4 | Pixel Bop's whole scales, for a shout that should be smaller or bigger. |

## States

| State | Look |
|---|---|
| Landing | Drops six pixels, a pixel a frame. |
| Holding | Stays for its `hold`: 900 ms by default. |
| Leaving | `data-leaving`: dithered, every other pixel, for two frames; then gone. |
| Reduced motion | Shows and goes in place, without the drop, and stays just as long. |

## Accessibility

- A polite live region (`role="status"`) says each shout as it shows; the drawn line is `aria-hidden`.
- The same words twice are said twice: the region is cleared first.
- A shout is never the only place something is said: a checkpoint is also on the HUD's track, "Hurry up!" on the
  clock turning red.

## Content

One to three words, ending in "!" or "?". Name the moment, not the rule: "Checkpoint!", not "Progress saved".

## Do and don't

- **Do** shout at the turns of a level: its start, a checkpoint, the last minute, its end.
- **Don't** shout for every coin or hit: the HUD counts those.
- **Don't** put anything to read or act on in a shout.

## API

| Element | Members | |
|---|---|---|
| `blip-shout` | `shout(text, { tone, hold, scale })` | Shows the words once the shouts before them have gone; returns a promise for when these have gone. |
| `blip-shout` | `clear()` | Takes every shout away at once and forgets the ones waiting. |
