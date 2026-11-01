---
name: Toast
package: "@jaatster/blip-components"
css: toast.css
element: pp-toaster
react: Toaster
status: stable
---

# Toast

A short message that comes up in a corner, says that something happened, and leaves on its own: "Saved to slot 2",
"Achievement unlocked", "Couldn't upload your replay". A stepped pixel bar along its bottom counts down until it
goes. Toasts are for news about something the person did or something that happened elsewhere; a problem with
what is on screen belongs in an [alert](alert.md) next to it.

## Usage

```html
<pp-toaster data-side="bottom" data-align="end"></pp-toaster>
<script type="module">
  import { toast } from "@jaatster/blip-elements/toast";
  toast({ title: "Achievement unlocked", body: "First Flight: clear World 1 without taking a hit.", tone: "success",
          action: { label: "View", onClick: () => openTrophies() } });
  const saving = toast("Saved to slot 2");   // a string is just a title
  saving.close();                           // at once; or wait: await saving.closed
</script>
```

`toast()` uses the first `<pp-toaster>` in the page and adds one to the end of `<body>` if there is none. Put your
own in the page early (in the HTML) so its live regions exist before the first message.

## Anatomy

1. **Toaster** (`<pp-toaster>`, `.pp-toaster`): a labelled region fixed to a corner. Holds the toasts, newest nearest
   the edge, and two hidden live regions that announce them.
2. **Toast** (`.pp-toast` on a `.pp-box`): with a tone, the tone's soft fill like an alert; without, a raised
   panel in the scheme's colours. Two-pixel drop: it floats.
3. **Sign** (`.pp-toast-icon`): the tone's 12 x 12 glyph (none without a tone).
4. **Title** (`.pp-toast-title`), **text**, **action** (`.pp-toast-actions`, one small outline button).
5. **Dismiss** (`.pp-toast-close`): a ghost icon button with the pixel cross.
6. **Timer** (`.pp-toast-timer`): a two-pixel strip over the bottom band that steps down in eight whole-pixel
   steps. Absent for toasts that stay.

## Variants

| Option (`toast()`) | Attribute | Values | Use |
|---|---|---|---|
| `tone` | `data-tone` | none (a raised panel), `info`, `success`, `warning`, `danger` | What kind of news. |
| `variant` | `data-variant` | `soft` (default), `candy` | Candy for celebrations ("Level clear!"). |
| `duration` | `--pp-toast-duration` | ms; `0` stays | Default: 5 s, or 60 ms a character when longer; danger stays until dismissed. |
| `live` | | `polite`, `assertive` | Default: assertive for danger, polite for the rest. |
| | `data-side` (toaster) | `bottom` (default), `top` | The edge of the screen they come up at. |
| | `data-align` (toaster) | `end` (default), `center`, `start` | Where along that edge. |
| | `max` (toaster) | number, default 3 | How many show at once; the rest wait their turn. |

## States

| State | How | Look |
|---|---|---|
| Arriving | added | Comes up from the edge: six pixels, two, then in place (a frame each). |
| Counting down | a duration | The timer strip loses an eighth every eighth of the time. |
| Paused | pointer over the toaster, keyboard focus in it, the page hidden, or a modal dialog open (`data-paused` on the toaster) | The timer stops; nothing leaves. |
| Leaving | timed out, dismissed, action pressed, Escape | Drops back out the way it came, then the others close the gap. |

With reduced motion they appear and go at once; the timer still steps (it is a clock, not motion).

## Accessibility

- **Announced, never focused.** The toaster keeps a polite (`role="status"`) and an assertive (`role="alert"`)
  live region and says each toast's title and text into the right one when it shows. Toasts never take focus.
- **Timing (WCAG 2.2.1).** Every countdown pauses while the pointer is over the toaster or keyboard focus is in it,
  while the page is hidden, and while a modal dialog is open. Errors (danger) stay until dismissed.
- **Under a modal dialog.** A modal makes the rest of the page inert, toasts included: they wait behind its scrim
  and can be used once it closes. So that they are still heard, the toaster puts its two live regions inside the
  open modal while it is open and announces from there.
- **Reachable.** The toaster is a landmark ("Notifications"): screen reader users can jump to it; keyboard users Tab
  to it (it is at the end of the page). Escape dismisses the focused toast and moves focus to the next one, or back
  where it came from.
- **Never the only copy.** A toast leaves. Anything the person must act on or keep (an error that blocks them, a
  code, a link they need) also belongs on the page. An action in a toast must also be reachable another way (Undo
  also in the menu, the trophy also in the profile).
- Each toast is a group named by its title, so its "Dismiss" button has context.

| Key | Does |
|---|---|
| Tab, Shift+Tab | Moves through the toasts' actions and dismiss buttons (pausing them all). |
| Enter, Space | Presses the focused action or dismiss button. |
| Escape | Dismisses the focused toast. |

## Content

- Title first and short: "Saved to slot 2", not "Your game has been successfully saved".
- At most one action, named for what it does ("Undo", "View", "Try again").
- No "Success!" titles: say what succeeded.
- Long words break onto the next line, at their hyphens where the page's `lang` allows; a toast never grows wider.

## Do and don't

- **Do** use a toast to confirm something that happened out of sight (a save, an upload, a friend coming online).
- **Do** keep danger toasts for failures of things the person started, and make them stay.
- **Don't** put form errors in toasts: put them by the field.
- **Don't** fire several toasts for one event, or a toast every second.

## API

`<pp-toaster>`: attributes `data-side`, `data-align`, `max`, `dismiss-label` (default "Dismiss"), `aria-label`
(default "Notifications"). Method `add(options | title)` returns a handle.

`toast(options | title): ToastHandle` with `options` `{ title, body?, tone?, variant?, action?: { label, onClick? },
duration?, live? }`. The handle is `{ close(), closed: Promise<void> }`, returned at once, the same from
`@jaatster/blip-react`: `close()` works straight away (a toast still waiting its turn never shows), and `closed` settles
once it has gone.

| Class or property | |
|---|---|
| `.pp-toaster` | The region. `data-pp-static` draws it in the page flow (docs and screenshots). |
| `.pp-toast`, `.pp-toast-icon`, `.pp-toast-body`, `.pp-toast-title`, `.pp-toast-actions`, `.pp-toast-close`, `.pp-toast-timer` | The parts. |
| `--pp-toast-duration` | The countdown, on a toast (set by the element). |
| `--pp-toast-timer` | The timer strip's colour (default: the tone's shade). |

Sound: with a sink provided through `provide({ sound })`, a toast plays `success`, `error` or `open` as it shows.
