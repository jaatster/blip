---
name: Tabs
package: "@jaatster/blip-components"
css: tabs.css
element: chu-tabs
react: Tabs
status: beta
equivalents:
  shadcn: Tabs
  apg: tabs
---

# Tabs

Views of one thing, one at a time: a row of tabs over a panel. Use tabs to switch between sibling views on one page
(General, Sound, Display). To move between pages, use the app bar, the sidebar, or tabs that are links
(`aria-current="page"`, no `role="tab"`). For the steps of a task, use progress steps.

## Usage

```html
<chu-tabs class="chu-tabs" data-variant="outline">
  <div class="chu-tabs-list" role="tablist" aria-label="Settings">
    <button class="chu-box chu-tab" data-variant="outline" role="tab" aria-selected="true">General</button>
    <button class="chu-box chu-tab" data-variant="outline" role="tab" aria-selected="false" tabindex="-1">Sound</button>
  </div>
  <div class="chu-tabs-panel" role="tabpanel">…</div>
  <div class="chu-tabs-panel" role="tabpanel" hidden>…</div>
</chu-tabs>
```

`<chu-tabs>` (from `@jaatster/blip-elements/tabs.js`) wires the ids, `aria-controls` and `aria-labelledby`, moves with the
arrow keys and shows the selected panel. Without it the markup still shows the selected panel, and a row too long for
its box still scrolls.

## Anatomy

1. **List**: `.chu-tabs-list`, `role="tablist"`. A row that scrolls sideways when it is too long. Paper cannot
   scroll: printed, the row wraps, every tab in sight, and the scroll buttons stay off.
2. **Tab**: a candy box, `role="tab"`, upper-case label; an icon before it or a muted count after it are fine.
3. **Panel**: `.chu-tabs-panel`, `role="tabpanel"`. Add `chu-box` and `data-variant="panel"` when it wants a frame.
4. **Arrow** (`data-arrow`): the TV's pointer arrow, ink outline and accent fill, over the selected tab.
5. **Scroll buttons**: added by `<chu-tabs>` while the row overflows; soft boxes with pixel chevrons that scroll it a
   few tabs at a time, in four steps.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-variant` on `.chu-tabs` | `candy` (default), `soft`, `outline`, `underline` | Candy and soft tabs rest in cream; the selected one takes the accent and sits in. Outline for dense, app-like screens. Underline for quiet page sections. Each tab carries the matching box tier: none (candy), `soft`, `outline`, or `ghost` (underline); `<chu-tabs>` fills it in when it is missing. |
| `data-size` on `.chu-tabs` | `sm` (16 pixels high), `md` (20, default), `lg` (24) | The heights of buttons: 32, 40 and 48 CSS px at the default pixel. |
| `data-arrow` on `.chu-tabs` | | The pointer arrow over the selected tab bobs for a few beats, then rests. It needs CSS anchor positioning; other browsers show no arrow (the selected tab still sits in). |
| `aria-orientation="vertical"` on the list | | Tabs down the side, the panel beside them. Under 480 px they become a scrolling row again. |
| `data-tone` on a tab | any box tone | A tab that keeps its own colour (inventory categories). It still sits in when selected. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | Lifts a pixel. Outline and underline tabs fill with the sunken surface. |
| Focus | keyboard | The yellow ring with an ink edge, following the stepped corners. An underline tab shows its outline and the sunken well inside the ring, selected or not; a selected one keeps its bar. |
| Selected | `aria-selected="true"`, or `aria-current="page"` on link tabs | Candy and soft: the accent, sitting in with its bands swapped. Outline: accent-light fill, ink outline. Underline: ink text over a two-pixel bar in the accent text colour, its ends stepped by the box's corners. |
| Disabled | `aria-disabled="true"` | Dithered. The arrow keys skip it. Keep it focusable only if it explains why it is off. |

## Accessibility

Follows the WAI-ARIA Authoring Practices Tabs pattern.

| Key | Does |
|---|---|
| Tab | Into the list, onto the selected tab; Tab again goes into the panel. |
| ArrowRight, ArrowLeft | The next or previous tab, wrapping, and selects it (right to left, they swap). |
| ArrowDown, ArrowUp | The same in a vertical list, where ArrowRight and ArrowLeft also work. |
| Home, End | The first or last tab. |
| Enter, Space | Selects the focused tab (`activation="manual"`; tabs are buttons, so this is their click). |

- Name the list with `aria-label` or `aria-labelledby`.
- One tab is in the tab order at a time (roving tabindex); leaving the list and coming back lands on the selected tab.
- Panels get `tabindex="0"` (the element adds it when missing), so a panel without focusable content can be reached.
- Use `activation="manual"` when showing a panel is slow, so arrowing past a tab does not load it.
- Selection never rests on colour alone: the tab sits in, and outline and underline tabs add a fill or a bar.
- The scroll buttons are a pointer convenience, hidden from assistive technology; the arrow keys bring any tab into
  view.
- The arrow bobs at most six beats (under five seconds) and not at all with reduced motion.
- Windows high contrast: system colours; the selected tab gets a two-pixel border.

## Content

- One or two words per tab, written in sentence case (CSS sets upper case).
- A count goes after the label in a muted span: `Reports <span class="chu-muted">12</span>`.
- Two to seven tabs. More than that is a sidebar or a select.

## Do and don't

- **Do** keep tabs in a steady order; never reorder them by use.
- **Do** use `aria-current="page"` and links, not `role="tab"`, for tabs that load another page.
- **Don't** nest tabs inside a tab panel.
- **Don't** put a candy tab row on a candy background; tabs stand on pastel or a panel.

## API

### `<chu-tabs>`

| Attribute or property | Type | |
|---|---|---|
| `value` | string | The selected tab's value: its `data-value`, else its `value`, else its label. Setting it selects that tab (no event); it follows the person's choice. Set before the tabs arrive, it selects the tab once it does. |
| `selectedIndex` (property) | number | The selected tab's index, or -1. Setting it selects that tab (no event). |
| `activation` | `"auto"` (default) or `"manual"` | Select on focus, or only on Enter, Space and click. |
| `tabs` (read only) | `HTMLElement[]` | The tabs, in order. |
| `list` (read only) | `HTMLElement` | The tab list. |

| Event | Detail | |
|---|---|---|
| `chu-change` | `{ value, index, tab, panel }` | After the person selects a tab. Bubbles. |

Panels are paired with tabs by `aria-controls`, or by order when it is missing. Tabs and panels added or removed
later (a framework rendering them once data arrives) are wired as they come; when the selected tab goes, the one
in its place is selected (no event).

### Custom properties

| Custom property | Default | |
|---|---|---|
| `--chu-r` with `--chu-shape`, `--chu-shape-inner` | 4 (sm 3, underline 2) | On `.chu-tab`. |
| `--chu-band-top`, `--chu-band-bottom` | 4, 4 (sm 3, 3) | On `.chu-tab`; underline uses the bottom band as its bar (2). |
| `--chu-tone`, `--chu-tone-light`, `--chu-tone-shade`, `--chu-tone-on` | accent | A custom tone on a tab. |
