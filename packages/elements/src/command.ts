/**
 * <blip-command>: a command palette over the command markup (see components/command.css): a modal <dialog> holding a
 * combobox and a listbox of grouped options.
 *
 * Opens and closes with a shortcut (Ctrl+K, Cmd+K on a Mac; set `shortcut`, or "" for none), resets and focuses the
 * field, filters the options as you type (every word must match the label or data-keywords), hides empty groups and
 * shows the empty state, moves the active option with the arrow keys (aria-activedescendant, so focus stays in the
 * field), follows the pointer, and runs the active option on Enter or a click. A click on the scrim closes it; the
 * dialog gives focus back to whatever had it. Options rendered later (results a framework fetches as you type) are
 * given ids and filtered as they arrive.
 *
 *   <blip-command shortcut="mod+k">…</blip-command>
 *   palette.addEventListener("blip-action", (e) => go(e.detail.value)); // e.preventDefault() keeps it open
 *   palette.open = true;                                              // or <blip-command open>
 */
import { BlipElement, warn } from "@jaatster/blip-core";
import { both, isOn, unFalse, valueOf, watch } from "./_dom.js";
import type { ActionDetail } from "./menu.js";

export type { ActionDetail } from "./menu.js";

const OPTION = '[role="option"]';
const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
let uid = 0;

/**
 * A command palette over the command markup: a modal <dialog> holding a combobox and a listbox of grouped options.
 * A shortcut opens it, typing filters, the arrow keys move, Enter or a click runs the active option.
 *
 * @summary A command palette: search and run commands from the keyboard.
 * @attr {string} [shortcut="mod+k"] - The keys that open and close it ("mod+k", "ctrl+shift+p", "/"); "" for none.
 * @attr {boolean} open - The palette is open; setting it opens (with an empty search) or closes it. Reflects the
 * palette. "false" is off.
 * @fires {CustomEvent<ActionDetail>} blip-action - An option was chosen (Enter or a click), before it runs.
 * Cancelable: preventDefault() keeps the palette open.
 * @fires {CustomEvent<void>} blip-open - The palette opened.
 * @fires {CustomEvent<void>} blip-close - The palette closed.
 */
export class BlipCommand extends BlipElement {
  static observedAttributes = ["open"];
  #active: HTMLElement | null = null;
  #showing = false;
  #quiet = false;
  #shown = false;
  #id = "";
  #n = 0;
  /** The dialog, field and list wired now, and what aborts their wiring when one goes. */
  #parts: (Element | null)[] = [];
  #wiring?: AbortController;

  get dialog(): HTMLDialogElement | null {
    return this.querySelector("dialog");
  }
  get input(): HTMLInputElement | null {
    return this.querySelector("input");
  }
  get options(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>(OPTION)];
  }
  /** True while the palette is open; setting it opens or closes it. */
  get open(): boolean {
    return !!this.dialog?.open;
  }
  set open(value: boolean) {
    if (value) this.show();
    else this.close();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (unFalse(this, name, value) || this.#quiet || !this.isConnected) return;
    if (isOn(this, "open")) this.show();
    else this.close();
  }

  /** Opens the palette with an empty search. */
  show(): void {
    const dialog = this.dialog;
    if (!dialog?.isConnected || dialog.open) return;
    this.#reset();
    this.#showing = true;
    dialog.showModal();
    this.input?.focus();
  }
  /** Closes it; the dialog gives focus back to whatever had it. */
  close(): void {
    this.dialog?.close();
  }

  #label(o: HTMLElement): string {
    return (o.querySelector(".blip-command-label") ?? o).textContent?.trim() ?? "";
  }
  #visible(): HTMLElement[] {
    return this.options.filter((o) => !o.hidden && o.getAttribute("aria-disabled") !== "true");
  }

  #reset(): void {
    if (this.input) this.input.value = "";
    this.#filter();
  }

  /** Shows the options that match what is typed. The first becomes active, unless `keep` and the active one still
      shows (options that arrived while typing don't move it). */
  #filter(keep = false): void {
    const words = (this.input?.value ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    for (const o of this.options) {
      const text = `${this.#label(o)} ${o.dataset.keywords ?? ""}`.toLowerCase();
      o.hidden = !words.every((w) => text.includes(w));
      if (!o.hidden) count++;
    }
    for (const g of this.querySelectorAll<HTMLElement>('[role="listbox"] [role="group"]')) g.hidden = !g.querySelector(`${OPTION}:not([hidden])`);
    const empty = this.querySelector<HTMLElement>(".blip-command-empty");
    if (empty) empty.hidden = count > 0;
    const status = this.querySelector('[role="status"]');
    if (status) status.textContent = words.length ? `${count} ${count === 1 ? "result" : "results"}` : "";
    const visible = this.#visible();
    if (keep && this.#active && visible.includes(this.#active)) this.#activate(this.#active, false);
    else this.#activate(visible[0] ?? null, !keep);
  }

  #activate(option: HTMLElement | null, scroll = true): void {
    this.#active = option;
    for (const o of this.options) o.setAttribute("aria-selected", String(o === option));
    if (option) {
      this.input?.setAttribute("aria-activedescendant", option.id);
      if (scroll) option.scrollIntoView({ block: "nearest" });
    } else this.input?.removeAttribute("aria-activedescendant");
  }

  #choose(option: HTMLElement): void {
    if (option.getAttribute("aria-disabled") === "true") return;
    if (this.emit<ActionDetail>("action", { item: option, value: valueOf(option, this.#label(option)) }, true)) this.close();
  }

  /** Does this key press match the shortcut attribute ("mod+k", "ctrl+shift+p", "/")? */
  #matches(e: KeyboardEvent): boolean {
    const keys = (this.getAttribute("shortcut") ?? "mod+k").toLowerCase().split("+");
    const key = keys.pop();
    if (!key || e.key.toLowerCase() !== key) return false;
    const has = (k: string) => keys.includes(k);
    if (!keys.length) {
      // A bare key never fires while someone is typing.
      const t = e.target as HTMLElement;
      if (t.isContentEditable || t.matches?.("input, textarea, select")) return false;
    }
    return e.ctrlKey === (has("ctrl") || (has("mod") && !mac)) && e.metaKey === (has("meta") || (has("mod") && mac)) && e.altKey === has("alt") && e.shiftKey === has("shift");
  }

  protected override connected(): void {
    this.#parts = [];
    this.#wire();
    // Parts rendered later, and options that come and go as results arrive, are wired as they come.
    watch(this, this.signal, () => this.#wire());
    if (!this.dialog && this.children.length) warn("BLIP-C001", "<blip-command> needs a <dialog> with an input and a [role=listbox] inside it.", this);
    this.on(document, "keydown", (e) => {
      if (e.defaultPrevented || !this.#matches(e)) return;
      e.preventDefault();
      if (this.open) this.close();
      else this.show();
    });
  }

  /** Wires the dialog, field and list there are now (once per set), gives new options ids, and filters again. */
  #wire(): void {
    const dialog = this.dialog;
    const input = this.input;
    const list = this.querySelector<HTMLElement>('[role="listbox"]');
    if (!dialog || !input || !list) return;
    this.#id ||= `blip-command-${++uid}`;
    list.id ||= `${this.#id}-list`;
    for (const o of this.options) o.id ||= `${this.#id}-option-${this.#n++}`;
    if (this.#parts[0] !== dialog || this.#parts[1] !== input || this.#parts[2] !== list) this.#listen(dialog, input, list);
    this.#filter(true);
  }

  #listen(dialog: HTMLDialogElement, input: HTMLInputElement, list: HTMLElement): void {
    this.#wiring?.abort();
    this.#parts = [dialog, input, list];
    const signal = both(this.signal, (this.#wiring = new AbortController()).signal);
    const listen = (target: EventTarget, type: string, fn: (e: KeyboardEvent & MouseEvent) => void) => target.addEventListener(type, fn as EventListener, { signal });
    Object.entries({ role: "combobox", "aria-expanded": "true", "aria-autocomplete": "list", "aria-controls": list.id, autocomplete: "off" }).forEach(([k, v]) => input.setAttribute(k, v));
    // Opened or closed any way (show(), a commandfor button, showModal(), Escape): reflected, announced, and opened
    // fresh. (show() has reset it already; what was typed since must stay.)
    const opened = new MutationObserver(() => {
      const open = dialog.open;
      if (open === this.#shown) return;
      this.#shown = open;
      if (open && !this.#showing) this.#reset();
      this.#showing = false;
      this.#quiet = true;
      if (open) this.setAttribute("open", "");
      else this.removeAttribute("open");
      this.#quiet = false;
      this.emit(open ? "open" : "close");
    });
    opened.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    signal.addEventListener("abort", () => opened.disconnect(), { once: true });
    listen(input, "input", () => this.#filter());
    listen(input, "keydown", (e) => {
      const visible = this.#visible();
      const i = visible.indexOf(this.#active as HTMLElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (visible.length) this.#activate(visible[(i + (e.key === "ArrowDown" ? 1 : -1) + visible.length) % visible.length]!);
      } else if (e.key === "Enter" && this.#active && !e.isComposing) {
        e.preventDefault();
        this.#choose(this.#active);
      }
    });
    listen(list, "click", (e) => {
      const option = (e.target as Element).closest<HTMLElement>(OPTION);
      if (option) this.#choose(option);
    });
    listen(list, "pointermove", (e) => {
      const option = (e.target as Element).closest<HTMLElement>(OPTION);
      if (option && option !== this.#active && option.getAttribute("aria-disabled") !== "true") this.#activate(option, false);
    });
    // A click on the scrim (outside the panel) closes it, where closedby="any" is not supported.
    listen(dialog, "click", (e) => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) this.close();
    });
    if (isOn(this, "open") && !dialog.open) this.show();
  }
}

BlipElement.define("blip-command", BlipCommand);

declare global {
  interface HTMLElementTagNameMap {
    "blip-command": BlipCommand;
  }
}
