/**
 * Text effects (the TV spec §6, PixelText.java, PixelTalk.java, PixelSpeech.java):
 *
 *   <blip-drop-text>   a Pixel Bop heading whose letters drop in one after another: each appears 30 ms after the last,
 *                    two pixels high for a frame, then lands (the TV's app name)
 *   <blip-typewriter>  types its text a letter every 50 ms, holding after a full stop (260 ms) or a comma (130 ms) that
 *                    ends a word; with `blips`, every other voiced letter plays the blip voice through services.sound()
 *
 * Both keep their whole text for assistive technology from the start, and show it all at once with reduced motion.
 */
import { BlipElement, run, services, reducedMotion, duration } from "@blip/core";
import { mirror } from "./_pixel.js";

/** Splits text into an accessible copy and a hidden visual copy whose letters can move. */
function frame(host: HTMLElement, text: string): HTMLElement {
  const said = Object.assign(document.createElement("span"), { className: "blip-sr-only", textContent: text });
  const shown = document.createElement("span");
  shown.setAttribute("aria-hidden", "true");
  host.replaceChildren(said, shown);
  return shown;
}

/**
 * <blip-drop-text class="blip-display blip-pop" data-pop="Blip">Blip</blip-drop-text>: the letters drop in when
 * it connects, when its text changes, and on play(). With data-pop, each letter keeps the POP tint.
 *
 * @summary A Pixel Bop heading whose letters drop in one after another.
 * @attr {boolean | string} data-pop - With .blip-pop: each letter keeps the POP outline and drop (the element keeps
 * the value in step with the text).
 * @attr {1 | 2 | 3 | 4} data-scale - With .blip-display: Pixel Bop at this whole scale.
 * @attr {"red" | "orange" | "yellow" | "green" | "teal" | "blue" | "purple" | "pink" | "info" | "success" | "warning" |
 * "danger"} data-tone - With .blip-pop: the tint and the drop's colour.
 * @cssprop [--blip-drop-text-stagger=30ms] - Time between letters.
 */
export class BlipDropText extends BlipElement {
  #text = "";

  get text(): string {
    return this.#text;
  }
  set text(value: string) {
    this.#text = value;
    if (this.dataset.pop !== undefined) this.dataset.pop = value;
    if (this.isConnected) this.play();
  }

  protected override connected(): void {
    this.#text ||= this.textContent?.trim() ?? "";
    this.play();
  }

  /** Drops the letters in again. Words stay whole when the line wraps. */
  play(): void {
    const shown = frame(this, this.#text);
    let i = 0;
    for (const [n, word] of this.#text.split(" ").entries()) {
      if (n) {
        shown.append(" ");
        i++;
      }
      const w = shown.appendChild(Object.assign(document.createElement("span"), { className: "blip-drop-text-word" }));
      for (const ch of word) {
        const l = w.appendChild(Object.assign(document.createElement("span"), { className: "blip-drop-text-letter", textContent: ch }));
        l.dataset.pop = ch;
        l.style.setProperty("--_i", String(i++));
      }
    }
  }
}

/** Timing and voice rules from PixelSpeech: a letter every LETTER, longer after a sentence or a clause ends. */
const voiced = (c: string) => /[\p{L}\p{N}]/u.test(c);
/** The blip's playback rate for a letter (PixelSpeech.pitch): a word always sounds the same, vowels a step up. */
function voiceRate(char: string, mood: string): number {
  const c = char.toUpperCase();
  const base = mood === "happy" ? 1.18 : mood === "sleepy" ? 0.8 : 1;
  return base * ("AEIOU".includes(c) ? 1.12 : 1) * (1 + ((((c.charCodeAt(0) || 0) * 7) % 5) - 2) * 0.03);
}

/**
 * <blip-typewriter mood="happy" blips>Hello there!</blip-typewriter>: types when it connects, when its text changes,
 * and on play(); finish() shows it all. Fires blip-typewriter-done when the last letter is in. The untyped rest keeps
 * its room, so nothing moves while it types.
 *
 * @summary Text that types itself in, a letter at a time.
 * @attr {boolean} blips - Voices every other letter with the chip blip (through services.sound()). "false" is off.
 * @attr {boolean} caret - A two-pixel block after the typed text: still while it types, then it blinks for six beats
 * once the last letter is in, and stays. "false" is off.
 * @attr {"plain" | "happy" | "sleepy"} [mood="plain"] - Pitches the blips.
 * @attr {1 | 2 | 3 | 4} data-scale - With .blip-display: Pixel Bop at this whole scale.
 * @fires {CustomEvent<void>} blip-typewriter-done - Once per play: when the last letter is in, or on finish().
 * @cssprop [--blip-duration-letter=50ms] - Time per letter.
 * @cssprop [--blip-duration-stop=260ms] - The hold after a full stop that ends a word.
 * @cssprop [--blip-duration-comma=130ms] - The hold after a comma that ends a word.
 */
export class BlipTypewriter extends BlipElement {
  declare blips: boolean;
  declare caret: boolean;
  /** "plain" (default), "happy" or "sleepy": pitches the blips. */
  declare mood: string | null;
  #text = "";
  #stop?: AbortController;
  #done = true;

  get text(): string {
    return this.#text;
  }
  set text(value: string) {
    this.#text = value;
    if (this.isConnected) this.play();
  }

  protected override connected(): void {
    this.#text ||= this.textContent?.trim() ?? "";
    this.play();
  }

  protected override disconnected(): void {
    this.#stop?.abort();
  }

  /** Fires blip-typewriter-done once a play has shown all its letters. */
  #end(): void {
    if (this.#done) return;
    this.#done = true;
    this.emit("typewriter-done");
  }

  /** Types the text from the start. */
  play(): Promise<void> {
    this.#stop?.abort();
    this.#stop = new AbortController();
    this.#done = false;
    const text = this.#text, shown = frame(this, text);
    const typed = shown.appendChild(Object.assign(document.createElement("span"), { className: "blip-typewriter-typed" }));
    const rest = shown.appendChild(Object.assign(document.createElement("span"), { className: "blip-typewriter-rest", textContent: text }));
    const letter = duration("letter", 50, this), stop = duration("stop", 260, this), comma = duration("comma", 130, this);
    const mood = this.getAttribute("mood") ?? "plain", blips = this.blips;
    let at = 0, v = 0;
    const steps = [...text].map((c, k, all) => {
      const blip = voiced(c) && v++ % 2 === 0, ends = k + 1 >= all.length || /\s/.test(all[k + 1]!), step = { at, do: () => {
        typed.textContent = all.slice(0, k + 1).join("");
        rest.textContent = all.slice(k + 1).join("");
        if (blip && blips && !document.hidden) services.sound().play("blip", { rate: voiceRate(c, mood), volume: 0.8 });
      } };
      at += !ends ? letter : /[.!?]/.test(c) ? stop : c === "," ? comma : letter;
      return step;
    });
    steps.push({ at: steps.at(-1)?.at ?? 0, do: () => this.#end() });
    if (reducedMotion() || !letter) {
      typed.textContent = text;
      rest.textContent = "";
      this.#end();
      return Promise.resolve();
    }
    return run(steps, { signal: AbortSignal.any([this.signal, this.#stop.signal]) });
  }

  /** Shows the whole text at once. */
  finish(): void {
    this.#stop?.abort();
    const typed = this.querySelector(".blip-typewriter-typed"), rest = this.querySelector(".blip-typewriter-rest");
    if (typed && rest) {
      typed.textContent = this.#text;
      rest.textContent = "";
    }
    this.#end();
  }
}

BlipElement.define("blip-drop-text", BlipDropText);
mirror(BlipTypewriter, ["blips", "caret"], ["mood"]);
BlipElement.define("blip-typewriter", BlipTypewriter);

declare global {
  interface HTMLElementTagNameMap {
    "blip-drop-text": BlipDropText;
    "blip-typewriter": BlipTypewriter;
  }
}
