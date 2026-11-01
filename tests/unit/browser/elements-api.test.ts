/**
 * One API shape for one idea, across the elements: an open attribute with pp-open and pp-close wherever something
 * opens, close() everywhere, pp-action for "an item was chosen to run" and pp-select for "the selection changed",
 * a value in every change, one placement vocabulary (data-side, data-align), and toast() handing back a handle whose
 * close() works at once.
 */
import { describe, expect, it } from "vitest";
import { toast, type PixelCombobox, type PixelCommand, type PixelMenu, type PixelTabs, type PixelTooltip } from "../../../packages/elements/src/index.ts";
import { mount } from "../support/dom.ts";

const settle = () => new Promise((done) => setTimeout(done, 0));
const record = (el: Element, ...types: string[]) => {
  const seen: [string, unknown][] = [];
  for (const type of types) el.addEventListener(type, (e) => seen.push([type, (e as CustomEvent).detail]));
  return seen;
};

describe("open, pp-open and pp-close", () => {
  it("pp-menu opens and closes from its open attribute, reflects the menu, and says so", async () => {
    const menu = mount<PixelMenu>(`<pp-menu><button>Level</button><div role="menu" aria-label="Level" popover><button role="menuitem">New</button></div></pp-menu>`);
    const seen = record(menu, "pp-open", "pp-close");
    menu.setAttribute("open", "");
    await settle();
    expect(menu.open).toBe(true);
    expect(document.activeElement?.textContent).toBe("New");
    menu.querySelector<HTMLElement>('[role="menu"]')!.hidePopover();
    await settle();
    expect(menu.hasAttribute("open")).toBe(false);
    expect(seen.map(([t]) => t)).toEqual(["pp-open", "pp-close"]);
  });

  it("pp-command opens from its open attribute and closes with close()", async () => {
    const palette = mount<PixelCommand>(`<pp-command shortcut=""><dialog aria-label="Palette"><input aria-label="Search"><div role="listbox" aria-label="Results"><div role="option">Levels</div></div></dialog></pp-command>`);
    const seen = record(palette, "pp-open", "pp-close");
    palette.open = true;
    await settle();
    expect(palette.querySelector("dialog")!.open).toBe(true);
    expect(palette.getAttribute("open")).toBe("");
    palette.close();
    await settle();
    expect(palette.hasAttribute("open")).toBe(false);
    expect(seen.map(([t]) => t)).toEqual(["pp-open", "pp-close"]);
  });

  it("pp-tooltip shows from its open attribute; close() replaces hide()", async () => {
    const box = mount(`<div><button id="tip-api">Save</button><pp-tooltip for="tip-api">Saves to slot 2</pp-tooltip></div>`);
    const tip = box.querySelector<PixelTooltip>("pp-tooltip")!;
    const seen = record(tip, "pp-open", "pp-close");
    tip.setAttribute("open", "");
    expect(tip.matches(":popover-open")).toBe(true);
    expect("hide" in tip).toBe(false);
    tip.close();
    expect(tip.matches(":popover-open")).toBe(false);
    expect(tip.hasAttribute("open")).toBe(false);
    expect(seen.map(([t]) => t)).toEqual(["pp-open", "pp-close"]);
  });

  it("pp-combobox says when its list opens and closes", async () => {
    const box = mount<PixelCombobox>(`<pp-combobox><span><input aria-label="World" list="w-api"></span><datalist id="w-api"><option value="a">A</option></datalist></pp-combobox>`);
    const seen = record(box, "pp-open", "pp-close");
    box.open = true;
    box.open = false;
    expect(seen.map(([t]) => t)).toEqual(["pp-open", "pp-close"]);
  });
});

describe("pp-action and pp-select", () => {
  it("a menu item chosen is pp-action, with its value", async () => {
    const menu = mount<PixelMenu>(`<pp-menu><button>Level</button><div role="menu" aria-label="Level" popover><button role="menuitem" data-value="dup">Duplicate</button><button role="menuitemcheckbox" aria-checked="false">Grid</button></div></pp-menu>`);
    const seen = record(menu, "pp-action", "pp-select");
    menu.show();
    await settle();
    menu.querySelector<HTMLElement>('[data-value="dup"]')!.click();
    menu.show();
    await settle();
    menu.querySelector<HTMLElement>('[role="menuitemcheckbox"]')!.click();
    expect(seen.map(([t, d]) => [t, (d as { value: string }).value, (d as { checked?: boolean }).checked])).toEqual([
      ["pp-action", "dup", undefined],
      ["pp-action", "Grid", true],
    ]);
  });

  it("a command chosen is pp-action too", async () => {
    const palette = mount<PixelCommand>(`<pp-command shortcut=""><dialog aria-label="Palette"><input aria-label="Search"><div role="listbox" aria-label="Results"><div role="option" data-value="/levels">Levels</div></div></dialog></pp-command>`);
    const seen = record(palette, "pp-action", "pp-select");
    palette.show();
    palette.querySelector<HTMLElement>('[role="option"]')!.click();
    expect(seen.map(([t, d]) => [t, (d as { value: string }).value])).toEqual([["pp-action", "/levels"]]);
    await settle();
  });

  it("a tile selected is pp-select", () => {
    const grid = mount(`<pp-tile-grid selection="single"><ul class="pp-tile-grid" role="list" aria-label="Apps"><li><button class="pp-box pp-tile" aria-pressed="false">A</button></li></ul></pp-tile-grid>`);
    const seen = record(grid, "pp-action", "pp-select");
    grid.querySelector<HTMLElement>(".pp-tile")!.click();
    expect(seen.map(([t]) => t)).toEqual(["pp-select"]);
  });
});

describe("pp-tabs: value", () => {
  const TABS = `
    <pp-tabs class="pp-tabs">
      <div class="pp-tabs-list" role="tablist" aria-label="Settings">
        <button class="pp-box pp-tab" role="tab" aria-selected="true" data-value="general">General</button>
        <button class="pp-box pp-tab" role="tab" aria-selected="false" value="sound">Sound</button>
        <button class="pp-box pp-tab" role="tab" aria-selected="false">Display</button>
      </div>
      <div class="pp-tabs-panel" role="tabpanel">1</div><div class="pp-tabs-panel" role="tabpanel" hidden>2</div><div class="pp-tabs-panel" role="tabpanel" hidden>3</div>
    </pp-tabs>`;

  it("selects by value (data-value, else value, else the label) without an event, and reports value and index", () => {
    const tabs = mount<PixelTabs>(TABS);
    const seen = record(tabs, "pp-change");
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
    const box = mount(`<div style="padding:200px"><button id="tip-side">Save</button><pp-tooltip for="tip-side" data-side="bottom">Saves</pp-tooltip></div>`);
    const tip = box.querySelector<PixelTooltip>("pp-tooltip")!;
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
    const toaster = document.querySelector("pp-toaster")!;
    expect(toaster.querySelectorAll(".pp-toast")).toHaveLength(1);
    handle.close();
    await handle.closed;
    expect(toaster.querySelectorAll(".pp-toast")).toHaveLength(0);
    toaster.remove();
  });
});
