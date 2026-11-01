# @blip/stylelint-config

Stylelint rules that keep CSS inside Blip: colours from tokens, sizes in whole pixels, motion in steps, and
only tokens that exist.

```sh
npm install -D stylelint @blip/stylelint-config
```

```js
// stylelint.config.mjs
export default { extends: ["@blip/stylelint-config"] };
```

## Rules

### blip/no-raw-color

No hex colours, colour functions (`rgb()`, `hsl()`, `oklch()`…) or named colours. Allowed: tokens,
`transparent`, `currentColor`, `inherit`, `color-mix()` of those, and system colours (`CanvasText`,
`Highlight`…) inside `@media (forced-colors: active)`. Mask layers are exempt (their colour only carries alpha):
`mask` declarations, custom properties that feed one in the same stylesheet, and the box's `--blip-shape*`.
Options: `ignoreProperties`, `maskProperties` (names or `"/regex/"`).

### blip/whole-pixels

Sizes are whole Blip pixels: tokens (`--blip-space-N`, `--blip-radius-N`, `--blip-control-*`), or
`calc(N * var(--blip-pixel))` with a whole N. Rejects raw `px`, `pt`, `cm`… (except `0`, and `1px` inside
forced-colors for system borders), font-relative `em`/`rem`/`ex` (text sizes come from `--blip-size-*`), and
fractions such as `calc(1.5 * var(--blip-pixel))` or `calc(var(--blip-pixel) / 2)`. Allows percentages, viewport and
container units, `fr`, and the text measures `ch` and `lh`. Breakpoints in `@media`/`@container` are not
checked. Options: `allow` (values such as `"0.5px"`), `ignoreProperties`.

### blip/stepped-motion

Timing functions are `steps()`, `step-start`, `step-end` or `var(--blip-ease-N)`, never `ease`, `linear` or
`cubic-bezier()`. In the `transition` and `animation` shorthands a missing timing function is an easing curve
too (the default is `ease`), unless nothing moves (duration 0) or a later longhand sets it.

### blip/known-tokens

Every `var(--blip-…)` is a token from @blip/tokens, a public property of a Blip package (the list ships
as `public-properties.json`), or declared in the same stylesheet; typos get "did you mean". Option: `allow`.

A documented exception takes a disable comment with its reason:

```css
/* stylelint-disable-next-line blip/whole-pixels -- the visually hidden pattern: never drawn */
```

MIT
