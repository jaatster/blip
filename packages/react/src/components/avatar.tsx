/**
 * Avatar: Avatar, AvatarStatus and AvatarGroup. CSS from @blip/components (avatar.css).
 */
import { forwardRef } from "react";
import { box, cx, type NativeProps, type Radius, type Tone } from "../internal/props.js";

/** A name for something whose words don't name it: `aria-label` or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Own props of {@link Avatar}. */
export interface AvatarOwnProps {
  /** 10, 12, 20 (default), 28 or 36 pixels square; the picture inside is 8, 8, 16, 24 or 32. `data-size`. */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** The matte round a picture, or the candy behind initials. Keep each person's colour the same. `data-tone`. */
  tone?: Tone;
  /** Corner radius in pixels, 0 to 5 (which keeps the picture clear of the corners); by size 1 to 5. `data-blip-r`. */
  radius?: Extract<Radius, 0 | 1 | 2 | 3 | 4 | 5>;
}

export type AvatarProps = AvatarOwnProps & NativeProps<"span", AvatarOwnProps>;

/**
 * A person or player as a picture or initials in a candy box. A picture is an `<img>`, `<svg>` or `<canvas>` (drawn at
 * 8 x 8 or 16 x 16, so it scales by whole numbers) with `alt` naming them; initials are one or two letters (one on xs
 * and sm) with `role="img"` and `aria-label` the full name. Renders `<span class="blip-box blip-avatar">`.
 *
 *   <Avatar tone="pink"><img src="pip.png" alt="Pip Bloom" /></Avatar>
 *   <Avatar tone="teal" role="img" aria-label="Kit Moss">KM</Avatar>
 */
export const Avatar = /*#__PURE__*/ forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { size, tone, radius, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("blip-box blip-avatar", className)}
      {...box({ tone, radius })}
      data-size={size}
      {...rest}
    />
  );
});

/** Own props of {@link AvatarStatus}. */
export interface AvatarStatusOwnProps {
  /** Success online, warning busy, danger do not disturb. `data-tone`. */
  tone?: "success" | "warning" | "danger";
  /** Outline: away or offline. `data-variant`. */
  variant?: "outline";
  /** None: the dot is named by `aria-label` or `aria-labelledby`. */
  children?: never;
}

export type AvatarStatusProps = AvatarStatusOwnProps & Named & NativeProps<"span", AvatarStatusOwnProps>;

/**
 * The status dot on an avatar's corner: a small candy box with a name ("Online"), so colour is never the only cue.
 * Renders `<span class="blip-box blip-avatar-status" role="img">`.
 *
 *   <Avatar size="lg" tone="pink">
 *     <img src="pip.png" alt="Pip Bloom" />
 *     <AvatarStatus tone="success" aria-label="Online" />
 *   </Avatar>
 */
export const AvatarStatus = /*#__PURE__*/ forwardRef<HTMLSpanElement, AvatarStatusProps>(function AvatarStatus(
  { tone, variant, role = "img", className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("blip-box blip-avatar-status", className)}
      {...box({ variant, tone })}
      role={role}
      {...rest}
    />
  );
});

/** Props for {@link AvatarGroup}. */
export type AvatarGroupProps = Named & NativeProps<"div">;

/**
 * Avatars that overlap by four pixels (three for small ones), ending with a `+3` avatar in neutral. A group named
 * with a label that counts everyone ("Party: Pip, Juno and 3 more"). Renders `<div class="blip-avatar-group"
 * role="group">`.
 *
 *   <AvatarGroup aria-label="Party: Pip, Juno and 3 more">
 *     <Avatar tone="pink"><img src="pip.png" alt="Pip Bloom" /></Avatar>
 *     <Avatar tone="neutral" role="img" aria-label="3 more">+3</Avatar>
 *   </AvatarGroup>
 */
export const AvatarGroup = /*#__PURE__*/ forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { role = "group", className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-avatar-group", className)} role={role} {...rest} />;
});
