/**
 * Badge: Badge and BadgeAnchor. CSS from @jaatster/blip-components (badge.css).
 */
import { forwardRef } from "react";
import { box, cx, flag, type NativeProps, type Size, type Tone } from "../internal/props.js";

/** A name for something whose words don't name it: `aria-label` or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Own props of {@link Badge}. */
export interface BadgeOwnProps {
  /**
   * Accent (default), an intent, neutral or a candy: danger for unread counts, success for new and online.
   * `data-tone`.
   */
  tone?: Tone;
  /** Candy (default), or soft and outline for quieter labels in dense lists. `data-variant`. */
  variant?: "candy" | "soft" | "outline";
  /** 8, 10 (default) or 12 pixels high: small when pinned to small buttons. `data-size`. */
  size?: Size;
  /**
   * Pinned over that corner of its parent: a `.chu-box` (a button, an avatar) or a {@link BadgeAnchor}. A pinned
   * badge is a picture of what its parent's name says: hide it and put the real count in that name.
   * `data-position`.
   */
  position?: "top-end" | "top-start" | "bottom-end" | "bottom-start";
}

/**
 * A dot (`data-dot`) is a 6-pixel candy box with no text: hide it (`aria-hidden`, its meaning in its parent's name
 * or nearby words) or name it (`role="img"` with `aria-label` or `aria-labelledby`), so colour is never the only cue.
 */
export type BadgeDot =
  | { dot?: false }
  | ({ dot: true; children?: never } & ({ "aria-hidden": true | "true" } | ({ role: "img" } & Named)));

export type BadgeProps = BadgeOwnProps & BadgeDot & NativeProps<"span", BadgeOwnProps & { dot?: boolean }>;

/**
 * A small candy box with a count, a short word or nothing at all (a dot). "3" unread on a bell, "New" by a menu item, a
 * green dot on an online friend. In a line of text it is read as text; pinned to a corner it is hidden. Remove a count
 * at zero. Renders `<span class="chu-box chu-badge">`.
 *
 *   <Badge tone="success">New</Badge>
 *   <Button iconOnly aria-label="Messages, 99+ unread">
 *     <Icon name="mail" />
 *     <Badge tone="danger" size="sm" position="top-end" aria-hidden>99+</Badge>
 *   </Button>
 *   <Badge dot tone="success" role="img" aria-label="Online" />
 */
export const Badge = /*#__PURE__*/ forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone, variant, size, position, dot, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("chu-box chu-badge", className)}
      {...box({ variant, tone })}
      data-size={size}
      data-dot={flag(dot)}
      data-position={position}
      {...rest}
    />
  );
});

/** Props for {@link BadgeAnchor}. */
export type BadgeAnchorProps = NativeProps<"span">;

/**
 * A wrapper that lets a badge sit on something that is not positioned, such as an icon. Name the whole thing
 * (`role="img"` with `aria-label`, "Trophies, 2 new") and hide the badge. Renders `<span class="chu-badge-anchor">`.
 *
 *   <BadgeAnchor role="img" aria-label="Trophies, 2 new">
 *     <Icon name="trophy" />
 *     <Badge tone="success" size="sm" position="top-end" aria-hidden>2</Badge>
 *   </BadgeAnchor>
 */
export const BadgeAnchor = /*#__PURE__*/ forwardRef<HTMLSpanElement, BadgeAnchorProps>(function BadgeAnchor(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("chu-badge-anchor", className)} {...rest} />;
});
