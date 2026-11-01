/**
 * Accordion: Accordion, AccordionItem, AccordionChevron, AccordionSummary and AccordionPanel. CSS from
 * @blip/components (accordion.css).
 */
import { forwardRef } from "react";
import { box, cx, type NativeProps, type Radius, type Tone } from "../internal/props.js";

/** Props for {@link Accordion}. */
export type AccordionProps = NativeProps<"div">;

/**
 * A stack of questions or sections that open one at a time, on `<details>` with no script. Give every {@link
 * AccordionItem} the same `name` and only one stays open (the browser's own exclusive accordion); leave it off to let
 * several open. Put a real heading before it, and don't nest them. Renders `<div class="blip-accordion">`.
 *
 *   <Accordion>
 *     <AccordionItem name="faq" open>
 *       <AccordionSummary>Can I play offline?</AccordionSummary>
 *       <AccordionPanel boxed><p>Yes. Everything runs on your device.</p></AccordionPanel>
 *     </AccordionItem>
 *   </Accordion>
 */
export const Accordion = /*#__PURE__*/ forwardRef<HTMLDivElement, AccordionProps>(function Accordion({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-accordion", className)} {...rest} />;
});

/** Props for {@link AccordionItem}: a `<details>`'s, `name` and `open` among them. */
export type AccordionItemProps = NativeProps<"details">;

/**
 * One question and its answer: a native `<details>`. `open` opens it (then the browser toggles it: follow it with
 * `onToggle`); find-in-page opens a closed one holding the match. Renders `<details class="blip-accordion-item">`.
 *
 *   <AccordionItem name="faq">
 *     <AccordionSummary>How do I save my game?</AccordionSummary>
 *     <AccordionPanel boxed><p>The game saves at every checkpoint flag.</p></AccordionPanel>
 *   </AccordionItem>
 */
export const AccordionItem = /*#__PURE__*/ forwardRef<HTMLDetailsElement, AccordionItemProps>(function AccordionItem(
  { className, ...rest },
  ref,
) {
  return <details ref={ref} className={cx("blip-accordion-item", className)} {...rest} />;
});

/** Props for {@link AccordionChevron}. */
export type AccordionChevronProps = NativeProps<"span", { children?: never }>;

/**
 * The pixel chevron, an empty span drawn and never read: right when closed, down when open. {@link AccordionSummary}
 * draws one; use this only in a summary of your own. Renders `<span class="blip-accordion-chevron">`.
 *
 *   <AccordionChevron />
 */
export const AccordionChevron = /*#__PURE__*/ forwardRef<HTMLSpanElement, AccordionChevronProps>(function AccordionChevron(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-accordion-chevron", className)} {...rest} />;
});

/** Own props of {@link AccordionSummary}. */
export interface AccordionSummaryOwnProps {
  /**
   * White (default) for FAQs; `panel`; soft or candy (with a tone) for a short menu; outline or ghost for dense
   * settings. `data-variant`.
   */
  variant?: "panel" | "soft" | "candy" | "outline" | "ghost";
  /** A soft or candy summary's colour. `data-tone`. */
  tone?: Tone;
  /** Corner radius in pixels, 0 to 8 (3 by default). `data-blip-r`. */
  radius?: Radius;
}

export type AccordionSummaryProps = AccordionSummaryOwnProps & NativeProps<"summary", AccordionSummaryOwnProps>;

/**
 * The question: a full-width box button with a pixel chevron. The browser names it from its words and gives it an
 * expanded state, Enter and Space. One line in the reader's words; no headings inside. Renders `<summary class="blip-box
 * blip-accordion-summary">`, its words followed by an {@link AccordionChevron}.
 *
 *   <AccordionSummary variant="soft" tone="teal">Sound</AccordionSummary>
 */
export const AccordionSummary = /*#__PURE__*/ forwardRef<HTMLElement, AccordionSummaryProps>(function AccordionSummary(
  { variant, tone, radius, className, children, ...rest },
  ref,
) {
  return (
    <summary
      ref={ref}
      className={cx("blip-box blip-accordion-summary", className)}
      {...box({ tone, radius })}
      data-variant={variant}
      {...rest}
    >
      {children}
      <AccordionChevron />
    </summary>
  );
});

/** Own props of {@link AccordionPanel}. */
export interface AccordionPanelOwnProps {
  /** The answer in a cream box tucked under its question, rather than plain text. Adds `.blip-box`. */
  boxed?: boolean;
  /** A boxed panel's corner radius in pixels, 0 to 8 (3 by default). `data-blip-r`. */
  radius?: Radius;
}

export type AccordionPanelProps = AccordionPanelOwnProps & NativeProps<"div", AccordionPanelOwnProps>;

/**
 * The answer, short (link out for more); it pops in a pixel as it opens. Renders `<div class="blip-accordion-panel">`,
 * `<div class="blip-box blip-accordion-panel">` boxed.
 *
 *   <AccordionPanel boxed><p>Yes: Settings, then Controls.</p></AccordionPanel>
 */
export const AccordionPanel = /*#__PURE__*/ forwardRef<HTMLDivElement, AccordionPanelProps>(function AccordionPanel(
  { boxed, radius, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx(boxed && "blip-box", "blip-accordion-panel", className)} {...box({ radius })} {...rest} />
  );
});
