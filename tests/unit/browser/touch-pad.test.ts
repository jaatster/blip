/**
 * <blip-touch-pad> (game kit): the parts it draws and names, the real key events it sends (key, code, keyCode) to its
 * target or the focused element, several fingers at once, a thumb rolled across the D-pad, focus left where it was,
 * a screen reader's tap, and nothing left held down.
 */
import { afterEach, beforeEach, describe, expect, inject, it, vi } from "vitest";
import padCss from "../../../packages/game/src/touch-pad.css?raw";
import "../../../packages/game/src/touch-pad.ts";
import { mount } from "../support/dom.ts";

let style: HTMLStyleElement;
beforeEach(() => {
  style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + padCss }));
  vi.spyOn(Element.prototype, "setPointerCapture").mockImplementation(() => {});
});
afterEach(() => {
  style.remove();
  vi.restoreAllMocks();
});

/** A game that records the keys it hears, and a pad for it. */
function game(attrs = 'for="game"') {
  const root = mount(`<div><div id="game" tabindex="0"></div><blip-touch-pad data-show="always" data-position="inline" ${attrs}></blip-touch-pad></div>`);
  const keys: string[] = [];
  const hear = (e: KeyboardEvent) => keys.push(`${e.type} ${e.key} ${e.code} ${e.keyCode}`);
  document.addEventListener("keydown", hear);
  document.addEventListener("keyup", hear);
  const target = root.querySelector<HTMLElement>("#game")!;
  const seen: EventTarget[] = [];
  target.addEventListener("keydown", (e) => seen.push(e.target!));
  const pad = root.querySelector("blip-touch-pad")!;
  const part = (sel: string) => pad.querySelector<HTMLElement>(sel)!;
  const done = () => {
    document.removeEventListener("keydown", hear);
    document.removeEventListener("keyup", hear);
  };
  return { pad, part, keys, seen, target, done };
}

/** A finger at the middle of an element, nudged by dx and dy. */
const touch = (type: string, el: Element, id: number, dx = 0, dy = 0) => {
  const r = el.getBoundingClientRect();
  const e = new PointerEvent(type, { pointerId: id, pointerType: "touch", clientX: r.left + r.width / 2 + dx, clientY: r.top + r.height / 2 + dy, bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  return e;
};

describe("blip-touch-pad", () => {
  it("draws a named group: four arms, B and A, and Start only when asked for", () => {
    const { pad, done } = game('data-start=""');
    expect(pad.getAttribute("role")).toBe("group");
    expect(pad.getAttribute("aria-label")).toBe("Game controls");
    const buttons = [...pad.querySelectorAll('[role="button"]')];
    expect(buttons.map((b) => b.getAttribute("aria-label") ?? b.textContent)).toEqual(["Up", "Right", "Down", "Left", "Start", "B", "A"]);
    expect(buttons.map((b) => b.getAttribute("aria-keyshortcuts"))).toEqual(["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft", "Enter", "x", "z"]);
    // Never in the tab order.
    expect(buttons.every((b) => (b as HTMLElement).tabIndex < 0)).toBe(true);
    done();
    expect(game().pad.querySelector('[data-button="start"]')).toBeNull();
  });

  it("sends real keydown and keyup events, with key, code and keyCode, to its target", () => {
    const { part, keys, seen, target, done } = game('for="game" data-a=" " data-b="Shift"');
    const a = part('[data-button="a"]');
    touch("pointerdown", a, 1);
    expect(a.hasAttribute("data-blip-pressed")).toBe(true);
    touch("pointerup", a, 1);
    expect(a.hasAttribute("data-blip-pressed")).toBe(false);
    expect(keys).toEqual(["keydown   Space 32", "keyup   Space 32"]);
    expect(seen).toEqual([target]);
    done();
  });

  it("takes several fingers at once: up and A held together, each let go on its own", () => {
    const { part, keys, done } = game();
    const dpad = part(".blip-touch-pad-dpad");
    const a = part('[data-button="a"]');
    touch("pointerdown", dpad, 1, 0, -40);
    touch("pointerdown", a, 2);
    expect(part('[data-dir="up"]').hasAttribute("data-blip-pressed")).toBe(true);
    touch("pointerup", dpad, 1);
    touch("pointerup", a, 2);
    expect(keys).toEqual(["keydown ArrowUp ArrowUp 38", "keydown z KeyZ 90", "keyup ArrowUp ArrowUp 38", "keyup z KeyZ 90"]);
    done();
  });

  it("follows a thumb rolled across the D-pad, and presses nothing on its middle", () => {
    const { part, keys, done } = game();
    const dpad = part(".blip-touch-pad-dpad");
    touch("pointerdown", dpad, 1, -40, 0);
    touch("pointermove", dpad, 1, -38, 5);
    touch("pointermove", dpad, 1, 5, 40);
    touch("pointermove", dpad, 1, 2, 2);
    touch("pointerup", dpad, 1, 2, 2);
    expect(keys).toEqual(["keydown ArrowLeft ArrowLeft 37", "keyup ArrowLeft ArrowLeft 37", "keydown ArrowDown ArrowDown 40", "keyup ArrowDown ArrowDown 40"]);
    done();
  });

  it("sends one keydown for two fingers on one button, and keeps focus where it was", () => {
    const { part, keys, target, done } = game('data-b="x"');
    target.focus();
    const b = part('[data-button="b"]');
    expect(touch("pointerdown", b, 1).defaultPrevented).toBe(true);
    touch("pointerdown", b, 2);
    touch("pointerup", b, 1);
    expect(b.hasAttribute("data-blip-pressed")).toBe(true);
    touch("pointerup", b, 2);
    expect(keys).toEqual(["keydown x KeyX 88", "keyup x KeyX 88"]);
    // Without for, keys go to the focused element, which kept focus.
    expect(document.activeElement).toBe(target);
    done();
  });

  it("presses briefly for a screen reader's double tap (a click with no pointer)", async () => {
    const { part, keys, done } = game();
    part('[data-dir="right"]').click();
    expect(keys).toEqual(["keydown ArrowRight ArrowRight 39"]);
    await new Promise((r) => setTimeout(r, 150));
    expect(keys).toEqual(["keydown ArrowRight ArrowRight 39", "keyup ArrowRight ArrowRight 39"]);
    done();
  });

  it("lets everything go when the window loses focus or the pad goes away", () => {
    const { pad, part, keys, done } = game();
    touch("pointerdown", part('[data-button="a"]'), 1);
    window.dispatchEvent(new Event("blur"));
    touch("pointerdown", part('[data-button="b"]'), 2);
    pad.remove();
    expect(keys).toEqual(["keydown z KeyZ 90", "keyup z KeyZ 90", "keydown x KeyX 88", "keyup x KeyX 88"]);
    done();
  });
});
