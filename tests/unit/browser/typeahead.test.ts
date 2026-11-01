/**
 * typeahead: typing letters jumps to the next item whose label starts with them (menus, listboxes, inventories).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { typeahead } from "@blip/core";
import { focused, mount, press } from "../support/dom.ts";

/** A list of fruit buttons with typeahead, focusing whatever matches (as menus do). */
function list(names = ["Apple", "Banana", "Blueberry", "Cherry", "Blackberry"], label?: (el: HTMLElement) => string) {
  const root = mount(`<div>${names.map((n) => `<button>${n}</button>`).join("")}</div>`);
  const items = () => [...root.querySelectorAll<HTMLElement>("button")];
  const stop = new AbortController();
  const onMatch = vi.fn((el: HTMLElement) => el.focus());
  typeahead(root, { items, onMatch, label, signal: stop.signal });
  items()[0]!.focus();
  const type = (text: string) => [...text].forEach((c) => press(c));
  return { root, items, onMatch, type, stop: () => stop.abort() };
}

describe("typeahead", () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it("jumps to the next item that starts with a letter, case aside", () => {
    const l = list();
    l.type("b");
    expect(focused()).toBe("Banana");
    vi.advanceTimersByTime(500);
    l.type("C");
    expect(focused()).toBe("Cherry");
  });

  it("cycles through the items with the same first letter when the letter is typed again after a pause", () => {
    const l = list();
    const seen: (string | undefined)[] = [];
    for (let i = 0; i < 4; i++) {
      l.type("b");
      seen.push(focused());
      vi.advanceTimersByTime(500);
    }
    expect(seen).toEqual(["Banana", "Blueberry", "Blackberry", "Banana"]);
  });

  it("matches several letters typed quickly as one word", () => {
    const l = list();
    l.type("bla");
    expect(focused()).toBe("Blackberry");
    expect(l.onMatch).toHaveBeenLastCalledWith(l.items()[4]);
  });

  it("starts a new word after 500 ms", () => {
    const l = list();
    l.type("b");
    vi.advanceTimersByTime(499);
    l.type("l");
    expect(focused()).toBe("Blueberry");
    vi.advanceTimersByTime(500);
    l.type("c");
    expect(focused()).toBe("Cherry");
  });

  it("keeps the focus where it is when nothing matches", () => {
    const l = list();
    l.type("z");
    expect(focused()).toBe("Apple");
    expect(l.onMatch).not.toHaveBeenCalled();
  });

  it("ignores keys with Ctrl, Meta or Alt, and keys that are not characters", () => {
    const l = list();
    press("b", { ctrlKey: true });
    press("b", { metaKey: true });
    press("b", { altKey: true });
    press("ArrowDown");
    press("Enter");
    expect(l.onMatch).not.toHaveBeenCalled();
  });

  it("leaves a first Space to the item (it presses it), but takes a space inside a word", () => {
    const l = list(["Apple", "Sky islands", "Sky castle"]);
    press(" ");
    expect(l.onMatch).not.toHaveBeenCalled();
    l.type("sky c");
    expect(focused()).toBe("Sky castle");
  });

  it("reads labels with the label option", () => {
    const l = list(["1", "2", "3"], (el) => ["zero", "one", "two", "three"][Number(el.textContent)]!);
    l.type("t");
    expect(focused()).toBe("2");
    vi.advanceTimersByTime(500);
    l.type("th");
    expect(focused()).toBe("3");
  });

  it("stops listening when its signal aborts", () => {
    const l = list();
    l.stop();
    l.type("b");
    expect(l.onMatch).not.toHaveBeenCalled();
  });
});
