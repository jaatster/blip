# @jaatster/blip-react

Typed React components for Blip: every core component and kit. They render the system's own markup (the
classes, data attributes and ARIA the CSS documents) and its Web Components, nothing else: no CSS-in-JS, no styles
of their own. Works with React 18.3 and 19, on the client and on the server.

```sh
npm install @jaatster/blip-react @jaatster/blip-tokens @jaatster/blip-core @jaatster/blip-components @jaatster/blip-font
```

## Set up the CSS once

```ts
import "@jaatster/blip-tokens/tokens.css";
import "@jaatster/blip-font/font.css";
import "@jaatster/blip-core/core.css";
import "@jaatster/blip-components/components.css"; // or one file per component
// kits, if you use them:
import "@jaatster/blip-game/game.css";
import "@jaatster/blip-blocks/blocks.css";
import "@jaatster/blip-effects/effects.css";
```

## Use

```tsx
import { Button, Card, CardBody, CardTitle, Dialog, DialogPanel, Stack, toast } from "@jaatster/blip-react";
import { Counter, Sprite } from "@jaatster/blip-react/game";
import { World } from "@jaatster/blip-react/effects";
import { Icon } from "@jaatster/blip-react/icons";

<Stack gap={4}>
  <Button onClick={() => toast({ title: "Saved", tone: "success" })}>Save game</Button>
  <Button variant="soft" tone="danger" size="sm">Delete save</Button>
  <Button iconOnly aria-label="Add level"><Icon name="plus" /></Button>
</Stack>

<Counter value={coins} pad={3} label="Coins" sound="coin"><Sprite name="coin" /></Counter>
```

Props are the documented attributes, typed: `variant`, `tone`, `size`, `radius` become `data-variant`, `data-tone`,
`data-size`, `data-blip-r`; states use ARIA (`busy` is `aria-busy`, `pressed` is `aria-pressed`). Where the system
needs something, the type does too: an icon-only button needs `aria-label` (or `aria-labelledby`), a toggle always
has `pressed`, `Icon` takes only real icon names. `className` joins the component's classes and every other prop
goes to the element. Form controls (`Input`, `Checkbox`…) put the ref and native props on the native control, and
`className` on the box around it. Parts that can never submit a form (`Tab`, `MenuItem`, `ToggleButton`…) default
to `type="button"`; `Button` keeps the native default, so give it `type="button"` outside a form.

Subpaths: `@jaatster/blip-react` (core components), `@jaatster/blip-react/game`, `@jaatster/blip-react/blocks`,
`@jaatster/blip-react/effects` and `@jaatster/blip-react/icons`. The package is ESM, has no side effects, and every
component is a pure call (`/*#__PURE__*/`), so a bundler keeps only what you use: a page with just a `Button` gets
the button, and one with `Tabs` gets the tabs' parts and their element, nothing else.

One name for one idea, everywhere: `fullWidth` fills the container (`data-width="full"`); `size` is `sm`, `md` or
`lg`; `layout` places a part in its grid (a `Feature`'s `lead`, `stat` or `wide`); `side` and `align` place things
(a drawer's `side` is `end`, `start` or `bottom`, following the text); `open` opens, with `onOpen` and `onClose`;
`onAction` hears an item chosen to run (Menu, CommandPalette, Choices) and `onSelect` a selection that changed
(Table, TileGrid, Inventory).

**Router links.** Every part that is a link takes `as`, and then the props of what you give it: `ButtonLink`,
`Link`, `CardLink`, `AppBarBrand`, `AppBarLink`, `SidebarItem`, `BreadcrumbsLink`, `PaginationPrev`,
`PaginationNext`, `PaginationPage`, `BottomBarItem`, `SkipLink` and `ListItem`.

```tsx
import NextLink from "next/link";
<AppBarLink as={NextLink} href="/live" current>Live ops</AppBarLink>
<ButtonLink as={RouterLink} to="/play" size="lg">Play now</ButtonLink>
```

## Web Components

The components with behaviour (`Dialog`, `Tabs`, `Menu`, `Combobox`, `Toaster`, `Dialogue`, `World`…) render
Blip's custom elements. Their wrappers are generated from the Custom Elements Manifests
(`scripts/generate.mjs`), so their props, events and docs follow the elements:

```tsx
<Button type="button" commandFor="save" command="show-modal">Save game</Button>
<Dialog lightDismiss onBeforeClose={(e) => unsaved && e.preventDefault()} onClose={(e) => save(e.detail.returnValue)}>
  <DialogPanel id="save" aria-labelledby="save-title">
    <DialogHeader><DialogTitle id="save-title">Save game</DialogTitle><DialogClose commandFor="save" /></DialogHeader>
    …
  </DialogPanel>
</Dialog>

<Tabs value={tab} onChange={(e) => setTab(e.detail.value)}>
  <TabList aria-label="Settings"><Tab value="general" selected>General</Tab><Tab value="sound">Sound</Tab></TabList>
  <TabPanel>…</TabPanel>
  <TabPanel hidden>…</TabPanel>
</Tabs>

<Combobox>
  <Input aria-label="Place" list="places" value={query} onChange={(e) => setQuery(e.target.value)} aria-autocomplete="list" />
  <datalist id="places">{places.map((p) => <option key={p} value={p} />)}</datalist>
</Combobox>
```

- **Attributes** are written as attributes in the first render, so the element has them when it connects and they
  are in server-rendered HTML. Booleans are present or absent.
- **Events**: `on<Event>` listens to the element's `blip-<event>` (`onChange` is `blip-change`, `onBeforeClose` is
  `blip-before-close`) with the detail typed, the same in React 18 and 19. Like any listener added after an element
  is in the page, it does not hear an event the element sends while it first connects.
- **Properties** without an attribute (`DropText`'s `text`) are assigned once the element is defined. A prop that
  mirrors an attribute is also assigned to the property when it changes after the first render, so it reaches
  elements that read the attribute only once (`Combobox`'s `value`); a prop that does not change is never written
  again, so a choice made in the element stays.
- **Loading**: each wrapper imports its element's module on the client when it first mounts, so it upgrades in
  place (until then the markup already reads and looks right). Nothing runs on the server. To define elements
  yourself, import `@jaatster/blip-elements` (or a single element) as usual: they are defined once.
- **Content you render later** is wired as it arrives: tabs that come with their data, options your search fills in,
  an error from your server (a `Field` links it, reads it out and leaves your `aria-invalid` alone). A `Combobox`
  whose input you control takes `aria-autocomplete="list"`, so it filters without completing the text you own.
- **Refs** point at the element: `ref.current.show()`, `ref.current.requestClose()`.
- With React 19, a name that is both an attribute and a property of the element (`open`, `value`, `label`) is
  still written as an attribute: React 19 would otherwise assign the property before the element connects (a
  dialog's `open` would never open it) or throw on a property with only a getter.
- Server rendering: light-DOM elements rewrite their own content when they upgrade. When you hydrate, let the
  wrappers load the elements (the default, after hydration) rather than defining them before.

`toast()` is exported too, and returns the same handle as `@jaatster/blip-elements` at once: `const saving =
toast("Saving…"); saving.close();`. The toaster loads as soon as `toast` is imported in the browser. Call it from an
event handler or effect, never while rendering.

## Components

<!-- components -->

### Core: `@jaatster/blip-react`

- **Actions**: `Button`, `ButtonGroup`, `ButtonLink`, `Link`, `ToggleButton`
- **Forms**: `CheckHelp`, `Checkbox`, `FieldCount`, `FieldError`, `FieldHelp`, `FieldLabel`, `FieldSet`, `FileDropItem`, `FileDropList`, `FileDropName`, `FileDropRemove`, `FileDropSize`, `FileDropZone`, `Input`, `InputAffix`, `InputButton`, `PlainField`, `Radio`, `RadioGroup`, `RatingDisplay`, `Search`, `Segment`, `SegmentRadio`, `SegmentedRadios`, `Select`, `SelectOption`, `Slider`, `SliderGroup`, `SliderTicks`, `SliderValue`, `Switch`, `Textarea`
- **Navigation**: `AppBar`, `AppBarActions`, `AppBarBrand`, `AppBarLink`, `AppBarLinks`, `AppBarNav`, `AppBarToggle`, `BottomBar`, `BottomBarBadge`, `BottomBarItem`, `BottomBarLabel`, `BottomBarList`, `Breadcrumbs`, `BreadcrumbsLink`, `BreadcrumbsList`, `CommandEmpty`, `CommandFooter`, `CommandGroup`, `CommandHeading`, `CommandHint`, `CommandInput`, `CommandItem`, `CommandLabel`, `CommandPanel`, `CommandResults`, `CommandSearch`, `CommandShortcut`, `CommandStatus`, `MenuGroup`, `MenuHeading`, `MenuItem`, `MenuLabel`, `MenuList`, `MenuSeparator`, `MenuShortcut`, `Pagination`, `PaginationGap`, `PaginationList`, `PaginationNext`, `PaginationPage`, `PaginationPrev`, `PaginationStatus`, `ProgressSteps`, `ProgressStepsHint`, `ProgressStepsItem`, `ProgressStepsLabel`, `ProgressStepsList`, `ProgressStepsMarker`, `Sidebar`, `SidebarBadge`, `SidebarGroup`, `SidebarHeading`, `SidebarItem`, `SidebarLabel`, `SidebarList`, `SkipLink`, `Tab`, `TabList`, `TabPanel`
- **Overlays**: `DialogBody`, `DialogClose`, `DialogFooter`, `DialogHeader`, `DialogIcon`, `DialogPanel`, `DialogTitle`, `DrawerSheet`, `Popover`, `PopoverClose`, `PopoverNub`, `PopoverTitle`, `TooltipChip`, `TooltipNub`
- **Feedback**: `Alert`, `AlertActions`, `AlertBody`, `AlertClose`, `AlertIcon`, `AlertTitle`, `Badge`, `BadgeAnchor`, `EmptyState`, `EmptyStateActions`, `EmptyStateArt`, `EmptyStateText`, `EmptyStateTitle`, `Loader`, `Meter`, `Progress`, `ProgressLabel`, `Skeleton`, `StaticToaster`, `Toast`, `ToastAction`, `ToastActions`, `ToastBody`, `ToastClose`, `ToastIcon`, `ToastTimer`, `ToastTitle`
- **Data**: `Accordion`, `AccordionChevron`, `AccordionItem`, `AccordionPanel`, `AccordionSummary`, `Avatar`, `AvatarGroup`, `AvatarStatus`, `Card`, `CardBody`, `CardContent`, `CardFooter`, `CardHeader`, `CardLink`, `CardMedia`, `CardSubtitle`, `CardTitle`, `DataTable`, `Divider`, `Keycap`, `Keys`, `List`, `ListContent`, `ListDescription`, `ListEnd`, `ListItem`, `ListTitle`, `Stat`, `StatDelta`, `StatLabel`, `StatValue`, `TableCaret`, `TableCheck`, `TableEmpty`, `TableFrame`, `TableLoading`, `TableScroll`, `TableSort`, `Tag`, `TagRemove`, `Tile`, `TileGlint`, `TileItem`, `TileLabel`, `TileList`
- **Phone**: `ActionSheetActions`, `ActionSheetCancel`, `ActionSheetMessage`, `ActionSheetPanel`, `ActionSheetTitle`, `FabAction`, `FabButton`, `FabMenu`, `PagerDot`, `PagerDots`, `PagerSlide`, `PagerTrack`, `RefreshScroller`, `SheetHandle`, `SheetPanel`, `SwipeRowActions`, `SwipeRowFace`, `SwipeRowMore`, `TopBar`, `TopBarActions`, `TopBarBack`, `TopBarLarge`, `TopBarTitle`
- **Layout**: `Cluster`, `Grid`, `Stack`
- **Window**: `Window`, `WindowBar`, `WindowBody`, `WindowControl`, `WindowControls`, `WindowStatus`, `WindowTitle`
- **Web Components (generated)**: `ActionSheet`, `Combobox`, `CommandPalette`, `Dialog`, `Drawer`, `Fab`, `Field`, `FileDrop`, `Menu`, `NumberStepper`, `Pager`, `Rating`, `Refresh`, `Segmented`, `Sheet`, `SwipeRow`, `Table`, `Tabs`, `TileGrid`, `Toaster`, `Tooltip`, `Wheel`

### Game kit: `@jaatster/blip-react/game`

- **CSS components**: `Achievement`, `AchievementIcon`, `AchievementLabel`, `AchievementReward`, `AchievementText`, `AchievementTitle`, `Achievements`, `Choice`, `ChoiceAside`, `ChoiceList`, `CounterIcon`, `DialogueBody`, `DialogueName`, `DialoguePortrait`, `DialogueText`, `Hud`, `HudBar`, `HudGroup`, `HudLabel`, `HudStat`, `LevelMap`, `LevelNumber`, `LevelPath`, `LevelStars`, `LevelTile`, `PauseHint`, `PauseMenu`, `PauseStats`, `PauseTitle`, `Prompt`, `PromptButton`, `PromptDpad`, `PromptKey`, `PromptShoulder`, `PromptStart`, `Slot`, `SlotCount`, `SlotTag`, `Stage`, `StageGround`, `StageScrim`
- **Web Components (generated)**: `Choices`, `Counter`, `Dialogue`, `Hearts`, `Inventory`, `Sprite`, `TouchPad`

### Website blocks: `@jaatster/blip-react/blocks`

- **Blocks**: `CtaActions`, `CtaBand`, `CtaGround`, `CtaNote`, `CtaText`, `CtaTitle`, `Feature`, `FeatureChip`, `FeatureChips`, `FeatureIcon`, `FeatureMedia`, `FeatureStat`, `FeatureText`, `FeatureTitle`, `Features`, `FeaturesGrid`, `FeaturesHead`, `FeaturesLead`, `FeaturesTitle`, `Footer`, `FooterBrand`, `FooterCol`, `FooterField`, `FooterHeading`, `FooterInner`, `FooterLegal`, `FooterNav`, `FooterRow`, `FooterSignup`, `Hero`, `HeroActions`, `HeroGround`, `HeroInner`, `HeroLead`, `HeroNote`, `HeroScenery`, `HeroTitle`, `Plan`, `PlanAmount`, `PlanCurrency`, `PlanFeature`, `PlanFeatures`, `PlanName`, `PlanPeriod`, `PlanPrice`, `PlanRibbon`, `PlanText`, `Pricing`

### Effects: `@jaatster/blip-react/effects`

- **Web Components (generated)**: `Attract`, `DropText`, `MotionToggle`, `Typewriter`, `World`

### Icons: `@jaatster/blip-react/icons`

- **Icons**: `Icon`

## Developing

```sh
pnpm cem                                  # at the root: refresh the Custom Elements Manifests after an element changes
pnpm --filter @jaatster/blip-react build      # generate the wrappers, then compile
pnpm --filter @jaatster/blip-react typecheck  # examples/usage.tsx, against React 19 and React 18 types
pnpm --filter @jaatster/blip-react test       # the wrapper runtime in jsdom, with React 19 and React 18
```

MIT
