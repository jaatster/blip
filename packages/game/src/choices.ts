/**
 * <blip-choices>: keyboard and events for a list of choices (see choices.css). Up and Down move between them (they
 * wrap), Home and End jump to the ends; only one choice is in the tab order. Picking one sends blip-action, as a menu
 * or a command palette does. Choices rendered after the element upgrades join in as they arrive.
 *
 *   list.addEventListener("blip-action", (e) => console.log(e.detail.value));   // { item, value, index, label }
 */
import { BlipElement, rovingFocus } from "@blip/core";

/** What blip-action reports from a list of choices. */
export interface ChoiceDetail {
  /** The choice's button. */
  item: HTMLButtonElement;
  /** The button's value, or its text when it has none. */
  value: string;
  index: number;
  label: string;
}

/**
 * Keyboard and events for a list of choices: Up and Down move between them (they wrap), Home and End jump to the
 * ends, and only one choice is in the tab order.
 *
 * @summary A list of answers to pick from with the keys.
 * @fires {CustomEvent<ChoiceDetail>} blip-action - A choice was clicked or pressed.
 */
export class BlipChoices extends BlipElement {
  #roving?: { focus: (i: number) => void; sync: () => void };

  /** The choices you can take, in order. */
  get choices(): HTMLButtonElement[] {
    return [...this.querySelectorAll<HTMLButtonElement>("button:not([hidden])")];
  }

  protected override connected(): void {
    const roving = (this.#roving = rovingFocus(this, { items: () => this.choices, orientation: "vertical", signal: this.signal }));
    // Choices a framework renders after the element upgrades (or takes away) join the keys: one of them keeps the
    // tab stop.
    const watch = new MutationObserver(() => roving.sync());
    watch.observe(this, { childList: true, subtree: true });
    this.signal.addEventListener("abort", () => watch.disconnect(), { once: true });
    this.on(this, "click", (e: Event) => {
      const button = (e.target as Element).closest("button");
      if (!button || !this.contains(button) || button.getAttribute("aria-disabled") === "true") return;
      const label = button.textContent?.replace(/\s+/g, " ").trim() ?? "";
      this.emit<ChoiceDetail>("action", { item: button, value: button.value || label, index: this.choices.indexOf(button), label });
    });
  }

  /** Moves focus to a choice (the first by default), skipping ones you can't take. */
  override focus(options?: FocusOptions & { index?: number }): void {
    const i = options?.index ?? 0;
    if (this.#roving) this.#roving.focus(i);
    else this.choices[i]?.focus(options);
  }
}

BlipElement.define("blip-choices", BlipChoices);

declare global {
  interface HTMLElementTagNameMap {
    "blip-choices": BlipChoices;
  }
}
