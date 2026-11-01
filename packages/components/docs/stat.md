---
name: Stat
package: "@blip/components"
css: stat.css
element: null
react: Stat
status: stable
---

# Stat

One number that matters, said big: a label, the value in Pixel Bop POP, and how it moved, with a pixel arrow in the
colour of what the move means. Dashboards, profiles, end-of-level screens.

## Usage

```html
<dl class="blip-grid" data-min="128">
  <div class="blip-stat">
    <dt class="blip-stat-label">High score</dt>
    <dd class="blip-stat-value blip-display blip-pop" data-scale="3" data-pop="98,120">98,120</dd>
    <dd class="blip-stat-delta" data-trend="up">+12% vs last week</dd>
  </div>
</dl>
```

## Anatomy

1. **Label**: `.blip-stat-label`, upper case, muted.
2. **Value**: `.blip-stat-value` with `.blip-display` (Pixel Bop at a whole scale) and, for the TV's look, `.blip-pop`
   (white letters, ink outline, a tinted lower band with `data-pop`, a drop in the tone's shade). Tabular digits.
3. **Delta** (optional): `.blip-stat-delta`, the change in words, after a pixel arrow for which way it moved and a
   mark for what that means: the success sign's check for good news, the danger sign's exclamation mark for bad,
   none when it is neither.
4. **Panel** (optional): `.blip-box` on the stat, with `data-variant="panel"` (or soft), for a stat on its own.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-scale` (value) | `1`, `2`, `3`, `4` | Pixel Bop's whole scales. Pick one the column can hold. |
| `data-tone` (value) | any tone or candy | The POP tint and drop. |
| `data-trend` (delta) | `up`, `down`, `flat` | The arrow. Up is good news (success green, a check), down bad (danger red, an exclamation mark), flat neither (muted, no mark). |
| `data-tone` (delta) | `success`, `danger`, `neutral` | What the move means, when the trend gets it wrong: down is good news (lag, lives lost), up is bad, or neither (coins spent). The colour and the mark follow the tone. |

## States

Stats are text, not controls. A soft or candy panel gives what sits on it the light roles: every line takes the
panel's ink, in every scheme.

## Accessibility

- Group stats in a `<dl>`: each stat is a `<div>` of `<dt>` (label) and `<dd>`s (value, delta), so the label is read
  with its value.
- **The words come first.** A delta's text must carry the change with its sign and what it compares to ("+12% vs
  last week"), and whether it is good or bad news wherever the number alone does not say ("-6, fewer is better",
  "+12 ms, slower"). The arrow, the mark and the colour repeat the words and are not read out; good and bad differ in
  shape (check, exclamation mark) as well as colour, so they read in greyscale and to colour-blind eyes too.
- Pixel Bop has digits, capitals and `: . , ! ? ' - + & / ( )`; other characters fall back to Pixelify Sans.

## Content

- In a grid (`.blip-grid`) a stat is a size container: its value steps down a whole scale while the column is narrower
  than five figures at its scale (146, 216 and 286 px for scales 2, 3 and 4), so a number never breaks or runs out.
  Give a longer value a wider column (`data-min`) or a smaller `data-scale`.
- Labels of one to three words.
- Values formatted for reading ("98,120"), units short ("412 KB").
- A delta says what it compares to ("vs last week", "today"), and says good or bad in words when that is not plain
  ("fewer is better", "slower").

## Do and don't

- **Do** keep three to six stats in a row; more is a table.
- **Do** set `data-tone` when the arrow's usual meaning is wrong (`neutral` when a move is neither good nor bad).
- **Don't** colour a value red or green to show good or bad: that's the delta's job.
- **Don't** leave good or bad news to the arrow, the mark and the colour: say it in the words.
- **Don't** shrink a scale-3 value into a narrow column: use scale 2.

## API

| Class | |
|---|---|
| `.blip-stat` | One stat. |
| `.blip-stat-label`, `.blip-stat-value`, `.blip-stat-delta` | Parts. |
