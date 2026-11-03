# @jaatster/blip-font

**Pixel Bop**, Blip's pixel display font (all capitals: every European capital in Latin, Cyrillic and Greek,
with three stroke sets for its whole scales); **Pixel Operator** for UI and body text, in Latin, regular and bold;
and **Pixelify Sans**, in Latin, Cyrillic and Greek, for the letters Pixel Operator does not draw.

```sh
npm install @jaatster/blip-font
```

## Use

```js
import "@jaatster/blip-font/font.css";     // @font-face for all three, with @jaatster/blip-tokens and @jaatster/blip-core
```

```html
<h1 class="blip-display blip-pop" data-scale="3" data-pop="Level 2">Level 2</h1>
```

Pixel Bop is used at whole scales only (`.blip-display` with `data-scale` 1 to 4). Pixel Operator is drawn on a
16-pixel em, so it is sharpest at 16 px (Blip's body size) and 32 px. Pixel Bop and Pixelify Sans come as three WOFF2
files each, Latin, Cyrillic and Greek, and Pixel Operator as one per weight; `font.css` gives each file the
`unicode-range` of what it draws, so a page downloads only what its text uses: for English, `pixel-bop.woff2` (about
8 KB) and `pixel-operator.woff2` and `pixel-operator-bold.woff2` (about 4 KB each).
`pixel-bop.ttf` holds every script, for design tools. Emoji are the system's, sized to the capitals; Vietnamese and
other scripts take the system font. [Font docs](./docs/font.md), with the
[supported scripts](./docs/font.md#supported-scripts).

Our Pixelify Sans is modified, and its version string says so. The original joins fi and fl into a glyph that reads
as "A", draws its accents, quotes, commas and some symbols in half pixels (its @ reads as a dot, © as °), draws C, G
and 5 so all-caps labels read CODE as OODE and 500 as S00, and misdraws or leaves out some Cyrillic and Greek
letters. The build leaves the ligatures out and redraws the rest on the font's own pixel grid, at every weight, from
`src/pixelify-sans.glyphs`; it fails if a default ligature or a stroke thinner than one of the font's pixels comes
back. The unmodified source is in `vendor/`.

Pixel Operator, by Jayvee Enaguas, is used as its author made it, made WOFF2, with one change its version string
names: the hyphen browsers add where they break a word, and the other hyphens it lacks, draw as its hyphen-minus. Its
source is in `vendor/` too.

Licences: Pixel Bop and Pixelify Sans, SIL Open Font License 1.1 (`OFL.txt`, `OFL-PixelifySans.txt`); Pixel Operator,
CC0 1.0, public domain (`CC0-PixelOperator.txt`).
