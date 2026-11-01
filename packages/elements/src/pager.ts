/**
 * <blip-pager>: a swipeable row of slides with pixel dots, as a WAI-ARIA carousel (see components/pager.css).
 *
 * The markup already works: the track scrolls and snaps, and the dots are in-page links. This element names the
 * parts (a region that is a "carousel", each slide a group that is a "slide", labelled "2 of 4"), keeps the current
 * dot in step as you swipe, adds previous and next buttons at either end of the dots, and moves with ArrowLeft,
 * ArrowRight, Home and End while focus is on the track or its controls. Slides out of view are inert, and the track
 * is a polite live region, so a screen reader hears the slide that comes in. It never moves by itself.
 *
 *   pager.addEventListener("blip-page", (e) => track(e.detail.index));
 *   pager.index = 2;                                  // or pager.next(), pager.prev()
 */
import { BlipElement, duration, frames, pixel, warn } from "@blip/core";
import { watch } from "./_dom.js";

/** What blip-page reports: the slide now showing. */
export interface PageDetail {
  index: number;
  slide: HTMLElement;
}

let uid = 0;

/**
 * A swipeable row of full-width slides with pixel dots, as a WAI-ARIA carousel that never rotates by itself.
 *
 * @summary Slides you swipe between, with dots.
 * @attr {string} [prev-label="Previous slide"] - The previous button's accessible name.
 * @attr {string} [next-label="Next slide"] - The next button's accessible name.
 * @attr {string} [slide-label="{n} of {count}"] - Each slide's name, where it has none of its own: {n} is its number and
 * {count} how many there are.
 * @fires {CustomEvent<PageDetail>} blip-page - Another slide is showing, after a swipe, a button, a key or a dot.
 */
export class BlipPager extends BlipElement {
  static override classes = ["blip-pager"];
  #index = 0;
  #moving?: AbortController;
  #frame = 0;

  /** The scrolling row. */
  get track(): HTMLElement | null {
    return this.querySelector(":scope > .blip-pager-track");
  }
  /** The slides, in order. */
  get slides(): HTMLElement[] {
    return [...(this.track?.children ?? [])] as HTMLElement[];
  }
  /** The slide showing. Setting it moves there (no event). */
  get index(): number {
    return this.#index;
  }
  set index(i: number) {
    this.#go(i, false);
  }
  /** Moves to the next slide, if there is one. */
  next(): void {
    this.#go(this.#index + 1, true);
  }
  /** Moves to the previous slide, if there is one. */
  prev(): void {
    this.#go(this.#index - 1, true);
  }

  protected override connected(): void {
    const track = this.track;
    if (!track) {
      if (this.children.length) warn("BLIP-N002", "<blip-pager> needs a .blip-pager-track child.", this);
      return;
    }
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.setAttribute("aria-roledescription", "carousel");
    if (!this.getAttribute("aria-label") && !this.getAttribute("aria-labelledby")) warn("BLIP-A001", "<blip-pager> has no name. Add aria-label or aria-labelledby.", this);
    track.id ||= `blip-pager-${++uid}`;
    track.setAttribute("aria-live", "polite");
    // A scroller the keyboard can reach, even when the slide showing has nothing to focus.
    if (!track.hasAttribute("tabindex")) track.tabIndex = 0;
    this.#sync();
    this.#index = this.#nearest();
    this.#show();
    watch(this, this.signal, () => {
      this.#sync();
      this.#show();
    });

    this.on(track, "scroll", () => {
      if (this.#moving || this.#frame) return;
      this.#frame = requestAnimationFrame(() => {
        this.#frame = 0;
        const i = this.#nearest();
        if (i !== this.#index) this.#set(i, true);
      });
    }, { passive: true });
    this.signal.addEventListener("abort", () => cancelAnimationFrame(this.#frame), { once: true });

    this.on(this, "click", (e) => {
      const t = e.target as Element;
      const dot = t.closest<HTMLElement>(".blip-pager-dot");
      const i = dot ? this.#dots().indexOf(dot) : -1;
      if (i >= 0) {
        e.preventDefault();
        this.#go(i, true);
      } else if (t.closest(".blip-pager-prev")) this.prev();
      else if (t.closest(".blip-pager-next")) this.next();
    });

    this.on(this, "keydown", (e: KeyboardEvent) => {
      const t = e.target as Element;
      if (t !== track && !t.closest(".blip-pager-dots")) return;
      const back = getComputedStyle(this).direction === "rtl" ? "ArrowRight" : "ArrowLeft";
      const on = back === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";
      const last = this.slides.length - 1;
      const to = e.key === back ? this.#index - 1 : e.key === on ? this.#index + 1 : e.key === "Home" ? 0 : e.key === "End" ? last : null;
      if (to === null || e.altKey || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      this.#go(to, true);
      // A dot follows the slide: focus moves with it.
      if (t.matches(".blip-pager-dot")) this.#dots()[this.#index]?.focus();
    });
  }

  #dots(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>(":scope > .blip-pager-dots .blip-pager-dot")];
  }

  /** Names the slides, adds the buttons, and ties the dots to the slides. */
  #sync(): void {
    const slides = this.slides;
    const template = this.getAttribute("slide-label") ?? "{n} of {count}";
    slides.forEach((s, i) => {
      s.setAttribute("role", "group");
      s.setAttribute("aria-roledescription", "slide");
      if (!s.hasAttribute("aria-labelledby") && (!s.hasAttribute("aria-label") || s.dataset.blipLabel !== undefined)) {
        s.setAttribute("aria-label", template.replace("{n}", String(i + 1)).replace("{count}", String(slides.length)));
        s.dataset.blipLabel = "";
      }
    });
    let dots = this.querySelector<HTMLElement>(":scope > .blip-pager-dots");
    if (!dots) {
      dots = this.appendChild(document.createElement("div"));
      dots.className = "blip-pager-dots";
    }
    const have = this.#dots();
    slides.forEach((s, i) => {
      if (have[i]) return;
      const a = dots.appendChild(document.createElement("a"));
      a.className = "blip-pager-dot";
      a.href = `#${(s.id ||= `${this.track!.id}-${i + 1}`)}`;
      a.setAttribute("aria-label", `Slide ${i + 1}`);
    });
    for (const [cls, label, text, first] of [["blip-pager-prev", "prev-label", "Previous slide", true], ["blip-pager-next", "next-label", "Next slide", false]] as const) {
      let b = dots.querySelector<HTMLButtonElement>(`:scope > .${cls}`);
      if (!b) {
        b = document.createElement("button");
        b.className = `blip-box blip-button ${cls}`;
        b.type = "button";
        Object.assign(b.dataset, { variant: "soft", size: "sm", iconOnly: "" });
        b.innerHTML = '<span class="blip-icon" aria-hidden="true"></span>';
        if (first) dots.prepend(b);
        else dots.append(b);
      }
      b.setAttribute("aria-label", this.getAttribute(label) ?? text);
      b.setAttribute("aria-controls", this.track!.id);
    }
  }

  /** The slide nearest to the track's start: the one showing. */
  #nearest(): number {
    const track = this.track;
    let best = 0;
    let gap = Infinity;
    this.slides.forEach((s, i) => {
      const d = Math.abs(this.#offset(track!, s));
      if (d < gap) [best, gap] = [i, d];
    });
    return best;
  }

  /** How far the track must scroll for a slide to sit at its start. */
  #offset(track: HTMLElement, slide: HTMLElement): number {
    const t = track.getBoundingClientRect();
    const s = slide.getBoundingClientRect();
    const css = getComputedStyle(track);
    return css.direction === "rtl" ? s.right - t.right + (parseFloat(css.scrollPaddingRight) || 0) : s.left - t.left - (parseFloat(css.scrollPaddingLeft) || 0);
  }

  /** Moves to a slide in four even jumps (at once with reduced motion), then shows it. */
  #go(i: number, emit: boolean): void {
    const track = this.track;
    const slide = this.slides[i];
    if (!track || !slide) return;
    this.#moving?.abort();
    const moving = (this.#moving = new AbortController());
    const signal = AbortSignal.any([this.signal, moving.signal]);
    const px = pixel(this);
    const total = this.#offset(track, slide);
    const from = track.scrollLeft;
    // Snapping would pull each jump back to a slide: off while it moves.
    track.style.scrollSnapType = "none";
    const done = () => {
      track.style.scrollSnapType = "";
      if (this.#moving === moving) this.#moving = undefined;
    };
    signal.addEventListener("abort", done, { once: true });
    if (i !== this.#index) this.#set(i, emit);
    frames(4, duration("frame", 40), (k) => {
      track.scrollLeft = k === 3 ? from + total : from + Math.round((total * (k + 1)) / 4 / px) * px;
      if (k === 3) done();
    }, { signal });
  }

  /** Makes slide i the one showing: its dot, the buttons at the ends, the other slides inert. */
  #set(i: number, emit: boolean): void {
    this.#index = i;
    this.#show();
    if (emit) this.emit<PageDetail>("page", { index: i, slide: this.slides[i]! });
  }

  #show(): void {
    const i = this.#index;
    const slides = this.slides;
    slides.forEach((s, n) => (s.inert = n !== i));
    this.#dots().forEach((d, n) => (n === i ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current")));
    this.querySelector(".blip-pager-prev")?.setAttribute("aria-disabled", String(i <= 0));
    this.querySelector(".blip-pager-next")?.setAttribute("aria-disabled", String(i >= slides.length - 1));
  }
}

BlipElement.define("blip-pager", BlipPager);

declare global {
  interface HTMLElementTagNameMap {
    "blip-pager": BlipPager;
  }
  interface HTMLElementEventMap {
    /** From blip-pager: another slide is showing. */
    "blip-page": CustomEvent<PageDetail>;
  }
}
