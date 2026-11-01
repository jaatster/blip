/**
 * @jaatster/blip-react/icons: <Icon name>, typed by IconName.
 *
 *   import { Icon } from "@jaatster/blip-react/icons";
 *   <Icon name="heart" />                      decorative: aria-hidden
 *   <Icon name="heart" label="Liked" />        an image named "Liked"
 *   <Icon name="gamepad" size="lg" />          24 pixels square instead of 12
 *
 * It renders the same <svg class="pp-icon"> as iconSvg() and <pp-icon>, straight from the path data in
 * @jaatster/blip-icons: no element, nothing to load, and it renders on the server. The .pp-icon class (size, crisp
 * edges) is in @jaatster/blip-core; the width and height attributes keep it 12 pixels without it.
 */
import { forwardRef } from "react";
import type { SVGProps } from "react";
import { icons, type IconName } from "@jaatster/blip-icons";
import { cx } from "./internal/props.js";

export type { IconName } from "@jaatster/blip-icons";
export { icons } from "@jaatster/blip-icons";

/** Every icon name, in the order of the set. */
export const iconNames = /*#__PURE__*/ Object.keys(icons) as IconName[];

/** Own props of {@link Icon}. */
export interface IconOwnProps {
  /** The icon. */
  name: IconName;
  /** "lg" draws it 24 pixels square; the default is 12. `data-size`. */
  size?: "md" | "lg";
  /**
   * Names the icon for assistive technology (role="img" and aria-label). Leave it out when the icon only
   * decorates words that say the same: then it is aria-hidden.
   */
  label?: string;
}
export type IconProps = IconOwnProps & Omit<SVGProps<SVGSVGElement>, keyof IconOwnProps | "ref" | "viewBox" | "children">;

/** One 12 x 12 pixel icon in the current text colour. */
export const Icon = /*#__PURE__*/ forwardRef<SVGSVGElement, IconProps>(function Icon({ name, size, label, className, ...rest }, ref) {
  const px = size === "lg" ? 48 : 24;
  const named = label?.trim();
  return (
    <svg
      ref={ref}
      className={cx("pp-icon", className)}
      data-size={size === "lg" ? "lg" : undefined}
      viewBox="0 0 12 12"
      width={px}
      height={px}
      fill="currentColor"
      shapeRendering="crispEdges"
      {...(named ? { role: "img", "aria-label": named } : { "aria-hidden": true })}
      {...rest}
    >
      <path d={Object.hasOwn(icons, name) ? icons[name] : ""} />
    </svg>
  );
});
