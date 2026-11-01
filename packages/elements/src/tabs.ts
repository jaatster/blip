/**
 * <blip-tabs>: WAI-ARIA tabs over the tabs markup (see components/tabs.css).
 *
 * Wires the ids and aria-controls/aria-labelledby, keeps one tab in the tab order, moves with the arrow keys, Home and
 * End (roving focus), selects on focus (automatic) or on Enter and Space (activation="manual"), shows the selected
 * panel, and adds two buttons that scroll an overflowing row a few tabs at a time, in steps. Tabs and panels added
 * or removed later (by a framework, after data arrives) are wired as they come.
 *
 *   <blip-tabs data-variant="outline" activation="manual" value="sound">…</blip-tabs>
 *   tabs.value = "display";
 *   tabs.addEventListener("blip-change", (e) => console.log(e.detail.value, e.detail.index));
 */
import { BlipElement, rovingFocus, frames, duration, pixel, warn } from "@blip/core";
import { both, valueOf, watch } from "./_dom.js";

export interface TabsChangeDetail {
  /** The tab's value: its data-value, else its value attribute, else its label. */
  value: string;
  index: number;
  tab: HTMLElement;
  panel: HTMLElement | null;
}

const TIER: Record<string, string> = { soft: "soft", outline: "outline", underline: "ghost" };
const enabled = (t: Element) => t.getAttribute("aria-disabled") !== "true" && !t.hasAttribute("disabled");
let uid = 0;

/**
 * WAI-ARIA tabs over the tabs markup: ids and ARIA wired, one tab in the tab order, the arrow keys, Home and End,
 * the selected panel shown, and stepped scroll buttons for a row that overflows. Tabs and panels added or removed
 * later are wired as they come.
 *
 * @summary Tabs: one panel at a time.
 * @attr {string} value - The selected tab's value: its data-value, else its value attribute, else its label.
 * Setting it selects that tab (no blip-change); it follows the person's choice.
 * @attr {"auto" | "manual"} [activation="auto"] - Select on focus, or only on Enter, Space and click.
 * @attr {"soft" | "outline" | "underline"} data-variant - The tabs' tier; each tab gets the matching box variant.
 * @attr {"sm" | "md" | "lg"} [data-size="md"] - 16, 20 or 24 pixels high, like buttons.
 * @fires {CustomEvent<TabsChangeDetail>} blip-change - After the person selects a tab.
 */
export class BlipTabs extends BlipElement {
  static override classes = ["blip-tabs"];
  static observedAttributes = ["value"];

  #id = "";
  #n = 0;
  #quiet = false;
  /** The tab list wired now, and what aborts its wiring when it goes. */
  #list: HTMLElement | null = null;
  #wiring?: AbortController;
  #update?: () => void;

  /** The tab list: the first [role=tablist] child. */
  get list(): HTMLElement | null {
    return this.querySelector(':scope > [role="tablist"]');
  }

  /** The tabs, in order. */
  get tabs(): HTMLElement[] {
    return [...(this.list?.children ?? [])].filter((el): el is HTMLElement => el.getAttribute("role") === "tab");
  }

  /** The selected tab's value. Setting it selects that tab (no blip-change). */
  get value(): string {
    const tab = this.tabs[this.selectedIndex];
    return tab ? valueOf(tab) : (this.getAttribute("value") ?? "");
  }
  set value(v: string) {
    this.setAttribute("value", v);
  }

  /** The index of the selected tab, or -1. Setting it selects that tab (no blip-change). */
  get selectedIndex(): number {
    return this.tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
  }
  set selectedIndex(index: number) {
    const tab = this.tabs[index];
    if (tab) this.#select(tab);
  }

  attributeChangedCallback(_name: string, _old: string | null, value: string | null): void {
    if (this.#quiet || value === null) return;
    const tab = this.tabs.find((t) => valueOf(t) === value);
    if (tab) this.#select(tab);
  }

  #panel(tab: HTMLElement): HTMLElement | null {
    const id = tab.getAttribute("aria-controls");
    return id ? document.getElementById(id) : null;
  }

  #select(tab: HTMLElement, user = false): void {
    if (tab.getAttribute("aria-selected") === "true" && user) return;
    const tabs = this.tabs;
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const p = this.#panel(t);
      if (p) p.hidden = !on;
    }
    const value = valueOf(tab);
    this.#quiet = true;
    this.setAttribute("value", value);
    this.#quiet = false;
    if (user) this.emit<TabsChangeDetail>("change", { value, index: tabs.indexOf(tab), tab, panel: this.#panel(tab) });
  }

  protected override connected(): void {
    this.#list = null;
    this.#wire();
    // Children rendered later (or taken away) are wired as they come.
    watch(this, this.signal, () => this.#wire());
    // A row of other children with no tab list is a mistake; no children yet is content still to come.
    if (!this.list && [...this.children].some((c) => !c.matches(".blip-tabs-scroll"))) warn("BLIP-N001", "<blip-tabs> needs a [role=tablist] child.", this);
  }

  /** Wires what is there now: ids, ARIA, tiers and pairs, one selected tab, its panel shown. Runs again whenever
      tabs or panels come or go. */
  #wire(): void {
    const list = this.list;
    if (list !== this.#list) {
      this.#wiring?.abort();
      this.#wiring = undefined;
      this.#list = list;
      if (list) this.#listen(list, both(this.signal, (this.#wiring = new AbortController()).signal));
    }
    const tabs = this.tabs;
    if (!list || !tabs.length) return;
    const id = (this.#id ||= this.id || `blip-tabs-${++uid}`);
    const tier = TIER[this.dataset.variant ?? ""];
    // Pair each tab with a panel: its aria-controls, else the next panel no tab has claimed, in order.
    const panels = [...this.querySelectorAll<HTMLElement>(':scope > [role="tabpanel"]')];
    const claimed = new Set(tabs.map((t) => this.#panel(t)).filter((p): p is HTMLElement => !!p && panels.includes(p)));
    const free = panels.filter((p) => !claimed.has(p));
    for (const tab of tabs) {
      tab.id ||= `${id}-tab-${this.#n++}`;
      if (tier && !tab.dataset.variant) tab.dataset.variant = tier;
      let panel = this.#panel(tab);
      if (!panel || !panels.includes(panel)) panel = free.shift() ?? null;
      if (!panel) continue;
      panel.id ||= `${id}-panel-${this.#n++}`;
      tab.setAttribute("aria-controls", panel.id);
      panel.setAttribute("aria-labelledby", tab.id);
      if (!panel.hasAttribute("tabindex")) panel.tabIndex = 0;
    }
    // One selected tab: the one the value names, else the one marked selected, else the first that can be used.
    const want = this.getAttribute("value");
    const pick =
      (want !== null ? tabs.find((t) => valueOf(t) === want) : undefined) ??
      tabs.find((t) => t.getAttribute("aria-selected") === "true") ??
      tabs.find(enabled) ??
      tabs[0]!;
    this.#select(pick);
    this.#update?.();
  }

  /** The keys, clicks and scroll buttons of one tab list, until it goes. */
  #listen(list: HTMLElement, signal: AbortSignal): void {
    const vertical = list.getAttribute("aria-orientation") === "vertical";
    const pick = (tab: HTMLElement) => enabled(tab) && this.#select(tab, true);
    rovingFocus(list, {
      items: () => this.tabs,
      orientation: vertical ? "both" : "horizontal",
      onMove: (tab) => this.getAttribute("activation") !== "manual" && pick(tab),
      signal,
    });
    list.addEventListener("click", (e) => {
      const tab = (e.target as Element).closest<HTMLElement>('[role="tab"]');
      if (tab && this.tabs.includes(tab)) pick(tab);
    }, { signal });
    // Coming back into the list lands on the selected tab, even after arrowing elsewhere (manual activation).
    list.addEventListener("focusout", (e) => {
      if (!list.contains(e.relatedTarget as Node | null)) this.tabs.forEach((t) => (t.tabIndex = t.getAttribute("aria-selected") === "true" ? 0 : -1));
    }, { signal });
    if (!vertical) this.#overflow(list, signal);
  }

  /** Scroll buttons for a row that does not fit: added once, shown only while it overflows. */
  #overflow(list: HTMLElement, signal: AbortSignal): void {
    const buttons = (["start", "end"] as const).map((dir) => {
      let b = this.querySelector<HTMLElement>(`:scope > .blip-tabs-scroll[data-dir="${dir}"]`);
      if (!b) {
        b = document.createElement("span");
        b.className = "blip-box blip-tabs-scroll";
        Object.assign(b.dataset, { dir, variant: "soft", blipInteractive: "" });
        b.setAttribute("aria-hidden", "true");
        b.append(document.createElement("span"));
        this.append(b);
      }
      b.addEventListener("click", () => {
        // A few tabs at a time, in four steps of whole pixels.
        const px = pixel(this);
        const step = Math.max(px, Math.round((list.clientWidth * 0.6) / 4 / px) * px);
        const sign = (dir === "end" ? 1 : -1) * (getComputedStyle(list).direction === "rtl" ? -1 : 1);
        frames(4, duration("frame", 40), () => list.scrollBy(sign * step, 0), { signal });
      }, { signal });
      return b;
    });
    const update = (this.#update = () => {
      const max = list.scrollWidth - list.clientWidth;
      const x = Math.abs(list.scrollLeft);
      this.toggleAttribute("data-overflow", max > 1);
      buttons[0]!.setAttribute("aria-disabled", String(x < 1));
      buttons[1]!.setAttribute("aria-disabled", String(x > max - 1));
    });
    const observer = new ResizeObserver(update);
    observer.observe(list);
    signal.addEventListener("abort", () => {
      observer.disconnect();
      if (this.#update === update) this.#update = undefined;
    }, { once: true });
    list.addEventListener("scroll", update, { passive: true, signal });
    // Start with the selected tab in view, without scrolling the page.
    const tab = this.tabs[this.selectedIndex];
    if (tab && tab.offsetLeft + tab.offsetWidth > list.clientWidth) list.scrollLeft = tab.offsetLeft - list.clientWidth / 2;
  }
}

BlipElement.define("blip-tabs", BlipTabs);

declare global {
  interface HTMLElementTagNameMap {
    "blip-tabs": BlipTabs;
  }
}
