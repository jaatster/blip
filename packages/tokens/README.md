# @jaatster/blip-tokens

Blip's design tokens: ink, the candy palette, the world palettes, the pixel spacing scale, motion frames and
type, in the W3C DTCG 2025.10 format. A resolver switches the scheme (Day, Sunset, Night), the pixel size (2, 3 or
4 CSS px) and the palette (Candy, and eleven presets); contrast levels are the next switch it is shaped for. Every
text pair is checked against WCAG 2.2 AA when the tokens build, in every scheme of every palette.

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

## Palettes

A palette is the accent of each time of day and Night's page: its surfaces, text, lines, ink, accent and night sky.
Candy is Blip's own (blue by Day, pink at Sunset, sky blue on charcoal at Night). Eleven presets come in
`palettes.css`:

| `data-pp-palette` | Accent on Night's page |
|---|---|
| `grape` | Purple on deep indigo: the TV's own Night |
| `ember` | Soft orange on charcoal (warnings turn amber) |
| `azure` | Blue on a blue dusk |
| `mint` | Mint on a green-tinted ash |
| `bubblegum` | Pink on a pink dusk |
| `dracula` | After Dracula by Zeno Rocha (MIT) |
| `nord` | After Nord by Arctic Ice Studio (MIT) |
| `catppuccin` | After Catppuccin Mocha (MIT) |
| `gruvbox` | After Gruvbox by Pavel Pertsev (MIT) |
| `tokyo-night` | After Tokyo Night by enkia (MIT) |
| `rose-pine` | After Rosé Pine (MIT) |

```css
@import "@jaatster/blip-tokens/tokens.css";
@import "@jaatster/blip-tokens/palettes.css";
```

```html
<html data-pp-palette="nord">             <!-- with no palette set, it is Candy -->
```

Set it on `<html>`, or on an element that sets its own `data-pp-scheme`: each scheme's roles are worked out where the
scheme is set, from the `--pp-palette-*` tokens. Every preset sets one accent for all three times of day (only Candy
has one of its own for each), and every one passes the same AA checks as Candy, in every scheme. In JavaScript, `palettes` has each
preset's roles in every scheme, and `paletteNames` lists them all, Candy first.

The presets are made from recipes in `scripts/palettes.mjs` by the same maths as the palette maker
(`scripts/palette.mjs`): an accent's hue and strength, Night's tint and lightness, or the colours a well-known theme
starts from, with every text colour nudged to AA. `pnpm --filter @jaatster/blip-tokens palettes` writes them again.

## Your own palette or theme

The [palette maker](https://jaatster.com/blip/theme/) makes a palette from the same four levers (or from a preset) and
exports it as a DTCG token file and a resolver.
`blip-tokens` builds its `tokens.css` through the checks Blip's own colours pass: every text pair at WCAG
2.2 AA in every scheme, the focus ring against the page, and labels on the candies and on a disabled control's dither.

```sh
npx blip-tokens my-theme.resolver.json                # writes my-theme.css beside it
npx blip-tokens my-theme.resolver.json --out src/tokens.css
npx blip-tokens my-theme.resolver.json --check        # checks only
```

Load the result instead of `@jaatster/blip-tokens/tokens.css`. A palette's resolver gives the `palette` modifier a
context of its own, listing Candy's file and then the palette's, and makes it the default:

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/resolver.json",
  "name": "My palette",
  "version": "2025.10",
  "modifiers": {
    "palette": {
      "contexts": {
        "candy": [{ "$ref": "node_modules/@jaatster/blip-tokens/src/palettes/candy.tokens.json" }],
        "mine": [{ "$ref": "node_modules/@jaatster/blip-tokens/src/palettes/candy.tokens.json" }, { "$ref": "my-palette.tokens.json" }]
      },
      "default": "mine"
    }
  }
}
```

A palette file sets only `palette.*` and `world.night.*` tokens, as `src/palettes/*.tokens.json` do; any other name
is a typo (`PP-T005`). A theme can still set a scheme's roles directly: its resolver lists, for each scheme, Pixel
Pop's file and then the theme's (`node_modules/@jaatster/blip-tokens/src/schemes/day.tokens.json`,
`my-theme.day.tokens.json`). Whatever a resolver leaves out (the primitives, the resolution order, the pixel sizes) is
Blip's. When a check fails, it
prints the code, the theme's file and token, the two colours and their ratio, and how to fix it, and writes nothing:

```
  PP-T060  my-theme.day.tokens.json at /accent/on
    day: accent.on #FFFFFF on accent.light #719CFF is 2.66:1; it needs 4.5:1.
    Fix: Darken or lighten one of the two in this scheme (WCAG 2.2 AA).
```

[Foundations](https://github.com/jaatster/blip/tree/main/apps/docs) · MIT
