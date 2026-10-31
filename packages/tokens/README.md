# @jaatster/blip-tokens

Blip's design tokens: ink, the candy palette, the world palettes, the pixel spacing scale, motion frames and
type, in the W3C DTCG 2025.10 format. A resolver switches the scheme (Day, Sunset, Night) and the pixel size (2, 3 or
4 CSS px); palettes and contrast levels are the next switches it is shaped for. Every text pair is checked against WCAG 2.2 AA when the tokens build.

```sh
npm install @jaatster/blip-tokens
```

## Use

```css
@import "@jaatster/blip-tokens/tokens.css";

.thing { color: var(--pp-text); padding: var(--pp-space-4); }
```

```html
<html data-pp-scheme="night">            <!-- day (default), sunset, night -->
<section data-pp-pixel="3">               <!-- a bigger pixel for one part of the page -->
```

```js
import { cssVar, px, schemes } from "@jaatster/blip-tokens";
cssVar("candy-pink");          // "var(--pp-candy-pink)"
px("space-4", 3);              // 12
```

Also exported: `tokens.json`, `manifest.json` (every token with its CSS variable), Figma variables, Kotlin
(Compose), Swift and Android XML in `dist/`, and the source token files with the resolver (`./resolver`).

[Foundations](https://github.com/jaatster/blip/tree/main/apps/docs) · MIT
