# @jaatster/blip-react

## 0.2.0

### Minor Changes

- React components for the game kit's new parts: `Shout`, `Tally`, `HudTrack`, `PromptMouse` and `PromptPill`, and `Counter`'s `chain` prop. The pricing and footer examples in the docs comments use the palette's accent instead of pink.

### Patch Changes

- Updated dependencies
  - @jaatster/blip-game@0.2.0
  - @jaatster/blip-effects@0.1.2

## 0.1.0

First release. Typed React components for every component: Web Component wrappers generated from the Custom Elements Manifests (React 18 and 19), the CSS components with their parts, and the game, blocks, effects and icons subpaths. `Attract` plays an attract-mode demo of its children, from a `script` or from `steps` (keep the list stable: a constant or `useMemo`).

- `SwipeRow` with `SwipeRowFace`, `SwipeRowMore` and `SwipeRowActions`; `Refresh` with `RefreshScroller` (both beta).
- `Wheel` (beta), and `TouchPad` from `@jaatster/blip-react/game` (beta).
- `Sheet` with `SheetPanel` and `SheetHandle`; `ActionSheet` with `ActionSheetPanel`, `ActionSheetTitle`, `ActionSheetMessage`, `ActionSheetActions` and `ActionSheetCancel` (both beta).
- `TopBar` with `TopBarBack`, `TopBarTitle`, `TopBarActions` and `TopBarLarge`; `Fab` with `FabButton`, `FabMenu` and `FabAction`; `Pager` with `PagerTrack`, `PagerSlide`, `PagerDots` and `PagerDot` (all beta).
- Renamed from Blip: the package is `@jaatster/blip-react` (was `@jaatster/blip-react`) and wraps the `<chu-*>` elements. The component names are unchanged.
- Renamed from Blip: the package is `@jaatster/blip-react` (was `@jaatster/blip-react`) and wraps the `<blip-*>` elements. The component names are unchanged.
- Every link part (`ButtonLink`, `Link`, `CardLink`, `AppBarBrand`, `AppBarLink`, `SidebarItem`, `BreadcrumbsLink`, `PaginationPrev`, `PaginationNext`, `PaginationPage`, `BottomBarItem`, `SkipLink`, `ListItem`) takes `as`, for your router's link.
- One name for one idea: `fullWidth` wherever something fills its container, `size` is `sm`, `md` or `lg` wherever there is one (a `Feature`'s place in its grid is its `layout`), `open` with `onOpen` and `onClose` wherever something opens, `onAction` when an item is chosen to run (Menu, CommandPalette, Choices) and `onSelect` when a selection changes, `side` and `align` for placement (a drawer's `side` is `end`, `start` or `bottom`, following the text).
- `CardMedia` takes `fit="pixels"` with `artWidth` and `artHeight` for pixel art at whole multiples of its pixels.
- `toast()` returns its handle at once, the same as `@jaatster/blip-elements`: `close()` works straight away.
- Tree-shakable: every component is a pure call, so a bundler keeps only what you import.
