/**
 * <blip-choices> (game kit), as in the dialogue example: a choice you can't take yet must not be the list's only tab
 * stop, or Tab lands on it and the arrow keys can't leave it.
 */
import { describe, expect, it, vi } from "vitest";
import "../../../packages/game/src/choices.ts";
import { focused, mount, press } from "../support/dom.ts";

const LIST = `
  <blip-choices class="blip-dialogue-choices">
    <ul class="blip-choices" role="list">
      <li><button class="blip-box blip-choice" value="pay" aria-disabled="true">Pay 30 coins</button></li>
      <li><button class="blip-box blip-choice" value="trade">Trade the moon key</button></li>
      <li><button class="blip-box blip-choice" value="later">Maybe later</button></li>
    </ul>
  </blip-choices>`;

describe("blip-choices", () => {
  it("puts the tab stop on the first choice you can take", () => {
    const list = mount(LIST);
    expect([...list.querySelectorAll("button")].map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
  });

  it("moves with Up and Down past the choice you can't take, wrapping", () => {
    const list = mount(LIST);
    list.querySelector<HTMLButtonElement>('[value="trade"]')!.focus();
    press("ArrowDown");
    expect(focused()).toBe("Maybe later");
    press("ArrowDown");
    expect(focused()).toBe("Trade the moon key");
  });

  it("sends blip-action for a choice you can take, and nothing for one you can't", () => {
    const list = mount(LIST);
    const chosen = vi.fn();
    list.addEventListener("blip-action", (e) => chosen((e as CustomEvent).detail));
    list.querySelector<HTMLButtonElement>('[value="pay"]')!.click();
    const later = list.querySelector<HTMLButtonElement>('[value="later"]')!;
    later.click();
    expect(chosen).toHaveBeenCalledTimes(1);
    expect(chosen).toHaveBeenCalledWith({ item: later, value: "later", index: 2, label: "Maybe later" });
  });
});
