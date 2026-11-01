/**
 * Tabs: TabList, Tab and TabPanel, the parts that go inside <Tabs>, and <Tabs> itself (generated from its element,
 * re-exported here). CSS from @blip/components (tabs.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx } from "../internal/props.js";
import type { NativeProps, Radius, Tone, Variant } from "../internal/props.js";

export { Tabs, type TabsProps } from "../generated/elements.js";

/** A landmark, list or group needs a name: `aria-label`, or `aria-labelledby` pointing at its heading. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Props for {@link TabList}. */
export type TabListProps = Named & NativeProps<"div">;

/**
 * The row of tabs, first inside `<Tabs>`, which wires the ids, keeps one tab in the tab order, moves with the arrow
 * keys and shows the selected panel. Name it. `aria-orientation="vertical"` puts the tabs down the side. Tabs and
 * panels rendered later (after data arrives) are wired as they come.
 *
 *   <Tabs variant="outline" value={tab} onChange={(e) => setTab(e.detail.value)}>
 *     <TabList aria-label="Settings">
 *       <Tab variant="outline" value="general" selected>General</Tab>
 *       <Tab variant="outline" value="sound">Sound</Tab>
 *     </TabList>
 *     <TabPanel>…</TabPanel>
 *     <TabPanel hidden>…</TabPanel>
 *   </Tabs>
 *
 * Renders `<div class="blip-tabs-list" role="tablist">`.
 */
export const TabList = /*#__PURE__*/ forwardRef<HTMLDivElement, TabListProps>(function TabList({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-tabs-list", className)} role="tablist" {...rest} />;
});

/** Own props of {@link Tab}. */
export interface TabOwnProps {
  /**
   * The tier matching the Tabs' variant: none (candy), soft, outline, or ghost for underline tabs; `<Tabs>` fills it
   * in when it is missing. `data-variant`.
   */
  variant?: Variant;
  /** A tab that keeps its own colour (inventory categories); it still sits in when selected. `data-tone`. */
  tone?: Tone;
  /** Corner radius in pixels: 4 (sm 3, underline 2) by default. `data-blip-r`. */
  radius?: Radius;
  /**
   * The tab whose panel shows: it sits in. Always written (`"false"` with `tabindex="-1"` on the others, so one tab
   * is in the tab order); `<Tabs>` keeps both in step as the person moves. `aria-selected`.
   */
  selected?: boolean;
  /** What `<Tabs>` reports as `detail.value` and selects by its `value` (the label otherwise). `data-value`. */
  value?: string;
}

/** Props for {@link Tab}. */
export type TabProps = TabOwnProps & NativeProps<"button", TabOwnProps>;

/**
 * A tab: a candy box with an upper-case label (an icon before it or a muted count after it are fine). Its size
 * comes from the Tabs' `size`. `aria-disabled="true"` turns it off; the arrow keys skip it.
 *
 *   <Tab variant="outline" selected>General</Tab>
 *   <Tab variant="ghost">Reports <span className="blip-muted">12</span></Tab>
 *
 * Renders `<button class="blip-box blip-tab" type="button" role="tab" aria-selected>`.
 */
export const Tab = /*#__PURE__*/ forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { variant, tone, radius, selected = false, value, type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("blip-box blip-tab", className)}
      type={type}
      {...box({ variant, tone, radius })}
      data-value={value}
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? undefined : -1}
      {...rest}
    />
  );
});

/** Own props of {@link TabPanel}. */
export interface TabPanelOwnProps {
  /** A framed panel: adds `blip-box` and `data-variant="panel"`. */
  framed?: boolean;
}

/** Props for {@link TabPanel}: a div's by default, or another element's with `as`. */
export type TabPanelProps<T extends ElementType = "div"> = PolymorphicProps<T, TabPanelOwnProps>;

/**
 * A tab's panel, in the same order as the tabs (or paired by `aria-controls`). Hide all but the selected one with
 * `hidden`; `<Tabs>` shows the selected one and makes each focusable.
 *
 *   <TabPanel as="section" framed hidden>…</TabPanel>
 *
 * Renders `<div class="blip-tabs-panel" role="tabpanel">` (`class="blip-box blip-tabs-panel" data-variant="panel"` framed).
 */
export const TabPanel = /*#__PURE__*/ forwardRef(function TabPanel(
  { as: Tag = "div", framed, className, ...rest }: TabPanelProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx(framed && "blip-box", "blip-tabs-panel", className)}
      data-variant={framed ? "panel" : undefined}
      role="tabpanel"
      {...rest}
    />
  );
}) as PolymorphicComponent<"div", TabPanelOwnProps>;
