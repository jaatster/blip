---
name: Search
package: "@jaatster/blip-components"
css: search.css
element: null
react: Search
status: beta
equivalents:
  html: '<input type="search">'
---

# Search

A search field: an [input](input.md) of type `search` with a pixel magnifier in front and a pixel cross that clears
it. Put it in a `<search>` element (or a form with `role="search"`) so it is found as a landmark. With a segmented
control, a select and a button it makes a filter bar.

## Usage

```html
<search>
  <form action="/levels">
    <label class="blip-sr-only" for="q">Search levels</label>
    <span class="blip-box blip-input">
      <svg class="blip-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg>
      <input id="q" name="q" type="search" placeholder="Search levels" enterkeyhint="search">
    </span>
  </form>
</search>
```

## Anatomy

1. **Well**: the input's well.
2. **Magnifier**: a 12 x 12 icon from `@jaatster/blip-icons`, muted, before the text.
3. **Clear**: the browser's own clear button, redrawn as an 8-pixel cross in a 12-pixel target. It shows while
   there is text and the field is focused or hovered.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` | `sm`, `md` (default), `lg` | As for the input. |

## States

As for the [input](input.md): focus ring, invalid, disabled. The cross darkens on hover.

## Accessibility

- Give it a name: a visible label, or a visually hidden one (`.blip-sr-only`) when the magnifier and placeholder make
  it obvious to sighted people.
- The landmark (`<search>`, or `role="search"` on the form) lets screen reader users jump straight to it.
- The cross is for pointers; keyboard users press Escape to clear (Chromium and Safari). Firefox has no clear button:
  select the text and delete it.
- Announce results somewhere polite ("12 levels found") if they update as you type.

| Key | Action |
|---|---|
| Tab | Moves to the field |
| Enter | Searches (submits the form) |
| Escape | Clears the field (Chromium, Safari) |

## Content

- The placeholder says what is searched ("Search levels"), not "Search…".

## Do and don't

- **Do** keep the query in the field after searching, so it can be changed.
- **Don't** search on every key press without a pause; wait for typing to stop.

## API

No classes of its own: use `.blip-input` with `type="search"`. The clear button's look is tied to that type.
