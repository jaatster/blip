# @blip/icons

Original icons drawn on a 12 x 12 pixel grid as bold, solid shapes with two-pixel lines, in one colour (`currentColor`): arrows,
actions, status, media, files, communication and people, commerce, devices, weather and time, and a game set. As SVG files, a
sprite, JS path data, `iconSvg()` and the `<blip-icon>` element.

```sh
npm install @blip/icons
```

## Use

```ts
import { iconSvg, icons, type IconName } from "@blip/icons";
button.innerHTML = iconSvg("heart", { label: "Liked" });
import "@blip/icons/element";          // defines <blip-icon>
```

```html
<blip-icon name="gamepad" data-size="lg"></blip-icon>
<svg class="blip-icon"><use href="/sprite.svg#blip-icon-heart"/></svg>   <!-- @blip/icons/sprite.svg -->
```

The `.blip-icon` class (size, crisp edges) is in @blip/core. All the path data is about 5.6 KB gzipped; the
element under 1 KB. [The set](./docs/icons.md) · MIT
