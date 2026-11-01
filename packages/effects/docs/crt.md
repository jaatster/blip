---
name: CRT
package: "@jaatster/blip-effects"
css: crt.css
element: null
react: null
status: beta
---

# CRT

An old television's look over anything: dithered ink scanlines on every other pixel row and a dithered ink vignette
round the edge. No blur, no curvature, no see-through wash, CSS only.

## Usage

```html
<div class="pp-crt">…a game screen, a picture, a panel…</div>
<div class="pp-crt" data-flicker>…</div>
```

Wrap the thing to filter. The effect sits over it and lets pointers through. Don't put `pp-crt` on a `.pp-box`
itself (both use the same pseudo-elements); wrap the box.

## Anatomy

1. **Scanlines**: ink on one pixel in four along every other pixel row, two pixels along from the line above, so an
   eighth of the pixels are ink and the rest show through untouched (a dither, never a wash).
2. **Vignette**: ink dithered round the edge, half the pixels in the outer two, a quarter in the four inside them.

## Variants

| | |
|---|---|
| `data-flicker` | The scanlines jump to the rows between them for a frame, twice a beat pair, for six beats, then hold still. |

## States

| State | Look |
|---|---|
| Reduced motion | No flicker. |
| Forced colours, print | No effect. |

## Accessibility

- Scanlines put a dot of ink on some pixels: keep text on a CRT big (POP on a picture, Pixel Bop on a panel), whose
  letters survive a dot, and check it still reads. Labels, captions and controls are too small: a dot can turn P
  into R. Keep them outside the CRT.
- Flicker is opt-in, steps without fading, and stops after six beats (under five seconds); never use it behind body
  text.

## Do and don't

- **Do** use it for a game screen, a title card, a retro picture.
- **Don't** put it over forms or long text.

## API

`.pp-crt`, `data-flicker`.
