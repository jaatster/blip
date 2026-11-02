/**
 * <blip-dialogue>: the RPG text box (see dialogue.css). One <p> per page. Each page types itself in a letter at a
 * time with the TV's rhythm (LETTER, a longer STOP after . ! ? and COMMA after a comma), voiced with a chip blip on
 * every other letter when `voice` is set. A click, Enter or Space shows the whole page at once; the next press turns
 * the page. After the last page come the choices, if there are any, or blip-done.
 *
 * Screen readers get each whole page at once, from a polite live region; the typing is visual only. With reduced
 * motion the text appears whole and nothing is voiced. Pages rendered or replaced after the element upgrades start it
 * again from the first.
 *
 *   dialogue.say(["Ah, a traveller!", "The bridge is out."]);
 *   dialogue.addEventListener("blip-done", () => dialogue.hidden = true);
 */
import { BlipElement, duration, reducedMotion, run, services, type Step } from "@jaatster/blip-core";

interface Piece {
  node: Text;
  rest: HTMLElement;
  text: string;
  start: number;
}

const LABELS = { typing: "Show all text", next: "Next", done: "Continue" } as const;
const TEXT = ".blip-dialogue-text";
type State = keyof typeof LABELS;
const prepared = new WeakMap<Element, Piece[]>();

/** The blip's playback rate for a letter, as on the TV: a word always sounds the same, vowels a step up. */
export function blipRate(letter: string, mood = "plain", base = 1): number {
  const c = letter.toUpperCase();
  return base * (mood === "happy" ? 1.18 : mood === "sleepy" ? 0.8 : 1) * ("AEIOU".includes(c) ? 1.12 : 1) * (1 + (((c.charCodeAt(0) * 7) % 5) - 2) * 0.03);
}

/**
 * The RPG text box: one <p> per page, each typed in a letter at a time with the TV's rhythm and an optional chip
 * voice. A click, Enter or Space shows the whole page, the next press turns it; after the last page come the
 * choices, if any, or blip-done. Screen readers get each whole page at once.
 *
 * @summary The RPG dialogue box that types its pages in.
 * @attr {boolean | number} voice - A blip on every other voiced letter. Present, or a base rate such as 1.2 (higher
 * for smaller characters). "false" is off.
 * @attr {"plain" | "happy" | "sleepy"} [mood="plain"] - Raises or lowers the voice.
 * @attr {number} [speed=1] - Typing speed multiplier.
 * @attr {string} [typing-label="Show all text"] - The ▼ button's name while a page types.
 * @attr {string} [next-label="Next"] - The ▼ button's name when another page follows.
 * @attr {string} [done-label="Continue"] - The ▼ button's name on the last page.
 * @attr {"display"} data-font - The text in Pixel Bop at scale 1, capitals, as on the TV's speech bubble.
 * @attr {number} data-blip-typed - Freezes the first page at this many letters (docs and screenshots only).
 * @fires {CustomEvent<{ page: number; pages: number }>} blip-next - A page turned.
 * @fires {CustomEvent<void>} blip-done - The reader pressed on after the last page (and there were no choices).
 */
export class BlipDialogue extends BlipElement {
  static override box = true;
  static override classes = ["blip-dialogue"];

  #page = 0;
  #pieces: Piece[] = [];
  #length = 0;
  #typing?: AbortController;
  #live?: HTMLElement;
  #next?: HTMLButtonElement;
  #watch?: MutationObserver;

  /** The pages, in order. */
  get pages(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>(`${TEXT} > *`)];
  }
  /** The page showing, from 0. */
  get page(): number {
    return this.#page;
  }
  /** True while a page is typing itself in. */
  get typing(): boolean {
    return !!this.#typing;
  }

  protected override connected(): void {
    this.#label();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.#live ??= this.appendChild(Object.assign(document.createElement("div"), { className: "blip-sr-only" }));
    this.#live.setAttribute("aria-live", "polite");
    this.#next ??= this.appendChild(Object.assign(document.createElement("button"), { type: "button", className: "blip-dialogue-next" }));
    // Focusable, so a click anywhere in the box keeps the keyboard here; Enter and Space then work as on the arrow.
    if (!this.hasAttribute("tabindex")) this.tabIndex = -1;
    this.on(this, "click", (e: Event) => {
      if (!(e.target as Element).closest(".blip-dialogue-choices, a, input, select, textarea")) this.advance();
    });
    this.on(this, "keydown", (e: KeyboardEvent) => {
      if (e.target !== this || (e.key !== "Enter" && e.key !== " ")) return;
      e.preventDefault();
      this.advance();
    });
    // Pages a framework renders or replaces after the element upgrades (the text's children, or the text itself): label
    // the box again and start from the first page. What the box changes inside a page as it types is not a page.
    const watch = (this.#watch = new MutationObserver((records) => {
      if (!records.some((r) => (r.target as Element).matches?.(TEXT) || [...r.addedNodes].some((n) => n instanceof Element && (n.matches(TEXT) || !!n.querySelector(TEXT))))) return;
      this.#label();
      this.#show(0);
      watch.takeRecords();
    }));
    watch.observe(this, { childList: true, subtree: true });
    this.signal.addEventListener("abort", () => watch.disconnect(), { once: true });
    this.#show(0);
  }

  /** Replaces the pages and starts again from the first. */
  say(pages: string | string[]): void {
    let box = this.querySelector(TEXT);
    if (!box) {
      box = Object.assign(document.createElement("div"), { className: "blip-dialogue-text" });
      const body = this.querySelector(".blip-dialogue-body");
      if (body) body.prepend(box);
      else this.insertBefore(box, this.#live ?? null);
    }
    box.setAttribute("aria-hidden", "true");
    box.replaceChildren(...[pages].flat().map((t) => Object.assign(document.createElement("p"), { textContent: t })));
    // Shown here at once; the watcher need not start it again.
    this.#watch?.takeRecords();
    this.#show(0);
  }

  /** Shows the rest of a typing page; otherwise turns to the next page, or after the last sends blip-done. */
  advance(): void {
    if (this.#typing || this.hasAttribute("data-blip-typed")) return this.#finish();
    if (this.hasAttribute("data-choosing")) return;
    if (this.#page + 1 < this.pages.length) {
      this.#show(this.#page + 1);
      this.emit("next", { page: this.#page, pages: this.pages.length });
    } else this.emit("done");
  }

  /** Focuses what the reader acts on next: the choices once they show, else the next arrow. */
  override focus(options?: FocusOptions): void {
    const choices = this.querySelector<HTMLElement>(".blip-dialogue-choices");
    if (this.hasAttribute("data-choosing") && choices) (choices.localName === "blip-choices" ? choices : choices.querySelector("button"))?.focus(options);
    else this.#next?.focus(options);
  }

  /** Names the box by its speaker's tab, and keeps the typing from assistive technology (the live region speaks). */
  #label(): void {
    const name = this.querySelector(".blip-dialogue-name");
    if (name) {
      name.id ||= `blip-dialogue-${Math.floor(services.random() * 1e9)}`;
      this.setAttribute("aria-labelledby", name.id);
    }
    this.querySelector(TEXT)?.setAttribute("aria-hidden", "true");
  }

  #show(index: number): void {
    this.#typing?.abort();
    this.#typing = undefined;
    this.removeAttribute("data-choosing");
    const pages = this.pages;
    this.#page = Math.max(0, Math.min(index, pages.length - 1));
    pages.forEach((p, i) => p.toggleAttribute("data-current", i === this.#page));
    const page = pages[this.#page];
    if (!page) return;
    this.#prepare(page);
    const text = this.#pieces.map((p) => p.text).join("");
    const name = this.querySelector(".blip-dialogue-name")?.textContent?.trim();
    // A beat later, so a live region that has just arrived is listened to.
    run([{ at: 60, do: () => this.#live && (this.#live.textContent = name ? `${name}: ${text}` : text) }], { signal: this.signal, instant: false });
    const frozen = this.getAttribute("data-blip-typed");
    if (frozen !== null) {
      this.#reveal(Number(frozen));
      this.#state("typing");
    } else this.#type(text);
  }

  /** Splits each text node into what shows and the rest, which waits in a hidden span holding its place. */
  #prepare(page: Element): void {
    let pieces = prepared.get(page);
    if (!pieces) {
      pieces = [];
      const walk = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      while (walk.nextNode()) nodes.push(walk.currentNode as Text);
      let start = 0;
      nodes.forEach((node, i) => {
        let text = node.data.replace(/\s+/g, " ");
        if (i === 0) text = text.trimStart();
        if (i === nodes.length - 1) text = text.trimEnd();
        const rest = Object.assign(document.createElement("span"), { className: "blip-dialogue-rest" });
        node.after(rest);
        pieces!.push({ node, rest, text, start });
        start += text.length;
      });
      prepared.set(page, pieces);
    }
    this.#pieces = pieces;
    this.#length = pieces.reduce((n, p) => n + p.text.length, 0);
    this.#reveal(0, true);
  }

  #reveal(n: number, all = false): void {
    for (const p of this.#pieces) {
      const k = Math.max(0, Math.min(p.text.length, n - p.start));
      if (all || p.node.data.length !== k) {
        p.node.data = p.text.slice(0, k);
        p.rest.textContent = p.text.slice(k);
      }
    }
  }

  #type(text: string): void {
    const speed = Number(this.getAttribute("speed")) || 1;
    const letter = duration("letter", 50, this) / speed;
    if (reducedMotion() || !letter) return this.#finish();
    const stop = duration("stop", 260, this) / speed, comma = duration("comma", 130, this) / speed;
    // voice="false" (a framework's false) is no voice, as is no attribute.
    const voice = this.flag("voice") ? this.getAttribute("voice") : null, mood = this.getAttribute("mood") ?? "plain";
    const steps: Step[] = [];
    let at = 0, voiced = 0, end = 0;
    for (const c of text) {
      const shown = (end += c.length);
      const blip = voice !== null && /[\p{L}\p{N}]/u.test(c) && voiced++ % 2 === 0;
      steps.push({ at, do: () => {
        this.#reveal(shown);
        if (blip) services.sound().play("blip", { rate: blipRate(c, mood, Number(voice) || 1) });
      } });
      const ends = end >= text.length || text[end] === " ";
      at += !ends ? letter : ".!?…".includes(c) ? stop : c === "," ? comma : letter;
    }
    steps.push({ at, do: () => this.#finish() });
    const typing = (this.#typing = new AbortController());
    this.#state("typing");
    run(steps, { signal: AbortSignal.any([this.signal, typing.signal]), instant: false });
  }

  #finish(): void {
    this.#typing?.abort();
    this.#typing = undefined;
    this.removeAttribute("data-blip-typed");
    this.#reveal(this.#length);
    const last = this.#page >= this.pages.length - 1;
    const choices = last ? this.querySelector<HTMLElement>(".blip-dialogue-choices:not([hidden])") : null;
    if (!choices) return this.#state(last ? "done" : "next");
    const focused = this.contains(document.activeElement);
    this.setAttribute("data-choosing", "");
    if (this.#next) this.#next.hidden = true;
    if (focused) this.focus();
  }

  #state(state: State): void {
    if (!this.#next) return;
    this.#next.hidden = false;
    this.#next.dataset.state = state;
    this.#next.setAttribute("aria-label", this.getAttribute(`${state}-label`) ?? LABELS[state]);
  }
}

BlipElement.define("blip-dialogue", BlipDialogue);

declare global {
  interface HTMLElementTagNameMap {
    "blip-dialogue": BlipDialogue;
  }
}
