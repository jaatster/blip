---
name: Stat
package: "@jaatster/blip-components"
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
<dl class="pp-grid" data-min="128">
  <div class="pp-stat">
    <dt class="pp-stat-label">High score</dt>
    <dd class="pp-stat-value pp-display pp-pop" data-scale="3" data-pop="98,120">98,120</dd>
    <dd class="pp-stat-delta" data-trend="up">+12% vs last week</dd>
  </div>
</dl>
```

## Anatomy

1. **Label**: `.pp-stat-label`, upper case, muted.
2. **Value**: `.pp-stat-value` with `.pp-display` (Pixel Bop at a whole scale) and, for the TV's look, `.pp-pop`
   (white letters, ink outline, a tinted lower band with `data-pop`, a drop in the tone's shade). Tabular digits.
3. **Delta** (optional): `.pp-stat-delta`, the change in words with a pixel arrow before it.
4. **Panel** (optional): `.pp-box` on the stat, with `data-variant="panel"` (or soft), for a stat on its own.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-scale` (value) | `1`, `2`, `3`, `4` | Pixel Bop's whole scales. Pick one the column can hold. |
| `data-tone` (value) | any tone or candy | The POP tint and drop. |
| `data-trend` (delta) | `up`, `down`, `flat` | The arrow. Up reads success green, down danger red, flat muted. |
| `data-tone` (delta) | `success`, `danger`, `neutral` | When down is good news (lag, lives lost) or up is bad, say so. |

## States

Stats are text, not controls. Inside a soft or candy panel, every line takes the panel's ink.

## Accessibility

- Group stats in a `<dl>`: each stat is a `<div>` of `<dt>` (label) and `<dd>`s (value, delta), so the label is read
  with its value.
- The delta's words carry the change and its sign ("+12% vs last week", "-6, fewer is better"); the arrow is
  decoration and the colour repeats the words.
- Pixel Bop has digits, capitals and `: . , ! ? ' - + & / ( )`; other characters fall back to Pixelify Sans.

## Content

- Labels of one to three words.
- Values formatted for reading ("98,120"), units short ("412 KB").
- A delta says what it compares to ("vs last week", "today").

## Do and don't

- **Do** keep three to six stats in a row; more is a table.
- **Don't** colour a value red or green to show good or bad: that's the delta's job.
- **Don't** shrink a scale-3 value into a narrow column: use scale 2.

## API

| Class | |
|---|---|
| `.pp-stat` | One stat. |
| `.pp-stat-label`, `.pp-stat-value`, `.pp-stat-delta` | Parts. |
