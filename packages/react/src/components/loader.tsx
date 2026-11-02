/**
 * <Loader>. CSS from @jaatster/blip-components (loader.css).
 */
import { forwardRef } from "react";
import type { ReactNode } from "react";
import { cx, type Intent, type NativeProps, type Size } from "../internal/props.js";

/** Own props of {@link Loader}. */
export interface LoaderOwnProps {
  /** A ring of eight dots (default), or three dots that step in, for inline text and tight spaces. `data-variant`. */
  variant?: "ring" | "dots";
  /** An 8-, 12- (default) or 24-pixel ring; dots of 2, 3 or 4 pixels. `data-size`. */
  size?: Size;
  /** The lit dots: accent (default) or an intent. `data-tone`. */
  tone?: "accent" | Intent;
  /**
   * What is loading, in words, always: "Loading World 2…". Wrap them in `<span className="blip-sr-only">` to show the
   * spinner alone.
   */
  children: ReactNode;
}

export type LoaderProps = LoaderOwnProps & NativeProps<"span", LoaderOwnProps>;

/**
 * A pixel spinner for a wait of unknown length; its words are its label. It is a polite live region
 * (`role="status"`), heard only once it is in the page: put it there before it has to speak, say when it is done
 * ("World 2 loaded"), then remove it. Show it only after a short wait; for a button that is working, use the
 * button's `busy`. Renders `<span class="blip-loader" role="status">`.
 *
 *   <Loader>Loading World 2…</Loader>
 *   <Loader size="lg"><span className="blip-sr-only">Loading</span></Loader>
 *   <Loader variant="dots" tone="warning">Reconnecting</Loader>
 */
export const Loader = /*#__PURE__*/ forwardRef<HTMLSpanElement, LoaderProps>(function Loader(
  { variant, size, tone, role = "status", className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("blip-loader", className)}
      data-variant={variant}
      data-size={size}
      data-tone={tone}
      role={role}
      {...rest}
    />
  );
});
