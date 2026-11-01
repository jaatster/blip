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

Also exported: `tokens.json` (sizes in CSS px, the type sizes at the 16 px default), `manifest.json` (every token
with its CSS variable), Figma variables, Kotlin (Compose), Swift and Android XML in `dist/`, and the source token
files with the resolver (`./resolver`).

## Your own theme

The [theme builder](https://jaatster.com/blip/theme/) exports a theme as DTCG token files and a resolver.
`blip-tokens` builds its `tokens.css` through the checks Blip's own colours pass: every text pair at WCAG
2.2 AA in every scheme, the focus ring against the page, and labels on the candies and on a disabled control's dither.

```sh
npx blip-tokens my-theme.resolver.json                # writes my-theme.css beside it
npx blip-tokens my-theme.resolver.json --out src/tokens.css
npx blip-tokens my-theme.resolver.json --check        # checks only
```

Load the result instead of `@jaatster/blip-tokens/tokens.css`. A theme's resolver lists, for each scheme, Blip's
file and then the theme's (`node_modules/@jaatster/blip-tokens/src/schemes/day.tokens.json`, `my-theme.day.tokens.json`);
whatever it leaves out (the primitives, the resolution order, the pixel sizes) is Blip's. When a check fails, it
prints the code, the theme's file and token, the two colours and their ratio, and how to fix it, and writes nothing:

```
  PP-T060  my-theme.day.tokens.json at /accent/on
    day: accent.on #FFFFFF on accent.light #719CFF is 2.66:1; it needs 4.5:1.
    Fix: Darken or lighten one of the two in this scheme (WCAG 2.2 AA).
```

[Foundations](https://github.com/jaatster/blip/tree/main/apps/docs) · MIT
