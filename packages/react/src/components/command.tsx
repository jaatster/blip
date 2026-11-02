/**
 * Command palette: CommandPanel, CommandSearch, CommandInput, CommandResults, CommandGroup, CommandHeading,
 * CommandItem, CommandLabel, CommandHint, CommandShortcut, CommandEmpty, CommandStatus and CommandFooter, the parts
 * that go inside <CommandPalette>, and <CommandPalette> itself (generated from its element, re-exported here). CSS
 * from @jaatster/blip-components (command.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx } from "../internal/props.js";
import type { NativeProps, Radius } from "../internal/props.js";

export { CommandPalette, type CommandPaletteProps } from "../generated/elements.js";

/** A landmark, list or group needs a name: `aria-label`, or `aria-labelledby` pointing at its heading. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Own props of {@link CommandPanel}. */
export interface CommandPanelOwnProps {
  /** Corner radius in pixels, 5 by default. `data-blip-r`. */
  radius?: Radius;
}

/** Props for {@link CommandPanel}: a dialog's by default (`as="div"` only for a static picture). */
export type CommandPanelProps<T extends ElementType = "dialog"> = PolymorphicProps<T, CommandPanelOwnProps & Named>;

/**
 * The palette: a cream panel near the top of the screen over a dithered scrim, a native modal `<dialog>` inside
 * `<CommandPalette>`, which opens it with the shortcut, filters as you type and moves the yellow row. A click on the
 * scrim closes it (`closedby="any"`). Name it, and give it an id for a button that opens it.
 *
 *   <CommandPalette onAction={(e) => go(e.detail.value)}>
 *     <CommandPanel id="palette" aria-label="Command palette">
 *       <CommandSearch>
 *         <Icon name="search" /><CommandInput aria-label="Search pages and actions" placeholder="Search…" />
 *       </CommandSearch>
 *       <CommandResults aria-label="Results">
 *         <CommandGroup aria-labelledby="palette-pages">
 *           <CommandHeading id="palette-pages">Pages</CommandHeading>
 *           <CommandItem value="/levels" keywords="worlds maps">
 *             <Icon name="flag" /><CommandLabel>Levels</CommandLabel><CommandHint>Page</CommandHint>
 *           </CommandItem>
 *         </CommandGroup>
 *       </CommandResults>
 *       <CommandEmpty>Nothing matches. Try a page or an action.</CommandEmpty>
 *       <CommandStatus />
 *     </CommandPanel>
 *   </CommandPalette>
 *
 * Renders `<dialog class="blip-box blip-command blip-pop-in" closedby="any">`.
 */
export const CommandPanel = /*#__PURE__*/ forwardRef(function CommandPanel(
  // The name is required by CommandPanelProps; inside, the props are just passed on.
  { as: Tag = "dialog", radius, className, ...rest }: PolymorphicProps<ElementType, CommandPanelOwnProps>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("blip-box blip-command blip-pop-in", className)}
      data-blip-r={radius}
      closedby={Tag === "dialog" ? "any" : undefined}
      {...rest}
    />
  );
}) as PolymorphicComponent<"dialog", CommandPanelOwnProps & Named>;

/** Props for {@link CommandSearch}. */
export type CommandSearchProps = NativeProps<"div">;

/**
 * The search row: an icon and the {@link CommandInput}, over a one-pixel rule.
 *
 *   <CommandSearch><Icon name="search" /><CommandInput aria-label="Search pages and actions" /></CommandSearch>
 *
 * Renders `<div class="blip-command-search">`.
 */
export const CommandSearch = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandSearchProps>(function CommandSearch(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-command-search", className)} {...rest} />;
});

/** Props for {@link CommandInput}. */
export type CommandInputProps = Named & NativeProps<"input">;

/**
 * The search field. `<CommandPalette>` makes it a combobox over the results; the focus stays here while the arrow
 * keys move the yellow row, so it has no ring of its own. Name it (`aria-label`, not just a placeholder). The ref and
 * every native prop go to the input.
 *
 *   <CommandInput aria-label="Search pages and actions" placeholder="Search…" />
 *
 * Renders `<input class="blip-command-input" type="text">`.
 */
export const CommandInput = /*#__PURE__*/ forwardRef<HTMLInputElement, CommandInputProps>(function CommandInput(
  { type = "text", className, ...rest },
  ref,
) {
  return <input ref={ref} className={cx("blip-command-input", className)} type={type} {...rest} />;
});

/** Props for {@link CommandResults}. */
export type CommandResultsProps = Named & NativeProps<"div">;

/**
 * The results: a scrolling listbox of {@link CommandGroup}s (pages first, then actions). Name it.
 *
 *   <CommandResults aria-label="Results">…</CommandResults>
 *
 * Renders `<div class="blip-command-results" role="listbox">`.
 */
export const CommandResults = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandResultsProps>(function CommandResults(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-command-results", className)} role="listbox" {...rest} />;
});

/** Props for {@link CommandGroup}. */
export type CommandGroupProps = Named & NativeProps<"div">;

/**
 * Results under a {@link CommandHeading}, named by it. A group whose results are all filtered out goes too.
 *
 *   <CommandGroup aria-labelledby="palette-actions">
 *     <CommandHeading id="palette-actions">Actions</CommandHeading>…
 *   </CommandGroup>
 *
 * Renders `<div class="blip-command-group" role="group">`.
 */
export const CommandGroup = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandGroupProps>(function CommandGroup(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-command-group", className)} role="group" {...rest} />;
});

/** Props for {@link CommandHeading}. */
export type CommandHeadingProps = NativeProps<"div">;

/**
 * A group's heading. Give it an id and name the group by it.
 *
 *   <CommandHeading id="palette-pages">Pages</CommandHeading>
 *
 * Renders `<div class="blip-command-heading">`.
 */
export const CommandHeading = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandHeadingProps>(function CommandHeading(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-command-heading", className)} {...rest} />;
});

/** Own props of {@link CommandItem}. */
export interface CommandItemOwnProps {
  /** What `blip-action` reports as `detail.value` (the label otherwise): a path, an action's name. `data-value`. */
  value?: string;
  /** More words the filter matches, space-separated ("home dashboard" finds Overview). `data-keywords`. */
  keywords?: string;
  /** Corner radius in pixels, 3 by default. `data-blip-r`. */
  radius?: Radius;
}

/** Props for {@link CommandItem}. */
export type CommandItemProps = CommandItemOwnProps & NativeProps<"div", CommandItemOwnProps>;

/**
 * A result: just its text at rest, the yellow FOCUS row while active (`<CommandPalette>` sets `aria-selected` and
 * hides the ones the search filters out). An icon, a {@link CommandLabel}, an optional {@link CommandHint} and
 * {@link CommandShortcut}. `aria-disabled="true"` turns it off: say why in its hint.
 *
 *   <CommandItem value="new-level" keywords="create add">
 *     <Icon name="plus" /><CommandLabel>New level</CommandLabel>
 *   </CommandItem>
 *
 * Renders `<div class="blip-box blip-command-item" role="option">`.
 */
export const CommandItem = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandItemProps>(function CommandItem(
  { value, keywords, radius, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("blip-box blip-command-item", className)}
      role="option"
      data-value={value}
      data-keywords={keywords}
      data-blip-r={radius}
      {...rest}
    />
  );
});

/** Props for {@link CommandLabel}. */
export type CommandLabelProps = NativeProps<"span">;

/**
 * A result's name, as the visible navigation says it ("Players", "New level"); the filter and `blip-action` read it.
 *
 *   <CommandLabel>Levels</CommandLabel>
 *
 * Renders `<span class="blip-command-label">`.
 */
export const CommandLabel = /*#__PURE__*/ forwardRef<HTMLSpanElement, CommandLabelProps>(function CommandLabel(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-command-label", className)} {...rest} />;
});

/** Props for {@link CommandHint}. */
export type CommandHintProps = NativeProps<"span">;

/**
 * A quiet note after the label: one word ("Page", "Scheme"), or why a result is off ("Finish it first").
 *
 *   <CommandHint>Page</CommandHint>
 *
 * Renders `<span class="blip-command-hint">`.
 */
export const CommandHint = /*#__PURE__*/ forwardRef<HTMLSpanElement, CommandHintProps>(function CommandHint(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-command-hint", className)} {...rest} />;
});

/** Props for {@link CommandShortcut}. */
export type CommandShortcutProps = NativeProps<"span">;

/**
 * A result's keys, small keycaps at the end, hidden from screen readers.
 *
 *   <CommandShortcut>
 *     <kbd className="blip-box blip-keycap" data-size="sm">G</kbd><kbd className="blip-box blip-keycap" data-size="sm">L</kbd>
 *   </CommandShortcut>
 *
 * Renders `<span class="blip-command-shortcut" aria-hidden="true">`.
 */
export const CommandShortcut = /*#__PURE__*/ forwardRef<HTMLSpanElement, CommandShortcutProps>(function CommandShortcut(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-command-shortcut", className)} aria-hidden="true" {...rest} />;
});

/** Props for {@link CommandEmpty}. */
export type CommandEmptyProps = NativeProps<"p">;

/**
 * What shows when nothing matches: suggest what to try. Hidden until then (`<CommandPalette>` shows it); pass
 * `hidden={false}` for a static picture.
 *
 *   <CommandEmpty>Nothing matches. Try a page or an action.</CommandEmpty>
 *
 * Renders `<p class="blip-command-empty" hidden>`.
 */
export const CommandEmpty = /*#__PURE__*/ forwardRef<HTMLParagraphElement, CommandEmptyProps>(function CommandEmpty(
  { hidden = true, className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-command-empty", className)} hidden={hidden} {...rest} />;
});

/** Props for {@link CommandStatus}. */
export type CommandStatusProps = Omit<NativeProps<"p">, "children">;

/**
 * The live line that announces how many results there are as you type ("3 results"). Empty: `<CommandPalette>`
 * writes it.
 *
 *   <CommandStatus />
 *
 * Renders `<p class="blip-sr-only" role="status">`.
 */
export const CommandStatus = /*#__PURE__*/ forwardRef<HTMLParagraphElement, CommandStatusProps>(function CommandStatus(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-sr-only", className)} role="status" {...rest} />;
});

/** Props for {@link CommandFooter}. */
export type CommandFooterProps = NativeProps<"div">;

/**
 * Optional keycap hints for the keys along the bottom, each a `<span>` of keycaps and a word. For the eye only:
 * hidden from screen readers, which hear the combobox.
 *
 *   <CommandFooter><span><kbd className="blip-box blip-keycap" data-size="sm">Enter</kbd> Open</span></CommandFooter>
 *
 * Renders `<div class="blip-command-footer" aria-hidden="true">`.
 */
export const CommandFooter = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandFooterProps>(function CommandFooter(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-command-footer", className)} aria-hidden="true" {...rest} />;
});
