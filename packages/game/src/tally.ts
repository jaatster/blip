/**
 * The tally at the end of a level (see tally.css): each row counts up to its value, a whole step a frame; the stars
 * earned land one by one, each a note higher; the total counts; then "New best!" pops. Any key, click or tap
 * skips to the end. Without JavaScript, or with less motion asked for, it is all there at once.
 *
 *   <blip-tally stars="2" max="3" best autoplay> …rows… </blip-tally>
 *   tally.play().then(() => playAgain.focus());
 */
import { BlipElement, duration, run, services } from "@jaatster/blip-core";

/**
 * The end of a level's tally: rows that count up, stars that land, a total and a new best. play() runs it once (or
 * the `autoplay` attribute, when it connects); a key, a click or a tap finishes it at once. The summary is said
 * politely to screen readers when it ends.
 *
 * @summary A level's results, counted up: rows, stars, a total, a new best.
 * @attr {number} stars - Stars earned.
 * @attr {number} [max=3] - Stars there were.
 * @attr {boolean} best - The total is a new best: "New best!" shows at the end.
 * @attr {boolean} autoplay - Plays when it connects.
 * @fires blip-done - When the tally has finished, played out or skipped.
 */
export class BlipTally extends BlipElement {
  static override classes = ["blip-tally"];
  static observedAttributes = ["stars", "max", "best"];
  #live?: HTMLElement;
  #playing?: AbortController;
  #done?: () => void;

  get stars(): number {
    return Number(this.getAttribute("stars")) || 0;
  }
  set stars(value: number) {
    this.setAttribute("stars", String(value));
  }
  get max(): number {
    return Number(this.getAttribute("max")) || 3;
  }
  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  protected override connected(): void {
    this.#live ??= this.appendChild(Object.assign(document.createElement("span"), { className: "blip-sr-only" }));
    this.#live.setAttribute("role", "status");
    this.#drawStars(this.stars);
    if (this.flag("autoplay")) void this.play();
  }

  attributeChangedCallback(): void {
    if (this.isConnected && !this.#playing) this.#drawStars(this.stars);
  }

  /** The values: each .blip-tally-value's number, from data-value or its text. */
  #values() {
    return [...this.querySelectorAll<HTMLElement>(".blip-tally-value")].map((el) => ({ el, to: Number(el.dataset.value ?? el.textContent!.replace(/\D/g, "")) || 0 }));
  }

  #show(el: HTMLElement, n: number): void {
    const text = n.toLocaleString(document.documentElement.lang || undefined);
    el.textContent = text;
    if (el.classList.contains("blip-pop")) el.dataset.pop = text;
  }

  #drawStars(lit: number): void {
    let row = this.querySelector(".blip-tally-stars");
    if (!row) {
      row = this.insertBefore(Object.assign(document.createElement("p"), { className: "blip-tally-stars" }), this.firstChild);
      row.setAttribute("role", "img");
    }
    row.setAttribute("aria-label", `${this.stars} of ${this.max} stars`);
    const sprites = [...row.querySelectorAll("blip-sprite")];
    for (let i = 0; i < Math.max(this.max, sprites.length); i++) {
      if (i >= this.max) {
        sprites[i]!.remove();
        continue;
      }
      (sprites[i] ?? row.appendChild(document.createElement("blip-sprite"))).setAttribute("name", i < lit ? "star" : "star-empty");
    }
  }

  /** Counts it all up; resolves when it has finished, played out or skipped. */
  play(): Promise<void> {
    this.#playing?.abort();
    const playing = (this.#playing = new AbortController());
    const signal = AbortSignal.any([this.signal, playing.signal]);
    const values = this.#values(), frame = duration("frame", 40, this), sound = services.sound();
    const best = this.querySelector<HTMLElement>(".blip-tally-best");
    const finish = () => {
      if (playing.signal.aborted) return;
      playing.abort();
      this.#playing = undefined;
      for (const { el, to } of values) this.#show(el, to);
      this.#drawStars(this.stars);
      if (best) best.hidden = !this.flag("best");
      // Said once it has ended: "2 of 3 stars. Score 12,450. New best!"
      const total = values.at(-1)?.el;
      this.#live!.textContent = [
        `${this.stars} of ${this.max} stars.`,
        total && `${total.closest(".blip-tally-row")?.querySelector("dt")?.textContent ?? ""} ${total.textContent}.`,
        this.flag("best") && best?.textContent,
      ].filter(Boolean).join(" ");
      this.emit("done");
      this.#done?.();
    };
    const done = new Promise<void>((resolve) => (this.#done = resolve));
    if (!frame) {
      finish();
      return done;
    }
    for (const { el } of values) this.#show(el, 0);
    this.#drawStars(0);
    if (best) best.hidden = true;
    // A key, a click or a tap skips to the end, and does nothing else.
    const skip = (e: Event) => {
      e.preventDefault();
      finish();
    };
    for (const type of ["keydown", "pointerdown"]) document.addEventListener(type, skip, { capture: true, once: true, signal });
    const steps: { at: number; do: () => void }[] = [];
    let at = 6 * frame;
    values.forEach(({ el, to }, i) => {
      // Before the total, the stars.
      if (i === values.length - 1) {
        for (let s = 0; s < this.stars; s++, at += 8 * frame) {
          steps.push({ at, do: () => {
            const star = this.querySelectorAll(".blip-tally-stars blip-sprite")[s] as HTMLElement;
            star.setAttribute("name", "star");
            star.classList.remove("blip-drop-in");
            void star.offsetWidth;
            star.classList.add("blip-drop-in");
            sound.play("coin", { rate: 1 + s * 0.25 });
          } });
        }
      }
      const n = Math.min(to, 20);
      for (let f = 1; f <= n; f++) steps.push({ at: at + f * frame, do: () => (this.#show(el, Math.round((to * f) / n)), f % 2 || sound.play("blip", { rate: 1.5 })) });
      at += (n + 6) * frame;
    });
    steps.push({ at, do: () => (best && this.flag("best") && ((best.hidden = false), sound.play("success")), finish()) });
    void run(steps, { signal, instant: false });
    return done;
  }
}

BlipElement.define("blip-tally", BlipTally);

declare global {
  interface HTMLElementTagNameMap {
    "blip-tally": BlipTally;
  }
}
