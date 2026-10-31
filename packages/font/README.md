# @jaatster/blip-font

**Pixel Bop**, Blip's pixel display font (all capitals, every European capital letter, three stroke sets for
its whole scales), and a Latin subset of **Pixelify Sans** for UI and body text.

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

Pixel Bop is used at whole scales only (`.pp-display` with `data-scale` 1 to 4). The files are
`pixel-bop.woff2` (about 9 KB), `pixel-bop.ttf` and `pixelify-sans.woff2`. [Font docs](./docs/font.md)

Our Pixelify Sans is modified. The original draws C as an O with a slit narrower than one of its pixels, closed at
bold, G the same way and 5 like an S, so all-caps labels read CODE as OODE; lower-case c closes at bold too. The build
redraws those four from the font's own parts (C is E without its middle bar, 5 is S with a square corner and a
straight stem) at every weight, and says so in the version string. The unmodified source is in `vendor/`.

Licence: SIL Open Font License 1.1 (`OFL.txt`, `OFL-PixelifySans.txt`).
