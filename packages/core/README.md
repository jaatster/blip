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

New components are put together from these blocks; see [AUTHORING.md](https://github.com/jaatster/blip/tree/main/AUTHORING.md). MIT
