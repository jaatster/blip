/**
 * rovingFocus: one item in a group is tabbable, and the arrow keys (Home, End) move between the items. Tabs, menus,
 * toolbars, segmented controls, radio groups and tile grids all use it.
 */
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { rovingFocus, type RovingOptions } from "@jaatster/blip-core";
import { focused, mount, press } from "../support/dom.ts";

/** A group of buttons named by their text, with rovingFocus on it. */
function group(buttons: string, options: Partial<RovingOptions> = {}, attrs = "") {
  const root = mount(`<div ${attrs}>${buttons}</div>`);
  const items = () => [...root.querySelectorAll<HTMLElement>("button")];
  const stop = new AbortController();
  const onMove = vi.fn();
  const api = rovingFocus(root, { items, onMove, signal: stop.signal, ...options });
  const stops = () => items().map((el) => el.tabIndex);
  const focus = (name: string) => items().find((el) => el.textContent === name)!.focus();
  return { root, items, api, onMove, stops, focus, stop: () => stop.abort() };
}
const ABCD = "<button>A</button><button>B</button><button>C</button><button>D</button>";

describe("rovingFocus: the tab stop", () => {
  it("makes the first item the only tab stop", () => {
    expect(group(ABCD).stops()).toEqual([0, -1, -1, -1]);
  });

  it("keeps the item that is already the tab stop", () => {
    const g = group('<button tabindex="-1">A</button><button>B</button><button tabindex="-1">C</button>');
    expect(g.stops()).toEqual([-1, 0, -1]);
  });

  it("starts on the first item that can be used, not a disabled one", () => {
    expect(group("<button disabled>A</button><button>B</button><button>C</button>").stops()).toEqual([-1, 0, -1]);
    expect(group('<button aria-disabled="true">A</button><button>B</button><button>C</button>').stops()).toEqual([-1, 0, -1]);
  });

  it("moves the tab stop to whatever item gets focus (a click)", () => {
    const g = group(ABCD);
    g.focus("C");
    expect(g.stops()).toEqual([-1, -1, 0, -1]);
  });

  it("sync() puts the tab stop back on one item after items change", () => {
    const g = group(ABCD);
    for (const el of g.items()) el.tabIndex = 0;
    g.api.sync();
    expect(g.stops()).toEqual([0, -1, -1, -1]);
  });
});

describe("rovingFocus: keys", () => {
  it("moves with ArrowRight and ArrowLeft, and handles the keys it uses", () => {
    const g = group(ABCD);
    g.focus("A");
    expect(press("ArrowRight")).toBe(true);
    expect(focused()).toBe("B");
    expect(g.stops()).toEqual([-1, 0, -1, -1]);
    press("ArrowRight");
    expect(focused()).toBe("C");
    press("ArrowLeft");
    expect(focused()).toBe("B");
  });

  it("jumps to the ends with Home and End", () => {
    const g = group(ABCD);
    g.focus("B");
    expect(press("End")).toBe(true);
    expect(focused()).toBe("D");
    expect(press("Home")).toBe(true);
    expect(focused()).toBe("A");
  });

  it("wraps round at the ends by default", () => {
    const g = group(ABCD);
    g.focus("D");
    press("ArrowRight");
    expect(focused()).toBe("A");
    press("ArrowLeft");
    expect(focused()).toBe("D");
  });

  it("stops at the ends with loop: false", () => {
    const g = group(ABCD, { loop: false });
    g.focus("D");
    press("ArrowRight");
    expect(focused()).toBe("D");
    g.focus("A");
    press("ArrowLeft");
    expect(focused()).toBe("A");
  });

  it("skips disabled items, native or ARIA", () => {
    const g = group('<button>A</button><button disabled>B</button><button aria-disabled="true">C</button><button>D</button>');
    g.focus("A");
    press("ArrowRight");
    expect(focused()).toBe("D");
    press("ArrowRight");
    expect(focused()).toBe("A");
  });

  it("moves on from a disabled item that has focus (it was clicked) to the next usable one in that direction", () => {
    const g = group('<button>A</button><button aria-disabled="true">B</button><button>C</button><button>D</button>');
    g.focus("B");
    expect(press("ArrowRight")).toBe(true);
    expect(focused()).toBe("C");
    expect(g.stops()).toEqual([-1, -1, 0, -1]);
    g.focus("B");
    press("ArrowLeft");
    expect(focused()).toBe("A");
    expect(g.onMove).toHaveBeenLastCalledWith(g.items()[0], 0);
  });

  it("steps past more disabled items from a disabled one, and wraps from a disabled end", () => {
    const g = group('<button>A</button><button aria-disabled="true">B</button><button aria-disabled="true">C</button><button>D</button><button aria-disabled="true">E</button>');
    g.focus("B");
    press("ArrowRight");
    expect(focused()).toBe("D");
    g.focus("C");
    press("ArrowLeft");
    expect(focused()).toBe("A");
    g.focus("E");
    press("ArrowRight");
    expect(focused()).toBe("A");
    g.focus("E");
    press("ArrowLeft");
    expect(focused()).toBe("D");
  });

  it("jumps to the usable ends with Home and End from a disabled item", () => {
    const g = group('<button aria-disabled="true">A</button><button>B</button><button aria-disabled="true">C</button><button>D</button><button aria-disabled="true">E</button>');
    g.focus("C");
    press("End");
    expect(focused()).toBe("D");
    g.focus("C");
    press("Home");
    expect(focused()).toBe("B");
  });

  it("moves on from a disabled item without looping, and flips in a right-to-left group", () => {
    const g = group('<button>A</button><button aria-disabled="true">B</button><button>C</button>', { loop: false });
    g.focus("B");
    press("ArrowRight");
    expect(focused()).toBe("C");
    g.focus("B");
    press("ArrowLeft");
    expect(focused()).toBe("A");
    const r = group('<button>A</button><button aria-disabled="true">B</button><button>C</button>', {}, 'dir="rtl"');
    r.focus("B");
    press("ArrowLeft");
    expect(focused()).toBe("C");
    r.focus("B");
    press("ArrowRight");
    expect(focused()).toBe("A");
  });

  it("uses Up and Down, not Left and Right, when vertical", () => {
    const g = group(ABCD, { orientation: "vertical" });
    g.focus("A");
    expect(press("ArrowRight")).toBe(false);
    expect(focused()).toBe("A");
    press("ArrowDown");
    expect(focused()).toBe("B");
    press("ArrowUp");
    expect(focused()).toBe("A");
  });

  it("uses all four arrows with orientation both", () => {
    const g = group(ABCD, { orientation: "both" });
    g.focus("A");
    press("ArrowDown");
    press("ArrowRight");
    expect(focused()).toBe("C");
    press("ArrowUp");
    expect(focused()).toBe("B");
  });

  it("leaves Up and Down alone when horizontal (the page can scroll)", () => {
    const g = group(ABCD);
    g.focus("B");
    expect(press("ArrowDown")).toBe(false);
    expect(press("ArrowUp")).toBe(false);
    expect(focused()).toBe("B");
  });

  it("flips Left and Right in a right-to-left group", () => {
    const g = group(ABCD, {}, 'dir="rtl"');
    g.focus("B");
    press("ArrowRight");
    expect(focused()).toBe("A");
    press("ArrowLeft");
    expect(focused()).toBe("B");
    press("ArrowLeft");
    expect(focused()).toBe("C");
  });

  it("does not flip Up and Down in a right-to-left group", () => {
    const g = group(ABCD, { orientation: "both" }, 'dir="rtl"');
    g.focus("B");
    press("ArrowDown");
    expect(focused()).toBe("C");
    press("ArrowLeft");
    expect(focused()).toBe("D");
  });

  it("calls onMove with the item and its index among the usable items", () => {
    const g = group('<button>A</button><button disabled>B</button><button>C</button>');
    g.focus("A");
    press("ArrowRight");
    expect(g.onMove).toHaveBeenCalledTimes(1);
    expect(g.onMove).toHaveBeenCalledWith(g.items()[2], 1);
  });

  it("ignores keys when focus is not on an item", () => {
    const g = group(ABCD);
    const outside = mount<HTMLButtonElement>("<button>Elsewhere</button>");
    outside.focus();
    expect(press("ArrowRight", {}, g.root)).toBe(false);
    expect(focused()).toBe("Elsewhere");
    expect(g.onMove).not.toHaveBeenCalled();
  });

  it("works with real key presses", async () => {
    const g = group(ABCD);
    g.focus("A");
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{End}{ArrowLeft}");
    expect(focused()).toBe("C");
  });

  it("focus(i) moves to the i-th usable item, wrapping", () => {
    const g = group(ABCD);
    g.api.focus(2);
    expect(focused()).toBe("C");
    g.api.focus(5);
    expect(focused()).toBe("B");
    expect(g.onMove).toHaveBeenLastCalledWith(g.items()[1], 1);
  });

  it("stops listening when its signal aborts", () => {
    const g = group(ABCD);
    g.focus("A");
    g.stop();
    expect(press("ArrowRight")).toBe(false);
    expect(focused()).toBe("A");
    g.focus("C");
    expect(g.stops()).toEqual([0, -1, -1, -1]);
  });
});
