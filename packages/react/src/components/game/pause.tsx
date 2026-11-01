/**
 * Pause menu: PauseMenu, PauseTitle, PauseStats and PauseHint. CSS from @jaatster/blip-game (pause.css).
 */
import { forwardRef } from "react";
import type { ElementType, ReactNode } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../../internal/polymorphic.js";
import { cx, type NativeProps } from "../../internal/props.js";

/** Something that shows only pictures or numbers needs a name: `aria-label`, or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** What a POP part repeats in `data-pop` (the tint on its letters' lower rows): its children, when they are text. */
const popText = (children: ReactNode): string | undefined =>
  typeof children === "string" || typeof children === "number" ? String(children) : undefined;

/** Props for {@link PauseMenu}: a dialog's own, and a name: its title's id in `aria-labelledby` (or `aria-label`). */
export type PauseMenuProps = Named & NativeProps<"dialog">;

/**
 * The pause menu: a cream panel over a dithered ink scrim (its `::backdrop`), the title in POP, a few facts about
 * the run, the menu, and a hint line. A native `<dialog>`: `showModal()` on the ref moves focus to the first choice,
 * keeps Tab inside, makes the game inert and closes on Escape; focus goes back where it was when it closes. Inside a
 * {@link Stage}, `open` shows it in place without the modal (docs, attract screens), over a {@link StageScrim}. Stop
 * the game's clock and sounds while it is open.
 *
 *   <PauseMenu ref={pause} aria-labelledby="pause-title" onClose={resume}>
 *     <PauseTitle id="pause-title">Paused</PauseTitle>
 *     <PauseStats><span><Sprite name="coin" />42 coins</span><span><Sprite name="clock" />12:40</span></PauseStats>
 *     <Choices onAction={(e) => e.detail.value === "resume" && pause.current?.close()}>
 *       <ChoiceList font="display">
 *         <li><Choice value="resume">Resume</Choice></li>
 *         <li><Choice value="quit">Quit to map</Choice></li>
 *       </ChoiceList>
 *     </Choices>
 *     <PauseHint><PromptKey>Esc</PromptKey> Resume</PauseHint>
 *   </PauseMenu>
 *
 * Renders `<dialog class="chu-box chu-pause">`.
 */
export const PauseMenu = /*#__PURE__*/ forwardRef<HTMLDialogElement, PauseMenuProps>(function PauseMenu({ className, ...rest }, ref) {
  return <dialog ref={ref} className={cx("chu-box chu-pause", className)} {...rest} />;
});

/** Props for {@link PauseTitle}: a heading's own; `as` picks its level. */
export type PauseTitleProps<T extends ElementType = "h2"> = PolymorphicProps<T, object>;

/**
 * The pause menu's title, in Pixel Bop at scale 3, POP: "Paused", or the game's own word. Give it the id the menu
 * is named by.
 *
 *   <PauseTitle id="pause-title">Paused</PauseTitle>
 *
 * Renders `<h2 class="chu-pause-title chu-display chu-pop" data-scale="3" data-pop="Paused">`; `data-pop` repeats the
 * text (when the children are text).
 */
export const PauseTitle = /*#__PURE__*/ forwardRef(function PauseTitle(
  { as: Tag = "h2", className, children, ...rest }: PauseTitleProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("chu-pause-title chu-display chu-pop", className)}
      data-scale={3}
      data-pop={popText(children)}
      {...rest}
    >
      {children}
    </Tag>
  );
}) as PolymorphicComponent<"h2", object>;

/** Props for {@link PauseStats}. */
export type PauseStatsProps = NativeProps<"p">;

/**
 * A row of small facts about the run under the title: one `<span>` each, a sprite and its words.
 *
 *   <PauseStats><span><Sprite name="coin" />42 coins</span><span><Sprite name="star" />5 of 18</span></PauseStats>
 *
 * Renders `<p class="chu-pause-stats">`.
 */
export const PauseStats = /*#__PURE__*/ forwardRef<HTMLParagraphElement, PauseStatsProps>(function PauseStats(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("chu-pause-stats", className)} {...rest} />;
});

/** Props for {@link PauseHint}. */
export type PauseHintProps = NativeProps<"p">;

/**
 * The hint line at the foot of the menu: a {@link Prompt} line in the muted ink.
 *
 *   <PauseHint><PromptKey>Esc</PromptKey> Resume</PauseHint>
 *
 * Renders `<p class="chu-pause-hint chu-prompt">`.
 */
export const PauseHint = /*#__PURE__*/ forwardRef<HTMLParagraphElement, PauseHintProps>(function PauseHint(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("chu-pause-hint chu-prompt", className)} {...rest} />;
});
