/** Typeahead: typing letters jumps to the next item whose label starts with them (menus, listboxes, selects). */
export function typeahead(container: HTMLElement, options: { items: () => HTMLElement[]; label?: (el: HTMLElement) => string; onMatch: (el: HTMLElement) => void; signal?: AbortSignal }): void {
  let buffer = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const label = options.label ?? ((el: HTMLElement) => el.textContent?.trim().toLowerCase() ?? "");
  container.addEventListener("keydown", (e) => {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey || (e.key === " " && !buffer)) return;
    buffer += e.key.toLowerCase();
    clearTimeout(timer);
    timer = setTimeout(() => (buffer = ""), 500);
    const items = options.items();
    const start = Math.max(0, items.indexOf(document.activeElement as HTMLElement));
    const ordered = [...items.slice(start + (buffer.length === 1 ? 1 : 0)), ...items.slice(0, start + (buffer.length === 1 ? 1 : 0))];
    const match = ordered.find((el) => label(el).startsWith(buffer));
    if (match) options.onMatch(match);
  }, { signal: options.signal });
  options.signal?.addEventListener("abort", () => clearTimeout(timer), { once: true });
}
