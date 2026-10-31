---
name: Font
package: "@jaatster/blip-font"
css: font.css
element: null
react: null
status: beta
---

# Font

Blip has two faces. **Pixel Bop** is the display face: bold pixel capitals for titles, scores, clocks and
anything big, drawn on the same grid as everything else. **Pixelify Sans** carries UI and body text, because a
7-pixel capital is too small to read at body sizes. Both are under the SIL Open Font License.

| Face | For | Sizes | File |
|---|---|---|---|
| Pixel Bop | Titles, app names, clocks, scores, game text | Whole scales only: `.pp-display` with `data-scale` 1 to 4 | `dist/pixel-bop.woff2` (about 9 KB), `dist/pixel-bop.ttf` |
| Pixelify Sans | Labels, buttons, body text, captions | The `--pp-size-*` steps, weights 400 to 700 | `dist/pixelify-sans.woff2` (about 14 KB, variable) |

## Usage

```js
import "@jaatster/blip-font/font.css"; // with @jaatster/blip-tokens/tokens.css and @jaatster/blip-core
```

```html
<h1 class="pp-display pp-pop" data-scale="3" data-pop="Level 2">Level 2</h1>
<p class="pp-display" data-scale="2">12:34</p>
<p class="pp-body">Pixelify Sans is the page's own face; nothing to add.</p>
```

`font.css` declares both faces with `font-display: swap`. The tokens name them: `--pp-font-display` (Pixel Bop, then
Pixelify Sans) and `--pp-font-ui` (Pixelify Sans). `.pp-display` and the other type classes live in
`@jaatster/blip-core`.

## Sizing

Pixel Bop is 10 pixels to the em, so the font size that puts every letter pixel on the Blip grid is:

- **font-size = 10 x pixel x scale.** `.pp-display` does this from `--pp-pixel` and `--pp-scale` (or `data-scale`).
- **Capitals are 7 x pixel x scale tall**, and most letters are 6 wide with one empty pixel after them.
- **line-height 1.2** (`--pp-leading-display`). The font's ascent and descent add up to exactly 12 pixels, so there
  is no half-leading and the baseline lands on a whole pixel. If you need more room between lines, add 0.2 at a
  time (1.4, 1.6): any other step puts the baseline on half a pixel. POP text keeps 1.2, which its tinted band
  is measured from.

| Scale | Cap height at the 2 px pixel | Font size | Letters drawn |
|---|---|---|---|
| 1 | 14 px | 20 px | Square pixels |
| 2 (default) | 28 px | 40 px | Rounded 2x (ss02) |
| 3 | 42 px | 60 px | Rounded 3x (ss03) |
| 4 | 56 px | 80 px | Rounded 2x (ss02) |

Accents sit one empty pixel above the capitals, so they rise a pixel above the line box (two for the ring of Å
and Ů), and the comma below Ș, Ț, Ģ, Ķ, Ļ, Ņ and Ŗ uses the whole descent. For stacked lines of accented text, use
line-height 1.4.

Never set Pixel Bop at another size: between whole scales its pixels fall between screen pixels and blur or
wobble.

## Stylistic sets

On the TV, big letters were enlarged with their corners rounded: EPX at 2x and AdvMAME3x at 3x, each letter on its
own so neighbours never smear together. Pixel Bop carries both as OpenType stylistic sets, at the same metrics:

| Feature | Name | What it draws | Used at |
|---|---|---|---|
| (none) | | The pixels, square | Scale 1 |
| `ss02` | Rounded 2x | EPX: every pixel split in half, corners rounded and diagonals smoothed in half pixels | Scales 2 and 4 |
| `ss03` | Rounded 3x | AdvMAME3x: every pixel split in thirds, rounded in thirds | Scale 3 |

`.pp-display` turns on the right one for its scale, so each rounding step is one Blip pixel (two at scale 4).
`data-scale` works in every browser; a `--pp-scale` set in your own CSS picks its set too where the browser can
compute feature values (Chrome can).
To see the square pixels at any scale, set `font-feature-settings: normal`. Outside `.pp-display`, turn a set on with
`font-feature-settings: "ss02"`; design tools list them as "Rounded 2x" and "Rounded 3x".

## Character set

<!-- charset: written by scripts/build.py -->
- **Capitals** (26): `A` `B` `C` `D` `E` `F` `G` `H` `I` `J` `K` `L` `M` `N` `O` `P` `Q` `R` `S` `T` `U` `V` `W` `X` `Y` `Z`
- **Accented and other letters** (97): `À` `Á` `Â` `Ã` `Ä` `Å` `Æ` `Ç` `È` `É` `Ê` `Ë` `Ì` `Í` `Î` `Ï` `Ð` `Ñ` `Ò` `Ó` `Ô` `Õ` `Ö` `Ø` `Ù` `Ú` `Û` `Ü` `Ý` `Þ` `Ā` `Ă` `Ą` `Ć` `Ĉ` `Ċ` `Č` `Ď` `Đ` `Ē` `Ĕ` `Ė` `Ę` `Ě` `Ĝ` `Ğ` `Ġ` `Ģ` `Ĥ` `Ħ` `Ĩ` `Ī` `Ĭ` `Į` `İ` `Ĳ` `Ĵ` `Ķ` `Ĺ` `Ļ` `Ľ` `Ŀ` `Ł` `Ń` `Ņ` `Ň` `ŉ` `Ŋ` `Ō` `Ŏ` `Ő` `Œ` `Ŕ` `Ŗ` `Ř` `Ś` `Ŝ` `Ş` `Š` `Ţ` `Ť` `Ŧ` `Ũ` `Ū` `Ŭ` `Ů` `Ű` `Ų` `Ŵ` `Ŷ` `Ÿ` `Ź` `Ż` `Ž` `Ș` `Ț` `ẞ`
- **Figures** (17): `0` `1` `2` `3` `4` `5` `6` `7` `8` `9` `²` `³` `¹` `¼` `½` `¾` `⁴`
- **Punctuation** (42): `!` `"` `#` `%` `&` `'` `(` `)` `*` `,` `-` `.` `/` `:` `;` `?` `@` `[` `\` `]` `_` `{` `}` `¡` `§` `«` `¶` `·` `»` `¿` `–` `—` `‘` `’` `‚` `“` `”` `„` `•` `…` `‹` `›`
- **Symbols** (38): `$` `+` `<` `=` `>` `|` `~` `¢` `£` `¤` `¥` `¦` `©` `ª` `¬` `®` `°` `±` `µ` `º` `×` `÷` `⁄` `€` `™` `←` `↑` `→` `↓` `−` `■` `▲` `▶` `▼` `◀` `●` `★` `♥`
- **Spacing accents** (14): `^` `` ` `` `¨` `¯` `´` `¸` `ˆ` `ˇ` `˘` `˙` `˚` `˛` `˜` `˝`
- **Combining accents**: U+0300 U+0301 U+0302 U+0303 U+0304 U+0306 U+0307 U+0308 U+030A U+030B U+030C U+0326 U+0327 U+0328. Text typed with them (decomposed) draws as the composed letter.
<!-- /charset -->

- **Lower case** draws as capitals: every lower-case letter of these blocks maps to its capital, so text keeps its
  case for screen readers, copying and search.
- **Romanian** (`lang="ro"`, also Moldovan): Ş and Ţ draw with the comma below, as Ș and Ț.
- **Not covered:** Greek, Cyrillic, Vietnamese and everything else falls back to Pixelify Sans (Greek and Cyrillic)
  or the system font. Pixelify Sans covers Latin, Latin-1, Latin Extended-A, General Punctuation, the euro and the
  trademark sign.

## Casing

- Pixel Bop is capitals only. `.pp-display` also sets `text-transform: uppercase`, so fallback text matches. Write
  text in its natural case ("Level complete", not "LEVEL COMPLETE"): screen readers read it better.
- `text-transform: uppercase` turns ß into SS. Write ẞ to keep the capital sharp s.
- It also turns the micro sign µ into a Greek capital Mu, which Pixel Bop does not draw. Keep µ with
  `<span style="text-transform: none">µ</span>`.
- Turkish and Azerbaijani: set `lang="tr"` (or `az`), and the browser capitalises i to İ.
- Pixelify Sans keeps sentence case, except `.pp-label`, which is upper case.

## Accessibility

- Pixel Bop is real text: it can be selected, translated, read aloud and zoomed. Never put display text in an image.
- Keep it for short, big text. Long passages and anything below scale 1 belong in Pixelify Sans.
- Contrast comes from the scheme roles, as for all text. POP letters are white with an ink outline, so they read on
  every scheme; plain display text uses `--pp-text`.
- Pixel Bop has no lower case, so give screen readers the natural case (see Casing).

## Do and don't

- **Do** use data-scale (or `--pp-scale`) for size. **Don't** set Pixel Bop's font-size by hand.
- **Do** keep POP text on one line: its tinted band is drawn for one line of text.
- **Don't** use Pixel Bop for body text, form input or long labels.
- **Don't** letter-space Pixel Bop except in whole pixels (`calc(N * var(--pp-pixel) * var(--pp-scale))`).

## Licensing

- **Pixel Bop**: SIL Open Font License 1.1, Copyright 2026 The Blip authors, with Reserved Font Name "Pixel
  Bop" (`OFL.txt`). You may use, embed, modify and redistribute it, also in commercial products; you may not sell
  the font on its own, and a modified version must not be called Pixel Bop.
- **Pixelify Sans**: SIL Open Font License 1.1, Copyright 2021 The Pixelify Sans Project Authors
  (`OFL-PixelifySans.txt`). The file here is a modified subset of the original: C, G, 5 and lower-case c are
  redrawn so they can't be read as O, O, S and o (the original's C and G have a slit narrower than one of their
  pixels that closes at bold, and its 5 is shaped like an S). The version string says so.
- The code in this package (`font.css`, the build script) is MIT, like the rest of Blip.

## Drawing a new glyph

Glyphs are pixel maps in `src/pixel-bop.glyphs`; the top of the file documents the format. To add one:

1. **Draw it on the grid.** Capitals are 7 rows tall from the baseline; rows above or below are set with
   `top=N`. Every vertical stroke is 2 pixels wide, horizontal strokes are 1 pixel tall, most letters are 6 wide,
   and figures are exactly 6 wide. Leave the gap between letters to the font: it adds one empty column after every
   glyph. Only small forms (superscripts, ordinals, the trademark sign) may use 1-pixel strokes, marked `thin`.
2. **Compose accented letters, don't draw them.** `@ Ǎ = A caron` puts the shared caron on A: centred, one empty
   row above the capital. A mark that belongs elsewhere is a new mark glyph, or a part placed exactly with
   `part(x,y)`. Lower case needs nothing: it maps to the capitals.
3. **Build** with `pnpm --filter @jaatster/blip-font build`. The build checks every block and names the file, the line
   and the fix when something is off (a ragged row, a 1-pixel stroke, ink outside the line). It writes the TTF and
   WOFF2, the glyph table in `examples/font.html` and the character list above, and fails if the WOFF2 goes over
   15 KB.
4. **Look** at the gallery (`node scripts/gallery.mjs`, then `/specimen/gallery.html?only=font`) at scales 1 to 4:
   the rounded sets are generated, but they show whether a shape survives EPX and AdvMAME3x.

## API

| File or export | |
|---|---|
| `@jaatster/blip-font/font.css` | The two `@font-face` rules. |
| `@jaatster/blip-font/pixel-bop.woff2`, `pixel-bop.ttf` | Pixel Bop (the TTF keeps glyph names, for design tools). |
| `@jaatster/blip-font/pixelify-sans.woff2` | The Pixelify Sans subset, variable weight 400 to 700. |
| `src/pixel-bop.glyphs` | The source of every Pixel Bop glyph. |

| OpenType | Value |
|---|---|
| Units per em | 1200 (one pixel is 120 units) |
| Ascent, descent, line gap | 1080, -360, 0 (9 and 3 pixels) |
| Cap height | 840 (7 pixels) |
| Features | `ss02` Rounded 2x, `ss03` Rounded 3x, `locl` for Romanian and Moldovan |
| Rendering | `gasp` asks Windows for no smoothing: pixel edges stay sharp |
