---
name: Dialogue
package: "@jaatster/blip-game"
css: dialogue.css
element: pp-dialogue
react: Dialogue
status: beta
---

# Dialogue

The RPG text box: a cream panel with the speaker's name on a tab, a portrait, and text that types itself in a letter
at a time, a page at a time. It is the TV's talking bubble grown into a component: the same rhythm (a letter every
LETTER, a longer STOP after `.` `!` `?`, a COMMA after a comma), the same chip voice, and a box sized for its fullest
page so it never jumps while pages turn.

Use it for characters talking, signs, tutorials and story beats. For a question to the player, end the last page with
[choices](choices.md). For a message that interrupts, use a dialog from the core components instead.

## Usage

```html
<pp-dialogue class="pp-box pp-dialogue" voice>
  <span class="pp-box pp-dialogue-name" data-tone="green">Bramble</span>
  <div class="pp-box pp-dialogue-portrait" data-variant="soft" data-tone="teal"><svg>…</svg></div>
  <div class="pp-dialogue-body">
    <div class="pp-dialogue-text">
      <p>Ah, a traveller! The rope bridge washed out in last night's storm.</p>
      <p>I could patch it up before sunset, for thirty coins.</p>
    </div>
    <pp-choices class="pp-dialogue-choices">
      <ul class="pp-choices" role="list">
        <li><button class="pp-box pp-choice" data-variant="ghost" value="pay">Pay 30 coins</button></li>
        <li><button class="pp-box pp-choice" data-variant="ghost" value="later">Maybe later</button></li>
      </ul>
    </pp-choices>
  </div>
</pp-dialogue>
```

```js
import "@jaatster/blip-game/dialogue";
import "@jaatster/blip-game/choices";

const box = document.querySelector("pp-dialogue");
box.addEventListener("pp-choice", (e) => box.say(e.detail.value === "pay" ? "Splendid!" : "Suit yourself."));
box.addEventListener("pp-done", () => (box.hidden = true));
box.focus();   // the arrow, or the first choice once they show
```

Without JavaScript every page shows, one after another, and the choices are plain buttons: the story still reads.

## Anatomy

1. **Panel**: a candy box in cream (light band, cream, cream shade), radius 4. A light island in every scheme: text,
   lines and wells inside it keep their light values at night.
2. **Name tab** (`.pp-dialogue-name`): a small candy box riding the top edge, the name in Pixel Bop at scale 1. Give
   each speaker a tone.
3. **Portrait** (`.pp-dialogue-portrait`): a framed slot, 36 x 36 pixels; art stands at the bottom of it, one sprite
   pixel to one Blip pixel.
4. **Text** (`.pp-dialogue-text`): one child per page, Pixelify Sans at the lead size, or Pixel Bop capitals.
5. **Choices** (`.pp-dialogue-choices`): shown once the last page has typed; they pop in.
6. **Next** (`.pp-dialogue-next`): the ▼ in the accent, drawn from the arrow sprite. Added by the element; a real
   button. It blinks on the beat for five seconds, then rests.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-tone` | cream (default), any tone | The panel. Keep cream for long reading. |
| `data-font="display"` | | Text in Pixel Bop at scale 1, capitals, 14-pixel lines: signs, titles, short barks. |
| `voice` | empty, or a base rate such as `1.2` | A blip on every other voiced letter. Higher numbers for smaller characters. |
| `mood` | `plain` (default), `happy`, `sleepy` | Raises or lowers the voice, as on the TV. |
| `speed` | `1` (default) | Typing speed multiplier. Offer it as a setting. |
| `--pp-dialogue-lines` | 3 | The fewest lines the box is tall. |
| `--pp-dialogue-portrait` | 36 | The portrait slot, in pixels. |

## States

| State | How | Look |
|---|---|---|
| Typing | a page is typing | Letters appear in place; the words never jump lines. The ▼ is hidden; the button says "Show all text". |
| Waiting | the page has typed | The ▼ blinks; the button says "Next", or "Continue" on the last page. |
| Choosing | the last page has typed and there are choices | The choices pop in under the text; focus moves to the first if it was in the box. |
| Reduced motion | `prefers-reduced-motion` | Each page appears whole, nothing is voiced, the ▼ does not blink. |
| Frozen | `data-pp-typed="40"` | The first page stops at 40 letters. Docs and screenshots only. |

## Accessibility

- **Keyboard:** Tab reaches the ▼ button (or the choices). Enter or Space on it, or on the box, shows the whole page
  at once if it is typing, otherwise turns the page; after the last page it sends `pp-done`. In the choices, Up and
  Down move, Home and End jump, Enter or Space picks.
- **Pointer:** a click anywhere in the box does the same as Enter. Clicks on choices, links and fields do their own thing.
- **Screen readers** never hear the typing: each page is put whole into a polite live region, with the speaker's
  name ("Bramble: Ah, a traveller!…"). The typed copy is `aria-hidden`. The box is a `group` named by its tab.
- The ▼ button is named for what it does: "Show all text", "Next", "Continue". Rename with `typing-label`,
  `next-label` and `done-label`.
- Nothing advances on its own: readers take the time they need (WCAG 2.2.1). The blinking stops after five seconds.
- Text is ink on cream in every scheme (above 12:1).

## Content

- One thought per page; three lines or fewer. Split with a new `<p>`, never mid-sentence.
- Write how the character talks, in sentence case. Pixel Bop pages are capitals by rule.
- Keep the voice for characters; signs and narration are quieter without it.

## Do and don't

- **Do** give each speaker a tone on the name tab, and use it every time they speak.
- **Do** let the player skip: never block the button while a page types.
- **Don't** auto-advance pages; let the reader press.
- **Don't** put links or forms in a page: they are hidden from screen readers with the typed copy.

## API

| Member | |
|---|---|
| `say(pages)` | Replaces the pages (a string or an array of strings) and starts from the first. |
| `advance()` | What a press does: show all, next page, or `pp-done`. |
| `focus()` | Focuses the ▼, or the first choice while choosing. |
| `pages`, `page`, `typing` | The pages, the current index, and whether a page is typing. |
| `blipRate(letter, mood, base)` | Exported: the TV's pitch rule, for voicing your own text. |

| Event | `detail` | When |
|---|---|---|
| `pp-next` | `{ page, pages }` | A page turned. |
| `pp-done` | | The reader pressed on after the last page (no choices). |
| `pp-choice` | `{ value, index, label }` | From [choices](choices.md): an answer was picked. |
