/**
 * Helpers for the interaction stories (src/interactions). Input goes through the real browser when the stories run
 * under Vitest (vitest-setup.ts hands over Vitest's userEvent, which drives Chromium through Playwright, so key presses
 * are trusted and native dialogs and popovers react to them). In the Storybook UI there is no such thing, so input is
 * simulated with Testing Library, and an Escape the page itself did not handle is delivered the way the browser
 * delivers it: as a close request to the topmost light-dismiss popover or modal dialog.
 */
import { expect, userEvent as simulated, waitFor } from "storybook/test";

interface Input {
  keyboard(text: string): Promise<unknown>;
  click(element: Element): Promise<unknown>;
  hover(element: Element): Promise<unknown>;
  unhover(element: Element): Promise<unknown>;
}

/** Vitest's userEvent when running under Vitest, else undefined. */
const trusted = (): Input | undefined => (globalThis as { __ppTrustedInput?: Input }).__ppTrustedInput;
const input = (): Input => trusted() ?? (simulated as unknown as Input);

/** Keys, in Testing Library's syntax: "{ArrowDown}", "{Enter}", " ", "abc", "{Shift>}{Tab}{/Shift}". */
export const press = (keys: string): Promise<unknown> => input().keyboard(keys);
export const click = (el: Element): Promise<unknown> => input().click(el);
export const hover = (el: Element): Promise<unknown> => input().hover(el);
export const unhover = (el: Element): Promise<unknown> => input().unhover(el);

/** Presses Escape. Simulated, it is not trusted, so if nothing on the page took it, close what the browser would. */
export async function escape(): Promise<void> {
  if (trusted()) return void (await press("{Escape}"));
  let handled = false;
  const watch = (e: KeyboardEvent) => (handled ||= e.key === "Escape" && e.defaultPrevented);
  window.addEventListener("keydown", watch);
  await simulated.keyboard("{Escape}");
  window.removeEventListener("keydown", watch);
  if (handled) return;
  const popover = [...document.querySelectorAll<HTMLElement>('[popover]:not([popover="manual"])')].reverse().find((p) => p.matches(":popover-open"));
  const modal = [...document.querySelectorAll("dialog")].reverse().find((d) => d.matches(":modal"));
  if (popover) popover.hidePopover();
  else (modal as (HTMLDialogElement & { requestClose?: () => void }) | undefined)?.requestClose?.();
}

/** Focuses an element from script (no pointer), as a keyboard user arriving there would. */
export function focus(el: HTMLElement): void {
  el.focus({ focusVisible: true } as FocusOptions);
}

/** Collects the `detail` of every `type` event that reaches `target`. */
export function events<T = unknown>(target: EventTarget, type: string): T[] {
  const seen: T[] = [];
  target.addEventListener(type, (e) => seen.push((e as CustomEvent<T>).detail));
  return seen;
}

/** Finds one element in the story or fails with a clear message. */
export function one<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`The example has no ${selector}.`);
  return el;
}

/** The element that has focus now. */
export const active = (): Element | null => document.activeElement;

/** Waits until `el` has focus. */
export const focused = (el: Element): Promise<void> => waitFor(() => expect(document.activeElement).toBe(el));

/** Waits `ms` of real time (for timers that are the behaviour under test, such as a hold or a toast's countdown). */
export const wait = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));
