/**
 * The game kit's elements wire content that a framework renders after they upgrade (React, Vue and Svelte often put
 * an element in the page first and fill it a moment later): late choices join the keys, late slots become options,
 * and late or replaced dialogue pages start the box from the first page.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { provide } from "@jaatster/blip-core";
import "../../../packages/game/src/choices.ts";
import "../../../packages/game/src/inventory.ts";
import "../../../packages/game/src/dialogue.ts";
import { focused, mount, press } from "../support/dom.ts";

/** Lets the elements' observers see what was just added. */
const settle = () => new Promise((r) => setTimeout(r, 0));

let restore: () => void = () => undefined;
beforeEach(() => {
  restore = provide({ seed: 7 });
});
afterEach(() => restore());

describe("pp-choices with choices rendered later", () => {
  it("gives the tab stop to the first choice you can take, moves with the keys and sends pp-action", async () => {
    const box = mount(`<pp-choices></pp-choices>`);
    expect(box.querySelectorAll("button")).toHaveLength(0);
    box.innerHTML = `<ul class="pp-choices" role="list">
      <li><button class="pp-box pp-choice" value="pay" aria-disabled="true">Pay 30 coins</button></li>
      <li><button class="pp-box pp-choice" value="trade">Trade the moon key</button></li>
      <li><button class="pp-box pp-choice" value="later">Maybe later</button></li>
    </ul>`;
    await settle();
    expect([...box.querySelectorAll("button")].map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
    box.querySelector<HTMLButtonElement>('[value="trade"]')!.focus();
    press("ArrowDown");
    expect(focused()).toBe("Maybe later");
    const chosen = vi.fn();
    box.addEventListener("pp-action", (e) => chosen((e as CustomEvent).detail.value));
    box.querySelector<HTMLButtonElement>('[value="later"]')!.click();
    expect(chosen).toHaveBeenCalledWith("later");
  });

  it("moves the tab stop when the choice holding it is taken away", async () => {
    const box = mount(`<pp-choices><ul class="pp-choices" role="list">
      <li><button class="pp-box pp-choice" value="a">A</button></li><li><button class="pp-box pp-choice" value="b">B</button></li>
    </ul></pp-choices>`);
    expect([...box.querySelectorAll("button")].map((b) => b.tabIndex)).toEqual([0, -1]);
    box.querySelector("li")!.remove();
    await settle();
    expect(box.querySelector("button")!.tabIndex).toBe(0);
  });
});

describe("pp-inventory with slots rendered later", () => {
  it("makes late slots options, with one tab stop, that the keys reach", async () => {
    const bag = mount(`<pp-inventory class="pp-inventory" aria-label="Backpack" style="--pp-inventory-columns: 3"></pp-inventory>`);
    expect(bag.getAttribute("role")).toBe("listbox");
    for (const name of ["Red potion", "Moon key", "Reed sword"]) {
      bag.insertAdjacentHTML("beforeend", `<button type="button" class="pp-box pp-slot" aria-label="${name}"></button>`);
    }
    await settle();
    const slots = [...bag.querySelectorAll<HTMLElement>(".pp-slot")];
    expect(slots.map((s) => s.getAttribute("role"))).toEqual(["option", "option", "option"]);
    expect(slots.map((s) => s.getAttribute("aria-selected"))).toEqual(["false", "false", "false"]);
    expect(slots.map((s) => s.tabIndex)).toEqual([0, -1, -1]);
    slots[0]!.focus();
    press("ArrowRight");
    expect(document.activeElement).toBe(slots[1]);
  });
});

describe("pp-dialogue with pages rendered later", () => {
  it("starts from the first page once its pages arrive, and again when they are replaced", async () => {
    const box = mount(`<pp-dialogue class="pp-box pp-dialogue" data-pp-typed="0"><div class="pp-dialogue-body"></div></pp-dialogue>`);
    box.querySelector(".pp-dialogue-body")!.innerHTML = `<div class="pp-dialogue-text"><p>Ah, a traveller!</p><p>The bridge is out.</p></div>`;
    await settle();
    const text = box.querySelector(".pp-dialogue-text")!;
    expect(text.getAttribute("aria-hidden")).toBe("true");
    expect([...text.children].map((p) => p.hasAttribute("data-current"))).toEqual([true, false]);
    // Pages replaced, as a framework re-renders them: the new first page is the one showing.
    text.innerHTML = `<p>New day.</p><p>New road.</p><p>New friends.</p>`;
    await settle();
    expect([...text.children].map((p) => p.hasAttribute("data-current"))).toEqual([true, false, false]);
    expect((box as unknown as { pages: HTMLElement[] }).pages).toHaveLength(3);
  });

  it("is named by a name tab that arrives late", async () => {
    const box = mount(`<pp-dialogue class="pp-box pp-dialogue"></pp-dialogue>`);
    box.insertAdjacentHTML("afterbegin", `<span class="pp-box pp-dialogue-name">Bramble</span><div class="pp-dialogue-text"><p>Hello.</p></div>`);
    await settle();
    const name = box.querySelector(".pp-dialogue-name")!;
    expect(name.id).not.toBe("");
    expect(box.getAttribute("aria-labelledby")).toBe(name.id);
  });

  it("does not start again after say(), which shows its pages itself", async () => {
    const box = mount(`<pp-dialogue class="pp-box pp-dialogue"><div class="pp-dialogue-text"><p>Hi.</p></div></pp-dialogue>`) as HTMLElement & { say(p: string[]): void; advance(): void; page: number };
    box.say(["One.", "Two."]);
    box.advance();
    box.advance();
    expect(box.page).toBe(1);
    await settle();
    expect(box.page).toBe(1);
  });
});
