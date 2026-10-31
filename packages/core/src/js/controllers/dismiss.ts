/**
 * Dismiss: closes a floating thing on Escape or a press outside it (menus, popovers, comboboxes). Native popovers
 * and <dialog> already do this; use it for anything else.
 */
export function dismiss(el: HTMLElement, options: { onDismiss: (reason: "escape" | "outside") => void; inside?: () => Element[]; signal?: AbortSignal }): void {
  const within = (t: EventTarget | null) => t instanceof Node && [el, ...(options.inside?.() ?? [])].some((x) => x.contains(t));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !e.defaultPrevented) options.onDismiss("escape");
  }, { signal: options.signal });
  document.addEventListener("pointerdown", (e) => {
    if (!within(e.target)) options.onDismiss("outside");
  }, { signal: options.signal, capture: true });
  document.addEventListener("focusin", (e) => {
    if (!within(e.target)) options.onDismiss("outside");
  }, { signal: options.signal });
}
