/**
 * <pp-combobox>: a text field with a list of suggestions, the WAI-ARIA editable combobox with list and inline
 * autocomplete. The suggestions come from a <datalist>, so without JavaScript the browser's own list still works.
 * Typing filters the list and completes the first suggestion that starts with what you typed (the completion is
 * selected, so typing on replaces it); the arrow keys move through the list; Enter takes the active suggestion;
 * Escape closes the list, then clears the field.
 *
 *   <pp-combobox class="pp-combobox">
 *     <span class="pp-box pp-input"><input id="world" name="world" list="worlds"></span>
 *     <datalist id="worlds"><option value="meadow">Meadow</option><option value="caves">Crystal caves</option></datalist>
 *   </pp-combobox>
 *
 * The form value is the chosen suggestion's value ("caves"), or the text when it matches none. The input's name
 * moves to the element, so the value is sent once. The list opens in the top layer where the browser has anchor
 * positioning, so no scrolling box clips it. Attributes: name, value, open, empty-text ("No matches"),
 * toggle-label ("Show suggestions"). Properties: value, open. Event: pp-change { value }.
 */
import { PixelElement, dismiss, warn } from "@jaatster/blip-core";

let uid = 0;
interface Suggestion {
  el: HTMLElement;
  value: string;
  label: string;
}
const make = (tag: string, className: string, attrs: Record<string, string> = {}): HTMLElement => {
  const el = document.createElement(tag);
  el.className = className;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};
/** The top layer, positioned by CSS anchors scoped to each combobox: only where all of that exists (the same test
    as the stylesheet's @supports). Elsewhere the list is placed absolutely under the field. */
const topLayer =
  typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype && typeof CSS !== "undefined" && CSS.supports("position-try-fallbacks: flip-block") && CSS.supports("anchor-scope: all");

/**
 * The WAI-ARIA editable combobox with list and inline autocomplete, over a text input and a <datalist>.
 * Form-associated: the form value is the chosen suggestion's value, or the text when it matches none.
 *
 * @summary A text field with a list of suggestions.
 * @attr {string} name - The form field name; taken from the input when left out.
 * @attr {string} value - The starting value (a suggestion's value, or text). The value property is the current one.
 * @attr {boolean} open - The list of suggestions is showing.
 * @attr {string} [empty-text="No matches"] - Shown in the list when nothing matches.
 * @attr {string} [toggle-label="Show suggestions"] - The toggle button's accessible name.
 * @fires {CustomEvent<{ value: string }>} pp-change - Once per new value: a suggestion taken, the field cleared, or
 * typed text committed.
 */
export class PixelCombobox extends PixelElement {
  static formAssociated = true;
  static classes = ["pp-combobox"];
  static observedAttributes = ["open"];

  #internals = this.attachInternals();
  #id = `pp-combobox-${++uid}`;
  #input: HTMLInputElement | null = null;
  #data: HTMLDataListElement | null = null;
  #toggle = make("button", "pp-box pp-combobox-toggle", { type: "button", tabindex: "-1", "data-variant": "ghost", "aria-expanded": "false" });
  #list = make("div", "pp-combobox-list", { role: "listbox", id: `${this.#id}-list` });
  #empty = make("p", "pp-combobox-empty", { role: "status" });
  #popup = make("div", "pp-box pp-combobox-popup", { "data-variant": "panel", hidden: "" });
  #options: Suggestion[] = [];
  #active = -1;
  #initial: string | null = null;
  #pending: string | undefined;
  #last = "";

  /** The form value: the matching suggestion's value, or the text. */
  get value(): string {
    if (!this.#input) return this.#pending ?? "";
    const text = this.#input.value;
    return this.#match(text)?.value ?? text;
  }
  set value(v: string) {
    if (!this.#input) {
      this.#pending = v;
      return;
    }
    this.#input.value = this.#options.find((o) => o.value === v)?.label ?? v;
    this.#store();
    this.#last = this.value;
  }
  get open(): boolean {
    return this.hasAttribute("open");
  }
  set open(v: boolean) {
    this.toggleAttribute("open", v);
  }
  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }
  /** Validity is the input's (required, pattern…), checked by the browser as usual. */
  checkValidity(): boolean {
    return this.#input?.checkValidity() ?? true;
  }
  reportValidity(): boolean {
    return this.#input?.reportValidity() ?? true;
  }

  protected connected(): void {
    const input = (this.#input = this.querySelector("input"));
    if (!input) return warn("PP-E001", "<pp-combobox> needs an <input> inside.", this);
    this.#data ??= input.list ?? this.querySelector("datalist");
    input.removeAttribute("list");
    if (input.name) {
      if (!this.hasAttribute("name")) this.setAttribute("name", input.name);
      input.removeAttribute("name");
    }
    const listId = this.#list.id;
    for (const [k, v] of Object.entries({ role: "combobox", "aria-autocomplete": "both", "aria-expanded": "false", "aria-controls": listId })) input.setAttribute(k, v);
    if (!input.hasAttribute("autocomplete")) input.autocomplete = "off";
    if (!this.#toggle.firstChild) this.#toggle.append(document.createElement("span"));
    this.#toggle.setAttribute("aria-label", this.getAttribute("toggle-label") ?? "Show suggestions");
    this.#toggle.setAttribute("aria-controls", listId);
    this.#list.setAttribute("aria-label", input.labels?.[0]?.textContent?.trim() || input.getAttribute("aria-label") || "Suggestions");
    if (topLayer) this.#popup.popover = "manual";
    this.#popup.replaceChildren(this.#list, this.#empty);
    input.parentElement?.append(this.#toggle);
    this.append(this.#popup);

    this.#options = [...(this.#data?.options ?? [])].map((o, i) => {
      const el = make("div", "pp-box pp-combobox-option", { role: "option", id: `${this.#id}-${i}`, "aria-selected": "false", "data-variant": "ghost" });
      el.textContent = o.label || o.value;
      return { el, value: o.value, label: el.textContent };
    });
    this.#list.replaceChildren(...this.#options.map((o) => o.el));

    if (this.#pending !== undefined) {
      this.value = this.#pending;
      this.#pending = undefined;
    }
    if (this.#initial === null) {
      this.#initial = this.getAttribute("value") ?? this.value;
      if (this.hasAttribute("value") && !input.value) this.value = this.#initial;
    }
    this.#store();
    this.#last = this.value;
    this.#lock();

    const option = (e: Event) => this.#options.findIndex((o) => o.el === (e.target as Element).closest('[role="option"]'));
    this.on(input, "input", (e) => this.#typed(e));
    this.on(input, "keydown", (e) => this.#key(e as KeyboardEvent));
    this.on(input, "change", () => this.#changed());
    // The pointer never takes the focus from the field.
    this.on(this.#toggle, "pointerdown", (e) => e.preventDefault());
    this.on(this.#popup, "pointerdown", (e) => e.preventDefault());
    this.on(this.#toggle, "click", () => {
      if (this.#locked()) return;
      if (this.open) this.#close();
      else this.#show();
      input.focus();
    });
    this.on(this.#list, "pointermove", (e) => {
      const i = option(e);
      if (i >= 0 && i !== this.#active) this.#activate(i);
    });
    this.on(this.#list, "click", (e) => this.#accept(option(e)));
    dismiss(this, { onDismiss: () => this.#close(), signal: this.signal });
    // The page may switch the field on or off later: keep the toggle and the form value in step.
    const watch = new MutationObserver(() => {
      this.#lock();
      this.#store();
      if (this.#locked()) this.#close();
    });
    watch.observe(input, { attributes: true, attributeFilter: ["disabled", "readonly"] });
    this.signal.addEventListener("abort", () => watch.disconnect(), { once: true });
    this.attributeChangedCallback();
  }

  attributeChangedCallback(): void {
    const open = this.open && !!this.#input;
    if (topLayer && this.#popup.popover) {
      if (this.#popup.isConnected) this.#popup.togglePopover(open);
      this.#popup.hidden = false;
    } else this.#popup.hidden = !open;
    this.#input?.setAttribute("aria-expanded", String(open));
    this.#toggle.setAttribute("aria-expanded", String(open));
    if (!open) this.#activate(-1);
  }

  formResetCallback(): void {
    this.value = this.#initial ?? "";
  }
  /** A disabled fieldset disables the field; enabling it again leaves alone a field the page disabled itself. */
  formDisabledCallback(off: boolean): void {
    const input = this.#input;
    if (!input) return;
    if (off && !input.disabled) {
      input.disabled = true;
      input.dataset.ppGroupOff = "";
    } else if (!off && input.dataset.ppGroupOff !== undefined) {
      input.disabled = false;
      delete input.dataset.ppGroupOff;
    }
    this.#lock();
    this.#store();
    if (off) this.#close();
  }
  formStateRestoreCallback(state: string | null): void {
    this.value = state ?? "";
  }

  /** Read-only and disabled fields can't be changed from the list or the keys. */
  #locked(): boolean {
    return !this.#input || this.#input.readOnly || this.#input.disabled;
  }
  #lock(): void {
    this.#toggle.toggleAttribute("disabled", !!this.#input?.disabled);
  }

  #match(text: string): Suggestion | undefined {
    const t = text.trim().toLowerCase();
    return t ? this.#options.find((o) => o.label.toLowerCase() === t || o.value.toLowerCase() === t) : undefined;
  }

  /** Shows the suggestions that contain the text (all of them for none); says so when there are none. */
  #filter(text: string): Suggestion[] {
    const t = text.trim().toLowerCase();
    for (const o of this.#options) o.el.hidden = !!t && !o.label.toLowerCase().includes(t);
    const shown = this.#options.filter((o) => !o.el.hidden);
    // Filled only when shown, so the status is read out as it appears.
    this.#empty.textContent = shown.length ? "" : (this.getAttribute("empty-text") ?? "No matches");
    this.#empty.hidden = shown.length > 0;
    return shown;
  }

  /** Opens with every suggestion, the current one active. */
  #show(): void {
    this.#filter("");
    this.open = true;
    this.#activate(this.#options.indexOf(this.#match(this.#input!.value)!));
  }
  #close(): void {
    this.open = false;
  }

  /** Typing: filter, open, and complete the first suggestion that starts with the text. */
  #typed(e: Event): void {
    if (!(e instanceof InputEvent)) return; // our own events
    const input = this.#input!;
    const text = input.value;
    const shown = this.#filter(text);
    this.open = true;
    let active = -1;
    if (text && e.inputType.startsWith("insert") && !e.isComposing && input.selectionEnd === text.length) {
      const hit = shown.find((o) => o.label.toLowerCase().startsWith(text.toLowerCase()));
      if (hit) {
        input.value = text + hit.label.slice(text.length);
        input.setSelectionRange(text.length, hit.label.length, "backward");
        active = this.#options.indexOf(hit);
      }
    }
    this.#activate(active);
    this.#store();
  }

  #key(e: KeyboardEvent): void {
    if (this.#locked()) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!this.open) {
        this.#show();
        if (e.altKey || this.#active >= 0) return;
      }
      const shown = this.#options.filter((o) => !o.el.hidden);
      if (!shown.length) return;
      const at = shown.indexOf(this.#options[this.#active]!);
      const down = e.key === "ArrowDown";
      const next = at < 0 ? (down ? 0 : shown.length - 1) : (at + (down ? 1 : -1) + shown.length) % shown.length;
      this.#activate(this.#options.indexOf(shown[next]!));
    } else if (e.key === "Enter") {
      if (this.open && this.#active >= 0) {
        e.preventDefault();
        this.#accept(this.#active);
      } else this.#close();
    } else if (e.key === "Escape") {
      if (this.open) {
        e.preventDefault();
        this.#close();
      } else if (this.#input!.value) {
        e.preventDefault();
        this.#input!.value = "";
        this.#store(true);
      }
    } else if (e.key === "Tab") this.#close();
    else if (["Home", "End", "ArrowLeft", "ArrowRight"].includes(e.key)) this.#activate(-1);
  }

  #activate(i: number): void {
    this.#active = i;
    this.#options.forEach((o, j) => o.el.setAttribute("aria-selected", String(j === i)));
    const o = this.#options[i];
    if (o && this.open) {
      this.#input?.setAttribute("aria-activedescendant", o.el.id);
      o.el.scrollIntoView({ block: "nearest" });
    } else this.#input?.removeAttribute("aria-activedescendant");
  }

  #accept(i: number): void {
    const o = this.#options[i];
    const input = this.#input;
    if (!o || !input || this.#locked()) return;
    input.value = o.label;
    input.setSelectionRange(o.label.length, o.label.length);
    this.#close();
    this.#store(true);
  }

  /** Puts the value in the form (none while disabled); with changed, fires input and change, as typing and leaving
      the field would (the browser fires no change of its own for a value set by script). */
  #store(changed = false): void {
    this.#internals.setFormValue(this.#input?.disabled ? null : this.value);
    if (!changed) return;
    for (const type of ["input", "change"]) this.#input?.dispatchEvent(new Event(type, { bubbles: true }));
  }

  /** pp-change, once per new value (the browser's own change on blur may follow a choice already announced). */
  #changed(): void {
    this.#store();
    const v = this.value;
    if (v === this.#last) return;
    this.#last = v;
    this.emit("change", { value: v });
  }
}

PixelElement.define("pp-combobox", PixelCombobox);

declare global {
  interface HTMLElementTagNameMap {
    "pp-combobox": PixelCombobox;
  }
}
