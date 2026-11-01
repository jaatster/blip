---
name: Loader
package: "@jaatster/blip-components"
css: loader.css
element: null
react: Loader
status: stable
equivalents:
  shadcn: Spinner
---

# Loader

A pixel spinner for a wait of unknown length: a ring of eight pixel dots where a lit arc steps round one dot a
frame, or three dots that step in like a busy button. Its text is its label. When you know how far along a task
is, use a [progress](progress.md) bar; for a whole region of content, [skeletons](skeleton.md); for a button that
is working, the button's own `aria-busy`.

## Usage

```html
<span class="chu-loader" role="status">Loading World 2…</span>
<span class="chu-loader" data-size="lg" role="status"><span class="chu-sr-only">Loading</span></span>
<span class="chu-loader" data-variant="dots" role="status">Reconnecting</span>
```

## Anatomy

1. **Spinner** (the loader's `::before`): eight dots on a pixel circle, masked out of a wheel of eighths, so every dot
   is one solid colour: the lit head in the tone, two trailing dots in the tone's light colour, five dim dots in
   `--chu-line-soft`. The wheel turns 45 degrees a step, eight steps a turn (a nudge each, 640 ms).
2. **Dots** (`data-variant="dots"`): three square dots, shown one, two, three on the beat.
3. **Label**: the loader's text, small and muted. Wrap it in `.chu-sr-only` to show the spinner alone.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-variant` | `ring` (default), `dots` | Dots for inline text and tight spaces. |
| `data-size` | `sm` (an 8-pixel ring), `md` (12, default), `lg` (24) | Small inline, medium in panels, large for a loading screen. Dots are 2, 3 or 4 pixels. |
| `data-tone` | `accent` (default), `info`, `success`, `warning`, `danger` | The lit dots. |

## States

| State | Look |
|---|---|
| Running | The arc steps round; the dots step in. |
| Reduced motion | Still: the head at the top, all three dots shown. The words still say it is loading. |

## Accessibility

- `role="status"` makes the loader a polite live region whose words are its message. A live region is only
  listened to once it is in the page: put the loader (or an empty `role="status"` container) in the page before it
  has to speak, then add the text or the loader into it.
- **Always words.** A spinner alone means nothing to a screen reader: give it visible text or `.chu-sr-only` text.
- **Say when it is done** ("World 2 loaded") in the same region, or move focus to what loaded, then remove the
  loader. Mark the region that is loading `aria-busy="true"` meanwhile (on a wrapper, not on a `.chu-box`).
- Nothing flashes: one small dot changes at a time, in colours of the same family.

Loaders are not interactive: no keys.

## Content

- Say what is loading, with an ellipsis for an ongoing wait: "Loading World 2…", "Saving".
- Keep it under four words.

## Do and don't

- **Do** show a loader only after a short wait (300 ms or so); a flash of spinner is worse than none.
- **Don't** put several loaders on one screen; one for the region is enough.
- **Don't** use a loader inside a button: set `aria-busy="true"` on the button.

## API

| Class or attribute | |
|---|---|
| `.chu-loader` | The loader; its text is the label. |
| `data-variant`, `data-size`, `data-tone` | See Variants. |
