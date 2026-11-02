---
name: Motion toggle
package: "@jaatster/blip-effects"
css: null
element: blip-motion-toggle
react: MotionToggle
status: beta
---

# Motion toggle

A page-wide pause for motion that runs on by itself: the world's drifting clouds, flaring stars and passing birds.
Pressed, it sets `data-blip-motion="reduce"` on `<html>`, and everything that moves on its own stops at once, where it
is; pressed again, it all carries on. The choice is remembered on this device. Show it on every page whose world
moves: WCAG 2.2.2 (Pause, Stop, Hide) asks for a way to pause motion that starts by itself and lasts more than five
seconds, and DESIGN.md lets motion run on only beside this toggle.

## Usage

```html
<section class="blip-hero" aria-labelledby="hero-title">
  <blip-world parallax clouds stars events avoid=".blip-hero-title, .blip-hero-lead"></blip-world>
  …
  <blip-motion-toggle></blip-motion-toggle>
</section>
```

```js
import "@jaatster/blip-effects/motion";   // defines <blip-motion-toggle>, and applies a remembered choice
import "@jaatster/blip-effects/world";
```

The module applies a remembered pause as it loads, so load it before the world's. To have it before the first paint,
put this in the page's `<head>`:

```html
<script>
  try {
    if (localStorage.getItem("blip:motion") === "reduce") document.documentElement.dataset.blipMotion = "reduce";
  } catch {}
</script>
```

### The page's motion setting

`data-blip-motion="reduce"` on `<html>` says the person asked for less motion on this page. It sits beside the device's
`prefers-reduced-motion`, which still works: `reducedMotion()` from `@jaatster/blip-core` is true when either says so, so
the toggle only ever adds to the device's setting. What follows it:

- `<blip-world>` pauses at once: a flaring star goes out, a flock or a shooting star goes, the layers come back to rest
  and the clouds stop where they are. When the attribute goes, it carries on from there.
- What moves in script checks `reducedMotion()` as it starts: the typewriter and the dialogue box show their whole
  text at once, bursts and screen transitions are skipped.
- In CSS, the world's layers stop sliding. Blip's other CSS motion (a pop-in, a glint, six blinks of a caret) is
  over within five seconds and follows the device's setting only.

Motion of your own that runs on: check `reducedMotion()` before it starts, and stop it the moment `<html>`'s
`data-blip-motion` changes:

```js
import { reducedMotion } from "@jaatster/blip-core";
const follow = () => (reducedMotion() ? loop.pause() : loop.play());
new MutationObserver(follow).observe(document.documentElement, { attributeFilter: ["data-blip-motion"] });
matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", follow);
```

## Anatomy

- **The element**: `<blip-motion-toggle>` holds a button and draws nothing of its own.
- **The button**: the one inside it, or the one it makes when it has none: a soft candy button
  (`.blip-box.blip-button[data-variant="soft"]`) with the pause icon (`pause` from `@jaatster/blip-icons`) and its label.
- **`aria-pressed`** on the button: `true` while `data-blip-motion="reduce"` is on `<html>`, whoever set it.

## Variants

| | | |
|---|---|---|
| `label` | text, default `Pause motion` | The words on the button it makes. Set `lang` on the element too when they are not in the page's language. |
| Your own button | a `<button>` inside | Any tier, tone or size, or icon-only with an `aria-label`. It gets `aria-pressed` and the press; what it shows stays yours. |

## States

| State | Look |
|---|---|
| Moving | The button at rest, `aria-pressed="false"`. |
| Paused | The button sits in with its bands swapped (the box's on look), `aria-pressed="true"`. Every toggle on the page shows it. |
| The device asks for less motion | Nothing moves, whatever the toggle shows; pressing it still records the page's own choice. |
| Before the script | Empty (a button of your own shows, and does nothing until the module loads). |
| Forced colours | The system's border; paused is the system highlight. |

## Accessibility

- A real `<button>` with `aria-pressed`: Tab reaches it, Enter or Space presses it, and a screen reader reads it as
  "Pause motion, toggle button", pressed or not pressed.
- The label stays the same in both states; `aria-pressed` says which. An icon-only button needs an `aria-label`.
- WCAG 2.2.2 (Pause, Stop, Hide): motion that starts by itself, lasts more than five seconds and sits beside other
  content needs a way to pause it. The toggle is that way for the whole page: put it near the moving world and early
  in the reading order.

## Content

- Keep the label about the motion and short: "Pause motion". Translate it with `label` (and `lang`).

## Do and don't

- **Do** show one on every page whose world drifts, flares or has events, near the world.
- **Do** load its module before the world's, or apply the remembered choice in `<head>`.
- **Don't** change the label with the state: `aria-pressed` says it.
- **Don't** use it to stop motion that is the content (a video, a game in play): give that its own controls.

## API

| | | |
|---|---|---|
| `label` | attribute and property | The label of the button it makes. |
| `data-blip-motion="reduce"` | on `<html>` | Set while paused. Set it yourself to start paused. |
| `"blip:motion"` | `localStorage` key | `"reduce"` while paused, gone otherwise; applied as the module loads. |
| `reducedMotion()` | `@jaatster/blip-core` | True when the device or the page asks for less motion. |
