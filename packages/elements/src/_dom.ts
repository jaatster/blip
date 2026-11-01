/**
 * What the elements share about the DOM they upgrade (private: not part of the API).
 *
 * - isOn(el, name): a boolean attribute is on when it is present and not "false". A framework that sets attributes
 *   on an element before it is defined writes open="false" for false; that is off, as the property false is.
 * - unFalse(el, name, value): takes a boolean attribute written "false" off the element (true if it did). The
 *   platform reads disabled and readonly on a form-associated element by presence alone, so "false" must go.
 * - watch(root, signal, fn) and observe(…, relevant): call fn when elements are added inside root or removed from it
 *   (or when `relevant` says so), so content a framework renders later (tabs, options, an error) is wired as it
 *   arrives. What fn changes itself is not reported back.
 * - valueOf(el): what an item reports as its value: its data-value, else its value attribute, else its label.
 */

/** Is a boolean attribute on? Present, and not "false". */
export const isOn = (el: Element, name: string): boolean => {
  const v = el.getAttribute(name);
  return v !== null && v !== "false";
};

/** Takes off a boolean attribute written "false" (the change comes back as a removal). True if it did. */
export const unFalse = (el: Element, name: string, value: string | null): boolean => {
  if (value !== "false") return false;
  el.removeAttribute(name);
  return true;
};

/** A record that adds or removes elements (text changing inside them does not count). */
export const elementsChanged = (r: MutationRecord): boolean =>
  r.type === "childList" && [...r.addedNodes, ...r.removedNodes].some((n) => n.nodeType === 1);

/**
 * Calls fn whenever the DOM inside root changes in a way `relevant` cares about, until signal aborts. Mutations fn
 * makes itself are dropped, so it never feeds itself.
 */
export function observe(root: Node, signal: AbortSignal, fn: () => void, relevant: (r: MutationRecord) => boolean, init: MutationObserverInit = {}): MutationObserver {
  const observer = new MutationObserver((records) => {
    if (!records.some(relevant)) return;
    fn();
    observer.takeRecords();
  });
  observer.observe(root, { childList: true, subtree: true, ...init });
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  return observer;
}

/** Calls fn whenever elements are added inside root or removed from it (by default anywhere inside it). */
export const watch = (root: Node, signal: AbortSignal, fn: () => void, init?: MutationObserverInit): MutationObserver => observe(root, signal, fn, elementsChanged, init);

/** An item's value: data-value, else value, else its label (its text, unless one is given). */
export const valueOf = (el: Element, label?: string): string =>
  el.getAttribute("data-value") ?? el.getAttribute("value") ?? label ?? el.textContent?.replace(/\s+/g, " ").trim() ?? "";

/** A signal that aborts with either of two: the connection's and one part's wiring. */
export const both = (a: AbortSignal, b: AbortSignal): AbortSignal => AbortSignal.any([a, b]);
