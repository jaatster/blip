/**
 * <blip-wheel>: the wheels a time or a date builds in the page's language and their order, the spin button each wheel
 * is (names, value text, the keys), a short month dropping its last days, custom wheels from selects, the form
 * (value, reset, disabled), and the mouse wheel and a drag turning a wheel and settling on a row.
 */
import { afterEach, beforeEach, describe, expect, inject, it, vi } from "vitest";
import wheelCss from "../../../packages/components/src/wheel.css?raw";
import type { BlipWheel } from "../../../packages/elements/src/wheel.ts";
import "../../../packages/elements/src/wheel.ts";
import { mount, press } from "../support/dom.ts";

let style: HTMLStyleElement;
beforeEach(() => {
  style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + wheelCss }));
  // Settles at once, so each test reads the end of a move.
  document.documentElement.dataset.blipMotion = "reduce";
});
afterEach(() => {
  style.remove();
  delete document.documentElement.dataset.blipMotion;
  vi.restoreAllMocks();
});

const wheel = (html: string, lang = "en-US") => mount(`<form lang="${lang}">${html}</form>`).firstElementChild as BlipWheel;
const spins = (w: Element) => [...w.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
const said = (w: Element) => spins(w).map((s) => s.getAttribute("aria-valuetext"));

describe("blip-wheel: time", () => {
  it("builds hours, minutes and AM/PM in English, named and valued, and sends HH:MM", () => {
    const w = wheel(`<blip-wheel class="blip-box blip-wheel" name="alarm" data-type="time" value="19:45"></blip-wheel>`);
    expect(spins(w).map((s) => s.getAttribute("aria-label"))).toEqual(["hour", "minute", "AM/PM"]);
    expect(said(w)).toEqual(["7", "45", "PM"]);
    expect(spins(w)[1]!.getAttribute("aria-valuenow")).toBe("45");
    expect(spins(w)[1]!.getAttribute("aria-valuemax")).toBe("59");
    expect(w.value).toBe("19:45");
    expect(new FormData(w.closest("form")!).get("alarm")).toBe("19:45");
    expect(w.querySelector(".blip-wheel-option[data-current]")!.textContent).toBe("7");
  });

  it("uses a 24-hour clock where the language does, and steps the minutes", () => {
    const w = wheel(`<blip-wheel class="blip-box blip-wheel" data-type="time" minute-step="15" value="08:40"></blip-wheel>`, "de");
    expect(spins(w)).toHaveLength(2);
    expect(said(w)).toEqual(["08", "30"]);
    expect(w.value).toBe("08:30");
  });

  it("turns with the keys, as a spin button: Up one more, Page Up five, Home and End to the ends", () => {
    const w = wheel(`<blip-wheel class="blip-box blip-wheel" data-type="time" hours="24" value="10:00"></blip-wheel>`);
    const events: string[] = [];
    for (const type of ["input", "change", "blip-change"]) w.addEventListener(type, (e) => events.push(type + ((e as CustomEvent).detail?.value ? ` ${(e as CustomEvent).detail.value}` : "")));
    const hour = spins(w)[0]!;
    hour.focus();
    expect(press("ArrowUp")).toBe(true);
    expect(w.value).toBe("11:00");
    expect(events).toEqual(["input", "change", "blip-change 11:00"]);
    press("ArrowDown");
    press("PageUp");
    expect(w.value).toBe("15:00");
    press("End");
    expect(w.value).toBe("23:00");
    press("Home");
    expect(w.value).toBe("00:00");
    expect(press("Tab")).toBe(false);
  });
});

describe("blip-wheel: date", () => {
  it("builds day, month and year in the language's order, months by name, years from min to max", () => {
    const us = wheel(`<blip-wheel class="blip-box blip-wheel" data-type="date" min="1990" max="2030" value="2024-02-29"></blip-wheel>`);
    expect(spins(us).map((s) => s.getAttribute("aria-label"))).toEqual(["month", "day", "year"]);
    expect(said(us)).toEqual(["February", "29", "2024"]);
    expect(spins(us)[2]!.getAttribute("aria-valuemin")).toBe("1990");
    const fr = wheel(`<blip-wheel class="blip-box blip-wheel" data-type="date" value="2024-02-29"></blip-wheel>`, "fr");
    expect(said(fr)).toEqual(["29", "février", "2024"]);
  });

  it("drops the days a short month doesn't have", () => {
    const w = wheel(`<blip-wheel class="blip-box blip-wheel" data-type="date" value="2023-01-31"></blip-wheel>`);
    spins(w)[0]!.focus();
    press("ArrowUp");
    expect(w.value).toBe("2023-02-28");
    const days = [...w.querySelectorAll<HTMLElement>(".blip-wheel-column:nth-child(2) .blip-wheel-option")];
    expect(days.filter((d) => !d.hidden)).toHaveLength(28);
    expect(spins(w)[1]!.getAttribute("aria-valuemax")).toBe("28");
  });
});

describe("blip-wheel: your own wheels", () => {
  const ORDER = `<blip-wheel class="blip-box blip-wheel" name="order">
      <select name="scoops" aria-label="Scoops"><option>1</option><option selected>2</option><option>3</option></select>
      <select name="flavour" aria-label="Flavour"><option value="berry">Berry</option><option value="mint" selected>Mint</option></select>
    </blip-wheel>`;

  it("makes a wheel of each select, starting on its selected option, and sends only its own value", () => {
    const w = wheel(ORDER);
    const form = w.closest("form")!;
    expect(spins(w).map((s) => s.getAttribute("aria-label"))).toEqual(["Scoops", "Flavour"]);
    expect(said(w)).toEqual(["2", "Mint"]);
    // Custom wheels count rows, from 1.
    expect(spins(w)[1]!.getAttribute("aria-valuenow")).toBe("2");
    expect([...form.querySelectorAll("select")].every((s) => s.hidden && s.disabled)).toBe(true);
    expect([...new FormData(form)]).toEqual([["order", "2 mint"]]);
  });

  it("goes back to where it started on a form reset, and follows a value set later", () => {
    const w = wheel(ORDER);
    spins(w)[0]!.focus();
    press("ArrowUp");
    expect(w.value).toBe("3 mint");
    w.closest("form")!.reset();
    expect(w.value).toBe("2 mint");
    w.value = "1 berry";
    expect(said(w)).toEqual(["1", "Berry"]);
  });

  it("is switched off by disabled: no tab stops, no keys", () => {
    const w = wheel(ORDER.replace('name="order"', 'name="order" disabled'));
    expect(spins(w).map((s) => [s.tabIndex, s.getAttribute("aria-disabled")])).toEqual([[-1, "true"], [-1, "true"]]);
    spins(w)[0]!.focus();
    press("ArrowUp", {}, spins(w)[0]);
    expect(w.value).toBe("2 mint");
    w.removeAttribute("disabled");
    expect(spins(w)[0]!.tabIndex).toBe(0);
  });
});

describe("blip-wheel: pointers", () => {
  it("turns a row for a mouse wheel's notch, and keeps the page still", () => {
    const w = wheel(`<blip-wheel class="blip-box blip-wheel" data-type="time" hours="24" value="10:00"></blip-wheel>`);
    const list = w.querySelector(".blip-wheel-list")!;
    const notch = new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true });
    list.dispatchEvent(notch);
    expect(notch.defaultPrevented).toBe(true);
    expect(w.value).toBe("11:00");
  });

  it("follows a drag a whole pixel at a time, then settles on the nearest row", async () => {
    vi.spyOn(Element.prototype, "setPointerCapture").mockImplementation(() => {});
    const w = wheel(`<blip-wheel class="blip-box blip-wheel" data-type="time" hours="24" value="10:00"></blip-wheel>`);
    const col = w.querySelector(".blip-wheel-column")!;
    const list = w.querySelector<HTMLElement>(".blip-wheel-list")!;
    const row = list.firstElementChild!.getBoundingClientRect().height;
    expect(row).toBe(32);
    const at = (y: number) => ({ pointerId: 7, pointerType: "touch", clientY: y, bubbles: true, cancelable: true });
    const down = new PointerEvent("pointerdown", at(300));
    list.firstElementChild!.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(spins(w)[0]);
    col.dispatchEvent(new PointerEvent("pointermove", at(300 - 2.3 * row)));
    // Two rows and a bit up: 12 is on the band, and the list sits on a whole pixel.
    expect(w.value).toBe("12:00");
    expect(Math.abs(parseFloat(getComputedStyle(list).translate.split(" ")[1]!)) % 2).toBe(0);
    await new Promise((r) => setTimeout(r, 120));
    col.dispatchEvent(new PointerEvent("pointerup", at(300 - 2.3 * row)));
    expect(list.style.getPropertyValue("--_blip-wheel-at")).toBe("12");
    expect(w.value).toBe("12:00");
  });
});
