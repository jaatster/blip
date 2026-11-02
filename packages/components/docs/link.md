---
name: Link
package: "@jaatster/blip-components"
css: link.css
element: null
react: Link
status: beta
equivalents:
  apg: link
  html: '<a>'
---

# Link

Words that go somewhere. In running text a link is underlined one pixel below its letters in the accent's text
colour; on hover the underline doubles. Keyboard focus paints it yellow with ink letters, the TV's highlight for
text. A standalone link (under a card, at the end of a list) is bold and underlines on hover.

## Usage

```html
<p>Read the <a class="blip-link" href="/rules">house rules</a> first.</p>
<a class="blip-link" data-variant="standalone" href="/levels">All levels <svg class="blip-icon" …></svg></a>
<a class="blip-link" href="https://example.com/wiki" target="_blank" rel="noopener" data-external="opens in a new tab">Wiki</a>
```

## Anatomy

1. **Text**: the accent's text colour (checked for contrast in every scheme).
2. **Underline**: one pixel thick, two pixels below the letters; two pixels on hover.
3. **Icon** (optional): a 12 x 12 icon before or after the words, sitting on the line.
4. **External mark** (optional): a pixel arrow after the words.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-variant="standalone"` | | A link on its own line: bold, no underline until hover. |
| `data-external` | the words to read out | Adds the pixel arrow; its text ("opens in a new tab") is read with the link. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | Underline two pixels thick (standalone links gain one). |
| Focus | keyboard | Yellow background, ink text, a two-pixel ink line underneath. |
| Visited | `:visited` | `--blip-link-visited` (the text colour by default). |

`data-blip-state="hover focus visited"` forces those looks in docs and tests.

## Accessibility

- Use `<a href>` for navigation and `<button>` for actions. If it must look like a button, wear the button's
  classes on the link.
- Inline links are underlined, so they don't rely on colour alone (WCAG 1.4.1). Standalone links stand apart by
  position, weight and usually an arrow.
- Say when a link opens a new tab: `data-external` adds the words to its name.
- Link text must make sense out of context: "Read the house rules", not "click here".
- Windows high contrast: system link colours and a system focus outline.

| Key | Action |
|---|---|
| Tab | Moves to the link |
| Enter | Follows it |

## Content

- Make the words describe the destination. Put the link on the few words that matter.

## Do and don't

- **Do** keep underlines on links inside paragraphs.
- **Don't** colour other text in the accent: in running text it would look like a link.
- **Don't** use yellow for links: yellow means focus.

## API

| Custom property | Default | |
|---|---|---|
| `--blip-link-visited` | `var(--blip-text)` | The visited colour. A scheme token for it is proposed; until then set your own per scheme. |
