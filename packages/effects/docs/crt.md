---
name: CRT
package: "@jaatster/blip-effects"
css: crt.css
element: null
react: null
status: beta
---

# CRT

An old television's look over anything: scanlines on every other pixel row and a dithered ink vignette round the
edge. No blur, no curvature, CSS only.

## Usage

```html
<div class="pp-crt">…a game screen, a picture, a panel…</div>
<div class="pp-crt" data-flicker>…</div>
```

Wrap the thing to filter. The effect sits over it and lets pointers through. Don't put `pp-crt` on a `.pp-box`
itself (both use the same pseudo-elements); wrap the box.

## Anatomy

1. **Scanlines**: every other pixel row darkened with ink at low strength.
2. **Vignette**: ink dithered round the edge, half the pixels in the outer two, a quarter in the four inside them.

## Variants

| | |
|---|---|
| `data-flicker` | The scanlines flicker a little, in steps. |
| `--pp-crt-strength` | Scanline strength (16%). |

## States

| State | Look |
|---|---|
| Reduced motion | No flicker. |
| Forced colours | No effect. |

## Accessibility

- Scanlines lower contrast a little: keep text on a CRT large (Pixel Bop, POP) and check it still reads.
- Flicker is opt-in and gentle; never use it behind body text.

## Do and don't

- **Do** use it for a game screen, a title card, a retro picture.
- **Don't** put it over forms or long text.

## API

`.pp-crt`, `data-flicker`, `--pp-crt-strength`.
