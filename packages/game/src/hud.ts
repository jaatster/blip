/**
 * The HUD's live values (see hud.css). Each keeps a polite live region and speaks only once its value has settled for
 * a second, so a run of coins is one announcement, not twenty. `quiet` turns that off (a ticking timer, a busy score).
 *
 *   <blip-counter value="42" pad="3" label="Coins" sound="coin"><blip-sprite name="coin"></blip-sprite></blip-counter>
 *   <blip-counter value="165" format="time" low="30" label="Time" quiet></blip-counter>
 *   <blip-hearts value="3.5" max="5" label="Health"></blip-hearts>
 *
 *   coins.value += 10;   // counts up a whole step a frame, the coin bumps, the coin sound plays
 *   hearts.value -= 1;   // the row shakes
 */
import { BlipElement, duration, frames, run, services } from "@jaatster/blip-core";

const retrigger = (el: Element | null, name: string) => {
  if (!el) return;
  el.classList.remove(name);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(name);
};

/** A number shown in the HUD, announced politely once it settles. */
abstract class HudValue extends BlipElement {
  static observedAttributes = ["value", "max", "low"];
  #live?: HTMLElement;
  #ready = false;
  #say?: AbortController;

  get value(): number {
    return Number(this.getAttribute("value")) || 0;
  }
  set value(value: number) {
    this.setAttribute("value", String(value));
  }
  /** What the value is, for screen readers: "Coins", "Health". */
  get label(): string {
    return this.getAttribute("label") ?? "";
  }
  set label(value: string) {
    this.setAttribute("label", value);
  }

  protected abstract text(): string;
  protected abstract draw(from?: number): void;

  protected override connected(): void {
    this.#live ??= this.appendChild(Object.assign(document.createElement("span"), { className: "blip-sr-only" }));
    this.#live.setAttribute("aria-live", "polite");
    this.#live.textContent = this.text();
    this.#ready = true;
    this.draw();
  }

  protected override disconnected(): void {
    this.#ready = false;
  }

  attributeChangedCallback(name: string, old: string | null, now: string | null): void {
    if (!this.#ready || old === now) return;
    this.draw(name === "value" ? Number(old) || 0 : undefined);
    if (this.flag("quiet")) return;
    this.#say?.abort();
    this.#say = new AbortController();
    run([{ at: 1000, do: () => this.#live && (this.#live.textContent = this.text()) }], { signal: AbortSignal.any([this.signal, this.#say.signal]), instant: false });
  }
}

/**
 * A coin, score or time counter in Pixel Bop's tabular digits. A gain counts up a whole step a frame, bumps the icon
 * and plays its sound; the value is announced politely once it settles.
 *
 * @summary A coin, score or time counter.
 * @attr {number} value - The count (seconds with format="time").
 * @attr {string} label - What the value is, for screen readers: "Coins", "Score".
 * @attr {number} pad - Zero-pads to this many digits: 042.
 * @attr {"time"} format - Shows the value, in seconds, as m:ss.
 * @attr {number} low - At or under this value the digits turn red (data-low).
 * @attr {string} sound - A chip sound to play on a gain: "coin".
 * @attr {boolean} quiet - Never announced: for a ticking timer or a busy score. "false" is off.
 * @omit-attr max
 */
export class BlipCounter extends HudValue {
  static override classes = ["blip-counter"];
  #shown?: number;
  #count?: AbortController;
  #out?: HTMLElement;

  /** The value as shown: zero-padded to `pad` digits, or m:ss with format="time". */
  format(n: number): string {
    const v = Math.max(0, Math.round(n));
    if (this.getAttribute("format") === "time") return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
    return String(v).padStart(Number(this.getAttribute("pad")) || 0, "0");
  }

  protected text(): string {
    return `${this.label} ${this.format(this.value)}`.trim();
  }

  protected draw(from?: number): void {
    if (!this.#out) {
      this.#out = this.querySelector<HTMLElement>(".blip-counter-value") ?? this.appendChild(Object.assign(document.createElement("span"), { className: "blip-counter-value blip-display blip-pop" }));
      this.#out.setAttribute("aria-hidden", "true");
    }
    const to = this.value, low = this.getAttribute("low");
    this.toggleAttribute("data-low", low !== null && to <= Number(low));
    this.#count?.abort();
    const start = this.#shown ?? from ?? to;
    if (from === undefined || start === to) return this.#render(to);
    if (to > start) {
      retrigger(this.querySelector(".blip-counter-icon, blip-sprite, svg"), "blip-bump");
      const sound = this.getAttribute("sound");
      if (sound) services.sound().play(sound);
    }
    // A whole step a frame, at most fifteen frames, so a big score still lands quickly.
    const n = Math.min(Math.abs(to - start), 15);
    this.#count = new AbortController();
    frames(n, duration("frame", 40, this), (i) => this.#render(i === n - 1 ? to : Math.round(start + ((to - start) * (i + 1)) / n)), { signal: AbortSignal.any([this.signal, this.#count.signal]) });
  }

  #render(n: number): void {
    this.#shown = n;
    const text = this.format(n);
    this.#out!.textContent = text;
    this.#out!.dataset.pop = text;
  }
}

/**
 * Hearts for health: full, half and empty sprites (sprites.js draws them). A loss shakes the row; the value is
 * announced politely once it settles.
 *
 * @summary A row of hearts for health.
 * @attr {number} value - The health, in hearts; halves show as half hearts.
 * @attr {number} [max=3] - How many hearts.
 * @attr {string} label - What the value is, for screen readers: "Health".
 * @attr {boolean} quiet - Never announced. "false" is off.
 * @omit-attr low
 */
export class BlipHearts extends HudValue {
  static override classes = ["blip-hearts"];

  get max(): number {
    return Number(this.getAttribute("max")) || 3;
  }
  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  protected text(): string {
    return `${this.label} ${this.value}/${this.max}`.trim();
  }

  protected draw(from?: number): void {
    const hearts = [...this.querySelectorAll("blip-sprite")];
    for (let i = 0; i < Math.max(this.max, hearts.length); i++) {
      if (i >= this.max) {
        hearts[i]!.remove();
        continue;
      }
      const left = this.value - i;
      const heart = hearts[i] ?? this.insertBefore(document.createElement("blip-sprite"), this.querySelector(".blip-sr-only"));
      heart.setAttribute("name", left >= 1 ? "heart" : left >= 0.5 ? "heart-half" : "heart-empty");
    }
    if (from !== undefined && this.value < from) retrigger(this, "blip-shake");
  }
}

BlipElement.define("blip-counter", BlipCounter);
BlipElement.define("blip-hearts", BlipHearts);

declare global {
  interface HTMLElementTagNameMap {
    "blip-counter": BlipCounter;
    "blip-hearts": BlipHearts;
  }
}
