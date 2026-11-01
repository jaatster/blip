---
name: Burst
package: "@jaatster/blip-effects"
css: null
element: null
react: null
status: beta
---

# Burst

Little whole-pixel sprites that pop out of something and fall, a frame (40 ms) at a time, then go: a reward, a
level cleared, a coin collected.

## Usage

```html
<button class="pp-box pp-button" data-pp-burst="coin">Collect</button>
<button class="pp-box pp-button" data-pp-burst="confetti" data-pp-burst-count="24">Celebrate</button>
```

```js
import { burst } from "@jaatster/blip-effects/burst";
await burst(button, { kind: "star", count: 8 });
```

## Variants

| `kind` | | Default count |
|---|---|---|
| `sparkle` | The TV's star flare (small, big, small) twinkling round the edges. | 6 |
| `coin` | The TV's coin, rising and slowing, a few after one another. | 3 |
| `star` | Yellow stars with an ink outline that burst out and arc down. | 6 |
| `confetti` | Candy bits, two pixels each, turning as they flutter down. | 18 |

Positions come from `services.random`, so `provide({ seed })` repeats a burst exactly (tests, screenshots). A sprite
pixel is the target's pixel made a whole number of device pixels, and the canvas sits on a whole device pixel, so
sprites stay crisp and even on a 125% or 175% screen.

## States

| State | Behaviour |
|---|---|
| Reduced motion | Nothing. |
| Disabled element | No declarative burst. |
| `signal` aborted | The sprites go at once. |

## Accessibility

Decoration only: the canvas is `aria-hidden`, in the top layer, and lets pointers through. Say what happened in
words too (a toast, a live region).

## Do and don't

- **Do** burst once, for a real reward.
- **Don't** burst on every click, or on errors.

## API

| | |
|---|---|
| `burst(target, { kind, count, signal })` | Returns a promise that resolves when the last sprite has gone. |
| `data-pp-burst="<kind>"`, `data-pp-burst-count` | Bursts on click, with no script of your own (load the module once). |
