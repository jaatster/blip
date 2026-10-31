---
name: Drop text
package: "@jaatster/blip-effects"
css: text.css
element: pp-drop-text
react: DropText
status: beta
---

# Drop text

A Pixel Bop heading whose letters drop in one after another, as the TV's app name does when the selection moves:
each letter appears 30 ms after the last, two pixels high for one frame, then lands.

## Usage

```html
<h1><pp-drop-text class="pp-display pp-pop" data-scale="3" data-pop="Level complete!">Level complete!</pp-drop-text></h1>
```

```js
const title = document.querySelector("pp-drop-text");
title.text = "Prime Video";   // the new name drops in
title.play();                 // drop in again
```

## Anatomy

The text, kept whole for assistive technology, and a hidden copy split into words (which never break) and letters
(which move).

## Variants

Any display style: `.pp-display` at a scale, `.pp-pop` with a `data-tone`, plain. Put `pp-pop` and `data-pop` on the
element itself, so each letter keeps its tinted lower rows as it drops.

## States

| State | Look |
|---|---|
| Dropping | Letters not yet reached are hidden; the newest is two pixels high for a frame. |
| Reduced motion | The letters are simply there. |
| Before the script | The plain heading. |

## Accessibility

- The whole text is read once, from a visually hidden copy; the moving letters are hidden from assistive technology.
- The drop takes about 30 ms a letter; it never repeats on its own.

## Content

Short titles: a name, a level, a word of praise. Pixel Bop is capitals only.

## Do and don't

- **Do** drop the one big title that changes as people move (the selected app, the level name).
- **Don't** drop body text or several headings at once.

## API

| | |
|---|---|
| `text` | The text; setting it drops the new text in. |
| `play()` | Drops the letters in again. |
| `--pp-drop-text-stagger` | Time between letters (30 ms). |
