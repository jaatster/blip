/**
 * Pull to refresh: RefreshScroller, the part that goes inside <Refresh>, and <Refresh> itself (generated from its
 * element, re-exported here). CSS from @jaatster/blip-components (refresh.css).
 */
import { forwardRef } from "react";
import { cx, type NativeProps } from "../internal/props.js";

export { Refresh, type RefreshProps } from "../generated/elements.js";

/** Props for {@link RefreshScroller}. */
export type RefreshScrollerProps = NativeProps<"div">;

/**
 * The scroll container inside `Refresh`: give it a height (or let a layout give one), a name and `tabIndex={0}` when
 * nothing inside can take focus. The browser's own pull stays out of it. `Refresh` adds the arrow, the loader and a
 * live region; pair it with a Refresh button that calls the element's `refresh()`. Renders `<div
 * class="blip-refresh-scroller">`.
 *
 *   const ref = useRef<BlipRefresh>(null);
 *   <Refresh ref={ref} onRefresh={(e) => e.detail.waitUntil(reload())}>
 *     <RefreshScroller tabIndex={0} aria-label="Feed">…</RefreshScroller>
 *   </Refresh>
 *   <Button variant="soft" onClick={() => ref.current?.refresh()}>Refresh</Button>
 */
export const RefreshScroller = /*#__PURE__*/ forwardRef<HTMLDivElement, RefreshScrollerProps>(function RefreshScroller({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-refresh-scroller", className)} {...rest} />;
});
