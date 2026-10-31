---
name: Choices
package: "@jaatster/blip-game"
css: choices.css
element: pp-choices
react: Choices
status: beta
---

# Choices

A list of options with the pixel pointer: dialogue answers, pause menus, title screens, shops. A white glove points at
the choice under the cursor or the keyboard and pokes toward it on the beat.

## Usage

```html
<pp-choices>
  <ul class="pp-choices" role="list" data-font="display">
    <li><button class="pp-box pp-choice" data-variant="ghost" value="new">New game</button></li>
    <li><button class="pp-box pp-choice" data-variant="ghost" value="continue">Continue</button></li>
    <li><button class="pp-box pp-choice" data-variant="ghost" value="credits" aria-disabled="true">Credits</button></li>
  </ul>
</pp-choices>
```

```js
import "@jaatster/blip-game/choices";
menu.addEventListener("pp-choice", (e) => start(e.detail.value));
```

## Anatomy

1. **List** (`.pp-choices`): as wide as its widest choice, so every highlight matches; room on the start side for the pointer.
2. **Choice** (`.pp-choice`): a ghost candy box. An icon or sprite may lead; `.pp-choice-aside` sits at the far end (a price, a count).
3. **Pointer**: the glove from the pointer sprite, ink outline and white fill, drawn with CSS masks.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-font="display"` | on the list | Pixel Bop capitals: title screens and pause menus. |
| `data-variant` | `ghost` (recommended) | Choices are quiet until pointed at; a candy choice would shout. |

## States

| State | Look |
|---|---|
| Hover | The pointer appears; the choice shows the sunken well. |
| Focus | The pointer appears; the yellow ring with the ink edge. |
| Can't take | `aria-disabled="true"`: dithered, skipped by the arrow keys, still read by screen readers ("Pay 30 coins, dimmed, you have 12"). |
| Reduced motion | The pointer stays still. It also stops poking after five seconds anywhere. |

## Accessibility

- Real `<button>`s in a list. The element makes one of them tabbable: **Up** and **Down** move (and wrap), **Home** and
  **End** jump, **Enter** or **Space** picks.
- Prefer `aria-disabled` over `disabled` so a choice you can't take still explains itself; put the reason in the
  choice ("You have 12").
- Windows high contrast: the pointer draws in system colours.

## Content

Two to four words, a verb first where it fits: "Pay 30 coins", "Trade the key", "Maybe later".

## Do and don't

- **Do** keep the safe choice last ("Maybe later", "Back").
- **Don't** mix choices that act with choices that go somewhere in one list.

## API

| Member | |
|---|---|
| `choices` | The buttons, in order (hidden ones left out). |
| `focus({ index })` | Focuses a choice, the first by default. |

| Event | `detail` | When |
|---|---|---|
| `pp-choice` | `{ value, index, label }` | A choice was clicked or pressed. `value` is the button's value, else its text. |
