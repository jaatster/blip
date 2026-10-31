---
name: Badge
package: "@jaatster/blip-components"
css: badge.css
element: null
react: Badge
status: stable
---

# Badge

A small candy box with a count, a short word or nothing at all (a dot), in a tone: "3" unread on a bell, "NEW" by
a menu item, a green dot on an online friend's avatar. It sits in a line of text or is pinned to the corner of a
button, an avatar or an icon. For labels people act on or remove, use a tag.

## Usage

```html
<span class="pp-box pp-badge" data-tone="success">New</span>

<button class="pp-box pp-button" data-icon-only aria-label="Messages, 99+ unread">
  <svg class="pp-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg>
  <span class="pp-box pp-badge" data-tone="danger" data-size="sm" data-position="top-end" aria-hidden="true">99+</span>
</button>

<span class="pp-box pp-avatar" data-tone="teal" role="img" aria-label="Kit Moss, online">KM
  <span class="pp-box pp-badge" data-dot data-tone="success" data-position="bottom-end" aria-hidden="true"></span>
</span>

<span class="pp-badge-anchor" role="img" aria-label="Trophies, 2 new">
  <svg class="pp-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg>
  <span class="pp-box pp-badge" data-tone="success" data-size="sm" data-position="top-end" aria-hidden="true">2</span>
</span>
```

## Anatomy

1. **Box**: a candy box, radius 2, one-pixel bands and drop, 10 pixels high (8 when small). At least as wide as it
   is high, so a single digit is square.
2. **Text**: Pixelify Sans, caption size, bold, upper case, tabular digits.
3. **Dot** (`data-dot`): a 6-pixel candy box with no text.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-tone` | `accent` (default), `info`, `success`, `warning`, `danger`, `neutral`, any candy name | `danger` for unread counts and errors, `success` for new and online. |
| `data-variant` | `candy` (default), `soft`, `outline` | Soft and outline for quieter labels in dense lists. Outline badges keep the tone in their text and outline (the tone's text colour). |
| `data-size` | `sm` (8 pixels), `md` (10, default) | Small when pinned to small buttons. |
| `data-dot` | | No text: status, or "something new here". |
| `data-position` | `top-end`, `top-start`, `bottom-end`, `bottom-start` | Pinned over that corner of its parent: a button or avatar (any `.pp-box`), or a `.pp-badge-anchor` round an icon. |

## States

Badges are not interactive. When the count changes, change the text; at zero, remove the badge.

## Accessibility

- **A pinned badge is a picture of what its parent's name says.** Hide it (`aria-hidden="true"`) and put the
  information in the parent's name: "Messages, 3 unread".
- **A capped count's name uses the capped text.** A badge that shows "99+" gives "Messages, 99+ unread", not
  "Messages, 120 unread": the name has to contain what the badge shows (WCAG 2.5.3, Label in Name), or someone who
  says "99+" to a speech-input tool gets no match. Where the exact number matters, give it in a description
  (`aria-describedby`).
- **A badge in text** is read as text ("Inventory 24 slots used"); make the sentence work when read aloud.
- **A dot on its own** needs a name: `role="img"` and `aria-label="Online"`, or say it in the parent's name.
- **Never colour alone.** Status dots differ only in colour, so their meaning must also be in a name or nearby text.
- Visible label in the name (WCAG 2.5.3): a button that says "Shop" is named "Shop, new items", not "New items".
- Candy text is ink on every tone (white on slate): WCAG AA, checked when the tokens build.

## Content

- Counts: digits, "99+" over 99. Words: one, at most five letters ("New", "Beta", "Low").

## Do and don't

- **Do** remove a count badge at zero rather than showing "0".
- **Don't** pin more than one badge to a thing.
- **Don't** use a yellow badge: yellow means focus.

## API

| Class or attribute | |
|---|---|
| `.pp-badge` on a `.pp-box` | The badge. |
| `data-tone`, `data-variant`, `data-size`, `data-dot`, `data-position` | See Variants. |
| `.pp-badge-anchor` | A wrapper that lets a badge sit on something that is not positioned, such as an icon. |

| Custom property | Default | |
|---|---|---|
| `--pp-tone`, `--pp-tone-light`, `--pp-tone-shade`, `--pp-tone-on` | accent | A custom tone. |
