/**
 * Content a framework renders after an element has upgraded: tabs that arrive with their data, options that change as
 * you type, an error that comes and goes, a trigger rendered after its tooltip. Each element wires what arrives, as
 * it arrives, and lets go of what leaves.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import "../../../packages/elements/src/index.ts";
import { mount, press } from "../support/dom.ts";

/** Lets the elements' MutationObservers (microtasks) and popover toggles (tasks) run. */
const settle = () => new Promise((done) => setTimeout(done, 0));
const html = (s: string) => {
  const t = document.createElement("template");
  t.innerHTML = s.trim();
  return t.content.firstElementChild as HTMLElement;
};

afterEach(() => vi.restoreAllMocks());

describe("blip-tabs: tabs and panels rendered later", () => {
  const TABS = `<blip-tabs class="blip-tabs"><div class="blip-tabs-list" role="tablist" aria-label="Async"></div></blip-tabs>`;
  const add = (tabs: HTMLElement, label: string, selected = false, value?: string) => {
    const tab = html(`<button class="blip-box blip-tab" role="tab" aria-selected="${selected}"${value ? ` data-value="${value}"` : ""}>${label}</button>`);
    const panel = html(`<div class="blip-tabs-panel" role="tabpanel"${selected ? "" : " hidden"}>Panel ${label}</div>`);
    tabs.querySelector('[role="tablist"]')!.append(tab);
    tabs.append(panel);
    return { tab, panel };
  };

  it("wires tabs that arrive after it upgraded, and shows the panel of the one you pick", async () => {
    const tabs = mount(TABS);
    const changes: unknown[] = [];
    tabs.addEventListener("blip-change", (e) => changes.push((e as CustomEvent).detail));
    const a = add(tabs, "Alpha", true);
    const b = add(tabs, "Beta");
    const c = add(tabs, "Gamma");
    await settle();
    for (const { tab, panel } of [a, b, c]) {
      expect(tab.getAttribute("aria-controls")).toBe(panel.id);
      expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
    }
    expect([a, b, c].map(({ tab }) => tab.tabIndex)).toEqual([0, -1, -1]);
    b.tab.click();
    expect([a, b, c].map(({ panel }) => panel.hidden)).toEqual([true, false, true]);
    expect(changes).toEqual([{ value: "Beta", index: 1, tab: b.tab, panel: b.panel }]);
    b.tab.focus();
    press("ArrowRight");
    expect(document.activeElement).toBe(c.tab);
    expect(c.panel.hidden).toBe(false);
  });

  it("pairs a tab added later with its own panel, and moves the selection off a tab that goes", async () => {
    const tabs = mount(TABS);
    const one = add(tabs, "One", true);
    const two = add(tabs, "Two");
    await settle();
    const three = add(tabs, "Three");
    await settle();
    expect(three.tab.getAttribute("aria-controls")).toBe(three.panel.id);
    three.tab.click();
    expect([one, two, three].map(({ panel }) => panel.hidden)).toEqual([true, true, false]);
    three.tab.remove();
    three.panel.remove();
    await settle();
    expect(tabs.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
    expect(one.tab.getAttribute("aria-selected")).toBe("true");
    expect(one.panel.hidden).toBe(false);
  });

  it("wires a tab list that arrives after the element, without a warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const tabs = mount(`<blip-tabs class="blip-tabs"></blip-tabs>`);
    tabs.append(html(`<div class="blip-tabs-list" role="tablist" aria-label="Later"><button class="blip-box blip-tab" role="tab">One</button><button class="blip-box blip-tab" role="tab">Two</button></div>`));
    tabs.append(html(`<div class="blip-tabs-panel" role="tabpanel">1</div>`), html(`<div class="blip-tabs-panel" role="tabpanel">2</div>`));
    await settle();
    const [one, two] = tabs.querySelectorAll<HTMLElement>('[role="tab"]');
    expect(one!.getAttribute("aria-selected")).toBe("true");
    two!.click();
    expect(tabs.querySelectorAll<HTMLElement>('[role="tabpanel"]')[1]!.hidden).toBe(false);
    expect(warn.mock.calls.flat().join(" ")).not.toContain("BLIP-N001");
  });

  it("selects the tab its value names once that tab arrives", async () => {
    const tabs = mount(`<blip-tabs class="blip-tabs" value="beta"><div class="blip-tabs-list" role="tablist" aria-label="Async"></div></blip-tabs>`);
    add(tabs, "Alpha", true, "alpha");
    const beta = add(tabs, "Beta", false, "beta");
    await settle();
    expect(beta.tab.getAttribute("aria-selected")).toBe("true");
    expect(beta.panel.hidden).toBe(false);
    expect((tabs as HTMLElement & { value: string }).value).toBe("beta");
  });
});

describe("blip-combobox: options that change as you type", () => {
  it("lists the datalist's options as they are now, and keeps the active option's id real", async () => {
    const box = mount(`
      <blip-combobox class="blip-combobox">
        <span class="blip-box blip-input"><input id="place" aria-label="Place" list="places"></span>
        <datalist id="places"></datalist>
      </blip-combobox>`);
    const input = box.querySelector("input")!;
    const data = box.querySelector("datalist")!;
    const options = () => [...box.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options()).toHaveLength(0);
    data.innerHTML = ["Meadow", "Crystal caves", "Castle", "Canyon"].map((o) => `<option value="${o}">${o}</option>`).join("");
    await settle();
    expect(options().map((o) => o.textContent)).toEqual(["Meadow", "Crystal caves", "Castle", "Canyon"]);
    input.focus();
    input.value = "ca";
    input.setSelectionRange(2, 2);
    input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "a" }));
    // The app narrows the list (as a search would), after the person typed.
    data.innerHTML = ["Crystal caves", "Castle", "Canyon"].map((o) => `<option value="${o}">${o}</option>`).join("");
    await settle();
    expect(options().filter((o) => !o.hidden).map((o) => o.textContent)).toEqual(["Crystal caves", "Castle", "Canyon"]);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    press("ArrowDown", {}, input);
    const active = input.getAttribute("aria-activedescendant");
    expect(active && document.getElementById(active)?.textContent).toBeTruthy();
  });

  it("lets the page hear what was typed before it completes, and completes nothing with aria-autocomplete=list", async () => {
    const box = mount(`
      <blip-combobox class="blip-combobox">
        <span class="blip-box blip-input"><input aria-label="Place" list="places-heard"></span>
        <datalist id="places-heard"><option value="Castle">Castle</option></datalist>
      </blip-combobox>`);
    const input = box.querySelector("input")!;
    const heard: string[] = [];
    // As a framework listens: on the root, after the element's own listener.
    document.addEventListener("input", (e) => heard.push((e.target as HTMLInputElement).value), { once: true });
    const type = (text: string) => {
      input.value = text;
      input.setSelectionRange(text.length, text.length);
      input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text.at(-1) }));
    };
    input.focus();
    type("ca");
    expect(heard).toEqual(["ca"]);
    await settle();
    expect(input.value).toBe("castle");
    input.setAttribute("aria-autocomplete", "list");
    type("ca");
    await settle();
    expect(input.value).toBe("ca");
  });

  it("wires an input rendered after the element", async () => {
    const box = mount(`<blip-combobox class="blip-combobox"></blip-combobox>`);
    box.append(html(`<span class="blip-box blip-input"><input aria-label="World" list="worlds-late"></span>`), html(`<datalist id="worlds-late"><option value="meadow">Meadow</option></datalist>`));
    await settle();
    const input = box.querySelector("input")!;
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.hasAttribute("list")).toBe(false);
    expect(box.querySelectorAll('[role="option"]')).toHaveLength(1);
  });
});

describe("blip-field: help and errors that come and go", () => {
  const FIELD = `
    <form>
      <blip-field class="blip-field">
        <label class="blip-field-label" for="name">Player name</label>
        <span class="blip-box blip-input"><input id="name" name="name" required minlength="3"></span>
      </blip-field>
    </form>`;
  const parts = (form: HTMLElement) => {
    const field = form.querySelector("blip-field")!;
    const input = form.querySelector("input")!;
    const described = () => (input.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    const live = () => field.querySelector(".blip-field-live")?.textContent ?? "";
    return { field, input, described, live };
  };

  it("links, marks and reads out an error rendered later, and lets go of it when it goes", async () => {
    const { field, input, described, live } = parts(mount(FIELD));
    const help = html(`<p class="blip-field-help">3 to 12 letters.</p>`);
    field.append(help);
    await settle();
    expect(described()).toEqual([help.id]);
    const error = html(`<p class="blip-field-error">That name is taken.</p>`);
    field.append(error);
    await settle();
    expect(described()).toEqual([help.id, error.id]);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(live()).toBe("That name is taken.");
    // The app writes a new error into it: read out too.
    error.textContent = "Names can't start with a number.";
    await settle();
    expect(live()).toBe("Names can't start with a number.");
    error.remove();
    await settle();
    expect(described()).toEqual([help.id]);
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  it("leaves the page's own aria-invalid and error alone when the browser finds the value valid", async () => {
    const { field, input, live } = parts(mount(FIELD));
    input.setAttribute("aria-invalid", "true");
    const error = html(`<p class="blip-field-error">That name is taken.</p>`);
    field.append(error);
    await settle();
    input.value = "PixelPat";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(error.textContent).toBe("That name is taken.");
    expect(live()).toBe("That name is taken.");
  });

  it("marks the browser's errors itself, and takes away only its own mark", async () => {
    const form = mount(FIELD);
    const { field, input, described } = parts(form);
    const error = html(`<p class="blip-field-error"></p>`);
    field.append(error);
    await settle();
    (form as HTMLFormElement).reportValidity();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(error.textContent).toBe(input.validationMessage);
    expect(described()).toContain(error.id);
    input.value = "Pixel";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(error.textContent).toBe("");
    expect(described()).not.toContain(error.id);
  });

  it("hands aria-invalid to the page once the page writes it", async () => {
    const form = mount(FIELD);
    const { input } = parts(form);
    (form as HTMLFormElement).reportValidity();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    // The app's server says no too, and writes aria-invalid itself.
    input.setAttribute("aria-invalid", "true");
    await settle();
    input.value = "Pixel";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("shows a hidden error's words for the browser's message, and describes nothing while it is hidden", async () => {
    const form = mount(`
      <form><blip-field class="blip-field">
        <label class="blip-field-label" for="bio">About you</label>
        <span class="blip-box blip-textarea"><textarea id="bio" required></textarea></span>
        <p class="blip-field-error" hidden>Tell us a little about you.</p>
      </blip-field></form>`);
    const input = form.querySelector("textarea")!;
    const error = form.querySelector<HTMLElement>(".blip-field-error")!;
    expect(input.hasAttribute("aria-describedby")).toBe(false);
    (form as HTMLFormElement).reportValidity();
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe("Tell us a little about you.");
    expect(input.getAttribute("aria-describedby")).toBe(error.id);
    input.value = "Hi";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(error.hidden).toBe(true);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });
});

describe("other elements with children rendered later", () => {
  it("blip-menu wires a button and list that arrive later; items added later are reached by the keys", async () => {
    const menu = mount(`<blip-menu class="blip-menu"></blip-menu>`);
    menu.append(html(`<button class="blip-box blip-button">Level</button>`), html(`<div class="blip-box blip-menu-list" role="menu" aria-label="Level" popover><button class="blip-box blip-menu-item" role="menuitem">New</button></div>`));
    await settle();
    const button = menu.querySelector("button")!;
    const list = menu.querySelector<HTMLElement>('[role="menu"]')!;
    expect(button.getAttribute("aria-haspopup")).toBe("menu");
    expect(button.getAttribute("aria-controls")).toBe(list.id);
    list.append(html(`<button class="blip-box blip-menu-item" role="menuitem">Duplicate</button>`));
    (menu as HTMLElement & { show(): void }).show();
    await settle();
    press("ArrowDown");
    expect(document.activeElement?.textContent).toBe("Duplicate");
    (menu as HTMLElement & { close(): void }).close();
    await settle();
  });

  it("blip-command gives options rendered later ids, and filters them by what is typed", async () => {
    const palette = mount(`
      <blip-command shortcut="">
        <dialog class="blip-box blip-command" aria-label="Command palette">
          <input class="blip-command-input" aria-label="Search">
          <div class="blip-command-results" role="listbox" aria-label="Results"></div>
          <p class="blip-sr-only" role="status"></p>
        </dialog>
      </blip-command>`);
    const input = palette.querySelector("input")!;
    const list = palette.querySelector('[role="listbox"]')!;
    (palette as HTMLElement & { show(): void }).show();
    input.value = "lev";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    list.append(html(`<div class="blip-box blip-command-item" role="option"><span class="blip-command-label">Levels</span></div>`), html(`<div class="blip-box blip-command-item" role="option"><span class="blip-command-label">Players</span></div>`));
    await settle();
    const [levels, players] = list.querySelectorAll<HTMLElement>('[role="option"]');
    expect(levels!.id).toBeTruthy();
    expect(players!.hidden).toBe(true);
    expect(input.getAttribute("aria-activedescendant")).toBe(levels!.id);
    (palette as HTMLElement & { close(): void }).close();
    await settle();
  });

  it("blip-segmented gives buttons added later their role, state and one tab stop", async () => {
    const seg = mount(`<blip-segmented class="blip-box blip-segmented" value="night" aria-label="Scheme"><button class="blip-box" type="button" value="day">Day</button></blip-segmented>`);
    seg.append(html(`<button class="blip-box" type="button" value="night">Night</button>`));
    await settle();
    const [day, night] = seg.querySelectorAll("button");
    expect(night!.getAttribute("role")).toBe("radio");
    expect(night!.getAttribute("aria-checked")).toBe("true");
    expect([day!.tabIndex, night!.tabIndex]).toEqual([-1, 0]);
  });

  it("blip-table keeps its own sort when rows change, and select-all follows new rows", async () => {
    const table = mount(`
      <blip-table><table class="blip-table">
        <thead><tr><th><input type="checkbox" data-select-all aria-label="All"></th><th>Name</th><th><button class="blip-table-sort">Score</button></th></tr></thead>
        <tbody>
          <tr><td class="blip-table-check"><input type="checkbox" aria-label="Ana" checked></td><th>Ana</th><td>30</td></tr>
          <tr><td class="blip-table-check"><input type="checkbox" aria-label="Bo" checked></td><th>Bo</th><td>10</td></tr>
        </tbody>
      </table></blip-table>`);
    const names = () => [...table.querySelectorAll("tbody tr th")].map((th) => th.textContent);
    table.querySelector<HTMLButtonElement>(".blip-table-sort")!.click();
    expect(names()).toEqual(["Bo", "Ana"]);
    await settle();
    // The app bumps a score and adds a row.
    table.querySelectorAll("tbody tr")[0]!.children[2]!.textContent = "110";
    table.querySelector("tbody")!.append(html(`<table><tr><td class="blip-table-check"><input type="checkbox" aria-label="Dee"></td><th>Dee</th><td>5</td></tr></table>`).querySelector("tr")!);
    await settle();
    expect(names()).toEqual(["Dee", "Ana", "Bo"]);
    const all = table.querySelector<HTMLInputElement>("[data-select-all]")!;
    expect(all.indeterminate).toBe(true);
  });

  it("blip-tile-grid keeps one tab stop as tiles come", async () => {
    const grid = mount(`<blip-tile-grid><ul class="blip-tile-grid" role="list" aria-label="Apps"><li><button class="blip-box blip-tile">A</button></li></ul></blip-tile-grid>`);
    grid.querySelector("ul")!.prepend(html(`<li><button class="blip-box blip-tile">New</button></li>`));
    await settle();
    expect([...grid.querySelectorAll<HTMLElement>(".blip-tile")].map((t) => t.tabIndex)).toEqual([-1, 0]);
  });

  it("blip-number puts its buttons round an input rendered later", async () => {
    const num = mount(`<blip-number class="blip-number"></blip-number>`);
    num.append(html(`<span class="blip-box blip-input"><input id="lives" type="number" min="1" max="9" value="3"></span>`));
    await settle();
    const input = num.querySelector("input")!;
    expect(input.previousElementSibling?.matches(".blip-number-step")).toBe(true);
    expect(input.nextElementSibling?.matches(".blip-number-step")).toBe(true);
  });

  it("blip-file-drop takes up an input rendered later", async () => {
    const drop = mount(`<blip-file-drop class="blip-file-drop"></blip-file-drop>`);
    drop.append(html(`<label class="blip-box blip-file-drop-zone"><input type="file" multiple> Drop here</label>`));
    await settle();
    expect(drop.querySelector(".blip-file-drop-list")).not.toBeNull();
  });

  it("blip-dialog opens a dialog rendered after its open attribute", async () => {
    const host = mount(`<blip-dialog open></blip-dialog>`);
    host.append(html(`<dialog class="blip-box blip-dialog" aria-label="Late">…</dialog>`));
    await settle();
    expect(host.querySelector("dialog")!.open).toBe(true);
    await (host as HTMLElement & { close(): Promise<void> }).close();
  });

  it("blip-tooltip describes a trigger rendered after it, and the new one when a framework replaces it", async () => {
    const box = mount(`<div><blip-tooltip for="tip-late">Saves to slot 2</blip-tooltip></div>`);
    const tip = box.querySelector("blip-tooltip")!;
    const first = html(`<button id="tip-late">Save</button>`);
    box.prepend(first);
    await settle();
    expect(first.getAttribute("aria-describedby")).toBe(tip.id);
    const second = html(`<button id="tip-late">Save</button>`);
    first.replaceWith(second);
    await settle();
    expect(second.getAttribute("aria-describedby")).toBe(tip.id);
    second.focus();
    second.dispatchEvent(new PointerEvent("pointerenter"));
    (tip as HTMLElement & { show(): void }).show();
    expect(tip.matches(":popover-open")).toBe(true);
    (tip as HTMLElement & { close(): void }).close();
  });
});
