---
name: Table
package: "@jaatster/blip-components"
css: table.css
element: blip-table
react: Table
status: stable
equivalents:
  shadcn: Table, Data Table
  apg: table
  html: '<table>'
---

# Table

A real `<table>` for data people compare across rows and columns: scores, prices, players. It stays calm: a white
panel, an ink rule under the header, line-soft row lines or zebra rows. Candy is kept for what you act on (sort
buttons, row actions) and for highlights (selected rows take the accent's light fill).

## Usage

```html
<blip-table>
  <div class="blip-box blip-table-frame">
    <div class="blip-table-scroll" role="region" aria-labelledby="scores-cap" tabindex="0">
      <table class="blip-table" data-zebra>
        <caption id="scores-cap">Leaderboard, this week</caption>
        <thead>
          <tr>
            <th scope="col" class="blip-table-check"><span class="blip-box blip-checkbox" data-size="sm"><input type="checkbox" aria-label="Select all players" data-select-all></span></th>
            <th scope="col"><button class="blip-box blip-table-sort" data-variant="ghost" type="button">Player<span class="blip-table-caret" aria-hidden="true"></span></button></th>
            <th scope="col" class="blip-numeric" aria-sort="descending"><button class="blip-box blip-table-sort" data-variant="ghost" type="button">Score<span class="blip-table-caret" aria-hidden="true"></span></button></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="blip-table-check"><span class="blip-box blip-checkbox" data-size="sm"><input type="checkbox" aria-labelledby="p1"></span></td>
            <th scope="row" id="p1">Pip Bloom</th>
            <td class="blip-numeric">98,120</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</blip-table>
```

Everything is optional except the `<table>`: drop the frame for a table on a card, the scroll region for a short one,
`<blip-table>` when you sort on the server.

### On a phone

A wide table scrolls across in its scroll region. One read a row at a time (a leaderboard, a list of options) reads
better stacked: add `data-stack` to the table and `data-label` to each cell that is not the row's heading. Under
576 px of the scroll region each row becomes a block of labelled values; the header row stays for screen readers.

```html
<table class="blip-table" data-zebra data-stack>
  …
  <tr>
    <th scope="row">Pip Bloom</th>
    <td data-label="World">Meadow</td>
    <td class="blip-numeric" data-label="Score">98,120</td>
  </tr>
```

## Anatomy

1. **Frame** (optional): `.blip-box.blip-table-frame`, a white panel; the table sits a pixel inside its outline.
2. **Scroll region** (optional): `.blip-table-scroll`, scrolls across (and down, with `--blip-table-max-height`), with a
   pixel scrollbar: a candy thumb with an ink edge on a dithered track (Chrome and Safari; Firefox gets the colours).
   Inside it the table keeps each row on one line and scrolls, rather than squeezing its columns; while there is
   more to one side, that edge dithers out. With `data-stack` it is also the container the table measures.
3. **Caption**: the table's name, bold, at the top.
4. **Header**: upper-case labels over an ink rule; it sticks to the top of the scroll region.
5. **Sort button**: a ghost box filling the header cell, with a pixel caret beside the label.
6. **Rows**: line-soft rules, or zebra rows in the sunken surface; hover draws a one-pixel ink frame round the row.
7. **Check column** (optional): `.blip-table-check` cells holding checkboxes; a checked row is selected.
8. **Footer** (optional): `<tfoot>` totals over an ink rule.

## Variants

| Attribute or class | Values | Use |
|---|---|---|
| `data-zebra` | | Every other body row in the sunken surface, instead of row lines. For wide tables. |
| `data-density` | `compact` | Tighter cells for long tables and side panels. Narrow scroll regions (under 480 px) tighten on their own. |
| `data-stack` | | On a phone, rows stack instead of scrolling across: under 576 px (36rem) of its scroll region, each row becomes a block, its heading first (the `th scope="row"`, or else the first cell), beside its checkbox, then each other cell as a label and its value. Give every such cell `data-label`, the column's name as the header says it. |
| `.blip-numeric` | on `td` and `th` | Numbers: tabular digits, aligned to the end. Put it on the column's header too. |
| `.blip-table-check` | on `td` and `th` | The narrow checkbox column. |
| `.blip-table-empty`, `.blip-table-loading` | on a `<tr>` with one cell spanning the table | No data, or data on its way (three stepped dots). |

## States

| State | How | Look |
|---|---|---|
| Sorted | `aria-sort="ascending"` or `"descending"` on the `<th>` | One caret, in the text colour. Sortable, unsorted columns show both carets, muted. |
| Row hover | pointer | A one-pixel ink frame round the row, inside its cells: nothing moves. |
| Row selected | its `.blip-table-check` checkbox is checked, or `aria-selected="true"` (in a grid) | The accent's light fill, ink text. |
| Stacked | `data-stack`, under 576 px of the scroll region | Each row a block: heading first, then label and value pairs; a one-pixel line, or zebra fill, between rows. The sort buttons step aside with the header. |
| Scrolled across | more to one side | That edge of the region dithers out in three hard steps, where the browser has scroll-driven animations. |
| Sort button hover, focus, pressed | | From the ghost box: sunken well, yellow ring, sits in. |
| Loading | `.blip-table-loading` row, `aria-busy="true"` on the table | Muted text and stepped dots; reduced motion shows all three dots. |
| Empty | `.blip-table-empty` row | Centred, muted, with room around it. |

## Accessibility

- Use a real `<table>` with a `<caption>`, `scope="col"` on column headers and `scope="row"` on the cell that names the
  row. Never a grid of `<div>`s.
- Sorting follows the WAI-ARIA sortable table example: a `<button>` in the header, `aria-sort` on the `<th>` of the
  sorted column only, and the caret `aria-hidden`. `<blip-table>` also says "Sorted by Score, descending" in a polite
  live region.
- The scroll region is a named `role="region"` with `tabindex="0"`, so keyboard users can scroll it with the arrows.
- Name every row checkbox for its row (`aria-labelledby` the row header), and the select-all one in words.
- Selection never relies on colour alone: the checkbox shows it.
- Keyboard: Tab moves through sort buttons and checkboxes; Enter and Space sort or check. The scroll region scrolls
  with the arrow keys when focused.
- Windows high contrast: system colours, a system rule under the header, a selected-colour edge on selected rows
  (their checkbox shows it too), carets in button text.

## Content

- Without a scroll region a table fits its container: headings and cells wrap, and a word too long for its column
  breaks.
- A caption that says what the rows are: "Leaderboard, this week".
- Header labels of one or two words. Units in the header ("Time (min)"), not in every cell.
- Numbers formatted for reading ("98,120"); give `data-sort-value` when the text doesn't sort ("3:41" as 221).
- An empty row says why and what to do: "No friends online. Invite someone to play."

## Do and don't

- **Do** align numbers to the end with `.blip-numeric`, and their headers too.
- **Do** keep candy out of the cells: tags for a status, not candy buttons on every row.
- **Don't** put a table in a table, or make whole rows clickable: put a link in the row's name cell.
- **Don't** sort on columns where order means nothing (a status of tags).

## API

| Custom property | Default | |
|---|---|---|
| `--blip-table-max-height` | none | On `.blip-table-scroll`: past this height the body scrolls under the sticky header. Printed, the table shows every row. |
| `--blip-table-header-bg` | `--blip-surface` | The sticky header's fill (set it to the page's colour for a frameless table on the page). |

### `<blip-table>`

| Property or method | | |
|---|---|---|
| `sort(th, direction?)` | method | Sorts the first `<tbody>` by that column (ascending, then flipping); returns `false` if refused. |
| `selectedRows` | read only | The `<tr>`s whose row checkbox is checked. |

| Event | Detail | |
|---|---|---|
| `blip-sort` | `{ column, direction, header }` | Before sorting. Cancelable: `preventDefault()` refuses it (sort on a server, then set `aria-sort` yourself). |
| `blip-select` | `{ rows }` | After any checkbox change; `rows` are the selected `<tr>`s. |

Sorting reads a cell's `data-sort-value`, or its text: numbers ("98,120", "-6") compare as numbers, anything else
in the reader's language with digits in order. Sortable tables need one header row without column spans.

Rows your framework adds, removes or changes later are taken in: select-all follows them, and a table the element
sorted stays sorted (no event, nothing announced). A sort you did yourself, by cancelling `blip-sort`, is left alone.
