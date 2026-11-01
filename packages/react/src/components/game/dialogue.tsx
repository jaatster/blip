/**
 * Dialogue: DialogueName, DialoguePortrait, DialogueBody and DialogueText, the parts that go inside <Dialogue>, and
 * <Dialogue> itself (generated from its element, re-exported here). CSS from @blip/game (dialogue.css). A dialogue's
 * answers are `<Choices className="blip-dialogue-choices">`.
 */
import { forwardRef } from "react";
import { cx, type NativeProps, type Tone } from "../../internal/props.js";

export { Dialogue, type DialogueProps } from "../../generated/game.js";

/** Own props of {@link DialogueName}. */
export interface DialogueNameOwnProps {
  /** The speaker's colour: give each speaker one, and use it every time they speak. `data-tone`. */
  tone?: Tone;
}

export type DialogueNameProps = DialogueNameOwnProps & NativeProps<"span", DialogueNameOwnProps>;

/**
 * The speaker's name, on a small candy tab riding the dialogue's top edge, in Pixel Bop. It names the box, and
 * screen readers hear it before each page ("Bramble: Ah, a traveller!").
 *
 *   <Dialogue voice>
 *     <DialogueName tone="green">Bramble</DialogueName>
 *     <DialoguePortrait tone="teal"><svg>…</svg></DialoguePortrait>
 *     <DialogueBody>
 *       <DialogueText>
 *         <p>Ah, a traveller! The rope bridge washed out in last night's storm.</p>
 *         <p>I could patch it up before sunset, for thirty coins.</p>
 *       </DialogueText>
 *       <Choices className="blip-dialogue-choices">
 *         <ChoiceList>
 *           <li><Choice value="pay">Pay 30 coins</Choice></li>
 *           <li><Choice value="later">Maybe later</Choice></li>
 *         </ChoiceList>
 *       </Choices>
 *     </DialogueBody>
 *   </Dialogue>
 *
 * Renders `<span class="blip-box blip-dialogue-name">`.
 */
export const DialogueName = /*#__PURE__*/ forwardRef<HTMLSpanElement, DialogueNameProps>(function DialogueName(
  { tone, className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-box blip-dialogue-name", className)} data-tone={tone} {...rest} />;
});

/** Own props of {@link DialoguePortrait}. */
export interface DialoguePortraitOwnProps {
  /** The frame's colour. `data-tone`. */
  tone?: Tone;
}

export type DialoguePortraitProps = DialoguePortraitOwnProps & NativeProps<"div", DialoguePortraitOwnProps>;

/**
 * A framed slot for the speaker's portrait, 36 pixels square (`--blip-dialogue-portrait`): a soft candy box with the
 * art standing at its bottom, one sprite pixel to one Blip pixel. Leave the art unnamed: the tab says who it is.
 *
 *   <DialoguePortrait tone="teal"><svg className="blip-sprite" aria-hidden="true">…</svg></DialoguePortrait>
 *
 * Renders `<div class="blip-box blip-dialogue-portrait" data-variant="soft">`.
 */
export const DialoguePortrait = /*#__PURE__*/ forwardRef<HTMLDivElement, DialoguePortraitProps>(function DialoguePortrait(
  { tone, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("blip-box blip-dialogue-portrait", className)}
      data-variant="soft"
      data-tone={tone}
      {...rest}
    />
  );
});

/** Props for {@link DialogueBody}. */
export type DialogueBodyProps = NativeProps<"div">;

/**
 * The dialogue's column beside the portrait: the {@link DialogueText}, then the choices, if any
 * (`<Choices className="blip-dialogue-choices">`), which show once the last page has typed.
 *
 *   <DialogueBody><DialogueText>…</DialogueText></DialogueBody>
 *
 * Renders `<div class="blip-dialogue-body">`.
 */
export const DialogueBody = /*#__PURE__*/ forwardRef<HTMLDivElement, DialogueBodyProps>(function DialogueBody(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-dialogue-body", className)} {...rest} />;
});

/** Props for {@link DialogueText}. */
export type DialogueTextProps = NativeProps<"div">;

/**
 * The pages: one child each, usually a `<p>`. The element types them in one at a time and gives screen readers each
 * whole page; without JavaScript every page shows, one after another. One thought per page, three lines or fewer;
 * no links or fields (the typed copy is hidden from screen readers). `<Dialogue font="display">` sets them in Pixel
 * Bop capitals, for signs and short barks.
 *
 *   <DialogueText><p>Ah, a traveller!</p><p>The rope bridge washed out in last night's storm.</p></DialogueText>
 *
 * Renders `<div class="blip-dialogue-text">`.
 */
export const DialogueText = /*#__PURE__*/ forwardRef<HTMLDivElement, DialogueTextProps>(function DialogueText(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-dialogue-text", className)} {...rest} />;
});
