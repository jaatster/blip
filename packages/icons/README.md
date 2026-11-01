# @jaatster/blip-icons

Original icons drawn on a 12 x 12 pixel grid as bold, solid shapes with two-pixel lines, in one colour (`currentColor`): arrows,
actions, status, media, files, communication and people, commerce, devices, weather and time, and a game set. As SVG files, a
sprite, JS path data, `iconSvg()` and the `<chu-icon>` element.

```sh
npm install @jaatster/blip-icons
```

## Use

```ts
import { iconSvg, icons, type IconName } from "@jaatster/blip-icons";
button.innerHTML = iconSvg("heart", { label: "Liked" });
import "@jaatster/blip-icons/element";          // defines <chu-icon>
```

```html
<chu-icon name="gamepad" data-size="lg"></chu-icon>
<svg class="chu-icon"><use href="/sprite.svg#chu-icon-heart"/></svg>   <!-- @jaatster/blip-icons/sprite.svg -->
```

The `.chu-icon` class (size, crisp edges) is in @jaatster/blip-core. All the path data is about 5.6 KB gzipped; the
element under 1 KB. [The set](./docs/icons.md) · MIT
