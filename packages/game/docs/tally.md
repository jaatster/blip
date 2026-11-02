---
name: Tally
package: "@jaatster/blip-game"
css: tally.css
element: blip-tally
react: Tally
status: beta
---

# Tally

The end of a level: the stars earned, rows that count up to what each thing was worth, the total, and a new best.
Each row counts a whole step a frame, the stars land one by one, each a note higher, then the total counts and "New
best!" bumps in. A key, a click or a tap skips to the end.

## Usage

```html
<blip-tally class="blip-tally" stars="2" max="3" best>
  <dl class="blip-tally-rows">
    <div class="blip-tally-row">
      <dt>Coins</dt><dd class="blip-tally-detail">42 × 10</dd>
      <dd class="blip-tally-value blip-display blip-pop" data-pop="420">420</dd>
    </div>
    <div class="blip-tally-row" data-total>
      <dt>Score</dt>
      <dd class="blip-tally-value blip-display blip-pop" data-scale="2" data-value="4600" data-pop="4,600">4,600</dd>
    </div>
  </dl>
  <p class="blip-tally-best"><span class="blip-box blip-tag" data-variant="candy" data-tone="success">New best!</span></p>
</blip-tally>
```

```js
await tally.play();                       // or the autoplay attribute
document.querySelector(".play-again").focus();
```

Write the markup as the result stands: without JavaScript, or with less motion asked for, that is what shows. The
last value is the total.

## Anatomy

1. **Stars** (`.blip-tally-stars`): the stars earned and the empty ones, at twice the pixel; the element draws them
   from `stars` and `max`, as a picture named "2 of 3 stars".
2. **Rows** (`.blip-tally-rows`): a `<dl>`, one `.blip-tally-row` (a `<div>` of a `<dt>` and `<dd>`s) a thing counted.
3. **Detail** (`.blip-tally-detail`): how the value was made, small and muted: "42 × 10".
4. **Value** (`.blip-tally-value`): the number in POP. `data-value` holds it when the text is formatted ("4,600").
5. **Total** (`data-total`): the last row, over a dithered rule, at scale 2.
6. **New best** (`.blip-tally-best`): a candy tag; hidden until the end, and shown only with `best`.

## Variants

| Attribute | Values | |
|---|---|---|
| `stars`, `max` | 0 to `max`; `max` 3 by default | Stars earned, of how many. |
| `best` | | The total is a new best: "New best!" shows at the end. |
| `autoplay` | | Plays when it connects. |
| `data-total` (on a row) | | The total, under its rule. |
| `data-scale` (on a value) | 1 (default) to 4 | Pixel Bop's whole scales. |

## States

| State | Look |
|---|---|
| Counting | A row's value steps up a whole step a frame, at most twenty frames, with a soft blip on every other. |
| Stars | Each star drops in, its coin sound a note higher than the last. |
| Done | Everything as written; "New best!" bumps in; `blip-done` fires. |
| Reduced motion | Shows the result at once, and fires `blip-done`. |

## Accessibility

- The stars are a picture with a name: "2 of 3 stars".
- The counting is visual. When it ends, a polite live region says the result once: "2 of 3 stars. Score 4,600. New
  best!"
- A key, a click or a tap skips to the end and does nothing else, so a fast reader is never kept waiting; then move
  the focus to what comes next (Play again).
- The rows are a description list: each label and its value are read together.

## Content

Labels are one word ("Coins", "Time", "Score"). Show how a value was made when it is a sum ("42 × 10"). Put the total
last.

## Do and don't

- **Do** give the player their next step right under it: Play again, the map.
- **Don't** let the tally run more than a few seconds: keep the rows few and the numbers round.

## API

| Element | Members | |
|---|---|---|
| `blip-tally` | `stars`, `max` | Mirror the attributes. |
| `blip-tally` | `play()` | Counts it all up; returns a promise for when it has finished, played out or skipped. |

| Event | `detail` | |
|---|---|---|
| `blip-done` | | The tally has finished: played out, skipped, or shown at once. |
