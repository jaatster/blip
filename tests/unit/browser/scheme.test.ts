/**
 * Schemes: setScheme sets one; autoScheme follows the clock (a provided one here), switching Day, Sunset and Night
 * at 6:00, 17:00 and 19:00, checking every minute, and fading the later changes.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { autoScheme, provide, setScheme } from "@jaatster/blip-core";
import { mount } from "../support/dom.ts";

describe("setScheme", () => {
  it("sets data-pp-scheme on the page, or on one section", () => {
    const section = mount("<section></section>");
    setScheme("night", section);
    expect(section.dataset.ppScheme).toBe("night");
    const before = document.documentElement.dataset.ppScheme;
    setScheme("sunset");
    expect(document.documentElement.dataset.ppScheme).toBe("sunset");
    if (before === undefined) delete document.documentElement.dataset.ppScheme;
    else document.documentElement.dataset.ppScheme = before;
  });
});

describe("autoScheme", () => {
  let time = new Date(2026, 5, 21, 16, 58);
  let restore: () => void;
  beforeEach(() => {
    vi.useFakeTimers();
    time = new Date(2026, 5, 21, 16, 58);
    restore = provide({ clock: () => time });
  });
  afterEach(() => {
    restore();
    vi.useRealTimers();
  });

  it("sets the scheme for the provided clock at once, without a fade", () => {
    const section = mount("<section></section>");
    const stop = autoScheme(section);
    expect(section.dataset.ppScheme).toBe("day");
    expect(section.hasAttribute("data-pp-scheme-auto")).toBe(true);
    expect(section.hasAttribute("data-pp-scheme-fade")).toBe(false);
    stop();
  });

  it("checks the clock every minute and fades to the next scheme, announcing it", () => {
    const section = mount("<section></section>");
    const changes: string[] = [];
    section.addEventListener("pp-scheme-change", (e) => changes.push((e as CustomEvent<{ scheme: string }>).detail.scheme));
    const stop = autoScheme(section);
    expect(changes).toEqual(["day"]);
    time = new Date(2026, 5, 21, 16, 59);
    vi.advanceTimersByTime(60_000);
    expect(changes).toEqual(["day"]);
    time = new Date(2026, 5, 21, 17, 0);
    vi.advanceTimersByTime(60_000);
    expect(section.dataset.ppScheme).toBe("sunset");
    expect(section.hasAttribute("data-pp-scheme-fade")).toBe(true);
    time = new Date(2026, 5, 21, 19, 0);
    vi.advanceTimersByTime(60_000);
    expect(changes).toEqual(["day", "sunset", "night"]);
    stop();
  });

  it("does not fade with fade: false", () => {
    const section = mount("<section></section>");
    const stop = autoScheme(section, { fade: false });
    time = new Date(2026, 5, 21, 17, 30);
    vi.advanceTimersByTime(60_000);
    expect(section.dataset.ppScheme).toBe("sunset");
    expect(section.hasAttribute("data-pp-scheme-fade")).toBe(false);
    stop();
  });

  it("stops following the clock when stopped, and clears its marks", () => {
    const section = mount("<section></section>");
    const stop = autoScheme(section);
    time = new Date(2026, 5, 21, 17, 0);
    vi.advanceTimersByTime(60_000);
    stop();
    expect(section.hasAttribute("data-pp-scheme-auto")).toBe(false);
    expect(section.hasAttribute("data-pp-scheme-fade")).toBe(false);
    time = new Date(2026, 5, 21, 23, 0);
    vi.advanceTimersByTime(5 * 60_000);
    expect(section.dataset.ppScheme).toBe("sunset");
  });
});
