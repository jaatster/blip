/**
 * Choices: ChoiceList, Choice and ChoiceAside, the parts that go inside <Choices>, and <Choices> itself (generated
 * from its element, re-exported here). CSS from @jaatster/blip-game (choices.css).
 */
import { forwardRef } from "react";
import { cx, type NativeProps, type Variant } from "../../internal/props.js";

export { Choices, type ChoicesProps } from "../../generated/game.js";

/** Own props of {@link ChoiceList}. */
export interface ChoiceListOwnProps {
  /** Pixel Bop capitals, for title screens and pause menus. `data-font="display"`. */
  font?: "display";
}

export type ChoiceListProps = ChoiceListOwnProps & NativeProps<"ul", ChoiceListOwnProps>;

/**
 * The list inside `<Choices>`: as wide as its widest choice, so every highlight matches, with room on the start
 * side for the white glove that points at the choice under the cursor or the keyboard. One {@link Choice} in each
 * `<li>`; keep the safe one last.
 *
 *   <Choices onAction={(e) => start(e.detail.value)}>
 *     <ChoiceList font="display">
 *       <li><Choice value="new">New game</Choice></li>
 *       <li><Choice value="continue">Continue</Choice></li>
 *     </ChoiceList>
 *   </Choices>
 *
 * Renders `<ul class="chu-choices" role="list">`.
 */
export const ChoiceList = /*#__PURE__*/ forwardRef<HTMLUListElement, ChoiceListProps>(function ChoiceList(
  { font, role = "list", className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("chu-choices", className)} role={role} data-font={font} {...rest} />;
});

/** Own props of {@link Choice}. */
export interface ChoiceOwnProps {
  /** The tier: ghost (the default here), quiet until pointed at; a candy choice would shout. `data-variant`. */
  variant?: Variant;
}

export type ChoiceProps = ChoiceOwnProps & NativeProps<"button", ChoiceOwnProps>;

/**
 * One choice: a real button, quiet until the pointer or the keyboard is on it. Its `value` is what `<Choices>`
 * reports (else its text). A sprite or an icon may lead; a {@link ChoiceAside} sits at the far end. A choice that
 * can't be taken stays in the list and says why: `aria-disabled` (dithered, skipped by the arrow keys, still read)
 * and the reason in its words. Two to four words, a verb first.
 *
 *   <li><Choice value="trade">Trade the moon key</Choice></li>
 *   <li><Choice value="pay" aria-disabled>Pay 30 coins <ChoiceAside>You have 12</ChoiceAside></Choice></li>
 *
 * Renders `<button type="button" class="chu-box chu-choice" data-variant="ghost">`.
 */
export const Choice = /*#__PURE__*/ forwardRef<HTMLButtonElement, ChoiceProps>(function Choice(
  { type = "button", variant = "ghost", className, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx("chu-box chu-choice", className)} data-variant={variant} {...rest} />
  );
});

/** Props for {@link ChoiceAside}. */
export type ChoiceAsideProps = NativeProps<"span">;

/**
 * Something said beside a choice, at its far end: a price, a count, a key.
 *
 *   <Choice value="potion"><Sprite name="potion" />Red potion <ChoiceAside>12</ChoiceAside></Choice>
 *
 * Renders `<span class="chu-choice-aside">`.
 */
export const ChoiceAside = /*#__PURE__*/ forwardRef<HTMLSpanElement, ChoiceAsideProps>(function ChoiceAside(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("chu-choice-aside", className)} {...rest} />;
});
