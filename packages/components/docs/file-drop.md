---
name: File drop
package: "@jaatster/blip-components"
css: file-drop.css
element: blip-file-drop
react: FileDrop
status: beta
equivalents:
  html: '<input type="file">'
---

# File drop

A tray to drop files on, or click to browse, and the list of what was picked, each with a remove button. The real
control is the native `<input type="file">` inside the tray: it opens the picker, takes the focus and sends the files
with the form. `<blip-file-drop>` adds dropping, the list and removing; without JavaScript the browser's own file button
shows in the tray.

## Usage

```html
<blip-file-drop class="blip-file-drop">
  <label class="blip-box blip-file-drop-zone">
    <input type="file" name="shots" multiple accept="image/png, image/jpeg" aria-describedby="shots-help">
    <svg class="blip-icon" data-size="lg" viewBox="0 0 12 12" aria-hidden="true">…</svg>
    <strong>Drop screenshots here</strong>
    <span id="shots-help">or click to browse. PNG or JPG.</span>
  </label>
</blip-file-drop>
```

## Anatomy

1. **Tray** (`.blip-file-drop-zone`): the calm well, a `<label>` so a click anywhere opens the picker.
2. **Input**: the native file input, invisible once the element is running.
3. **Words**: a bold line saying what to drop, and a muted line with the types and sizes accepted.
4. **List** (`.blip-file-drop-list`): one `.blip-file-drop-item` per file: its name (`.blip-file-drop-name`, cut with an
   ellipsis when long; the full name is its tooltip), its size (`.blip-file-drop-size`), and a ghost
   `.blip-file-drop-remove` button with a pixel cross.

## Variants

| On the input | Use |
|---|---|
| `multiple` | Files add up across drops and picks. Without it, a new file replaces the old one. |
| `accept` | Dropped files that don't match are left out (and reported with `blip-reject`). |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | The well darkens. |
| Files over the tray | `data-dragover` (set by the element) | The soft accent: tone-light fill, ink outline and text. |
| Focus | keyboard on the input | The yellow ring round the tray. |
| Invalid | `aria-invalid="true"` or `:user-invalid` on the input | Danger outline; pair with an error. |
| Disabled | `disabled` on the input | Dithered; drops are ignored, remove buttons disabled. |

`data-blip-state="hover focus dragover"` on the tray forces those looks in docs and tests.

## Accessibility

- Dropping is a shortcut, never the only way: the tray is a real file input, so Tab reaches it and Enter or Space opens
  the picker. Its name is the tray's text, or `aria-labelledby` pointing at a field label.
- After picking, screen readers hear the input's own summary ("3 files"). Each remove button is named "Remove" plus
  the file name (`remove-label` translates "Remove").
- Removing a file moves focus to the next file's button, or the previous one, or back to the tray.
- Say the accepted types and sizes in words, before the person tries.

| Key | Action |
|---|---|
| Tab | Moves to the tray, then to each remove button |
| Enter, Space (tray) | Opens the file picker |
| Enter, Space (remove) | Removes that file |

## Content

- Say what to drop ("Drop screenshots here") and what's accepted ("PNG or JPG, up to 2 MB each").

## Do and don't

- **Do** check sizes and types on the server too; `accept` is a hint.
- **Don't** start uploading on drop without showing the list first, unless that's the whole point (an avatar).

## API

`<blip-file-drop>`

| Attribute / property | Type | |
|---|---|---|
| `remove-label` | string | Put before each file name on its remove button ("Remove"). |
| `files` (property) | `File[]` | The picked files, in order. |
| `input` (property) | `HTMLInputElement` | The file input inside. |

| Event | Detail | |
|---|---|---|
| `blip-change` | `{ files }` | The list changed (picked, dropped or removed). The input also fires `input` and `change`. |
| `blip-reject` | `{ files }` | Dropped files that didn't match `accept`. |

An input rendered after the element, or swapped by a framework, is taken up when it arrives.
