# @jaatster/blip-components

## Unreleased

- Swipe rows (`swipe-row.css`, beta): a list row whose face slides aside, a whole pixel at a time, over a sunken tray of candy actions, with a More button for a pointer and a keyboard. Pull to refresh (`refresh.css`, beta): a pixel arrow that steps down and flips past the line, then the loader, round a scroller that keeps the browser's own pull out.
- Wheel picker (`wheel.css`, beta): wheels of options in a calm well, a candy band across the middle, rows above and below fading out through the dither.
- Bottom sheet (`sheet.css`, beta): the bottom drawer with a grab handle in the title bar, snap heights and room for the safe areas. Action sheet (`action-sheet.css`, beta): a column of large full-width choices with Cancel apart, at the bottom on a phone and a compact dialog in the middle from 600 px.
- Top bar (`top-bar.css`, beta): a phone screen's own bar, sticky and flush inside the safe area, with a back button and its pixel chevron, a centred title and up to two actions; `data-large` gives a big title that the bar's own title takes over from in three steps as you scroll (CSS scroll-driven). Action button (`fab.css`, beta): a candy block floating at the bottom end of the screen, inside the safe areas and clear of a bottom bar it follows (`--chu-fab-offset`), icon-only or extended, with a speed dial's stack of mini buttons that step up into place. Pager (`pager.css`, beta): a scroll-snap track of full-width slides with pixel dots that are in-page links, so it works without a script.
- On a phone: the bottom bar's current section (`aria-current="true"`) wears the on look with an ink label, not the muted one; a tab row that scrolls without its buttons dithers out at the edge with more; the small switch's knob and the rating's stars have 24 px targets (invisibly); a static tooltip narrows in a tight row; text fields, selects and text areas narrow below the native control's width instead of widening their row; a window's status line ends in an ellipsis.

## 0.1.0

First release. The core components as layered CSS: actions, forms, navigation, feedback and overlays, data and layout, in one file or one per component. Every file builds in lightningcss (Vite 8, Next.js 16) and esbuild, except `popover-nub.css`, an opt-in file for the nub of an open popover, kept out of `components.css` and loaded with a `<link>`.

- Renamed from Blip: the package is `@jaatster/blip-components` (was `@jaatster/blip-components`), and its classes, `data-chu-*` attributes, custom properties and keyframes start `chu-` (was `pp-`).
