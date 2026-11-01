# @jaatster/blip-core

Blip's building blocks. CSS: the pixel unit, the candy box (one-pixel ink outline, stepped corners, light and
shade bands, glints, the drop), the yellow focus ring, the dither, stepped motion, Pixel Bop display type and base
styles. JavaScript: `PixelElement` (the base of every Web Component), the roving focus, typeahead and dismiss
controllers, the timeline runner, the scheme clock, and the swappable clock, random-number and sound services.

```sh
npm install @jaatster/blip-core @jaatster/blip-tokens
```

## Use

```css
@import "@jaatster/blip-tokens/tokens.css";
@import "@jaatster/blip-core/core.css";
```

```html
<button class="pp-box" data-tone="pink">A candy box</button>
<h1 class="pp-display pp-pop" data-scale="3" data-pop="Level 2">Level 2</h1>
```

```js
import { PixelElement, provide, seeded, autoScheme } from "@jaatster/blip-core";
provide({ random: seeded(42) });        // repeatable effects in tests and screenshots
```

Set `lang` on `<html>`: titles and reading text hyphenate long words in the page's language (words under ten
letters stay whole), and break them where it has no dictionary rather than let them run out of their box.

## With Tailwind CSS or layered CSS of your own

Import `@jaatster/blip-core/layers.css` first. It puts all of Blip (the `pp` layers) after Tailwind v4's
`properties`, `theme` and `base` (preflight) and before its `components` and `utilities`, so a utility class beats
a component's own rules, preflight cannot undo them, and the order of the other imports no longer matters.

```css
@import "@jaatster/blip-core/layers.css";
@import "tailwindcss";
@import "@jaatster/blip-tokens/tokens.css";
@import "@jaatster/blip-core/core.css";
@import "@jaatster/blip-components/components.css";
```

From a script, import it before any other stylesheet. With layers of your own, write your own `@layer` line with
`pp` in its place instead.

## What the base styles follow

- **Text size.** The `--pp-size-*` tokens are in rem, so text follows a larger default text size set in the browser
  (20 px makes body text 20 px and labels 17.5 px); it never goes below Blip's own sizes, which are whole
  pixels at the default 16 px. Everything counted in pixels (controls, spacing, Pixel Bop) keeps its size.
- **More contrast.** With `prefers-contrast: more`, soft lines take the line colour, muted text the text colour, and
  the focus ring's ink edge is two pixels wide.
- **Ligatures** are off for all text, whatever the font: in a pixel font fi and fl merge into a glyph that reads as
  another letter.
- **Auto.** `autoScheme()` follows the clock: Day from 6:00, Sunset from 17:00, Night from 19:00. When the time of
  day changes, every colour changes in one step, shown as an ordered dither: the new colours take a quarter of the
  pixels, then half, then three quarters, a frame (40 ms) each. Every pixel shows one palette or the other, never a
  mix, so text keeps its contrast; the page stays live under it. Without view transitions, or with reduced motion,
  the change is instant; `autoScheme(target, { fade: false })` makes it instant too.

## What the box keeps

- **Zoom.** At 100%, 200% and 300% every pixel lands on whole screen pixels. At 125%, 150% and 175% a pixel spans a
  fraction of one, so a box's outer edges can be soft (the browser's limit); its layers overlap, so it never shows
  seams.
- **Soft and candy boxes** are light in every scheme, so the text, links, fields and calm buttons on them take the
  light roles.
- **On** (pressed, selected, current) sits in with its bands swapped and an ink shadow inside its top and left.
- **Disabled** is dithered with `--pp-disabled-dither`, light in every scheme, so the label still reads.
- **High contrast and paper.** In Windows high contrast, on is the system highlight and busy keeps its dots.
  Printed, boxes keep their colours with the browser's background graphics off, in Day's colours, without scrims.

New components are put together from these blocks; see [AUTHORING.md](https://github.com/jaatster/blip/tree/main/AUTHORING.md). MIT
