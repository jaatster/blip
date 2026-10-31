/** DOM helpers for the browser tests. */
import { afterEach } from "vitest";

const mounted = new Set<Element>();
afterEach(() => {
  for (const el of mounted) el.remove();
  mounted.clear();
});

/** Puts HTML into a fresh container at the end of the body (removed after each test) and returns its first element. */
export function mount<T extends HTMLElement = HTMLElement>(html: string): T {
  const box = document.body.appendChild(document.createElement("div"));
  box.innerHTML = html.trim();
  mounted.add(box);
  return box.firstElementChild as T;
}

/**
 * Dispatches a keydown as pressing a key does, on the focused element unless told otherwise. Returns whether the page
 * handled it (called preventDefault).
 */
export function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.activeElement ?? document.body): boolean {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, composed: true, ...init });
  target.dispatchEvent(event);
  return event.defaultPrevented;
}

/** The text of the focused element. */
export const focused = (): string | undefined => document.activeElement?.textContent?.trim();
