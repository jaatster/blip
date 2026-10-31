/**
 * <pp-tabs>: WAI-ARIA tabs over the tabs markup (see components/tabs.css).
 *
 * Wires the ids and aria-controls/aria-labelledby, keeps one tab in the tab order, moves with the arrow keys, Home and
 * End (roving focus), selects on focus (automatic) or on Enter and Space (activation="manual"), shows the selected
 * panel, and adds two buttons that scroll an overflowing row a few tabs at a time, in steps.
 *
 *   <pp-tabs data-variant="outline" activation="manual">…</pp-tabs>
 *   tabs.selected = 2;
 *   tabs.addEventListener("pp-change", (e) => console.log(e.detail.index));
 */
import { PixelElement, rovingFocus, frames, duration, pixel, warn } from "@jaatster/blip-core";

export interface TabsChangeDetail {
  index: number;
  tab: HTMLElement;
  panel: HTMLElement | null;
}

const TIER: Record<string, string> = { soft: "soft", outline: "outline", underline: "ghost" };
let uid = 0;

export class PixelTabs extends PixelElement {
  static override classes = ["pp-tabs"];
  static observedAttributes = ["selected"];

  /** The tab list: the first [role=tablist] child. */
  get list(): HTMLElement | null {
    return this.querySelector(':scope > [role="tablist"]');
  }

  /** The tabs, in order. */
  get tabs(): HTMLElement[] {
    return [...(this.list?.children ?? [])].filter((el): el is HTMLElement => el.getAttribute("role") === "tab");
  }

  /** The index of the selected tab, or -1. Setting it selects that tab (no pp-change). */
  get selected(): number {
    return this.tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
  }
  set selected(index: number) {
    const tab = this.tabs[index];
    if (tab) this.#select(tab);
  }

  attributeChangedCallback(_name: string, _old: string | null, value: string | null): void {
    if (value !== null && Number(value) !== this.selected) this.selected = Number(value);
  }

  #panel(tab: HTMLElement): HTMLElement | null {
    return document.getElementById(tab.getAttribute("aria-controls") ?? "");
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
    const index = tabs.indexOf(tab);
    this.setAttribute("selected", String(index));
    if (user) this.emit<TabsChangeDetail>("change", { index, tab, panel: this.#panel(tab) });
  }

  protected override connected(): void {
    const list = this.list;
    if (!list) return warn("PP-T001", "<pp-tabs> needs a [role=tablist] child.", this);
    const signal = this.signal;
    const id = this.id || `pp-tabs-${++uid}`;
    const panels = [...this.querySelectorAll<HTMLElement>(':scope > [role="tabpanel"]')];
    const tier = TIER[this.dataset.variant ?? ""];
    const vertical = list.getAttribute("aria-orientation") === "vertical";
    const tabs = this.tabs;
    tabs.forEach((tab, i) => {
      tab.id ||= `${id}-tab-${i}`;
      if (tier && !tab.dataset.variant) tab.dataset.variant = tier;
      const panel = this.#panel(tab) ?? panels[i];
      if (!panel) return;
      panel.id ||= `${id}-panel-${i}`;
      tab.setAttribute("aria-controls", panel.id);
      panel.setAttribute("aria-labelledby", tab.id);
      if (!panel.hasAttribute("tabindex")) panel.tabIndex = 0;
    });

    const enabled = (t: Element) => t.getAttribute("aria-disabled") !== "true" && !t.hasAttribute("disabled");
    const pick = (tab: HTMLElement) => enabled(tab) && this.#select(tab, true);
    rovingFocus(list, {
      items: () => this.tabs,
      orientation: vertical ? "both" : "horizontal",
      onMove: (tab) => this.getAttribute("activation") !== "manual" && pick(tab),
      signal,
    });
    this.on(list, "click", (e) => {
      const tab = (e.target as Element).closest<HTMLElement>('[role="tab"]');
      if (tab && this.tabs.includes(tab)) pick(tab);
    });
    // Coming back into the list lands on the selected tab, even after arrowing elsewhere (manual activation).
    this.on(list, "focusout", (e) => {
      if (!list.contains(e.relatedTarget as Node | null)) this.tabs.forEach((t) => (t.tabIndex = t.getAttribute("aria-selected") === "true" ? 0 : -1));
    });

    const first = tabs[Number(this.getAttribute("selected") ?? NaN)] ?? tabs.find((t) => t.getAttribute("aria-selected") === "true") ?? tabs.find(enabled);
    if (first) this.#select(first);
    if (!vertical) this.#overflow(list, signal);
  }

  /** Scroll buttons for a row that does not fit: added once, shown only while it overflows. */
  #overflow(list: HTMLElement, signal: AbortSignal): void {
    const buttons = (["start", "end"] as const).map((dir) => {
      let b = this.querySelector<HTMLElement>(`:scope > .pp-tabs-scroll[data-dir="${dir}"]`);
      if (!b) {
        b = document.createElement("span");
        b.className = "pp-box pp-tabs-scroll";
        Object.assign(b.dataset, { dir, variant: "soft", ppInteractive: "" });
        b.setAttribute("aria-hidden", "true");
        b.append(document.createElement("span"));
        this.append(b);
      }
      this.on(b, "click", () => {
        // A few tabs at a time, in four steps of whole pixels.
        const px = pixel(this);
        const step = Math.max(px, Math.round((list.clientWidth * 0.6) / 4 / px) * px);
        const sign = (dir === "end" ? 1 : -1) * (getComputedStyle(list).direction === "rtl" ? -1 : 1);
        frames(4, duration("frame", 40), () => list.scrollBy(sign * step, 0), { signal });
      });
      return b;
    });
    const update = () => {
      const max = list.scrollWidth - list.clientWidth;
      const x = Math.abs(list.scrollLeft);
      this.toggleAttribute("data-overflow", max > 1);
      buttons[0]!.setAttribute("aria-disabled", String(x < 1));
      buttons[1]!.setAttribute("aria-disabled", String(x > max - 1));
    };
    const observer = new ResizeObserver(update);
    observer.observe(list);
    signal.addEventListener("abort", () => observer.disconnect(), { once: true });
    this.on(list, "scroll", update, { passive: true });
    // Start with the selected tab in view, without scrolling the page.
    const tab = this.tabs[this.selected];
    if (tab && tab.offsetLeft + tab.offsetWidth > list.clientWidth) list.scrollLeft = tab.offsetLeft - list.clientWidth / 2;
  }
}

PixelElement.define("pp-tabs", PixelTabs);

declare global {
  interface HTMLElementTagNameMap {
    "pp-tabs": PixelTabs;
  }
  interface HTMLElementEventMap {
    "pp-change": CustomEvent<TabsChangeDetail>;
  }
}
