/**
 * BlipElement, the base of every Blip Web Component: one AbortSignal per connection (aborted on disconnect, so
 * nothing leaks), set-up deferred while the page is still parsing, events, classes and safe definition.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { BlipElement } from "@jaatster/blip-core";
import { mount } from "../support/dom.ts";

let n = 0;
/** Defines a fresh test element (tags can't be redefined) that records its life. */
function define(extra: { box?: boolean; classes?: string[] } = {}) {
  const tag = `blip-test-${++n}`;
  const log: string[] = [];
  class TestElement extends BlipElement {
    static override box = extra.box ?? false;
    static override classes = extra.classes ?? [];
    resized = 0;
    protected override connected(): void {
      log.push("connected");
      this.on(window, "resize", () => this.resized++);
    }
    protected override disconnected(): void {
      log.push("disconnected");
    }
    /** emit is protected: let the tests call it. */
    fire<T>(name: string, detail?: T, cancelable?: boolean): boolean {
      return this.emit(name, detail, cancelable);
    }
    has(name: string): boolean {
      return this.flag(name);
    }
  }
  BlipElement.define(tag, TestElement);
  return { tag, log, make: () => document.createElement(tag) as TestElement };
}

describe("BlipElement: one signal per connection", () => {
  it("aborts the signal when the element is removed", () => {
    const { make } = define();
    const el = document.body.appendChild(make());
    const signal = el.signal;
    expect(signal.aborted).toBe(false);
    el.remove();
    expect(signal.aborted).toBe(true);
  });

  it("gives a fresh signal when the element comes back", () => {
    const { make, log } = define();
    const el = document.body.appendChild(make());
    const first = el.signal;
    el.remove();
    document.body.append(el);
    expect(el.signal).not.toBe(first);
    expect(el.signal.aborted).toBe(false);
    expect(first.aborted).toBe(true);
    expect(log).toEqual(["connected", "disconnected", "connected"]);
    el.remove();
  });

  it("aborts the listeners added with on() on disconnect", () => {
    const { make } = define();
    const el = document.body.appendChild(make());
    window.dispatchEvent(new Event("resize"));
    expect(el.resized).toBe(1);
    el.remove();
    window.dispatchEvent(new Event("resize"));
    expect(el.resized).toBe(1);
  });

  it("sets up again after a move without doubling its listeners", () => {
    const { make, log } = define();
    const el = document.body.appendChild(make());
    const box = mount("<div></div>");
    box.append(el);
    expect(log).toEqual(["connected", "disconnected", "connected"]);
    window.dispatchEvent(new Event("resize"));
    expect(el.resized).toBe(1);
  });
});

describe("BlipElement: while the page is still loading", () => {
  afterEach(() => {
    delete (document as { readyState?: string }).readyState;
  });
  const loading = () => Object.defineProperty(document, "readyState", { configurable: true, get: () => "loading" });

  it("waits for DOMContentLoaded before setting up, so its children exist", () => {
    const { make, log } = define();
    loading();
    const el = document.body.appendChild(make());
    expect(log).toEqual([]);
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(log).toEqual(["connected"]);
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(log).toEqual(["connected"]);
    el.remove();
  });

  it("never sets up if it was removed before the page finished loading", () => {
    const { make, log } = define();
    loading();
    const el = document.body.appendChild(make());
    el.remove();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(log).toEqual(["disconnected"]);
  });

  it("sets up at once when the page has loaded", () => {
    const { make, log } = define();
    mount("<div></div>").append(make());
    expect(log).toEqual(["connected"]);
  });
});

describe("BlipElement: events, classes, attributes", () => {
  it("emits blip-<name> events that bubble and are composed, with detail", () => {
    const { make } = define();
    const host = mount("<div></div>");
    const el = host.appendChild(make());
    const heard = vi.fn();
    host.addEventListener("blip-change", heard);
    expect(el.fire("change", { value: 3 })).toBe(true);
    const event = heard.mock.calls[0]![0] as CustomEvent;
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event.detail).toEqual({ value: 3 });
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.cancelable).toBe(false);
  });

  it("returns false from a cancelable event a listener refused", () => {
    const { make } = define();
    const el = mount("<div></div>").appendChild(make());
    el.addEventListener("blip-before-close", (e) => e.preventDefault());
    expect(el.fire("before-close", { reason: "escape" }, true)).toBe(false);
    // Not cancelable: preventDefault does nothing.
    el.addEventListener("blip-close", (e) => e.preventDefault());
    expect(el.fire("close")).toBe(true);
  });

  it("adds blip-box and its classes when it connects", () => {
    const { make } = define({ box: true, classes: ["blip-thing", "blip-thing-ready"] });
    const el = mount("<div></div>").appendChild(make());
    expect([...el.classList]).toEqual(["blip-box", "blip-thing", "blip-thing-ready"]);
  });

  it("adds no classes by default", () => {
    const { make } = define();
    const el = mount("<div></div>").appendChild(make());
    expect(el.className).toBe("");
  });

  it("reads boolean attributes with flag()", () => {
    const { make } = define();
    const el = make();
    expect(el.has("open")).toBe(false);
    el.setAttribute("open", "");
    expect(el.has("open")).toBe(true);
  });

  it("defines a tag once: a second definition is ignored, not an error", () => {
    const { tag } = define();
    const first = customElements.get(tag);
    class Other extends BlipElement {}
    expect(() => BlipElement.define(tag, Other)).not.toThrow();
    expect(customElements.get(tag)).toBe(first);
  });
});
