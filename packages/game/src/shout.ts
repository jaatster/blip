/**
 * Shouts: big POP words across a game for a moment ("Ready?", "Go!", "Checkpoint!", "Level clear!"), one at a time in
 * the order they came, each said to screen readers as it shows (see shout.css).
 *
 *   <blip-shout></blip-shout>
 *   await shout.shout("Checkpoint!");
 *   shout.shout("Hurry up!", { tone: "warning", hold: 1500 });
 */
import { BlipElement, duration, run } from "@jaatster/blip-core";

/** How a shout looks and how long it stays. */
export interface ShoutOptions {
  /** The POP's tint and drop: any tone ("success", "warning", "pink"…); the accent by default. */
  tone?: string;
  /** How long the words stay, in ms, once they have landed (900 by default). */
  hold?: number;
  /** Pixel Bop's scale, 1 to 4; by default 2, and 3 where the shout is 600 px wide or more. */
  scale?: number;
}

/**
 * Big POP words across a game for a moment. shout() queues them: each drops in, stays, dithers away, and is said
 * politely to screen readers. With less motion asked for, the words show and go without moving.
 *
 * @summary Big POP words across a game for a moment: Ready?, Checkpoint!, Level clear!
 */
export class BlipShout extends BlipElement {
  static override classes = ["blip-shout"];
  #queue: Promise<void> = Promise.resolve();
  #live?: HTMLElement;

  protected override connected(): void {
    this.#live ??= this.appendChild(Object.assign(document.createElement("span"), { className: "blip-sr-only" }));
    this.#live.setAttribute("role", "status");
  }

  /** Shows the words once the shouts before them have gone; resolves when these have gone too. */
  shout(text: string, options: ShoutOptions = {}): Promise<void> {
    const show = () => this.#show(text, options);
    return (this.#queue = this.#queue.then(show, show));
  }

  /** Takes every shout away at once, and forgets the ones waiting. */
  clear(): void {
    this.#queue = Promise.resolve();
    for (const line of this.querySelectorAll(".blip-shout-line")) line.remove();
  }

  async #show(text: string, { tone, hold = 900, scale }: ShoutOptions): Promise<void> {
    if (!this.isConnected) return;
    const line = Object.assign(document.createElement("p"), { className: "blip-shout-line blip-display blip-pop", textContent: text });
    line.dataset.pop = text;
    line.setAttribute("aria-hidden", "true");
    if (tone) line.dataset.tone = tone;
    if (scale) line.dataset.scale = String(scale);
    this.append(line);
    // Cleared first, so the same words twice ("Ready?" again) are said twice.
    this.#live!.textContent = "";
    const frame = duration("frame", 40, this) || 40;
    await run(
      [
        { at: 16, do: () => (this.#live!.textContent = text) },
        { at: 6 * frame + hold, do: () => line.setAttribute("data-leaving", "") },
        { at: 8 * frame + hold, do: () => line.remove() },
      ],
      { signal: this.signal, instant: false },
    );
  }
}

BlipElement.define("blip-shout", BlipShout);

declare global {
  interface HTMLElementTagNameMap {
    "blip-shout": BlipShout;
  }
}
