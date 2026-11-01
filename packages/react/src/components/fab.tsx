/**
 * Action button: FabButton, and FabMenu and FabAction, the parts of a speed dial that go inside <Fab> (generated from
 * its element, re-exported here). CSS from @blip/components (fab.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, flag, type IconOnly, type NativeProps, type Tone } from "../internal/props.js";

export { Fab, type FabProps } from "../generated/elements.js";

/** A landmark, list or group needs a name: `aria-label`, or `aria-labelledby` pointing at its heading. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Own props of {@link FabButton}. */
export interface FabButtonOwnProps {
  /** Its candy: the accent by default. `data-tone`. */
  tone?: Tone;
  /**
   * Where it floats: the bottom end of the screen (`fixed`, the default), of the nearest positioned box
   * (`absolute`), or in the flow (`static`). Inside `<Fab>`, set it on the `Fab`. `data-position`.
   */
  position?: "fixed" | "absolute" | "static";
}

/** Props for {@link FabButton}: a button's by default, a link's with `as="a"`, or your router's link's. */
export type FabButtonProps<T extends ElementType = "button"> = PolymorphicProps<T, FabButtonOwnProps & IconOnly & { iconOnly?: boolean }>;

/**
 * A screen's one main action, a candy block floating at the bottom end of the screen, inside the safe areas and clear
 * of a `BottomBar` it comes after (`--blip-fab-offset` clears anything else). An icon and a label, or the icon alone
 * with `iconOnly` and an `aria-label`. Inside `<Fab>` it is the speed dial's button.
 *
 *   <FabButton iconOnly aria-label="New level"><Icon name="plus" /></FabButton>
 *   <FabButton><Icon name="edit" />New note</FabButton>
 *
 * Renders `<button class="blip-box blip-fab" type="button">`.
 */
export const FabButton = /*#__PURE__*/ forwardRef(function FabButton(
  { as: Tag = "button", tone, position, iconOnly, className, ...rest }: FabButtonProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("blip-box blip-fab", className)}
      type={Tag === "button" ? "button" : undefined}
      data-tone={tone}
      data-position={position}
      data-icon-only={flag(iconOnly)}
      {...rest}
    />
  );
}) as PolymorphicComponent<"button", FabButtonOwnProps & IconOnly & { iconOnly?: boolean }>;

/** Props for {@link FabMenu}. */
export type FabMenuProps = Named & NativeProps<"div">;

/**
 * A speed dial's stack, after the `FabButton` inside `<Fab>`: two or three {@link FabAction}s, the first nearest the
 * button. Hidden until it opens; `<Fab>` shows and hides it. Name it.
 *
 *   <Fab>
 *     <FabButton iconOnly aria-label="Add"><Icon name="plus" /></FabButton>
 *     <FabMenu aria-label="Add">
 *       <FabAction value="screenshot"><Icon name="camera" />Screenshot</FabAction>
 *       <FabAction value="clip"><Icon name="image" />Clip</FabAction>
 *     </FabMenu>
 *   </Fab>
 *
 * Renders `<div class="blip-fab-menu" role="menu" hidden>`.
 */
export const FabMenu = /*#__PURE__*/ forwardRef<HTMLDivElement, FabMenuProps>(function FabMenu({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-fab-menu", className)} role="menu" hidden {...rest} />;
});

/** Own props of {@link FabAction}. */
export interface FabActionOwnProps {
  /** Its candy: marshmallow by default; `danger` for a destructive choice. `data-tone`. */
  tone?: Tone;
  /** What `blip-action` reports as `detail.value` (the label otherwise). `data-value`. */
  value?: string;
}

/** Props for {@link FabAction}. */
export type FabActionProps = FabActionOwnProps & NativeProps<"button", FabActionOwnProps>;

/**
 * One choice of a speed dial: a labelled mini button, an icon and one or two words.
 *
 *   <FabAction value="clip"><Icon name="image" />Clip</FabAction>
 *
 * Renders `<button class="blip-box blip-fab-action" type="button" role="menuitem">`.
 */
export const FabAction = /*#__PURE__*/ forwardRef<HTMLButtonElement, FabActionProps>(function FabAction(
  { tone, value, type = "button", className, ...rest },
  ref,
) {
  return <button ref={ref} className={cx("blip-box blip-fab-action", className)} type={type} role="menuitem" data-tone={tone} data-value={value} {...rest} />;
});
