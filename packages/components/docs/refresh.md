---
name: Pull to refresh
package: "@jaatster/blip-components"
css: refresh.css
element: chu-refresh
react: Refresh
status: beta
---

# Pull to refresh

Pull a list down from its top to fetch what is new: a feed, an inbox, a leaderboard. On a touch screen the content
follows your finger a whole pixel at a time and a pixel arrow steps down above it; past the line the arrow flips to
say "let go", and letting go shows the [loader](loader.md) until the page has refreshed, then everything steps
back up. It is a gesture for touch only, so **always pair it with a visible Refresh button**, for a mouse, a
keyboard and a screen reader; the button calls `refresh()`, which does exactly what a pull does.

## Usage

```html
<chu-refresh class="chu-refresh" id="scores">
  <div class="chu-refresh-scroller" tabindex="0" aria-label="Leaderboard">
    <ol class="chu-box chu-list" role="list">…</ol>
  </div>
</chu-refresh>
<button class="chu-box chu-button" type="button" data-variant="soft" id="refresh-scores">Refresh</button>
```

```js
import "@jaatster/blip-elements/refresh";
const scores = document.querySelector("#scores");
scores.addEventListener("chu-refresh", (e) => e.detail.waitUntil(loadScores()));
document.querySelector("#refresh-scores").addEventListener("click", () => scores.refresh());
```

Give the scroller a height (or let a layout give one: it fills a column of a flex or grid parent). The element adds
the arrow, the loader and a live region itself.

## Anatomy

1. **Container**: `<chu-refresh class="chu-refresh">`, round the scroller. Nothing of its own shows at rest.
2. **Scroller**: `.chu-refresh-scroller`, the scroll container. It keeps the browser's own pull and the page behind
   out of it (`overscroll-behavior-y: contain`), and steps down while pulled.
3. **Indicator**: `.chu-refresh-indicator`, added by the element above the scroller and hidden from screen readers:
   `.chu-refresh-arrow`, a 12-pixel ink-outlined arrow in the accent; a `.chu-loader` ring; and `.chu-refresh-label`,
   a few words in small capitals.
4. **Live region**: `.chu-refresh-status`, a visually hidden `role="status"` added by the element, which says
   "Refreshing" and then "Updated".

## Variants

There is one look. The words are attributes (`pull-label`, `release-label`, `refreshing-label`, `done-label`),
and the arrow takes the accent of the scheme and palette.

## States

| State | How | Look |
|---|---|---|
| Rest | | Nothing shows; the scroller scrolls. |
| Pulling | `data-chu-pull="pulling"` (set by the element) | The content follows the finger at half its pace, in whole pixels, up to 40 pixels; the arrow points down: "Pull to refresh". |
| Past the line | `data-chu-pull="ready"` | From 28 pixels down the arrow flips to point up: "Release to refresh". |
| Refreshing | `data-chu-pull="refreshing"`, and `aria-busy="true"` on the scroller | The content holds 24 pixels down and the loader spins: "Refreshing". |
| Done | `data-chu-pull="done"` | "Updated", while the content steps back up in four whole-pixel frames. |

With reduced motion the content goes straight back, and the loader holds still while the words say what is
happening. For docs and tests, `data-chu-state="pulling"`, `"ready"`, `"refreshing"` or `"done"` draws a state.

## Accessibility

- **Pair it with a Refresh button.** The pull is touch only (a mouse drag never pulls, and there is no key for it),
  so a visible button that calls `refresh()` is how a mouse, a keyboard and a screen reader refresh.
- It is announced politely: "Refreshing" when it starts and "Updated" when every promise has resolved. When one
  rejects nothing more is said, so tell the person what went wrong (a [toast](toast.md), or an alert in the page).
- The scroller is `aria-busy="true"` while the page refreshes; the live region is outside it, so it is heard.
- Name the scroller and give it `tabindex="0"` when nothing inside it can take focus, so a keyboard can scroll it.
- The pull starts only at the very top of the scroller, with one finger moving down more than across: scrolling,
  sideways swipes and pinches are left alone.
- Windows high contrast: the arrow is drawn in the system text and highlight colours.

## Content

- Keep the words short: they sit beside a 12-pixel arrow on a phone. "Pull to refresh", "Release to refresh",
  "Refreshing", "Updated".
- Say what changed in the content itself (a new row, a "2 new" badge), not only in the announcement.

## Do and don't

- **Do** use it on the main list of a phone screen: a feed, an inbox, scores.
- **Do** put the Refresh button where it can always be reached, in the [top bar](app-bar.md) or above the list.
- **Don't** use it for anything but fetching what is new, and don't refresh by itself when the person did not ask.
- **Don't** put it round a scroller inside another scroller that pulls.

## API

### `<chu-refresh>`

| Attribute, property or method | | |
|---|---|---|
| `refresh()` | returns a promise | Refreshes as a pull does: steps the content down, shows the loader, sends `chu-refresh`, waits, steps back. Resolves once it has stepped back. Called while a refresh runs, it returns that one. |
| `refreshing` (read only) | boolean | True from the start of a refresh until it has stepped back. |
| `scroller` (read only) | element | The scroll container: the `.chu-refresh-scroller`, else the first other element inside. |
| `pull-label` | string | Shown by the arrow while pulling (default "Pull to refresh"). |
| `release-label` | string | Shown past the line (default "Release to refresh"). |
| `refreshing-label` | string | Shown by the loader and announced (default "Refreshing"). |
| `done-label` | string | Announced when every promise has resolved (default "Updated"). |

| Event | Detail | |
|---|---|---|
| `chu-refresh` | `{ waitUntil(promise) }` | A refresh starts. Hand `waitUntil()` the work, while the event is dispatched (call it more than once for several); the loader stays until all of it settles, and a beat at least. Cancelable: `preventDefault()` refreshes nothing. Bubbles. |
