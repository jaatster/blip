# @jaatster/blip-font

**Pixel Bop**, Blip's pixel display font (all capitals: every European capital in Latin, Cyrillic and Greek,
with three stroke sets for its whole scales), and **Pixelify Sans** for UI and body text, in Latin, Cyrillic and
Greek.

```sh
npm install @jaatster/blip-font
```

## Use

```js
import "@jaatster/blip-font/font.css";     // @font-face for both, with @jaatster/blip-tokens and @jaatster/blip-core
```

```html
<h1 class="pp-display pp-pop" data-scale="3" data-pop="Level 2">Level 2</h1>
```

Pixel Bop is used at whole scales only (`.pp-display` with `data-scale` 1 to 4). Each face comes as three WOFF2
files, Latin, Cyrillic and Greek, and `font.css` gives each the `unicode-range` of what it draws, so a page downloads
only the scripts it shows: for Latin, `pixel-bop.woff2` (about 8 KB) and `pixelify-sans.woff2` (about 12 KB).
`pixel-bop.ttf` holds every script, for design tools. Emoji are the system's, sized to the capitals; Vietnamese and
other scripts take the system font. [Font docs](./docs/font.md), with the
[supported scripts](./docs/font.md#supported-scripts).

Our Pixelify Sans is modified, and its version string says so. The original joins fi and fl into a glyph that reads
as "A", draws its accents, quotes, commas and some symbols in half pixels (its @ reads as a dot, © as °), draws C, G
and 5 so all-caps labels read CODE as OODE and 500 as S00, and misdraws or leaves out some Cyrillic and Greek
letters. The build leaves the ligatures out and redraws the rest on the font's own pixel grid, at every weight, from
`src/pixelify-sans.glyphs`; it fails if a default ligature or a stroke thinner than one of the font's pixels comes
back. The unmodified source is in `vendor/`.

Licence: SIL Open Font License 1.1 (`OFL.txt`, `OFL-PixelifySans.txt`).
