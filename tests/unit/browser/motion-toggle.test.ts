/**
 * The page's motion setting and its toggle. reducedMotion() is true when the device or the page (data-chu-motion=
 * "reduce" on <html>) asks for less motion, live. <chu-motion-toggle> makes a real button, or wires the one it holds;
 * its aria-pressed follows the attribute whoever sets it, and pressing it (pointer, Enter, Space) sets and clears the
 * attribute and remembers the choice. Its module applies a remembered choice as it loads.
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { reducedMotion } from "@jaatster/blip-core";
import type { BlipMotionToggle } from "../../../packages/effects/src/motion.ts";
import { mount } from "../support/dom.ts";

const html = document.documentElement;
const KEY = "blip:motion";
/** What the module found when it loaded with a choice remembered from an earlier visit. */
let remembered: string | undefined;
beforeAll(async () => {
  localStorage.setItem(KEY, "reduce");
  await import("../../../packages/effects/src/motion.ts");
  remembered = html.dataset.chuMotion;
  delete html.dataset.chuMotion;
  localStorage.removeItem(KEY);
});
afterEach(async () => {
  delete html.dataset.chuMotion;
  localStorage.removeItem(KEY);
  await commands.emulateMedia("no-preference");
});

const pressed = (b: Element) => b.getAttribute("aria-pressed");
const button = (html: string) => mount(html).querySelector("button")!;

describe("reducedMotion", () => {
  it("is true while the page asks for less motion, live", () => {
    expect(reducedMotion()).toBe(false);
    html.dataset.chuMotion = "reduce";
    expect(reducedMotion()).toBe(true);
    html.dataset.chuMotion = "full";
    expect(reducedMotion()).toBe(false);
    delete html.dataset.chuMotion;
    expect(reducedMotion()).toBe(false);
  });

  it("still follows the device's setting, which the page only adds to", async () => {
    await commands.emulateMedia("reduce");
    await expect.poll(reducedMotion).toBe(true);
    html.dataset.chuMotion = "reduce";
    delete html.dataset.chuMotion;
    expect(reducedMotion()).toBe(true);
  });
});

describe("<chu-motion-toggle>", () => {
  it("applies a choice remembered from an earlier visit as its module loads", () => {
    expect(remembered).toBe("reduce");
  });

  it("makes a soft button with the pause icon and its label, not pressed while things move", () => {
    const b = button(`<chu-motion-toggle></chu-motion-toggle>`);
    expect(b.type).toBe("button");
    expect(b.className).toBe("chu-box chu-button");
    expect(b.dataset.variant).toBe("soft");
    // The pause icon of @jaatster/blip-icons, hidden from assistive technology: the label names the button.
    expect(b.querySelector("svg.chu-icon[aria-hidden='true'] > path")!.getAttribute("d")).toBe("M2 2h3v8H2zm5 0h3v8H7z");
    expect(b.textContent).toBe("Pause motion");
    expect(pressed(b)).toBe("false");
  });

  it("takes its words from label, as it changes, and mirrors it as a property", () => {
    const toggle = mount<BlipMotionToggle>(`<chu-motion-toggle label="Bewegung anhalten"></chu-motion-toggle>`);
    expect(toggle.querySelector("button")!.textContent).toBe("Bewegung anhalten");
    toggle.label = "Stop the sky";
    expect(toggle.getAttribute("label")).toBe("Stop the sky");
    expect(toggle.querySelector("button")!.textContent).toBe("Stop the sky");
    toggle.label = null;
    expect(toggle.hasAttribute("label")).toBe(false);
    expect(toggle.querySelector("button")!.textContent).toBe("Pause motion");
  });

  it("pauses the page when pressed, remembers it, and lets go when pressed again, by pointer or keyboard", async () => {
    const b = button(`<chu-motion-toggle></chu-motion-toggle>`);
    await userEvent.click(b);
    expect(html.dataset.chuMotion).toBe("reduce");
    expect(reducedMotion()).toBe(true);
    expect(pressed(b)).toBe("true");
    expect(localStorage.getItem(KEY)).toBe("reduce");
    b.focus();
    await userEvent.keyboard("{Enter}");
    expect(html.hasAttribute("data-chu-motion")).toBe(false);
    expect(pressed(b)).toBe("false");
    expect(localStorage.getItem(KEY)).toBeNull();
    await userEvent.keyboard(" ");
    expect(html.dataset.chuMotion).toBe("reduce");
    expect(pressed(b)).toBe("true");
  });

  it("keeps every toggle on the page in step with the attribute, whoever sets it", async () => {
    const a = button(`<chu-motion-toggle></chu-motion-toggle>`);
    const b = button(`<chu-motion-toggle></chu-motion-toggle>`);
    html.dataset.chuMotion = "reduce";
    await expect.poll(() => [pressed(a), pressed(b)]).toEqual(["true", "true"]);
    await userEvent.click(b);
    expect([pressed(a), pressed(b)]).toEqual(["false", "false"]);
    // A toggle that connects while the page is paused shows it at once.
    html.dataset.chuMotion = "reduce";
    expect(pressed(button(`<chu-motion-toggle></chu-motion-toggle>`))).toBe("true");
  });

  it("wires a button of its own, leaving what it shows, and one rendered later", async () => {
    const toggle = mount(`<chu-motion-toggle><button class="chu-box chu-button" type="button" data-icon-only aria-label="Pause motion"><svg class="chu-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2h3v8H2zm5 0h3v8H7z"/></svg></button></chu-motion-toggle>`);
    const own = toggle.querySelector("button")!;
    expect(toggle.querySelectorAll("button")).toHaveLength(1);
    expect(own.textContent).toBe("");
    expect(pressed(own)).toBe("false");
    await userEvent.click(own);
    expect(html.dataset.chuMotion).toBe("reduce");
    expect(pressed(own)).toBe("true");
    const late = toggle.appendChild(Object.assign(document.createElement("button"), { type: "button", textContent: "Still" }));
    await expect.poll(() => pressed(late)).toBe("true");
    await userEvent.click(late);
    expect(html.hasAttribute("data-chu-motion")).toBe(false);
    expect([pressed(own), pressed(late)]).toEqual(["false", "false"]);
  });
});
