/**
 * <chu-attract>: the script reader and the still frame. A script is steps split by ";" (not inside quotes); each step
 * becomes an object, as the steps property takes them. A step it cannot read, or whose selector matches nothing in
 * it, is reported with its text and left out, and never throws. With less motion asked for, the demo shows its still
 * frame at once: the state once the step marked poster is done, or the end without one; when motion is allowed
 * again, its markup comes back first.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { BlipAttract } from "../../../packages/effects/src/attract.ts";
import { mount } from "../support/dom.ts";

const html = document.documentElement;
beforeAll(async () => {
  await import("../../../packages/effects/src/attract.ts");
});
afterEach(() => {
  delete html.dataset.chuMotion;
  vi.restoreAllMocks();
});

const demo = (script: string, inner = "") => mount<BlipAttract>(`<chu-attract label="A demo" script="${script.replace(/"/g, "&quot;")}">${inner}</chu-attract>`);
/** The console's Blip warnings, from now on. */
const warnings = () => {
  const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  return () => spy.mock.calls.map((c) => String(c[0]));
};
/** The demo has set itself up (it waits for the elements inside and the fonts). */
const ready = (el: BlipAttract) => expect.poll(() => el.querySelector(".chu-attract-pointer")?.hidden).toBe(false);

describe("the script", () => {
  it("reads each verb into a step, with poster on its own", () => {
    const el = demo(`move #a; press .b > button; type #title 'Ship it'; wait 500ms; wait 2s; wait 2 beats; wait 300; show #toast; hide #hint; poster`);
    expect(el.steps).toEqual([
      { move: "#a" },
      { press: ".b > button" },
      { type: "#title", text: "Ship it" },
      { wait: "500ms" },
      { wait: "2s" },
      { wait: "2 beats" },
      { wait: "300" },
      { show: "#toast" },
      { hide: "#hint" },
      { poster: true },
    ]);
  });

  it("keeps quoted text whole, semicolons and the other quote included, after a selector with quotes of its own", () => {
    const el = demo(`type [name='title'] "it's; done"; type #b 'say "hi"'`);
    expect(el.steps).toEqual([{ type: "[name='title']", text: "it's; done" }, { type: "#b", text: 'say "hi"' }]);
  });

  it("leaves out a step it cannot read, says so with the step's text, and reads the rest", () => {
    const said = warnings();
    const el = demo(`move #a; jump #b; type #c; wait soon; press; move #d`);
    expect(() => el.steps).not.toThrow();
    expect(el.steps).toEqual([{ move: "#a" }, { move: "#d" }]);
    const lines = said().filter((l) => l.includes("CHU-D010"));
    for (const step of ["jump #b", "type #c", "wait soon", "press"]) expect(lines.some((l) => l.includes(`"${step}"`)), step).toBe(true);
  });

  it("takes steps as objects, and goes back to the script for null", () => {
    const el = demo(`move #a`);
    el.steps = [{ press: "#b" }, { poster: true }];
    expect(el.steps).toEqual([{ press: "#b" }, { poster: true }]);
    el.steps = null;
    expect(el.steps).toEqual([{ move: "#a" }]);
  });
});

describe("the still frame", () => {
  const markup = `
    <span class="chu-box chu-input"><input id="f"></span>
    <button id="b" type="button" onclick="this.dataset.clicked = 'yes'">Save</button>
    <p id="late" hidden>Later</p>`;

  it("is the state once the step marked poster is done: typed, pressed (its click ran), nothing after", async () => {
    html.dataset.chuMotion = "reduce";
    const el = demo(`move #f; type #f 'Hi'; press #b; poster; show #late`, markup);
    await ready(el);
    expect(el.querySelector<HTMLInputElement>("#f")!.value).toBe("Hi");
    expect(el.querySelector<HTMLElement>("#b")!.dataset.clicked).toBe("yes");
    expect(el.querySelector<HTMLElement>("#late")!.hidden).toBe(true);
    // The pointer rests on what it pressed, which shows the hover look; the field it left does not.
    expect(el.querySelector("#b")!.getAttribute("data-chu-state")).toBe("hover");
    expect(el.querySelector(".chu-input")!.hasAttribute("data-chu-state")).toBe(false);
  });

  it("is the end without a poster", async () => {
    html.dataset.chuMotion = "reduce";
    const el = demo(`type #f 'Hi'; press #b; show #late`, markup);
    await ready(el);
    expect(el.querySelector<HTMLElement>("#late")!.hidden).toBe(false);
  });

  it("skips a step whose selector matches nothing, says so with the step, and shows the rest", async () => {
    const said = warnings();
    html.dataset.chuMotion = "reduce";
    const el = demo(`press #nowhere-to-be-found; show #late`, markup);
    await ready(el);
    expect(el.querySelector<HTMLElement>("#late")!.hidden).toBe(false);
    expect(said().some((l) => l.includes("CHU-D011") && l.includes('"press #nowhere-to-be-found"'))).toBe(true);
  });

  it("follows the steps property", async () => {
    html.dataset.chuMotion = "reduce";
    const el = demo(`show #late`, markup);
    await ready(el);
    el.steps = [{ type: "#f", text: "Yo", poster: true }, { show: "#late" }];
    expect(el.querySelector<HTMLInputElement>("#f")!.value).toBe("Yo");
    expect(el.querySelector<HTMLElement>("#late")!.hidden).toBe(true);
  });

  it("gives its markup back when motion is allowed again, field values included", async () => {
    html.dataset.chuMotion = "reduce";
    const el = demo(`type #f 'Hi'; press #b; show #late`, markup);
    await ready(el);
    delete html.dataset.chuMotion;
    await expect.poll(() => el.querySelector<HTMLInputElement>("#f")!.value).toBe("");
    expect(el.querySelector<HTMLElement>("#b")!.dataset.clicked).toBeUndefined();
    expect(el.querySelector<HTMLElement>("#late")!.hidden).toBe(true);
  });

  it("is one picture: an image named by label, its markup inert", async () => {
    const el = demo(`press #b`, markup);
    await ready(el);
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("A demo");
    for (const c of el.children) expect(c.hasAttribute("inert"), c.outerHTML).toBe(true);
  });
});
