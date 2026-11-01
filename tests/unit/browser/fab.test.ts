/**
 * <chu-fab>: the action button's speed dial, as a WAI-ARIA menu button. The button says what it opens and whether it
 * is open; opening focuses the item nearest the button; the arrow keys move along the stack as it looks (it runs
 * upward); Escape and choosing an item close it and give focus back to the button; Tab closes it where focus goes.
 */
import { describe, expect, it } from "vitest";
import type { BlipFab } from "../../../packages/elements/src/fab.ts";
import "../../../packages/elements/src/fab.ts";
import { focused, mount, press } from "../support/dom.ts";

const DIAL = `
  <chu-fab class="chu-fab-dial" data-position="static">
    <button class="chu-box chu-fab" data-icon-only aria-label="Create">+</button>
    <div class="chu-fab-menu" role="menu" aria-label="Create" hidden>
      <button class="chu-box chu-fab-action" role="menuitem" data-value="photo">Photo</button>
      <button class="chu-box chu-fab-action" role="menuitem">Clip</button>
      <button class="chu-box chu-fab-action" role="menuitem">Note</button>
    </div>
  </chu-fab>`;

const record = (el: Element, ...types: string[]) => {
  const seen: [string, unknown][] = [];
  for (const type of types) el.addEventListener(type, (e) => seen.push([type, (e as CustomEvent).detail]));
  return seen;
};

describe("<chu-fab>", () => {
  it("wires its button as a menu button, closed", () => {
    const fab = mount<BlipFab>(DIAL);
    const button = fab.trigger!;
    expect(fab.classList.contains("chu-fab-dial")).toBe(true);
    expect(button.getAttribute("aria-haspopup")).toBe("menu");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-controls")).toBe(fab.menu!.id);
    expect(button.getAttribute("type")).toBe("button");
    expect(fab.items.map((i) => i.tabIndex)).toEqual([-1, -1, -1]);
    expect(fab.open).toBe(false);
  });

  it("opens from its button, focusing the item nearest it, and says so", () => {
    const fab = mount<BlipFab>(DIAL);
    const seen = record(fab, "chu-open", "chu-close");
    fab.trigger!.click();
    expect(fab.open).toBe(true);
    expect(fab.hasAttribute("open")).toBe(true);
    expect(fab.trigger!.getAttribute("aria-expanded")).toBe("true");
    expect(focused()).toBe("Photo");
    fab.trigger!.click();
    expect(fab.open).toBe(false);
    expect(seen.map(([t]) => t)).toEqual(["chu-open", "chu-close"]);
  });

  it("moves up the stack with ArrowUp and back with ArrowDown, wrapping; Home and End jump", () => {
    const fab = mount<BlipFab>(DIAL);
    fab.trigger!.focus();
    expect(press("ArrowUp")).toBe(true);
    expect(focused()).toBe("Photo");
    press("ArrowUp");
    expect(focused()).toBe("Clip");
    press("ArrowDown");
    press("ArrowDown");
    expect(focused()).toBe("Note");
    press("Home");
    expect(focused()).toBe("Photo");
    press("End");
    expect(focused()).toBe("Note");
  });

  it("closes on Escape and gives focus back to the button", () => {
    const fab = mount<BlipFab>(DIAL);
    fab.show();
    press("Escape");
    expect(fab.open).toBe(false);
    expect(document.activeElement).toBe(fab.trigger);
    expect(fab.trigger!.getAttribute("aria-expanded")).toBe("false");
  });

  it("an item chosen is chu-action with its value; the stack closes unless the event is cancelled", () => {
    const fab = mount<BlipFab>(DIAL);
    const seen = record(fab, "chu-action");
    fab.show();
    fab.items[0]!.click();
    expect(fab.open).toBe(false);
    expect(document.activeElement).toBe(fab.trigger);
    fab.addEventListener("chu-action", (e) => e.preventDefault(), { once: true });
    fab.show();
    fab.items[1]!.click();
    expect(fab.open).toBe(true);
    expect(seen.map(([, d]) => (d as { value: string }).value)).toEqual(["photo", "Clip"]);
  });

  it("closes on Tab, and on a press outside it, without taking focus", () => {
    const fab = mount<BlipFab>(DIAL);
    fab.show();
    press("Tab");
    expect(fab.open).toBe(false);
    fab.show();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(fab.open).toBe(false);
  });

  it("opens and closes from its open attribute; \"false\" is off", () => {
    const fab = mount<BlipFab>(DIAL);
    fab.setAttribute("open", "");
    expect(fab.open).toBe(true);
    fab.setAttribute("open", "false");
    expect(fab.open).toBe(false);
    expect(fab.hasAttribute("open")).toBe(false);
  });
});
