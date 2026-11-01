# @jaatster/blip-core

## 0.1.0

First release. The building blocks: the pixel unit, the candy box (outline, bands, glints, drop, stepped corners), the focus ring, dither, stepped motion, type styles and base styles; PixelElement, the roving focus, typeahead and dismiss controllers, the timeline runner, and the swappable clock, random and sound services.

- `@jaatster/blip-core/layers.css` declares the cascade-layer order for a page that also uses Tailwind CSS v4 or layered CSS of its own (`properties, theme, base, pp, components, utilities`): import it first.
- Text follows a larger default text size set in the browser (the `--pp-size-*` tokens are in rem), never below Blip's own sizes.
- `autoScheme()` changes the time of day in one step, shown as an ordered dither (a quarter, half, then three quarters of the pixels, a frame each), so every pixel is one whole palette and text keeps its contrast; `data-pp-scheme-dither` marks `<html>` while it runs.
- With `prefers-contrast: more`, soft lines take the line colour, muted text the text colour, and the focus ring's ink edge is two pixels.
- Ligatures are off for all text, and titles and reading text hyphenate long words in the page's `lang`.
- `PixelElement`'s `flag()` reads a boolean attribute written `"false"` as off, as frameworks write it on an element defined after they render.
- POP prints without its tint (print ignores `background-clip: text`, so the tint printed as a box): white letters, the ink outline and the drop.
- The box's layers overlap, so at 125%, 150% and 175% zoom a box never shows seams at its corners (its outer edges can be soft there; at 100%, 200% and 300% every pixel is exact).
- Soft and candy boxes are light in every scheme: text, links, status words, fields, calm buttons, menus and tooltips on them take the light roles (a soft alert's default included).
- On (pressed, selected, current, open) also drops a candy or soft box's face a pixel inside its outline, an ink shadow along its top and left, so it reads without colour.
- Disabled boxes are dithered with `--pp-disabled-dither`, light in every scheme; cream takes `--pp-disabled-dither-cream` and slate ink.
- In Windows high contrast, on is the system highlight (grey when disabled) and busy keeps its three dots. Printed, boxes keep their colours with background graphics off, and scrims are left off.
