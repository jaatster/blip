/**
 * <Search>. CSS from @jaatster/blip-components (search.css). The ref and every native prop go to the control itself, so
 * forms, labels and refs work as on the bare element; className and style go to the outermost element it renders.
 */
import { forwardRef } from "react";
import { cx, type NativeProps, type Size } from "../internal/props.js";

/** Own props of {@link Search}. */
export interface SearchOwnProps {
  /** 16, 20 (default) or 24 pixels high, as for the input. `data-size`. */
  size?: Size;
}

export type SearchProps = SearchOwnProps & Omit<NativeProps<"input", SearchOwnProps>, "type" | "children">;

/** The magnifier in front of a search field: the `search` icon of @jaatster/blip-icons (12 x 12). */
const magnifier = "M3 1h4v1h1v1h1v5h1v1h1v2H8v-1H7V9H3V8H2V7H1V3h1V2h1zm1 2v1H3v2h1v1h2V6h1V4H6V3z";

/**
 * A search field: an input of type search with a pixel magnifier in front and a pixel cross that clears it (the
 * browser's own, redrawn; Escape clears too). Put it in a `<search>` element, or a form with role="search", so it is
 * found as a landmark, and name it: a label (it may be `chu-sr-only`) or aria-label. The placeholder says what is
 * searched. Its enterKeyHint is "search" unless you say otherwise.
 *
 *   <search>
 *     <form action="/levels">
 *       <label className="chu-sr-only" htmlFor="q">Search levels</label>
 *       <Search id="q" name="q" placeholder="Search levels" />
 *     </form>
 *   </search>
 *
 * Renders `<span class="chu-box chu-input"><svg class="chu-icon"></svg><input type="search"></span>`. The ref and
 * every native prop go to the `<input>`; className and style go to the well.
 */
export const Search = /*#__PURE__*/ forwardRef<HTMLInputElement, SearchProps>(function Search(
  { size, enterKeyHint = "search", className, style, ...rest },
  ref,
) {
  return (
    <span className={cx("chu-box chu-input", className)} style={style} data-size={size}>
      <svg className="chu-icon" viewBox="0 0 12 12" aria-hidden>
        <path d={magnifier} />
      </svg>
      <input ref={ref} type="search" enterKeyHint={enterKeyHint} {...rest} />
    </span>
  );
});
