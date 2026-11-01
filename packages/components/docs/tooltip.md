---
name: Tooltip
package: "@blip/components"
css: tooltip.css
element: blip-tooltip
react: Tooltip
status: stable
equivalents:
  shadcn: Tooltip
  apg: tooltip
---

# Tooltip

A small chip that names or explains the control you point at or focus: "Save to slot 2 (Ctrl+S)". It is the
inverse of the page (ink with white text by day, starlight with ink text at night) and has a pixel nub pointing at
its trigger. Text only: anything with links or buttons is a [popover](popover.md).

## Usage

```html
<button class="blip-box blip-button" data-icon-only aria-label="Save" id="save-btn">…</button>
<blip-tooltip for="save-btn">Save to slot 2 (Ctrl+S)</blip-tooltip>

<span class="blip-box blip-input"><input id="name" aria-label="Player name"></span>
<blip-tooltip for="name" data-side="right">3 to 12 letters or numbers. Shown on leaderboards.</blip-tooltip>
```

Without `for`, a `<blip-tooltip>` belongs to the element just before it.

## Anatomy

1. **Chip**: a candy box, radius 2, filled with the scheme's text colour, one-pixel drop. Caption-size text, up to
   about 110 pixels wide.
2. **Nub** (`.blip-tooltip-nub`, added by the element): seven pixels wide and four deep, turned in quarter turns to
   point at the trigger's middle, even when the chip was pushed back on screen.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-side` | `top` (default), `bottom`, `left`, `right` | The side it prefers. When there is no room, it takes the other side while it shows, and `data-side` says so; on a static chip, where it is drawn. |

## States

| State | How | Look |
|---|---|---|
| Hidden | | Not shown; still read by screen readers as the trigger's description. |
| Showing | hover for a beat (`--blip-duration-beat`, 400 ms), or keyboard focus at once | Pops in: one pixel low for a frame. |
| Hiding | hover and focus leave (after a glide, 160 ms, to reach the chip), a press on the trigger, Escape | Gone at once. |

Moving from one trigger to the next while a tooltip shows skips the wait. One shows at a time. With reduced motion
there is no pop-in; the waits stay (they are not motion).

## Accessibility

- Follows the WAI-ARIA tooltip pattern: the chip has `role="tooltip"` and the trigger's `aria-describedby` points at
  it, so screen readers read it with the trigger whether it shows or not.
- WCAG 1.4.13, content on hover or focus: **dismissible** (Escape hides it without moving focus or the pointer, and
  stops that Escape from closing a dialog underneath), **hoverable** (the pointer can move onto the chip; it stays),
  **persistent** (it stays until hover and focus leave or it is dismissed; it never times out).
- Keyboard focus shows it, but only `:focus-visible` focus, so a click does not.
- The trigger must have its own name. A tooltip describes; it does not label. An icon-only button keeps its
  `aria-label` ("Save"); the tooltip adds detail ("Save to slot 2, Ctrl+S").
- Touch: tooltips do not show on touch. Never put something people need only in a tooltip.
- Disabled buttons do not get pointer or focus events: use `aria-disabled="true"` on a trigger with a tooltip.

| Key | Does |
|---|---|
| Tab (onto the trigger) | Shows it. |
| Tab (away) | Hides it. |
| Escape | Hides it; focus stays on the trigger. |

## Content

- A few words; at most two short lines. Sentence case. Put a shortcut in brackets at the end: "Settings (S)".
- Do not repeat the trigger's label ("Save: Save").

## Do and don't

- **Do** give every icon-only button a tooltip that adds its shortcut or what it acts on.
- **Don't** put links, buttons or images in a tooltip.
- **Don't** use a tooltip for errors or for help that people must read before they can go on.

## API

`<blip-tooltip>`: attributes `for` (the trigger's id), `data-side` and `open` (showing; set it to show it); properties
`htmlFor` and `open`; methods `show()` and `close()`; events `blip-open` and `blip-close`. A trigger rendered after the
tooltip, or replaced by a framework, is found again and described as it arrives. It becomes the chip: it gets
`blip-box blip-tooltip`, `role="tooltip"`, an id if it has none,
`popover="manual"` (the top layer, above dialogs) and the nub. It shows itself with its trigger as the popover's
source, so where the browser anchors a popover to its source, CSS anchor positioning places it; where not (it
checks on the first show), it places itself with script. It follows scrolling and resizing either way, and never
writes the trigger's `anchor-name`.

| Class or property | |
|---|---|
| `.blip-tooltip` on a `.blip-box` | The chip. `data-blip-static` draws it in the page flow. |
| `.blip-tooltip-nub` | The nub. |
| `--_blip-nub-x` | Where the nub sits along the top or bottom edge (set by the element). |
| `--blip-duration-beat`, `--blip-duration-glide` | The show and hide waits; set them on a `<blip-tooltip>` to change its own. |
