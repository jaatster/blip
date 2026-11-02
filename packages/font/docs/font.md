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
7-pixel capital is too small to read at body sizes. Both draw Latin, Cyrillic and Greek, and both are under the SIL
Open Font License.

| Face | For | Sizes | Files |
|---|---|---|---|
| Pixel Bop | Titles, app names, clocks, scores, game text | Whole scales only: `.blip-display` with `data-scale` 1 to 4 | `dist/pixel-bop.woff2` (Latin, about 8 KB), `pixel-bop-cyrillic.woff2` (3 KB), `pixel-bop-greek.woff2` (2 KB); `dist/pixel-bop.ttf` (every script) |
| Pixelify Sans | Labels, buttons, body text, captions | The `--blip-size-*` steps, weights 400 to 700 | `dist/pixelify-sans.woff2` (Latin, about 12 KB, variable), `pixelify-sans-cyrillic.woff2` (5 KB), `pixelify-sans-greek.woff2` (4 KB) |

## Usage

```js
import "@jaatster/blip-font/font.css"; // with @jaatster/blip-tokens/tokens.css and @jaatster/blip-core
```

```html
<h1 class="blip-display blip-pop" data-scale="3" data-pop="Level 2">Level 2</h1>
<p class="blip-display" data-scale="2">12:34</p>
<p class="blip-body">Pixelify Sans is the page's own face; nothing to add.</p>
```

`font.css` declares both faces, one rule per file, with `font-display: swap` and the `unicode-range` of exactly the
characters each file draws: a page downloads only the scripts its text uses, so a Latin page loads only Latin. It also
declares Blip Fallback, the system's emoji sized to stand as tall as the capitals. The tokens name them:
`--blip-font-display` (Pixel Bop, then Pixelify Sans) and `--blip-font-ui` (Pixelify Sans), each followed by Blip
Fallback and the system font. `.blip-display` and the other type classes live in `@jaatster/blip-core`.

## Sizing

Pixel Bop is 10 pixels to the em, so the font size that puts every letter pixel on the Blip grid is:

- **font-size = 10 x pixel x scale.** `.blip-display` does this from `--blip-pixel` and `--blip-scale` (or `data-scale`).
- **Capitals are 7 x pixel x scale tall**, and most letters are 6 wide with one empty pixel after them.
- **line-height 1.2** (`--blip-leading-display`). The font's ascent and descent add up to exactly 12 pixels, so there
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

`.blip-display` turns on the right one for its scale, so each rounding step is one Blip pixel (two at scale 4).
`data-scale` works in every browser; a `--blip-scale` set in your own CSS picks its set too where the browser can
compute feature values (Chrome can).
To see the square pixels at any scale, set `font-feature-settings: normal`. Outside `.blip-display`, turn a set on with
`font-feature-settings: "ss02"`; design tools list them as "Rounded 2x" and "Rounded 3x".

## Supported scripts

| Script | Pixel Bop (display) | Pixelify Sans (UI and body) |
|---|---|---|
| Latin: English and the European languages written in it (French to Turkish, Icelandic to Maltese) | Every capital; lower case draws as capitals | Latin-1 and Latin Extended-A, in both cases |
| Cyrillic: Russian, Ukrainian, Belarusian, Bulgarian, Serbian, Macedonian | Every capital, in its own file | Every letter, in its own file |
| Greek, modern | Every capital, in its own file; the tonos is left off, as Greek is set in capitals | Every letter but ΐ and ΰ, in its own file |
| Vietnamese | **Not supported.** Letters with two accents, ơ and ư come from the system font | **Not supported.** The same |
| Chinese, Japanese, Korean | The system font for the page's language, sized to the capitals | The same |
| Arabic, Hebrew | The system font, right to left | The same |
| Emoji | Blip Fallback: the system's colour emoji, as tall as the capitals | The same |
| Every other script | The system font | The same |

- **Fallback is whole.** A character a face does not draw goes to the next font in the stack (Pixel Bop, Pixelify
  Sans, Blip Fallback, the system font) as a whole letter: neither face pieces a letter together from a base
  and accents, so no accent stacks into the line above. A letter typed with a combining accent (decomposed text, e
  followed by U+0301) still draws as the composed letter where the face has it.
- **Downloads.** Cyrillic and Greek are separate files, fetched only when the text on the page has those letters.
- **Sizes.** `font.css` sets `font-size-adjust: cap-height from-font`, so a system font standing in for a script the
  faces do not draw lines up with their capitals. Safari and Firefox size every such font; Chrome sizes the ones it
  picks for the page's language, so set `lang` on Chinese, Japanese and Korean text. Arabic and Hebrew already
  stand about as tall as the capitals.
- **Set `lang`.** Turkish and Azerbaijani (`tr`, `az`): the capital of i is İ. Romanian (`ro`): Pixel Bop draws Ş and
  Ţ with the comma below. Greek (`el`): `text-transform: uppercase` drops the accents. Chinese, Japanese and Korean
  (`zh`, `ja`, `ko`): the browser picks the system font with that language's forms of the characters they share.
- **Russian stress marks** (а followed by U+0301) come from the system font.

## Character set

<!-- charset: written by scripts/build.py -->
- **Capitals** (26): `A` `B` `C` `D` `E` `F` `G` `H` `I` `J` `K` `L` `M` `N` `O` `P` `Q` `R` `S` `T` `U` `V` `W` `X` `Y` `Z`
- **Cyrillic** (49): `Ѐ` `Ё` `Ђ` `Ѓ` `Є` `Ѕ` `І` `Ї` `Ј` `Љ` `Њ` `Ћ` `Ќ` `Ѝ` `Ў` `Џ` `А` `Б` `В` `Г` `Д` `Е` `Ж` `З` `И` `Й` `К` `Л` `М` `Н` `О` `П` `Р` `С` `Т` `У` `Ф` `Х` `Ц` `Ч` `Ш` `Щ` `Ъ` `Ы` `Ь` `Э` `Ю` `Я` `Ґ`
- **Greek** (26): `Α` `Β` `Γ` `Δ` `Ε` `Ζ` `Η` `Θ` `Ι` `Κ` `Λ` `Μ` `Ν` `Ξ` `Ο` `Π` `Ρ` `Σ` `Τ` `Υ` `Φ` `Χ` `Ψ` `Ω` `Ϊ` `Ϋ`
- **Accented and other letters** (97): `À` `Á` `Â` `Ã` `Ä` `Å` `Æ` `Ç` `È` `É` `Ê` `Ë` `Ì` `Í` `Î` `Ï` `Ð` `Ñ` `Ò` `Ó` `Ô` `Õ` `Ö` `Ø` `Ù` `Ú` `Û` `Ü` `Ý` `Þ` `Ā` `Ă` `Ą` `Ć` `Ĉ` `Ċ` `Č` `Ď` `Đ` `Ē` `Ĕ` `Ė` `Ę` `Ě` `Ĝ` `Ğ` `Ġ` `Ģ` `Ĥ` `Ħ` `Ĩ` `Ī` `Ĭ` `Į` `İ` `Ĳ` `Ĵ` `Ķ` `Ĺ` `Ļ` `Ľ` `Ŀ` `Ł` `Ń` `Ņ` `Ň` `ŉ` `Ŋ` `Ō` `Ŏ` `Ő` `Œ` `Ŕ` `Ŗ` `Ř` `Ś` `Ŝ` `Ş` `Š` `Ţ` `Ť` `Ŧ` `Ũ` `Ū` `Ŭ` `Ů` `Ű` `Ų` `Ŵ` `Ŷ` `Ÿ` `Ź` `Ż` `Ž` `Ș` `Ț` `ẞ`
- **Figures** (17): `0` `1` `2` `3` `4` `5` `6` `7` `8` `9` `²` `³` `¹` `¼` `½` `¾` `⁴`
- **Punctuation** (42): `!` `"` `#` `%` `&` `'` `(` `)` `*` `,` `-` `.` `/` `:` `;` `?` `@` `[` `\` `]` `_` `{` `}` `¡` `§` `«` `¶` `·` `»` `¿` `–` `—` `‘` `’` `‚` `“` `”` `„` `•` `…` `‹` `›`
- **Symbols** (38): `$` `+` `<` `=` `>` `|` `~` `¢` `£` `¤` `¥` `¦` `©` `ª` `¬` `®` `°` `±` `µ` `º` `×` `÷` `⁄` `€` `™` `←` `↑` `→` `↓` `−` `■` `▲` `▶` `▼` `◀` `●` `★` `♥`
- **Spacing accents** (14): `^` `` ` `` `¨` `¯` `´` `¸` `ˆ` `ˇ` `˘` `˙` `˚` `˛` `˜` `˝`
- **Combining accents** (U+0300 U+0301 U+0302 U+0303 U+0304 U+0306 U+0307 U+0308 U+030A U+030B U+030C U+0326 U+0327 U+0328) are parts, not characters: a letter typed with one (decomposed) draws as the composed letter.
<!-- /charset -->

- **Lower case** draws as capitals: every lower-case letter of these blocks maps to its capital, so text keeps its
  case for screen readers, copying and search. Greek lower case and the capitals with a tonos draw as the plain
  capitals (ά and Ά as Α), and ΐ and ΰ as Ϊ and Ϋ.
- **Romanian** (`lang="ro"`, also Moldovan): Ş and Ţ draw with the comma below, as Ș and Ț.
- **Not covered:** see [Supported scripts](#supported-scripts). Pixelify Sans covers Latin, Latin-1, Latin
  Extended-A, Cyrillic (Russian to Macedonian), Greek, General Punctuation, the euro, the trademark and the minus
  sign.

## Casing

- Pixel Bop is capitals only. `.blip-display` also sets `text-transform: uppercase`, so fallback text matches. Write
  text in its natural case ("Level complete", not "LEVEL COMPLETE"): screen readers read it better.
- `text-transform: uppercase` turns ß into SS. Write ẞ to keep the capital sharp s.
- It also turns the micro sign µ into a Greek capital Mu, which draws as M. Keep µ with
  `<span style="text-transform: none">µ</span>`.
- Turkish and Azerbaijani: set `lang="tr"` (or `az`), and the browser capitalises i to İ.
- Greek: set `lang="el"`, and the browser leaves the accents off the capitals, as Greek is set. Pixel Bop leaves the
  tonos off either way.
- Pixelify Sans keeps sentence case, except `.blip-label`, which is upper case.

## Accessibility

- Pixel Bop is real text: it can be selected, translated, read aloud and zoomed. Never put display text in an image.
- Keep it for short, big text. Long passages and anything below scale 1 belong in Pixelify Sans.
- Contrast comes from the scheme roles, as for all text. POP letters are white with an ink outline, so they read on
  every scheme; plain display text uses `--blip-text`.
- Pixel Bop has no lower case, so give screen readers the natural case (see Casing).

## Do and don't

- **Do** use data-scale (or `--blip-scale`) for size. **Don't** set Pixel Bop's font-size by hand.
- **Do** keep POP text on one line: its tinted band is drawn for one line of text.
- **Don't** use Pixel Bop for body text, form input or long labels.
- **Don't** letter-space Pixel Bop except in whole pixels (`calc(N * var(--blip-pixel) * var(--blip-scale))`).

## Licensing

- **Pixel Bop**: SIL Open Font License 1.1, Copyright 2026 The Blip authors, with Reserved Font Name "Pixel
  Bop" (`OFL.txt`). You may use, embed, modify and redistribute it, also in commercial products; you may not sell
  the font on its own, and a modified version must not be called Pixel Bop.
- **Pixelify Sans**: SIL Open Font License 1.1, Copyright 2021 The Pixelify Sans Project Authors
  (`OFL-PixelifySans.txt`). The files here are a modified subset of the original, and the version string says so:
  - no ligatures: the original joins fi and fl into a glyph that reads as "A" ("first" read "Arst");
  - C, G, 5 and lower-case c redrawn so they can't be read as O, O, S and o (the original's C and G have a slit
    narrower than one of their pixels that closes at bold, and its 5 is shaped like an S);
  - every glyph drawn finer than one of its pixels redrawn on its pixel grid, at regular and bold: the accents,
    quotes, commas and asterisk, @ © ® ™ ° ¶ ‰ ¤ ¥ × / \, the ordinals, superscripts and fractions, and Ł, ł, Ø, ø, ð
    (the original's @ read as a dot and © as °; its carons closed into dots at bold);
  - Cyrillic: К and Ќ un-swapped; Ж and the tails of Ц and Щ redrawn; І, О, П and the letters with a grave added;
  - Greek: ι without its dot, υ without a tonos, μ, ί, ϊ and ϋ in lower case; Θ, θ, γ and Φ redrawn; the tonos of
    the capitals moved to their left, as Greek sets it; Δ, Ω and ς added.
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
   WOFF2 files, the glyph table in `examples/font.html`, the character list above and the `@font-face` rules of
   `font.css`, and fails if a WOFF2 goes over 15 KB.
4. **Look** at the gallery (`node scripts/gallery.mjs`, then `/specimen/gallery.html?only=font`) at scales 1 to 4:
   the rounded sets are generated, but they show whether a shape survives EPX and AdvMAME3x.

Pixelify Sans's changes are pixel maps too, in `src/pixelify-sans.glyphs`, drawn on that font's own grid (its top
documents the format). The build fails, naming the glyph, if any glyph of its three files has a stroke thinner than
one of its pixels at regular or bold, or if a feature browsers apply by default joins letters into a ligature.

## API

| File or export | |
|---|---|
| `@jaatster/blip-font/font.css` | The `@font-face` rules: each face in three files, and Blip Fallback (emoji). |
| `@jaatster/blip-font/pixel-bop.woff2`, `pixel-bop-cyrillic.woff2`, `pixel-bop-greek.woff2` | Pixel Bop, one file per script. |
| `@jaatster/blip-font/pixel-bop.ttf` | Pixel Bop, every script in one file, with glyph names, for design tools. |
| `@jaatster/blip-font/pixelify-sans.woff2`, `pixelify-sans-cyrillic.woff2`, `pixelify-sans-greek.woff2` | Pixelify Sans, one file per script, variable weight 400 to 700. |
| `src/pixel-bop.glyphs` | The source of every Pixel Bop glyph. |
| `src/pixelify-sans.glyphs` | The glyphs Blip draws, composes or corrects in Pixelify Sans. |

| OpenType | Value |
|---|---|
| Units per em | 1200 (one pixel is 120 units) |
| Ascent, descent, line gap | 1080, -360, 0 (9 and 3 pixels) |
| Cap height | 840 (7 pixels) |
| Features | `ss02` Rounded 2x, `ss03` Rounded 3x, `locl` for Romanian and Moldovan (Pixelify Sans: `ccmp`, `locl`, `kern`; no ligatures) |
| Rendering | `gasp` asks Windows for no smoothing: pixel edges stay sharp |
