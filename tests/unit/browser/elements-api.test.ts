/**
 * One API shape for one idea, across the elements: an open attribute with blip-open and blip-close wherever something
 * opens, close() everywhere, blip-action for "an item was chosen to run" and blip-select for "the selection changed",
 * a value in every change, one placement vocabulary (data-side, data-align), and toast() handing back a handle whose
 * close() works at once.
 */
import { describe, expect, it } from "vitest";
import { toast, type BlipCombobox, type BlipCommand, type BlipMenu, type BlipTabs, type BlipTooltip } from "../../../packages/elements/src/index.ts";
import { mount } from "../support/dom.ts";

const settle = () => new Promise((done) => setTimeout(done, 0));
const record = (el: Element, ...types: string[]) => {
  const seen: [string, unknown][] = [];
  for (const type of types) el.addEventListener(type, (e) => seen.push([type, (e as CustomEvent).detail]));
  return seen;
};

describe("open, blip-open and blip-close", () => {
  it("blip-menu opens and closes from its open attribute, reflects the menu, and says so", async () => {
    const menu = mount<BlipMenu>(`<blip-menu><button>Level</button><div role="menu" aria-label="Level" popover><button role="menuitem">New</button></div></blip-menu>`);
    const seen = record(menu, "blip-open", "blip-close");
    menu.setAttribute("open", "");
    await settle();
    expect(menu.open).toBe(true);
    expect(document.activeElement?.textContent).toBe("New");
    menu.querySelector<HTMLElement>('[role="menu"]')!.hidePopover();
    await settle();
    expect(menu.hasAttribute("open")).toBe(false);
    expect(seen.map(([t]) => t)).toEqual(["blip-open", "blip-close"]);
  });

  it("blip-command opens from its open attribute and closes with close()", async () => {
    const palette = mount<BlipCommand>(`<blip-command shortcut=""><dialog aria-label="Palette"><input aria-label="Search"><div role="listbox" aria-label="Results"><div role="option">Levels</div></div></dialog></blip-command>`);
    const seen = record(palette, "blip-open", "blip-close");
    palette.open = true;
    await settle();
    expect(palette.querySelector("dialog")!.open).toBe(true);
    expect(palette.getAttribute("open")).toBe("");
    palette.close();
    await settle();
    expect(palette.hasAttribute("open")).toBe(false);
    expect(seen.map(([t]) => t)).toEqual(["blip-open", "blip-close"]);
  });

  it("blip-tooltip shows from its open attribute; close() replaces hide()", async () => {
    const box = mount(`<div><button id="tip-api">Save</button><blip-tooltip for="tip-api">Saves to slot 2</blip-tooltip></div>`);
    const tip = box.querySelector<BlipTooltip>("blip-tooltip")!;
    const seen = record(tip, "blip-open", "blip-close");
    tip.setAttribute("open", "");
    expect(tip.matches(":popover-open")).toBe(true);
    expect("hide" in tip).toBe(false);
    tip.close();
    expect(tip.matches(":popover-open")).toBe(false);
    expect(tip.hasAttribute("open")).toBe(false);
    expect(seen.map(([t]) => t)).toEqual(["blip-open", "blip-close"]);
  });

  it("blip-combobox says when its list opens and closes", async () => {
    const box = mount<BlipCombobox>(`<blip-combobox><span><input aria-label="World" list="w-api"></span><datalist id="w-api"><option value="a">A</option></datalist></blip-combobox>`);
    const seen = record(box, "blip-open", "blip-close");
    box.open = true;
    box.open = false;
    expect(seen.map(([t]) => t)).toEqual(["blip-open", "blip-close"]);
  });
});

describe("blip-action and blip-select", () => {
  it("a menu item chosen is blip-action, with its value", async () => {
    const menu = mount<BlipMenu>(`<blip-menu><button>Level</button><div role="menu" aria-label="Level" popover><button role="menuitem" data-value="dup">Duplicate</button><button role="menuitemcheckbox" aria-checked="false">Grid</button></div></blip-menu>`);
    const seen = record(menu, "blip-action", "blip-select");
    menu.show();
    await settle();
    menu.querySelector<HTMLElement>('[data-value="dup"]')!.click();
    menu.show();
    await settle();
    menu.querySelector<HTMLElement>('[role="menuitemcheckbox"]')!.click();
    expect(seen.map(([t, d]) => [t, (d as { value: string }).value, (d as { checked?: boolean }).checked])).toEqual([
      ["blip-action", "dup", undefined],
      ["blip-action", "Grid", true],
    ]);
  });

  it("a command chosen is blip-action too", async () => {
    const palette = mount<BlipCommand>(`<blip-command shortcut=""><dialog aria-label="Palette"><input aria-label="Search"><div role="listbox" aria-label="Results"><div role="option" data-value="/levels">Levels</div></div></dialog></blip-command>`);
    const seen = record(palette, "blip-action", "blip-select");
    palette.show();
    palette.querySelector<HTMLElement>('[role="option"]')!.click();
    expect(seen.map(([t, d]) => [t, (d as { value: string }).value])).toEqual([["blip-action", "/levels"]]);
    await settle();
  });

  it("a tile selected is blip-select", () => {
    const grid = mount(`<blip-tile-grid selection="single"><ul class="blip-tile-grid" role="list" aria-label="Apps"><li><button class="blip-box blip-tile" aria-pressed="false">A</button></li></ul></blip-tile-grid>`);
    const seen = record(grid, "blip-action", "blip-select");
    grid.querySelector<HTMLElement>(".blip-tile")!.click();
    expect(seen.map(([t]) => t)).toEqual(["blip-select"]);
  });
});

describe("blip-tabs: value", () => {
  const TABS = `
    <blip-tabs class="blip-tabs">
      <div class="blip-tabs-list" role="tablist" aria-label="Settings">
        <button class="blip-box blip-tab" role="tab" aria-selected="true" data-value="general">General</button>
        <button class="blip-box blip-tab" role="tab" aria-selected="false" value="sound">Sound</button>
        <button class="blip-box blip-tab" role="tab" aria-selected="false">Display</button>
      </div>
      <div class="blip-tabs-panel" role="tabpanel">1</div><div class="blip-tabs-panel" role="tabpanel" hidden>2</div><div class="blip-tabs-panel" role="tabpanel" hidden>3</div>
    </blip-tabs>`;

  it("selects by value (data-value, else value, else the label) without an event, and reports value and index", () => {
    const tabs = mount<BlipTabs>(TABS);
    const seen = record(tabs, "blip-change");
    expect(tabs.value).toBe("general");
    tabs.value = "sound";
    expect(tabs.selectedIndex).toBe(1);
    tabs.selectedIndex = 2;
    expect(tabs.value).toBe("Display");
    expect(tabs.getAttribute("value")).toBe("Display");
    expect(seen).toEqual([]);
    tabs.tabs[0]!.click();
    expect(seen.map(([, d]) => ({ ...(d as object), tab: undefined, panel: undefined }))).toEqual([{ value: "general", index: 0, tab: undefined, panel: undefined }]);
  });
});

describe("placement: data-side", () => {
  it("a tooltip prefers its data-side, says where it shows, and goes back to the preference when it closes", () => {
    const box = mount(`<div style="padding:200px"><button id="tip-side">Save</button><blip-tooltip for="tip-side" data-side="bottom">Saves</blip-tooltip></div>`);
    const tip = box.querySelector<BlipTooltip>("blip-tooltip")!;
    tip.show();
    expect(tip.dataset.side).toBe("bottom");
    tip.close();
    expect(tip.dataset.side).toBe("bottom");
    expect(tip.hasAttribute("placement")).toBe(false);
  });
});

describe("toast(): one handle shape", () => {
  it("returns { close, closed } at once, and close() works straight away", async () => {
    const handle = toast("Saved to slot 2");
    expect(Object.keys(handle).sort()).toEqual(["close", "closed"]);
    const toaster = document.querySelector("blip-toaster")!;
    expect(toaster.querySelectorAll(".blip-toast")).toHaveLength(1);
    handle.close();
    await handle.closed;
    expect(toaster.querySelectorAll(".blip-toast")).toHaveLength(0);
    toaster.remove();
  });
});
