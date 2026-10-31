/**
 * <pp-choices>: keyboard and events for a list of choices (see choices.css). Up and Down move between them (they
 * wrap), Home and End jump to the ends; only one choice is in the tab order. Picking one sends pp-choice.
 *
 *   list.addEventListener("pp-choice", (e) => console.log(e.detail.value));   // { value, index, label }
 */
import { PixelElement, rovingFocus } from "@jaatster/blip-core";

export interface ChoiceDetail {
  /** The button's value, or its text when it has none. */
  value: string;
  index: number;
  label: string;
}

export class PixelChoices extends PixelElement {
  #roving?: { focus: (i: number) => void; sync: () => void };

  /** The choices you can take, in order. */
  get choices(): HTMLButtonElement[] {
    return [...this.querySelectorAll<HTMLButtonElement>("button:not([hidden])")];
  }

  protected override connected(): void {
    this.#roving = rovingFocus(this, { items: () => this.choices, orientation: "vertical", signal: this.signal });
    this.on(this, "click", (e: Event) => {
      const button = (e.target as Element).closest("button");
      if (!button || !this.contains(button) || button.getAttribute("aria-disabled") === "true") return;
      const label = button.textContent?.replace(/\s+/g, " ").trim() ?? "";
      this.emit<ChoiceDetail>("choice", { value: button.value || label, index: this.choices.indexOf(button), label });
    });
  }

  /** Moves focus to a choice (the first by default), skipping ones you can't take. */
  override focus(options?: FocusOptions & { index?: number }): void {
    const i = options?.index ?? 0;
    if (this.#roving) this.#roving.focus(i);
    else this.choices[i]?.focus(options);
  }
}

PixelElement.define("pp-choices", PixelChoices);

declare global {
  interface HTMLElementTagNameMap {
    "pp-choices": PixelChoices;
  }
}
