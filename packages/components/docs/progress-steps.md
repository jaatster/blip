---
name: Progress steps
package: "@jaatster/blip-components"
css: progress-steps.css
element: null
react: ProgressSteps
status: beta
---

# Progress steps

The steps of a task in order, for wizards, checkouts and first-run checklists: done steps are green with a check, the
current step sits in, upcoming steps wait in outline, and a line joins them, solid behind you and dashed ahead.
Horizontal by default, or down the side.

## Usage

```html
<div class="blip-progress-steps" data-arrow>
  <ol class="blip-progress-steps-list" aria-label="Checkout">
    <li class="blip-progress-steps-item" data-state="done">
      <a href="/checkout/basket"><span class="blip-box blip-progress-steps-marker">1</span>
        <span class="blip-progress-steps-label">Basket<span class="blip-sr-only">, done</span></span></a>
    </li>
    <li class="blip-progress-steps-item" aria-current="step">
      <span class="blip-box blip-progress-steps-marker">2</span>
      <span class="blip-progress-steps-label">Payment</span>
      <span class="blip-progress-steps-hint">Card or coins</span>
    </li>
    <li class="blip-progress-steps-item">
      <span class="blip-box blip-progress-steps-marker">3</span><span class="blip-progress-steps-label">Review</span>
    </li>
  </ol>
</div>
```

## Anatomy

1. **Steps**: `.blip-progress-steps` (a size container) around an ordered list.
2. **Marker**: `.blip-progress-steps-marker`, a 14-pixel box with the step's number; a check replaces the number once
   the step is done.
3. **Label**: `.blip-progress-steps-label`, upper case, bold. **Hint** (optional): `.blip-progress-steps-hint`.
4. **Line**: from each step to the next; solid when the next step is reached, dashed while it is ahead.
5. **Arrow** (`data-arrow`): the TV's pointer arrow over the current step (beside it, down the side).

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-state="done"` on a step | | Finished: green candy and a check. Say so in its text too (", done" in a `blip-sr-only` span). |
| `aria-current="step"` | on the current step, or on its link | Sits in, in the accent (or the marker's `data-tone`). |
| `data-orientation="vertical"` | | Down the side, hints beside the steps. For checklists and long step names. |
| `data-arrow` | | The pointer arrow bobs over the current step for a few beats, then rests. |
| `data-tone` on a marker | any tone | The current step's colour. |

Under 480 px the hints step aside. Labels wrap, and words break at their hyphens where the page's language allows; a
label with a word still too long for its step folds away wherever that happens, not at a set width (it stays in the
accessibility tree), where the browser can tell (scroll-driven animations); elsewhere the word breaks instead. The
current step always keeps its label and may use its whole step for it, so the labels either side of it keep a little
further off and fold a little sooner.

## States

| State | How | Look |
|---|---|---|
| Upcoming | (nothing) | An outline box, muted number and label, a dashed line to it. |
| Current | `aria-current="step"` | The accent, sitting in with its bands swapped; bold ink label. |
| Done | `data-state="done"` | Green candy with a white glint and an ink check; a solid line to the next step. |
| Link | a done step wrapped in `<a>` | Its label underlines on hover; focus is the yellow ring around the step. |

## Accessibility

| Key | Does |
|---|---|
| Tab | Through the done steps that are links. |
| Enter | Goes back to that step. |

- An ordered list with a name (`aria-label` on the `ol`) gives "list, 4 items" and each step's position.
- `aria-current="step"` announces the current step; done steps say so in words, not only with the check.
- The current and upcoming steps are not links: you get to them by finishing the step before.
- The arrow bobs at most six beats (under five seconds), and not at all with reduced motion.
- Windows high contrast: lines, checks and the arrow in the text colour; the current marker gets a two-pixel border.

## Content

- Three to six steps; labels are one or two words ("Payment"), hints a short phrase ("Card or coins").
- Number steps from 1, in the order they are done.

## Do and don't

- **Do** let people go back to done steps.
- **Do** keep the steps the same while the task runs; do not add steps on the way.
- **Don't** use progress steps for navigation between unrelated pages: use tabs or a sidebar.

## API

| Custom property | Default | |
|---|---|---|
| `--blip-r` with `--blip-shape`, `--blip-shape-inner` | 4 | On the marker. |
| `--blip-tone` and friends on a marker | accent | The current step's colour. |
