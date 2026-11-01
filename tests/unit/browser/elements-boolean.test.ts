/**
 * A boolean attribute written as "false" is off. Vue and Svelte set attributes on an element that is not defined
 * yet, and write open="false" for false; when the element upgrades later, a dialog must not open on load. Each test
 * puts the markup in the page first, then defines the element (a subclass under a fresh tag, so it upgrades in place).
 */
import { describe, expect, it } from "vitest";
import { PixelCombobox, PixelCommand, PixelDialog, PixelMenu, PixelRating, PixelSegmented, PixelTooltip } from "../../../packages/elements/src/index.ts";
import { mount } from "../support/dom.ts";

const settle = () => new Promise((done) => setTimeout(done, 0));
let n = 0;
/** Mounts markup for a tag that is defined only afterwards, as a lazily loaded element is. */
function late<T extends HTMLElement>(base: CustomElementConstructor, markup: (tag: string) => string): T {
  const tag = `pp-late-${++n}`;
  const el = mount<T>(markup(tag));
  customElements.define(tag, class extends (base as unknown as typeof HTMLElement) {});
  return el;
}

describe('boolean attributes: "false" is off', () => {
  it('a dialog with open="false" stays closed when it upgrades, and opens and closes as the property says', async () => {
    const host = late<PixelDialog>(PixelDialog, (t) => `<${t} open="false" light-dismiss="false"><dialog class="pp-box pp-dialog" aria-label="Save">…</dialog></${t}>`);
    await settle();
    const dialog = host.querySelector("dialog")!;
    expect(dialog.open).toBe(false);
    expect(host.open).toBe(false);
    host.open = true;
    expect(dialog.open).toBe(true);
    expect(host.getAttribute("open")).toBe("");
    await host.close();
    expect(host.hasAttribute("open")).toBe(false);
  });

  it('an open dialog closes when the attribute becomes "false"', async () => {
    const host = late<PixelDialog>(PixelDialog, (t) => `<${t} open><dialog class="pp-box pp-dialog" aria-label="Save">…</dialog></${t}>`);
    await settle();
    expect(host.querySelector("dialog")!.open).toBe(true);
    host.setAttribute("open", "false");
    await settle();
    await new Promise((done) => setTimeout(done, 50));
    expect(host.querySelector("dialog")!.open).toBe(false);
  });

  it('a menu, a command palette, a combobox and a tooltip with open="false" stay closed', async () => {
    const menu = late<PixelMenu>(PixelMenu, (t) => `<${t} open="false"><button>Level</button><div role="menu" aria-label="Level" popover><button role="menuitem">New</button></div></${t}>`);
    const palette = late<PixelCommand>(PixelCommand, (t) => `<${t} open="false" shortcut=""><dialog aria-label="Palette"><input aria-label="Search"><div role="listbox" aria-label="Results"></div></dialog></${t}>`);
    const combo = late<PixelCombobox>(PixelCombobox, (t) => `<${t} open="false"><span><input aria-label="World" list="w-false"></span><datalist id="w-false"><option value="a">A</option></datalist></${t}>`);
    const tipBox = mount(`<div><button id="tip-false">Save</button></div>`);
    const tip = late<PixelTooltip>(PixelTooltip, (t) => `<${t} for="tip-false" open="false">Saves</${t}>`);
    tipBox.append(tip);
    await settle();
    expect(menu.open).toBe(false);
    expect(palette.open).toBe(false);
    expect(combo.open).toBe(false);
    expect(combo.querySelector("input")!.getAttribute("aria-expanded")).toBe("false");
    expect(tip.open).toBe(false);
  });

  it('segmented and rating read disabled, required and readonly "false" as off', async () => {
    const seg = late<PixelSegmented>(PixelSegmented, (t) => `<${t} disabled="false" required="false" aria-label="View"><button value="a">A</button><button value="b">B</button></${t}>`);
    const rating = late<PixelRating>(PixelRating, (t) => `<${t} readonly="false" disabled="false" required="false" aria-label="Fun"></${t}>`);
    await settle();
    expect(seg.disabled).toBe(false);
    expect([...seg.querySelectorAll("button")].some((b) => b.disabled)).toBe(false);
    expect(seg.checkValidity()).toBe(true);
    expect(rating.hasAttribute("aria-disabled")).toBe(false);
    expect(rating.hasAttribute("aria-readonly")).toBe(false);
    expect(rating.checkValidity()).toBe(true);
    expect(rating.querySelector<HTMLElement>(".pp-rating-star")!.tabIndex).toBe(0);
  });
});
