---
name: Progress
package: "@jaatster/blip-components"
css: progress.css
element: null
react: Progress
status: stable
equivalents:
  shadcn: Progress
  apg: meter
  html: '<progress>, <meter>'
---

# Progress and meter

A native `<progress>` or `<meter>` drawn as a row of candy blocks in an ink-outlined well. Progress shows how far a
task has got (a download, a level loading); with no value it shows that something is happening. A meter shows an
amount within a range that is not a task: health, storage, signal. For a spinner, use a [loader](loader.md); for
steps of a flow, progress steps.

## Usage

```html
<div class="blip-progress-label"><label for="load">Loading World 2</label><span>60%</span></div>
<div class="blip-box blip-progress" data-tone="success"><progress id="load" max="100" value="60">60%</progress></div>

<div class="blip-box blip-progress"><progress aria-label="Finding a match">Searching</progress></div>

<div class="blip-box blip-meter"><meter min="0" max="10" low="4" high="7" optimum="10" value="6" aria-label="Health">6 of 10</meter></div>
```

## Anatomy

1. **Well**: a candy box, radius 2, ink outline, the sunken surface, no drop. As wide as its container, rounded down
   to whole blocks, so the row never ends in a sliver.
2. **Blocks**: one-pixel gaps cut the bar into blocks. Filled blocks are candy (light top row, base, shade bottom
   row); empty ones are dark, as in the game's HUD: Liquorice's shade by Day and at Sunset, the palette's page
   colour at Night, in the ink well (cream under the Liquorice candy, which is dark itself). Filled and empty differ by at least 3:1 in
   lightness for every tone in every scheme, so the bar reads in greyscale and to colour-blind eyes.
3. **Label row** (`.blip-progress-label`, optional): the name at the start, the value in words at the end.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-tone` | `accent` (default), `info`, `success`, `warning`, `danger`, any candy name | Progress fill. `success` when done, `danger` for a draining thing (a boss's health). |
| `data-size` | `sm` (7 pixels high, 3-pixel blocks), `md` (8, 4-pixel blocks), `lg` (12, 6-pixel blocks) | Small in dense lists and popovers, large for a loading screen. |
| `.blip-meter` | | Colour from the meter's own `low`, `high` and `optimum`: green when good, orange when not, red when worse. `data-tone` fixes one colour instead (a magic bar is always blue). |

## States

| State | How | Look |
|---|---|---|
| Determinate | `value` (and `max`) | Filled blocks up to the value. Where CSS can read the value (typed `attr()`), the fill moves a whole block at a time; elsewhere it follows the value exactly and the gaps still show. |
| Indeterminate | no `value` | Two lit blocks in every six march along one block a step (six steps a cycle). Still with reduced motion. |
| Complete | `value` equal to `max` | Every block filled; say "Done" in the label. |
| Right to left | `dir="rtl"` on the page or a parent | Fills from the right, and the indeterminate blocks march leftwards. |

## Accessibility

- Native elements: `<progress>` is a progressbar with its value, `<meter>` a meter; nothing to add but a name.
- **Name every bar**: a `<label for>` (both elements are labelable), `aria-label` or `aria-labelledby`.
- **Say it in words** when a percentage says too little: `aria-valuetext="3 of 8 files"`, and the same in the label
  row.
- The text inside the element is a fallback for very old browsers; keep it equal to the value.
- **Don't announce every step.** A bar is not a live region. Announce the start and the end ("World 2 loaded")
  with a [loader](loader.md) or a status message, not every percent.
- Colour is never the only cue for a meter: the value is in its name or the label row ("Health 2/10").
- Windows high contrast: the well is a system border; filled blocks are Highlight, empty ones GrayText.

Progress bars and meters are not interactive: no keys.

## Content

- Label the task, not the widget: "Downloading World 2", not "Progress".
- Values in the units people think in: "3 of 8 files", "450 / 1,000 XP", "91%".

## Do and don't

- **Do** use an indeterminate bar only until you can show a value.
- **Do** use a meter for amounts (health, storage) and progress for tasks.
- **Don't** let a bar go backwards; start a new bar for a new task.
- **Don't** make the fill yellow: yellow means focus.

## API

| Class or attribute | |
|---|---|
| `.blip-progress` on a `.blip-box` around a `<progress>` | The bar. |
| `.blip-meter` on a `.blip-box` around a `<meter>` | The meter. |
| `.blip-progress-label` | A row above: the label first, the value in words last. |
| `data-tone`, `data-size` | See Variants. |
