/**
 * Window: Window, WindowBar, WindowTitle, WindowControls, WindowControl, WindowBody and WindowStatus. CSS from
 * @blip/components (window.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx, type NativeProps, type Radius, type Tone } from "../internal/props.js";

/** Own props of {@link Window}. */
export interface WindowOwnProps {
  /**
   * The title bar's colour: accent (default), or any tone or candy (success for done, warning for a heads-up,
   * danger for an error). `data-tone`.
   */
  tone?: Tone;
  /** A cream panel (default), or soft or candy: a whole-window tint, for a small game dialog. `data-variant`. */
  variant?: "soft" | "candy";
  /** Corner radius in pixels, 0 to 8 (4 by default). `data-blip-r`. */
  radius?: Radius;
}

export type WindowProps<T extends ElementType = "section"> = PolymorphicProps<T, WindowOwnProps>;

/**
 * A pixel window: a cream panel whose top band is the title bar. A region of the page, a `<section>` named by its
 * title (`aria-labelledby` the {@link WindowTitle}'s id). For a modal one, use the dialog component and put the
 * window inside it (`as` renders another element). Keep it for game menus and dashboards where the retro frame
 * helps; a card is calmer. Renders `<section class="blip-box blip-window">`.
 *
 *   <Window aria-labelledby="sys-title">
 *     <WindowBar>
 *       <WindowTitle id="sys-title">System</WindowTitle>
 *       <WindowControls>
 *         <WindowControl control="minimize" aria-label="Minimize System" onClick={minimize} />
 *         <WindowControl control="close" aria-label="Close System" onClick={close} />
 *       </WindowControls>
 *     </WindowBar>
 *     <WindowBody>…</WindowBody>
 *     <WindowStatus><span>Ready</span><span>12:30</span></WindowStatus>
 *   </Window>
 */
export const Window = /*#__PURE__*/ forwardRef(function Window(
  { as: Tag = "section", tone, variant, radius, className, ...rest }: WindowProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("blip-box blip-window", className)} {...box({ variant, tone, radius })} {...rest} />;
}) as PolymorphicComponent<"section", WindowOwnProps>;

/** Props for {@link WindowBar}. */
export type WindowBarProps = NativeProps<"header">;

/**
 * The title bar: the box's own light band, 16 pixels with an ink rule, holding the title and the controls. Renders
 * `<header class="blip-window-bar">`.
 *
 *   <WindowBar><WindowTitle id="pause-title">Paused</WindowTitle></WindowBar>
 */
export const WindowBar = /*#__PURE__*/ forwardRef<HTMLElement, WindowBarProps>(function WindowBar({ className, ...rest }, ref) {
  return <header ref={ref} className={cx("blip-window-bar", className)} {...rest} />;
});

export type WindowTitleProps<T extends ElementType = "h2"> = PolymorphicProps<T, object>;

/**
 * The window's title in Pixel Bop POP, upper case: one or two words ("System", "Paused"). A heading at the right
 * level for its place, with an `id` that names the window. Renders `<h2 class="blip-window-title blip-display blip-pop">`.
 *
 *   <WindowTitle as="h3" id="win-saved">Saved</WindowTitle>
 */
export const WindowTitle = /*#__PURE__*/ forwardRef(function WindowTitle(
  { as: Tag = "h2", className, ...rest }: WindowTitleProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("blip-window-title blip-display blip-pop", className)} {...rest} />;
}) as PolymorphicComponent<"h2", object>;

/** Props for {@link WindowControls}. */
export type WindowControlsProps = NativeProps<"div">;

/**
 * The row of controls at the end of the title bar. Renders `<div class="blip-window-controls">`.
 *
 *   <WindowControls><WindowControl control="close" aria-label="Close pause menu" onClick={resume} /></WindowControls>
 */
export const WindowControls = /*#__PURE__*/ forwardRef<HTMLDivElement, WindowControlsProps>(function WindowControls(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-window-controls", className)} {...rest} />;
});

/** Own props of {@link WindowControl}. */
export interface WindowControlOwnProps {
  /**
   * The glyph, and what the control does to its window: close (red unless given a tone), minimize, maximize.
   * `data-control`.
   */
  control: "close" | "minimize" | "maximize";
  /** A candy instead of cream (or of red, on close). `data-tone`. */
  tone?: Tone;
  /** None: the control draws its glyph. */
  children?: never;
}

/** A control is named for what it does to which window: "Close System", not "X". */
export type WindowControlProps = WindowControlOwnProps &
  ({ "aria-label": string } | { "aria-labelledby": string }) &
  NativeProps<"button", WindowControlOwnProps>;

/**
 * A 12-pixel candy button in the title bar (24 CSS px), its glyph drawn from `control`. It does what it says: wire
 * it up (hide, collapse the body, enlarge) or leave it out. Renders `<button class="blip-box blip-window-control"
 * type="button">` holding the glyph's empty `<span>`.
 *
 *   <WindowControl control="close" aria-label="Close System" onClick={close} />
 */
export const WindowControl = /*#__PURE__*/ forwardRef<HTMLButtonElement, WindowControlProps>(function WindowControl(
  { control, tone, type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("blip-box blip-window-control", className)}
      {...box({ tone })}
      data-control={control}
      type={type}
      {...rest}
    >
      <span />
    </button>
  );
});

/** Props for {@link WindowBody}. */
export type WindowBodyProps = NativeProps<"div">;

/**
 * The window's content, padded; it scrolls when the window has a height. Renders `<div class="blip-window-body">`.
 *
 *   <WindowBody><p>Your game was saved to slot 2.</p></WindowBody>
 */
export const WindowBody = /*#__PURE__*/ forwardRef<HTMLDivElement, WindowBodyProps>(function WindowBody({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-window-body", className)} {...rest} />;
});

/** Props for {@link WindowStatus}. */
export type WindowStatusProps = NativeProps<"footer">;

/**
 * The status bar: the box's shade band, sunken, one line of at most two pieces (start and end). If it updates (a
 * save, a clock), give it `role="status"` so the change is announced. Renders `<footer class="blip-window-status">`.
 *
 *   <WindowStatus><span>Battery</span><span>10%</span></WindowStatus>
 */
export const WindowStatus = /*#__PURE__*/ forwardRef<HTMLElement, WindowStatusProps>(function WindowStatus(
  { className, ...rest },
  ref,
) {
  return <footer ref={ref} className={cx("blip-window-status", className)} {...rest} />;
});
