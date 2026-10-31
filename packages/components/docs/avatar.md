---
name: Avatar
package: "@jaatster/blip-components"
css: avatar.css
element: null
react: Avatar
status: stable
---

# Avatar

A person or player as a picture in a candy box. The picture is drawn pixelated inside a one-pixel matte of the box's
colour; with no picture, one or two initials in Pixel Bop sit on the candy. A status dot can sit on the corner, and
avatars can stack in a group.

## Usage

```html
<span class="pp-box pp-avatar" data-tone="pink"><img src="pip.png" alt="Pip Bloom"></span>
<span class="pp-box pp-avatar" data-tone="teal" role="img" aria-label="Kit Moss">KM</span>
<span class="pp-box pp-avatar" data-size="lg" data-tone="pink">
  <img src="pip.png" alt="Pip Bloom">
  <span class="pp-box pp-avatar-status" data-tone="success" role="img" aria-label="Online"></span>
</span>
<div class="pp-avatar-group" role="group" aria-label="Party: Pip, Juno and 3 more">…</div>
```

## Anatomy

1. **Box**: the candy box, square, with stepped corners.
2. **Matte**: one pixel of the box's colour between the outline and the picture, so the picture never touches the
   stepped corners.
3. **Picture** or **initials**: an `<img>`, `<svg>` or `<canvas>`, or text in Pixel Bop at scale 1.
4. **Status dot** (optional): `.pp-avatar-status`, a small candy box on the bottom-right corner.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` | `xs` (10 pixels), `sm` (12), `md` (20, default), `lg` (28), `xl` (36) | The picture area inside is 8, 8, 16, 24 or 32 pixels: draw avatars at 8 x 8 (or 16 x 16) and they scale by whole numbers. |
| `data-tone` | `accent` (default), any tone or candy, `neutral` | The matte, or the candy behind initials. Give each person a stable colour. |
| Status tone | `success` online, `warning` busy, `danger` do not disturb, `data-variant="outline"` away or offline | On `.pp-avatar-status`, with a name. |
| `.pp-avatar-group` | | Avatars overlap by four pixels (three for small ones). End with a `+3` avatar in `neutral`. |

## States

Avatars are pictures, not controls. Inside a link or button, the link or button takes the states.

## Accessibility

- An `<img>` avatar needs `alt` with the person's name (or `alt=""` when the name is written next to it).
- An initials avatar needs `role="img"` and `aria-label` with the full name: initials alone are not a name.
- A status dot needs `role="img"` and `aria-label` ("Online"), so colour is never the only cue.
- A group is `role="group"` with a label that counts everyone ("Party: Pip, Juno, Kit and 3 more").
- Pixel Bop has capitals and digits only; initials are upper case.

## Content

- One initial on `xs` and `sm`, two on larger sizes.
- Picture art at 8 x 8 or 16 x 16 pixels.

## Do and don't

- **Do** keep a person's colour the same everywhere.
- **Don't** scale picture art by a fraction: pick the size whose picture area is a multiple of the art.
- **Don't** use an avatar as the only way to say who someone is: put the name nearby, or in `alt`.

## API

| Class | |
|---|---|
| `.pp-avatar` | The box. Use with `.pp-box`. |
| `.pp-avatar-status`, `.pp-avatar-group` | The status dot (also a `.pp-box`), the group. |

| Custom property | Default | |
|---|---|---|
| `--pp-r` with `--pp-shape`, `--pp-shape-inner` | 3 (by size: 1, 2, 3, 4, 5) | Corner radius; 0 to 5 keeps the picture clear of the corners. |
| `--pp-tone`, `--pp-tone-light`, `--pp-tone-shade`, `--pp-tone-on` | accent | A custom colour. |
