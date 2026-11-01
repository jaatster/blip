/**
 * Feedback: Alert, Progress, Meter, Loader, Skeleton, EmptyState, Badge, and Toast drawn by hand for docs and
 * screenshots (live toasts come from toast() and <Toaster>). CSS from @jaatster/blip-components (alert.css,
 * progress.css, loader.css, skeleton.css, empty-state.css, badge.css, toast.css).
 */
import { forwardRef } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx, flag, type Intent, type NativeProps, type Radius, type Size, type Tone } from "../internal/props.js";

/** A name for something whose words don't name it: `aria-label` or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Whole pixels, as a length. */
const px = (n: number): string => `calc(${n} * var(--chu-pixel))`;

/** The user's style over one public custom property, when it has a value. */
function withProperty(style: CSSProperties | undefined, name: string, value?: string): CSSProperties | undefined {
  return value === undefined ? style : ({ [name]: value, ...style } as CSSProperties);
}

/* ------------------------------------------------------------------------------------------------- alert */

/** Own props of {@link Alert}. */
export interface AlertOwnProps {
  /** What kind of news: info (default), success, warning, danger or neutral. The sign follows. `data-tone`. */
  tone?: Intent | "neutral";
  /**
   * Soft (default) for most; candy for the one thing on the page that must not be missed (a form that failed);
   * outline in dense screens, where the colour stays in the sign. `data-variant`.
   */
  variant?: "soft" | "candy" | "outline";
  /** Corner radius in pixels, 0 to 8 (3 by default). `data-chu-r`. */
  radius?: Radius;
}
export type AlertProps = AlertOwnProps & NativeProps<"div", AlertOwnProps>;

/**
 * An inline banner about the page or the task in front of it. A pixel sign, a title, a few words, the action that
 * helps, and a dismiss button when it can go away; put it next to what it is about. A static alert needs no role; one
 * you insert in answer to something needs `role="alert"` (urgent: it interrupts) or `role="status"` (good or neutral
 * news). Renders `<div class="chu-box chu-alert">`.
 *
 *   <Alert tone="danger">
 *     <AlertIcon />
 *     <AlertBody>
 *       <AlertTitle><span className="chu-sr-only">Error: </span>Can't reach the save server</AlertTitle>
 *       <p>Your progress is safe on this device. We'll try again in 30 seconds.</p>
 *       <AlertActions><Button type="button" size="sm" variant="outline">Retry now</Button></AlertActions>
 *     </AlertBody>
 *     <AlertClose onClick={dismiss} />
 *   </Alert>
 */
export const Alert = /*#__PURE__*/ forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone, variant, radius, className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-box chu-alert", className)} {...box({ variant, tone, radius })} {...rest} />;
});

/** Props for {@link AlertIcon}. */
export type AlertIconProps = NativeProps<"span">;

/**
 * The alert's sign, 12 x 12 pixels. Empty, it draws the tone's glyph (a disc with an i or a check, a triangle or an
 * octagon with "!"), so the kind of news is in the shape as well as the colour; or put an `<svg class="chu-icon">`
 * inside. Decorative. Renders `<span class="chu-alert-icon" aria-hidden="true">`.
 *
 *   <AlertIcon />
 */
export const AlertIcon = /*#__PURE__*/ forwardRef<HTMLSpanElement, AlertIconProps>(function AlertIcon({ className, ...rest }, ref) {
  return <span ref={ref} className={cx("chu-alert-icon", className)} aria-hidden {...rest} />;
});

/** Props for {@link AlertBody}. */
export type AlertBodyProps = NativeProps<"div">;

/**
 * The alert's content column: title, text in `<p>`s, actions. Renders `<div class="chu-alert-body">`.
 *
 *   <AlertBody><AlertTitle>Backup complete</AlertTitle><p>All three save slots are backed up.</p></AlertBody>
 */
export const AlertBody = /*#__PURE__*/ forwardRef<HTMLDivElement, AlertBodyProps>(function AlertBody({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("chu-alert-body", className)} {...rest} />;
});

/** Props for {@link AlertTitle}. */
export type AlertTitleProps = NativeProps<"p">;

/**
 * The alert's title: what happened, in plain words, on one bold line as tall as the sign. Start it with a visually
 * hidden word for what the colour and shape say ("Error: ", "Warning: "). Renders `<p class="chu-alert-title">`.
 *
 *   <AlertTitle><span className="chu-sr-only">Warning: </span>Storage almost full</AlertTitle>
 */
export const AlertTitle = /*#__PURE__*/ forwardRef<HTMLParagraphElement, AlertTitleProps>(function AlertTitle(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("chu-alert-title", className)} {...rest} />;
});

/** Props for {@link AlertActions}. */
export type AlertActionsProps = NativeProps<"div">;

/**
 * The alert's row of actions: small outline or ghost buttons that name the fix ("Retry now", not "OK"). Renders
 * `<div class="chu-alert-actions">`.
 *
 *   <AlertActions><Button type="button" size="sm" variant="outline">Free up space</Button></AlertActions>
 */
export const AlertActions = /*#__PURE__*/ forwardRef<HTMLDivElement, AlertActionsProps>(function AlertActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-alert-actions", className)} {...rest} />;
});

/** Props for {@link AlertClose}: a button's, without children (it draws the cross). */
export type AlertCloseProps = NativeProps<"button", { children?: never }>;

/**
 * The alert's dismiss button: a small ghost icon button with the pixel cross. It is named "Dismiss" unless you name it
 * for what it dismisses ("Dismiss storage warning") when there are several. Your onClick removes or hides the alert and
 * moves focus somewhere sensible; never make the only copy of something important dismissible. Renders `<button
 * class="chu-box chu-button chu-alert-close" type="button" data-variant="ghost" data-size="sm" data-icon-only
 * aria-label="Dismiss">` holding the cross.
 *
 *   <AlertClose onClick={() => setShown(false)} />
 */
export const AlertClose = /*#__PURE__*/ forwardRef<HTMLButtonElement, AlertCloseProps>(function AlertClose(
  { type = "button", "aria-label": label = "Dismiss", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("chu-box chu-button chu-alert-close", className)}
      type={type}
      {...box({ variant: "ghost" })}
      data-size="sm"
      data-icon-only=""
      aria-label={label}
      {...rest}
    >
      <span className="chu-icon" data-glyph="close" aria-hidden />
    </button>
  );
});

/* ---------------------------------------------------------------------------------------- progress, meter */

/** Every bar needs a name: the `id` a `<label htmlFor>` points at, `aria-label` or `aria-labelledby`. */
type BarName = Named | { id: string };

/** Own props of {@link Progress}. */
export interface ProgressOwnProps {
  /**
   * The fill: accent (default), an intent or a candy name; success when done, danger for a draining thing (a
   * boss's health). Don't make it yellow: yellow means focus. `data-tone` on the well.
   */
  tone?: Exclude<Tone, "neutral">;
  /** 7, 8 (default) or 12 pixels high, in blocks 3, 4 or 6 pixels wide. `data-size` on the well. */
  size?: Size;
}
export type ProgressProps = ProgressOwnProps & BarName & NativeProps<"progress", ProgressOwnProps>;

/**
 * How far a task has got: a native `<progress>` drawn as a row of candy blocks in an ink-outlined well. Without a
 * `value` it is indeterminate (two lit blocks march along); use that only until you can show one. The ref and every
 * prop except `className` and `style` (which go to the well) are the `<progress>`'s own; its children are the
 * fallback text, equal to the value. Name it: a `<label htmlFor>` in a {@link ProgressLabel} row, `aria-label` or
 * `aria-labelledby`, and `aria-valuetext` when a number says too little ("3 of 8 files"). It is not a live region:
 * announce the start and the end, not every step. Renders `<div class="chu-box chu-progress"><progress>`.
 *
 *   <ProgressLabel><label htmlFor="load">Loading World 2</label><span>60%</span></ProgressLabel>
 *   <Progress id="load" tone="success" max={100} value={60}>60%</Progress>
 *   <Progress aria-label="Finding a match">Searching</Progress>
 */
export const Progress = /*#__PURE__*/ forwardRef<HTMLProgressElement, ProgressProps>(function Progress(
  { tone, size, className, style, ...rest },
  ref,
) {
  return (
    <div className={cx("chu-box chu-progress", className)} style={style} {...box({ tone })} data-size={size}>
      <progress ref={ref} {...rest} />
    </div>
  );
});

/** Props for {@link ProgressLabel}. */
export type ProgressLabelProps = NativeProps<"div">;

/**
 * The row above a bar: its name first, the value in words last. The name is a `<label htmlFor>` the bar's id; the value
 * is said the way people think of it ("3 of 8 files", "Done"). Renders `<div class="chu-progress-label">`.
 *
 *   <ProgressLabel><label htmlFor="up">Uploading replay</label><span>3 of 8 files</span></ProgressLabel>
 */
export const ProgressLabel = /*#__PURE__*/ forwardRef<HTMLDivElement, ProgressLabelProps>(function ProgressLabel(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-progress-label", className)} {...rest} />;
});

/** Own props of {@link Meter}. */
export interface MeterOwnProps {
  /**
   * One colour whatever the value (a magic bar is always blue). Left out, the colour follows the meter's `low`,
   * `high` and `optimum`: green when good, orange when not, red when worse. `data-tone` on the well.
   */
  tone?: Exclude<Tone, "neutral">;
  /** 7, 8 (default) or 12 pixels high, in blocks 3, 4 or 6 pixels wide. `data-size` on the well. */
  size?: Size;
}
export type MeterProps = MeterOwnProps & BarName & NativeProps<"meter", MeterOwnProps>;

/**
 * An amount within a range that is not a task (health, storage, signal), as a native `<meter>`. It is drawn as candy
 * blocks in a well. The ref and every prop except `className` and `style` (which go to the well) are the `<meter>`'s
 * own; its children are the fallback text. Name it, and say the value in words nearby ("Health 2/10"): colour is never
 * the only cue. Renders `<div class="chu-box chu-meter"><meter>`.
 *
 *   <Meter min={0} max={10} low={4} high={7} optimum={10} value={6} aria-label="Health">6 of 10</Meter>
 */
export const Meter = /*#__PURE__*/ forwardRef<HTMLMeterElement, MeterProps>(function Meter(
  { tone, size, className, style, ...rest },
  ref,
) {
  return (
    <div className={cx("chu-box chu-meter", className)} style={style} {...box({ tone })} data-size={size}>
      <meter ref={ref} {...rest} />
    </div>
  );
});

/* ------------------------------------------------------------------------------------------------ loader */

/** Own props of {@link Loader}. */
export interface LoaderOwnProps {
  /** A ring of eight dots (default), or three dots that step in, for inline text and tight spaces. `data-variant`. */
  variant?: "ring" | "dots";
  /** An 8-, 12- (default) or 24-pixel ring; dots of 2, 3 or 4 pixels. `data-size`. */
  size?: Size;
  /** The lit dots: accent (default) or an intent. `data-tone`. */
  tone?: "accent" | Intent;
  /**
   * What is loading, in words, always: "Loading World 2…". Wrap them in `<span className="chu-sr-only">` to show the
   * spinner alone.
   */
  children: ReactNode;
}
export type LoaderProps = LoaderOwnProps & NativeProps<"span", LoaderOwnProps>;

/**
 * A pixel spinner for a wait of unknown length; its words are its label. It is a polite live region
 * (`role="status"`), heard only once it is in the page: put it there before it has to speak, say when it is done
 * ("World 2 loaded"), then remove it. Show it only after a short wait; for a button that is working, use the
 * button's `busy`. Renders `<span class="chu-loader" role="status">`.
 *
 *   <Loader>Loading World 2…</Loader>
 *   <Loader size="lg"><span className="chu-sr-only">Loading</span></Loader>
 *   <Loader variant="dots" tone="warning">Reconnecting</Loader>
 */
export const Loader = /*#__PURE__*/ forwardRef<HTMLSpanElement, LoaderProps>(function Loader(
  { variant, size, tone, role = "status", className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("chu-loader", className)}
      data-variant={variant}
      data-size={size}
      data-tone={tone}
      role={role}
      {...rest}
    />
  );
});

/* ---------------------------------------------------------------------------------------------- skeleton */

/** Own props of {@link Skeleton}. */
export interface SkeletonOwnProps {
  /** A block (default: a picture, a button), a line of body text, or a pixel disc (an avatar). `data-shape`. */
  shape?: "block" | "text" | "circle";
  /** A block's height or a circle's width, in whole pixels (24 by default). `--chu-skeleton-size`. */
  size?: number;
  /** None: a skeleton is empty. */
  children?: never;
}
export type SkeletonProps<T extends ElementType = "span"> = PolymorphicProps<T, SkeletonOwnProps>;

/**
 * A dithered placeholder in the shape of content on its way, so the layout doesn't jump when it arrives. It is a
 * picture of nothing: hide it (or a wrapper) with `aria-hidden`, mark the region that is loading `aria-busy` (on a
 * wrapper, never on a `.chu-box`), and say in words what is loading. Vary text lines with `inlineSize` in `style`.
 * Renders `<span class="chu-skeleton">` (`as="div"` for a `<div>`).
 *
 *   <div aria-busy="true">
 *     <Loader size="sm">Loading friends</Loader>
 *     <div aria-hidden="true">
 *       <Skeleton shape="circle" />
 *       <Skeleton shape="text" style={{ inlineSize: "70%" }} />
 *     </div>
 *   </div>
 */
export const Skeleton = /*#__PURE__*/ forwardRef(function Skeleton(
  { as: Tag = "span", shape, size, style, className, ...rest }: SkeletonProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("chu-skeleton", className)}
      data-shape={shape}
      style={withProperty(style, "--chu-skeleton-size", size === undefined ? undefined : px(size))}
      {...rest}
    />
  );
}) as PolymorphicComponent<"span", SkeletonOwnProps>;

/* ------------------------------------------------------------------------------------------- empty state */

/** Own props of {@link EmptyState}. */
export interface EmptyStateOwnProps {
  /**
   * The picture at one, two (default) or three pixels a unit: small in panels, cards and sidebars, large on a screen
   * of its own. `data-size`.
   */
  size?: Size;
}
export type EmptyStateProps = EmptyStateOwnProps & NativeProps<"div", EmptyStateOwnProps>;

/**
 * What a list, page or panel shows when it has nothing in it yet. A small pixel picture, a title, a line saying why it
 * is empty or what goes here, and the action that fills it. Not for errors: that is an alert. Replace it with the
 * content when there is some. Renders `<div class="chu-empty-state">`.
 *
 *   <EmptyState>
 *     <EmptyStateArt viewBox="0 0 32 24">…</EmptyStateArt>
 *     <EmptyStateTitle>No saves yet</EmptyStateTitle>
 *     <EmptyStateText>Start a game and it is saved here after every level.</EmptyStateText>
 *     <EmptyStateActions><Button>New game</Button></EmptyStateActions>
 *   </EmptyState>
 */
export const EmptyState = /*#__PURE__*/ forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { size, className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-empty-state", className)} data-size={size} {...rest} />;
});

/** Own props of {@link EmptyStateArt}. */
export interface EmptyStateArtOwnProps {
  /** The drawing's grid: 32 units wide (two pixels a unit, one when small), as tall as it needs. `viewBox`. */
  viewBox: `0 0 32 ${number}`;
}
export type EmptyStateArtProps = EmptyStateArtOwnProps & NativeProps<"svg", EmptyStateArtOwnProps>;

/**
 * The empty state's picture: an inline SVG on a grid 32 units wide. Draw it in whole units, coloured with tokens
 * (`style={{ fill: "var(--chu-outline)" }}`, candies, scheme roles) with an ink outline. It says nothing a reader needs,
 * so it is hidden. Renders `<svg class="chu-empty-state-art" aria-hidden="true">`.
 *
 *   <EmptyStateArt viewBox="0 0 32 24"><path style={{ fill: "var(--chu-outline)" }} d="M1 4h3v1H1z" /></EmptyStateArt>
 */
export const EmptyStateArt = /*#__PURE__*/ forwardRef<SVGSVGElement, EmptyStateArtProps>(function EmptyStateArt(
  { className, ...rest },
  ref,
) {
  return <svg ref={ref} className={cx("chu-empty-state-art", className)} aria-hidden {...rest} />;
});

export type EmptyStateTitleProps<T extends ElementType = "h2"> = PolymorphicProps<T, object>;

/**
 * The empty state's title in Pixel Bop: the plain fact ("No saves yet"). A real heading at the right level for its
 * place: `<h2>` in a page section, `as="h3"` in a card. Renders `<h2 class="chu-empty-state-title">`.
 *
 *   <EmptyStateTitle as="h3">No items</EmptyStateTitle>
 */
export const EmptyStateTitle = /*#__PURE__*/ forwardRef(function EmptyStateTitle(
  { as: Tag = "h2", className, ...rest }: EmptyStateTitleProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("chu-empty-state-title", className)} {...rest} />;
}) as PolymorphicComponent<"h2", object>;

/** Props for {@link EmptyStateText}. */
export type EmptyStateTextProps = NativeProps<"p">;

/**
 * The empty state's line: why it is empty or what will appear, and how to change that. Renders `<p
 * class="chu-empty-state-text">`.
 *
 *   <EmptyStateText>Open chests to fill your bag.</EmptyStateText>
 */
export const EmptyStateText = /*#__PURE__*/ forwardRef<HTMLParagraphElement, EmptyStateTextProps>(function EmptyStateText(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("chu-empty-state-text", className)} {...rest} />;
});

/** Props for {@link EmptyStateActions}. */
export type EmptyStateActionsProps = NativeProps<"div">;

/**
 * The empty state's actions: the main way to fill it (candy) and perhaps one more (ghost). Renders `<div
 * class="chu-empty-state-actions">`.
 *
 *   <EmptyStateActions><Button>New game</Button><Button variant="ghost">Load from file</Button></EmptyStateActions>
 */
export const EmptyStateActions = /*#__PURE__*/ forwardRef<HTMLDivElement, EmptyStateActionsProps>(function EmptyStateActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-empty-state-actions", className)} {...rest} />;
});

/* ------------------------------------------------------------------------------------------------- badge */

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

/* ------------------------------------------------------------------------------------------------- toast */

/** Own props of {@link Toast}. */
export interface ToastOwnProps {
  /**
   * What kind of news, in the tone's soft fill like an alert; left out, a raised panel in the scheme's colours.
   * `data-tone`.
   */
  tone?: Intent;
  /** Soft (the default with a tone), or candy for celebrations ("Level clear!"). `data-variant`. */
  variant?: "soft" | "candy";
}
export type ToastProps = ToastOwnProps & Named & NativeProps<"div", ToastOwnProps>;

/**
 * A toast drawn by hand, for a {@link StaticToaster} in docs and screenshots. Live toasts come from toast() (or a
 * `<Toaster>`'s add()), which builds this markup, announces it, times it and stacks it. A group named by its title.
 * Renders `<div class="chu-box chu-toast" role="group">`.
 *
 *   <Toast tone="success" aria-label="Achievement unlocked">
 *     <ToastIcon />
 *     <ToastBody>
 *       <ToastTitle>Achievement unlocked</ToastTitle>
 *       <p>First Flight: clear World 1 without taking a hit.</p>
 *       <ToastActions><ToastAction>View</ToastAction></ToastActions>
 *     </ToastBody>
 *     <ToastClose />
 *     <ToastTimer />
 *   </Toast>
 */
export const Toast = /*#__PURE__*/ forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { tone, variant, role = "group", className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx("chu-box chu-toast", className)} {...box({ variant, tone })} role={role} {...rest} />
  );
});

/** Props for {@link ToastIcon}. */
export type ToastIconProps = NativeProps<"span">;

/**
 * The toast's sign: the tone's 12 x 12 glyph, on toasts with a tone only. Decorative. Renders `<span
 * class="chu-toast-icon" aria-hidden="true">`.
 *
 *   <ToastIcon />
 */
export const ToastIcon = /*#__PURE__*/ forwardRef<HTMLSpanElement, ToastIconProps>(function ToastIcon({ className, ...rest }, ref) {
  return <span ref={ref} className={cx("chu-toast-icon", className)} aria-hidden {...rest} />;
});

/** Props for {@link ToastBody}. */
export type ToastBodyProps = NativeProps<"div">;

/**
 * The toast's content column: title, text, action. Renders `<div class="chu-toast-body">`.
 *
 *   <ToastBody><ToastTitle>Level clear!</ToastTitle><p>3 of 3 stars, 2:41.</p></ToastBody>
 */
export const ToastBody = /*#__PURE__*/ forwardRef<HTMLDivElement, ToastBodyProps>(function ToastBody({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("chu-toast-body", className)} {...rest} />;
});

/** Props for {@link ToastTitle}. */
export type ToastTitleProps = NativeProps<"p">;

/**
 * The toast's title, first and short: "Saved to slot 2", not "Success!". Renders `<p class="chu-toast-title">`.
 *
 *   <ToastTitle>Saved to slot 2</ToastTitle>
 */
export const ToastTitle = /*#__PURE__*/ forwardRef<HTMLParagraphElement, ToastTitleProps>(function ToastTitle(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("chu-toast-title", className)} {...rest} />;
});

/** Props for {@link ToastActions}. */
export type ToastActionsProps = NativeProps<"div">;

/**
 * The row holding the toast's one action. Renders `<div class="chu-toast-actions">`.
 *
 *   <ToastActions><ToastAction>Undo</ToastAction></ToastActions>
 */
export const ToastActions = /*#__PURE__*/ forwardRef<HTMLDivElement, ToastActionsProps>(function ToastActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-toast-actions", className)} {...rest} />;
});

/** Props for {@link ToastAction}. */
export type ToastActionProps = NativeProps<"button">;

/**
 * The toast's action: a small outline button named for what it does ("Undo", "View", "Try again"). The toast
 * leaves, so it must also be reachable another way. Renders `<button class="chu-box chu-button chu-toast-action"
 * type="button" data-size="sm" data-variant="outline">`.
 *
 *   <ToastAction onClick={undo}>Undo</ToastAction>
 */
export const ToastAction = /*#__PURE__*/ forwardRef<HTMLButtonElement, ToastActionProps>(function ToastAction(
  { type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("chu-box chu-button chu-toast-action", className)}
      type={type}
      {...box({ variant: "outline" })}
      data-size="sm"
      {...rest}
    />
  );
});

/** Props for {@link ToastClose}: a button's, without children (it draws the cross). */
export type ToastCloseProps = NativeProps<"button", { children?: never }>;

/**
 * The toast's dismiss button: a ghost icon button with the pixel cross, named "Dismiss" unless you name it
 * otherwise. Renders `<button class="chu-box chu-button chu-toast-close" type="button" data-variant="ghost"
 * data-size="sm" data-icon-only aria-label="Dismiss">` holding the cross.
 *
 *   <ToastClose />
 */
export const ToastClose = /*#__PURE__*/ forwardRef<HTMLButtonElement, ToastCloseProps>(function ToastClose(
  { type = "button", "aria-label": label = "Dismiss", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("chu-box chu-button chu-toast-close", className)}
      type={type}
      {...box({ variant: "ghost" })}
      data-size="sm"
      data-icon-only=""
      aria-label={label}
      {...rest}
    >
      <span className="chu-icon" data-glyph="close" aria-hidden />
    </button>
  );
});

/** Props for {@link ToastTimer}. */
export type ToastTimerProps = NativeProps<"span", { children?: never }>;

/**
 * The countdown: a two-pixel strip over the toast's bottom band that steps down in eight whole-pixel steps. Leave
 * it out of a toast that stays (danger toasts stay until dismissed). In a static toaster it holds still, full.
 * Renders `<span class="chu-toast-timer" aria-hidden="true">`.
 *
 *   <ToastTimer />
 */
export const ToastTimer = /*#__PURE__*/ forwardRef<HTMLSpanElement, ToastTimerProps>(function ToastTimer(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("chu-toast-timer", className)} aria-hidden {...rest} />;
});

/** Props for {@link StaticToaster}. */
export type StaticToasterProps = Named & NativeProps<"div">;

/**
 * Toasts in the page flow instead of a corner, for docs and screenshots: nothing times out, nothing is announced.
 * A region, so give each its own name. For real toasts, put a `<Toaster>` in your layout and call toast(). Renders
 * `<div class="chu-toaster" data-chu-static role="region">`.
 *
 *   <StaticToaster aria-label="Notifications, example">
 *     <Toast aria-label="Saved to slot 2">
 *       <ToastBody><ToastTitle>Saved to slot 2</ToastTitle></ToastBody>
 *       <ToastClose />
 *     </Toast>
 *   </StaticToaster>
 */
export const StaticToaster = /*#__PURE__*/ forwardRef<HTMLDivElement, StaticToasterProps>(function StaticToaster(
  { role = "region", className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-toaster", className)} data-chu-static="" role={role} {...rest} />;
});
