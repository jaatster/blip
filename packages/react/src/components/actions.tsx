/**
 * Actions: Button, ButtonLink, ToggleButton, ButtonGroup, Link. CSS from @jaatster/blip-components (button.css,
 * button-group.css, link.css).
 */
import { forwardRef } from "react";
import type { ReactNode } from "react";
import { box, cx, flag, type BoxProps, type NativeProps, type Size } from "../internal/props.js";

/** What every button takes besides its tier, tone and radius. */
export interface ButtonOptions extends BoxProps {
  /** 16, 20 (default) or 24 pixels high. `data-size`. */
  size?: Size;
  /** Fills its container (mobile, dialogs). `data-width="full"`. */
  fullWidth?: boolean;
  /** Loading: three stepped dots replace the label, which keeps its width. `aria-busy="true"`. */
  busy?: boolean;
}

/**
 * An icon-only button is square and needs a name: `aria-label` (the action, "Add level", not the icon) or
 * `aria-labelledby`.
 */
export type IconOnly =
  | { iconOnly?: false }
  | ({ iconOnly: true } & ({ "aria-label": string } | { "aria-labelledby": string }));

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
 * Renders `<button class="pp-box pp-button">`. Like a native button it submits a form it sits in: give buttons
 * outside forms (or beside the submit button) `type="button"`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, tone, radius, size, fullWidth, busy, iconOnly, pressed, commandFor, command, className, ...rest },
  ref,
) {
  // Invoker attributes, lowercase as HTML has them (React's types do not know them yet; React passes them on).
  const invoker = { ...(commandFor !== undefined && { commandfor: commandFor }), ...(command !== undefined && { command }) };
  return (
    <button
      ref={ref}
      className={cx("pp-box pp-button", className)}
      {...buttonAttrs({ variant, tone, radius, size, fullWidth, busy, iconOnly })}
      aria-pressed={pressed}
      {...invoker}
      {...rest}
    />
  );
});

/** Props for {@link ButtonLink}. */
export type ButtonLinkProps = ButtonOptions & IconOnly & { href: string; children?: ReactNode } & NativeProps<"a", ButtonOptions & { iconOnly?: boolean }>;

/**
 * A link that must look like a button (a call to action that goes somewhere). Renders `<a class="pp-box
 * pp-button">`.
 *
 *   <ButtonLink href="/play" size="lg">Play now</ButtonLink>
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant, tone, radius, size, fullWidth, busy, iconOnly, className, ...rest },
  ref,
) {
  return <a ref={ref} className={cx("pp-box pp-button", className)} {...buttonAttrs({ variant, tone, radius, size, fullWidth, busy, iconOnly })} {...rest} />;
});

/** Props for {@link ToggleButton}. */
export type ToggleButtonProps = Omit<ButtonProps, "pressed"> & {
  /** On or off. Always written (`aria-pressed="false"` when off), so it is announced as a toggle. */
  pressed: boolean;
};

/**
 * A button that stays on or off: "show grid", "favourite". On, it sits in with its bands swapped. Keep its label
 * the same in both states; the pressed state says which. Renders `<button class="pp-box pp-button"
 * type="button" aria-pressed>`.
 *
 *   <ToggleButton pressed={grid} onClick={() => setGrid(!grid)}>Show grid</ToggleButton>
 */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton({ type = "button", ...props }, ref) {
  return <Button ref={ref} type={type} {...(props as ButtonProps)} />;
});

/** Props for {@link ButtonGroup}. */
export interface ButtonGroupOwnProps {
  /** One bar: shared outlines, a radius of 3 at the two ends only. Give every button the same size. `data-attached`. */
  attached?: boolean;
  /** Fills its container; the buttons share the width. `data-width="full"`. */
  fullWidth?: boolean;
}
export type ButtonGroupProps = ButtonGroupOwnProps & NativeProps<"div", ButtonGroupOwnProps>;

/**
 * Buttons that belong together: spaced (a row of actions) or attached (one bar). Name the group with aria-label.
 * Renders `<div class="pp-button-group" role="group">`; pass `role="toolbar"` for a toolbar (then make one button
 * tabbable and move with the arrow keys). A `<span role="separator" />` inside draws a divider.
 *
 *   <ButtonGroup attached aria-label="Text style">
 *     <ToggleButton variant="outline" pressed={bold}>Bold</ToggleButton>
 *     <ToggleButton variant="outline" pressed={italic}>Italic</ToggleButton>
 *   </ButtonGroup>
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup({ attached, fullWidth, className, role = "group", ...rest }, ref) {
  return <div ref={ref} className={cx("pp-button-group", className)} role={role} data-attached={flag(attached)} data-width={fullWidth ? "full" : undefined} {...rest} />;
});

/** Props for {@link Link}. */
export interface LinkOwnProps {
  /** A link on its own line (under a card, at the end of a list): bold, underlined on hover. `data-variant="standalone"`. */
  standalone?: boolean;
  /**
   * Opens somewhere else: adds the pixel arrow, and its words are read out with the link ("opens in a new tab").
   * `true` reads "opens in a new tab". `data-external`.
   */
  external?: string | true;
}
export type LinkProps = LinkOwnProps & NativeProps<"a", LinkOwnProps>;

/**
 * Words that go somewhere: underlined, in the accent's text colour; focus paints it yellow with ink letters.
 * Renders `<a class="pp-link">`. For a router's own link component, give it `className="pp-link"` (and the same
 * data attributes): the class is all the styling.
 *
 *   <Link href="/rules">house rules</Link>
 *   <Link standalone href="/levels">All levels</Link>
 *   <Link href="https://example.com/wiki" target="_blank" rel="noopener" external>Wiki</Link>
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ standalone, external, className, ...rest }, ref) {
  return (
    <a
      ref={ref}
      className={cx("pp-link", className)}
      data-variant={standalone ? "standalone" : undefined}
      data-external={external === true ? "opens in a new tab" : external}
      {...rest}
    />
  );
});
