/**
 * Roving focus: one item in a group is tabbable; arrow keys move between items, Home and End jump to the ends.
 * Used by tabs, menus, toolbars, segmented controls, radio groups, grids of tiles.
 */
export interface RovingOptions {
  /** Items, re-read on every key so added or removed items just work. */
  items: () => HTMLElement[];
  orientation?: "horizontal" | "vertical" | "both";
  loop?: boolean;
  /** Called after focus moves. */
  onMove?: (item: HTMLElement, index: number) => void;
  signal?: AbortSignal;
}

export function rovingFocus(container: HTMLElement, options: RovingOptions): { focus: (i: number) => void; sync: () => void } {
  const { orientation = "horizontal", loop = true } = options;
  const usable = (el: HTMLElement) => !el.hasAttribute("disabled") && el.getAttribute("aria-disabled") !== "true";
  const enabled = () => options.items().filter(usable);
  const sync = (active?: HTMLElement) => {
    const items = options.items();
    // The tab stop is never a disabled item while there is one that can be used: a disabled button can't take focus,
    // and the arrow keys only move between usable items.
    const current = active ?? items.find((el) => el.tabIndex === 0 && usable(el)) ?? enabled()[0] ?? items.find((el) => el.tabIndex === 0);
    items.forEach((el) => (el.tabIndex = el === current ? 0 : -1));
  };
  const focus = (i: number) => {
    const items = enabled();
    if (!items.length) return;
    const index = loop ? (i + items.length) % items.length : Math.max(0, Math.min(items.length - 1, i));
    const item = items[index]!;
    sync(item);
    item.focus();
    options.onMove?.(item, index);
  };
  const keys: Record<string, number> = {};
  if (orientation !== "vertical") Object.assign(keys, { ArrowRight: 1, ArrowLeft: -1 });
  if (orientation !== "horizontal") Object.assign(keys, { ArrowDown: 1, ArrowUp: -1 });
  container.addEventListener("keydown", (e) => {
    const all = options.items();
    const at = all.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    let next: number | undefined;
    const rtl = getComputedStyle(container).direction === "rtl";
    if (e.key in keys) {
      const step = keys[e.key]! * (rtl && e.key.startsWith("Arrow") && orientation !== "vertical" && (e.key === "ArrowLeft" || e.key === "ArrowRight") ? -1 : 1);
      // Focus may sit on a disabled item (an aria-disabled one that was clicked): it still has a place in the line,
      // so step from there to the next usable item in that direction.
      const here = all.slice(0, at).filter(usable).length;
      next = usable(all[at]!) ? here + step : step > 0 ? here : here - 1;
    } else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = enabled().length - 1;
    if (next === undefined) return;
    e.preventDefault();
    focus(next);
  }, { signal: options.signal });
  container.addEventListener("focusin", (e) => {
    const t = e.target as HTMLElement;
    if (options.items().includes(t)) sync(t);
  }, { signal: options.signal });
  sync();
  return { focus, sync: () => sync() };
}
