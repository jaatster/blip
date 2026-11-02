/**
 * Button: Button and ButtonLink. CSS from @jaatster/blip-components (button.css).
 */
import { forwardRef } from "react";
import type { ElementType, ReactNode } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx, flag, type BoxProps, type NativeProps, type Size, type IconOnly } from "../internal/props.js";

/** What every button takes besides its tier, tone and radius. */
export interface ButtonOptions extends BoxProps {
  /** 16, 20 (default) or 24 pixels high. `data-size`. */
  size?: Size;
  /** Fills its container (mobile, dialogs). `data-width="full"`. */
  fullWidth?: boolean;
  /** Loading: three stepped dots replace the label, which keeps its width. `aria-busy="true"`. */
  busy?: boolean;
}

const buttonAttrs = ({ variant, tone, radius, size, fullWidth, busy, iconOnly }: ButtonOptions & { iconOnly?: boolean }) => ({
  ...box({ variant, tone, radius }),
  "data-size": size,
  "data-width": fullWidth ? "full" : undefined,
  "data-icon-only": flag(iconOnly),
  "aria-busy": busy ? true : undefined,
});

/** What an invoker button does to the dialog or popover it names: a built-in command, or a custom `--command`. */
export type ButtonCommand = "show-modal" | "close" | "request-close" | "show-popover" | "hide-popover" | "toggle-popover" | `--${string}`;

/** A button's own props beyond its look. */
export interface ButtonBehaviour {
  /** A toggle that is on sits in, its bands swapped. Leave it out on a plain button. `aria-pressed`. */
  pressed?: boolean;
  /** The id of the dialog or popover this button controls, as an invoker command. Written as `commandfor`. */
  commandFor?: string;
  /** What it does to it: `show-modal` opens a dialog, `close` or `request-close` closes it. `command`. */
  command?: ButtonCommand;
}

/** Props for {@link Button}. */
export type ButtonProps = ButtonOptions &
  IconOnly &
  ButtonBehaviour & { children?: ReactNode } & NativeProps<"button", ButtonOptions & ButtonBehaviour & { iconOnly?: boolean }>;

/**
 * A candy box you press. Buttons start actions; for going somewhere use {@link Link} (or {@link ButtonLink}).
 *
 *   <Button>Save game</Button>
 *   <Button variant="soft" tone="danger" size="sm">Delete save</Button>
 *   <Button iconOnly aria-label="Add level"><Icon name="plus" /></Button>
 *   <Button type="button" commandFor="save" command="show-modal">Save game</Button>    opens <DialogPanel id="save">
 *
 * Renders `<button class="blip-box blip-button">`. Like a native button it submits a form it sits in: give buttons
 * outside forms (or beside the submit button) `type="button"`.
 */
export const Button = /*#__PURE__*/ forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, tone, radius, size, fullWidth, busy, iconOnly, pressed, commandFor, command, className, ...rest },
  ref,
) {
  // Invoker attributes, lowercase as HTML has them (React's types do not know them yet; React passes them on).
  const invoker = { ...(commandFor !== undefined && { commandfor: commandFor }), ...(command !== undefined && { command }) };
  return (
    <button
      ref={ref}
      className={cx("blip-box blip-button", className)}
      {...buttonAttrs({ variant, tone, radius, size, fullWidth, busy, iconOnly })}
      aria-pressed={pressed}
      {...invoker}
      {...rest}
    />
  );
});

/** Props for {@link ButtonLink}: a link's by default, or your router's link's with `as`. */
export type ButtonLinkProps<T extends ElementType = "a"> = PolymorphicProps<T, ButtonOptions & IconOnly>;

/**
 * A link that must look like a button (a call to action that goes somewhere). Renders `<a class="blip-box
 * blip-button">`; with `as`, your router's link (it gets the same classes and attributes).
 *
 *   <ButtonLink href="/play" size="lg">Play now</ButtonLink>
 *   <ButtonLink as={NextLink} href="/play" size="lg">Play now</ButtonLink>
 */
export const ButtonLink = /*#__PURE__*/ forwardRef(function ButtonLink(
  { as: Tag = "a", variant, tone, radius, size, fullWidth, busy, iconOnly, className, ...rest }: ButtonLinkProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("blip-box blip-button", className)} {...buttonAttrs({ variant, tone, radius, size, fullWidth, busy, iconOnly })} {...rest} />;
}) as PolymorphicComponent<"a", ButtonOptions & IconOnly>;
