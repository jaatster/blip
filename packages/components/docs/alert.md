---
name: Alert
package: "@jaatster/blip-components"
css: alert.css
element: null
react: Alert
status: stable
equivalents:
  shadcn: Alert
  apg: alert
---

# Alert

An inline banner that tells people something about the page or the task in front of them: a pixel sign, a title, a
few words, the action that helps, and a dismiss button when it can go away. It sits in the page, where the problem
is. For a message about something that just happened elsewhere, use a [toast](toast.md); for a decision that must
be made now, an alert [dialog](dialog.md).

## Usage

```html
<div class="blip-box blip-alert" data-tone="danger">
  <span class="blip-alert-icon" aria-hidden="true"></span>
  <div class="blip-alert-body">
    <p class="blip-alert-title"><span class="blip-sr-only">Error: </span>Can't reach the save server</p>
    <p>Your progress is safe on this device. We'll try again in 30 seconds.</p>
    <div class="blip-alert-actions">
      <button class="blip-box blip-button" type="button" data-size="sm" data-variant="outline">Retry now</button>
    </div>
  </div>
  <button class="blip-box blip-button blip-alert-close" type="button" data-variant="ghost" data-size="sm" data-icon-only aria-label="Dismiss"><span class="blip-icon" data-glyph="close" aria-hidden="true"></span></button>
</div>
```

## Anatomy

1. **Box**: a candy box in the soft tier: the tone's light colour, an ink outline, the tone itself as a two-pixel lip
   along the bottom, a one-pixel drop.
2. **Sign** (`.blip-alert-icon`): a 12 x 12 pixel glyph chosen by the tone. The four differ in shape, not just colour:
   a disc with an i (info), a disc with a check (success), a triangle with "!" (warning), an octagon with "!"
   (danger). Put an `<svg class="blip-icon">` inside it to use another picture.
3. **Title** (`.blip-alert-title`): one bold line, exactly as tall as the sign so they line up.
4. **Text**: a sentence or two in `<p>`s.
5. **Actions** (`.blip-alert-actions`, optional): small buttons. Outline or ghost: the alert's colour already speaks.
6. **Dismiss** (`.blip-alert-close`, optional): a small ghost icon button with the pixel cross.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-tone` | `info` (default), `success`, `warning`, `danger`, `neutral` | What kind of news it is. The sign follows. |
| `data-variant` | `soft` (default), `candy`, `outline` | Soft for most; candy for the one thing on the page that must not be missed (a form that failed); outline in dense screens, where the colour stays in the sign. |

Soft and candy alerts are light in every scheme, so text, links, buttons and the cross on them take the light
roles (ink text, white outline buttons) even at night. Outline alerts follow the scheme.

## States

Alerts are not interactive; their buttons have the button's states. A dismissed alert is removed (or `hidden`) by
your code, which then moves focus somewhere sensible (the next alert, or the heading of the section) if focus was on
the dismiss button.

## Accessibility

- **Static alerts** (on the page when it loads, or part of a section that just rendered) need no role: they are read
  in order, like any text.
- **Alerts you insert in answer to something** need a live role so screen readers announce them:
  `role="alert"` for urgent problems (it interrupts: a failed save, a lost connection), `role="status"` for good or
  neutral news (polite). Insert the whole alert at once; do not fill an empty `role="alert"` word by word.
- **Never use colour alone.** Each tone has its own sign shape, and a visually hidden word ("Error:", "Warning:") at
  the start of the title tells screen reader users what the colour and shape say.
- **Dismiss buttons** are named for what they do ("Dismiss", or "Dismiss storage warning" when there are several).
  Never make the only copy of something important dismissible.
- Text on soft and candy fills is ink on a light candy: every tone passes WCAG AA. Muted text is not used inside.
- Windows high contrast: the box becomes a system border; the sign and cross keep the system text colour.

| Key | Does |
|---|---|
| Tab | Moves through the alert's links and buttons in order. |
| Enter, Space | Press the focused button. |

## Content

- Title: what happened, in plain words ("Can't reach the save server"), not a code or "Error".
- Text: what it means for the person and what they can do ("Your progress is safe. We'll try again in 30
  seconds.").
- Actions name the fix ("Retry now", "Free up space"), not "OK".

## Do and don't

- **Do** put the alert next to what it is about: above the form, at the top of the list.
- **Do** keep one candy alert per screen at most.
- **Don't** stack several alerts about the same thing; merge them ("3 fields need your attention").
- **Don't** use an alert for a passing confirmation ("Saved"): that is a toast.
- **Don't** make warnings yellow: yellow means focus. Warning is orange.

## API

| Class or attribute | |
|---|---|
| `.blip-alert` on a `.blip-box` | The banner. |
| `.blip-alert-icon` | The sign: empty for the tone's glyph, or holding an `<svg class="blip-icon">`. |
| `.blip-alert-body`, `.blip-alert-title`, `.blip-alert-actions` | Content column, title line, row of actions. |
| `.blip-alert-close` | The dismiss button (`data-variant="ghost" data-size="sm" data-icon-only` with a `data-glyph="close"` icon). |
| `.blip-icon[data-glyph]` | `close`, `info`, `success`, `warning`, `danger`: the shared pixel glyphs (on an empty span). |

| Custom property | Default | |
|---|---|---|
| `--blip-r` with `--blip-shape`, `--blip-shape-inner` | 3 | Corner radius in pixels. |
| `--blip-band-top`, `--blip-band-bottom` | 2, 2 | Band heights in pixels. |
| `--blip-tone`, `--blip-tone-light`, `--blip-tone-shade`, `--blip-tone-on`, `--blip-tone-text` | info | A custom tone. |
