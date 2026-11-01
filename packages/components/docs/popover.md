---
name: Popover
package: "@blip/components"
css: popover.css
element: null
react: Popover
status: stable
equivalents:
  shadcn: Popover
  html: popover
---

# Popover

A panel anchored to the button that opens it, with a pixel nub pointing back at that button: a player's profile,
the filters for a list, a short explanation with a link. It does not block the page. Built on the native `popover`
attribute, so the browser opens and closes it; CSS anchor positioning places it. For text that only names or
explains a control, use a [tooltip](tooltip.md); for a choice that must be made, a [dialog](dialog.md); for a list
of commands, a menu.

## Usage

```html
<button class="blip-box blip-button" popovertarget="profile">Pixel Pat</button>
<div class="blip-box blip-popover" id="profile" popover role="dialog" aria-labelledby="profile-name">
  <span class="blip-popover-nub" aria-hidden="true"></span>
  <p class="blip-popover-title" id="profile-name">Pixel Pat</p>
  <p>Level 12, 3,450 XP</p>
</div>
```

Browsers that make the opener the popover's implicit anchor (Chromium-based ones today) need nothing more. From
script, open it with `popover.showPopover({ source: button })` so the button is still its anchor. Elsewhere, name
the anchor yourself: `style="anchor-name: --profile"` on the button and `style="position-anchor: --profile"` on the
popover.

### The nub of an open popover (opt-in)

An open popover flips to the other side of its button when there is no room, and only an anchored container query
can tell which side it took. Those queries live in a file of their own, `popover-nub.css`: with it, an open popover
shows its nub and turns it when it flips; without it, an open popover has no nub, rather than one pointing the wrong
way. (Static popovers, `data-blip-static`, always have theirs.)

```html
<link rel="stylesheet" href="…/@blip/components/dist/popover-nub.min.css">
```

Load it with a `<link>` after `components.css` (or `popover.css`): from a CDN, or a copy in your public folder. Do
not import it through your bundler: lightningcss, which Vite 8 and Next.js 16 run on all CSS (Next.js in development
too), cannot parse `@container anchored()` yet and fails the build; `components.css` builds with it. Browsers
without anchored container queries ignore the file.

## Anatomy

1. **Panel**: a candy box, raised, radius 3, ink outline, a two-pixel drop.
2. **Nub** (`.blip-popover-nub`): seven pixels wide and four deep, an ink outline round the panel's own fill, its base
   lying on the panel's outline so the two read as one shape (like the TV's speech bubble). It is drawn pointing
   down and turned in quarter turns, which keep every pixel on the grid.
3. **Title** (`.blip-popover-title`, optional), content, and an optional **close** button (`.blip-popover-close`).

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-side` | `bottom` (default), `top`, `left`, `right` | Which side of the button it opens on. When there is no room it flips to the other side, and (with `popover-nub.css`) the nub flips with it. |
| `data-align` | `center` (default), `start`, `end` | For top and bottom: centred on the button, or lined up with its start or end edge (use near the screen's edges). The nub follows. |

## States

| State | How | Look |
|---|---|---|
| Opening | `popovertarget`, `showPopover()` | One pixel low for a frame, then in place (the pop-in). |
| Flipped | not enough room | On the other side; with `popover-nub.css`, the nub turned to match. |
| Static | `data-blip-static` | In the page flow: docs, tests, screenshots only. |

Where nothing can tell which side the popover took (`popover-nub.css` not loaded, or a browser without anchored
container queries), an open popover's nub is hidden rather than pointing the wrong way. Without anchor positioning at
all, the popover opens in the middle of the screen.

## Accessibility

- **The browser does the work**: the opener gets `aria-expanded`, the popover follows it in the tab order, Escape and
  a press outside close it, and focus returns to the opener when it was inside.
- **A popover with controls is a non-modal dialog**: give it `role="dialog"` and a name (`aria-labelledby`). A
  popover of plain text needs neither.
- Popovers do not trap focus: Tab moves on through the page after the popover's contents.
- Do not open popovers on hover alone: hover-only content cannot be reached by keyboard or touch.

| Key | Does |
|---|---|
| Enter, Space (on the opener) | Opens or closes it. |
| Tab | From the opener into the popover, then on to the rest of the page. |
| Escape | Closes it; focus returns to the opener. |

## Content

- Short: a title, a few lines, one or two actions.
- If it grows a scrollbar, it should be a dialog or a page.

## Do and don't

- **Do** anchor a popover to the control that opens it, and keep that control's label in its title.
- **Don't** nest popovers, or put a popover in a tooltip.
- **Don't** use a popover for errors; put them next to the field.

## API

| Class or attribute | |
|---|---|
| `.blip-popover` on a `.blip-box` with `popover` | The panel. |
| `.blip-popover-nub` | The nub: an empty span, first in the popover. |
| `.blip-popover-title`, `.blip-popover-close` | Optional title line; optional close button (`popovertargetaction="hide"`). |
| `data-side`, `data-align` | Placement (see Variants). |
| `data-blip-static` | Drawn in the page flow. |
| `@blip/components/popover-nub.css` | Opt-in: the nub on open popovers, turned when they flip. Not in `components.css`; load it with a `<link>`. |

| Custom property | Default | |
|---|---|---|
| `--blip-r` with `--blip-shape`, `--blip-shape-inner` | 3 | Corner radius in pixels. |
| `--blip-drop-size` | 2 | Drop in pixels. |
