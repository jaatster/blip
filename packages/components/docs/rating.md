---
name: Rating
package: "@jaatster/blip-components"
css: rating.css
element: pp-rating
react: Rating
status: beta
equivalents:
  apg: radio
---

# Rating

A row of pixel stars (or hearts). To show a score, plain CSS draws it, fractions included, on whole pixels. To set
one, `<pp-rating>` makes the row a radio group: the arrow keys move and set it, and the pointer previews what a click
would set.

## Usage

Showing a score (no script):

```html
<span class="pp-rating" role="img" aria-label="Rated 4.5 out of 5" style="--pp-rating-value: 4.5"></span>
```

Setting one:

```html
<span class="pp-field-label" id="fun-label">How fun was it?</span>
<pp-rating class="pp-rating" name="fun" value="4" aria-labelledby="fun-label"></pp-rating>
```

## Anatomy

1. **Stars**: 11 x 11 pixel stars 12 pixels apart (hearts 11 x 10). On: yellow candy (a light band, the base, a shade
   band) with an ink outline. Off: a sunken well with only the soft line round it, no ink.
2. **Score**: the fill stops at `--pp-rating-value` stars, rounded down to a whole pixel, so 3.5 fills half a star.
3. **Radios** (element): one transparent `.pp-rating-star` per star, over the drawing.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-shape="heart"` | | Red pixel hearts (lives, how much you loved it). |
| `max` (element) or `--pp-rating-max` | 5 | How many stars. |
| `data-pp-pixel` (on a parent) | 2, 3, 4 | Bigger stars, still on the grid. |

## States

| State | How | Look |
|---|---|---|
| Preview | pointer over a star (`data-preview`) | The stars a click would set go pale yellow. |
| Focus | keyboard | The square yellow ring with an ink edge round that star. |
| Read-only | `readonly` | The score shows; one tab stop (on the current star) so it can be reached; it can't change. |
| Disabled | `disabled` | Dithered with a light colour (`--pp-disabled-dither`); not focusable. |

## Accessibility

- A display-only score is an image: `role="img"` with an `aria-label` that says the score in words.
- `<pp-rating>` is a `radiogroup` (name it with `aria-label`, `aria-labelledby` or a `<label for>`; it warns in
  development without one) of `radio`s named "1 star", "2 stars"… (`star-label` translates: "{n} of {max}"). Only the
  current star, or the first, is in the tab order. Read-only sets `aria-readonly` and keeps that one tab stop;
  disabled sets `aria-disabled` and has none. Right to left, the stars fill from the right.
- Not colour alone: on stars are filled and drawn in ink, off stars are pale wells in the soft line. In greyscale the
  ink outline tells them apart by Day and at Sunset (8:1 and more), the fill at Night (10:1).
- Touch doesn't preview; it sets on tap.
- Windows high contrast: system colours for the outlines and the fill.

| Key | Action |
|---|---|
| Tab | Moves into the rating (onto the current star, or the first), then out |
| Right / Down Arrow | Sets one more (wraps to one) |
| Left / Up Arrow | Sets one fewer (wraps to the most) |
| Home / End | Sets one / the most |
| Space | Sets the focused star |

## Content

- Say what's being rated, next to it ("How fun was it?"). For scores, say how many ratings it's from.

## Do and don't

- **Do** use the CSS rating for lists of scores; it costs no script.
- **Don't** ask for a rating without saying what the stars mean when it isn't obvious.

## API

`<pp-rating>` (form-associated)

| Attribute / property | Type | |
|---|---|---|
| `name` | string | The form field name. |
| `value` | number | The score, 0 to `max`. 0 is "not rated" (nothing is sent). |
| `max` | number | How many stars (5). |
| `readonly`, `disabled` | boolean | Show only; switched off (also follows a disabled fieldset). `"false"` is off. |
| `required` | boolean | Invalid while 0 (`required-message` sets the text). `"false"` is off. |
| `star-label` | string | Each star's name; `{n}` and `{max}` are filled in. |
| `form`, `validity`, `validationMessage`, `checkValidity()`, `reportValidity()` | | As on native controls. |

| Event | Detail | |
|---|---|---|
| `pp-change` | `{ value }` | A star was set by click or key, after `input` and `change` (as a native control fires them). |

| Custom property | Default | |
|---|---|---|
| `--pp-rating-value` | 0 | The score drawn (the element sets it). |
| `--pp-rating-max` | 5 | How many stars are drawn (the element sets it). |
