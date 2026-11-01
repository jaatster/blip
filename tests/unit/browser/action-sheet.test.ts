/**
 * <blip-action-sheet>: a modal (focus inside, the page inert) whose choice comes back as the value of the button that
 * closed it, on the dialog's returnValue, the element's and blip-close's detail; dismissed, the answer is "", never the
 * one from the time before; Cancel is a choice like any other.
 */
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import type { BlipActionSheet } from "../../../packages/elements/src/action-sheet.ts";
import "../../../packages/elements/src/action-sheet.ts";
import { mount } from "../support/dom.ts";

const settle = (ms = 0) => new Promise((done) => setTimeout(done, ms));
function sheet(): { el: BlipActionSheet; d: HTMLDialogElement; opener: HTMLButtonElement; button: (v: string) => HTMLButtonElement } {
  const box = mount(`<div>
    <button id="as-open" type="button" commandfor="as-t-sheet" command="show-modal">Replay 12</button>
    <blip-action-sheet light-dismiss>
      <dialog class="blip-box blip-drawer blip-action-sheet" id="as-t-sheet" aria-labelledby="as-t-title">
        <form method="dialog">
          <h2 class="blip-action-sheet-title" id="as-t-title">Replay 12</h2>
          <div class="blip-action-sheet-actions">
            <button class="blip-box blip-button" value="share">Share</button>
            <button class="blip-box blip-button" data-tone="danger" value="delete">Delete</button>
          </div>
          <button class="blip-box blip-button blip-action-sheet-cancel" value="cancel">Cancel</button>
        </form>
      </dialog>
    </blip-action-sheet></div>`);
  const el = box.querySelector<BlipActionSheet>("blip-action-sheet")!;
  const d = el.querySelector("dialog")!;
  return { el, d, opener: box.querySelector("#as-open")!, button: (v) => d.querySelector(`button[value="${v}"]`)! };
}

describe("blip-action-sheet", () => {
  it("is a modal: focus goes inside, the page is inert, and focus comes back", async () => {
    const { el, d, opener } = sheet();
    opener.focus();
    await userEvent.click(opener);
    await settle();
    expect(el.open).toBe(true);
    expect(d.matches(":modal")).toBe(true);
    expect(d.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(d.querySelector('button[value="share"]'));
    await userEvent.keyboard("{Tab}{Tab}");
    expect(document.activeElement).toBe(d.querySelector('button[value="cancel"]'));
    // The page behind is inert: its button cannot take focus.
    opener.focus();
    expect(document.activeElement).toBe(d.querySelector('button[value="cancel"]'));
    await userEvent.keyboard("{Escape}");
    await settle(50);
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it("hands back the chosen value: returnValue and blip-close's detail", async () => {
    const { el, d, button } = sheet();
    const seen: unknown[] = [];
    el.addEventListener("blip-close", (e) => seen.push((e as CustomEvent).detail));
    el.show();
    await userEvent.click(button("delete"));
    await settle(50);
    expect(el.open).toBe(false);
    expect(d.returnValue).toBe("delete");
    expect(el.returnValue).toBe("delete");
    expect(seen).toEqual([{ reason: "submit", returnValue: "delete" }]);
  });

  it("answers \"\" when dismissed, never the choice from last time", async () => {
    const { el, button } = sheet();
    const seen: unknown[] = [];
    el.addEventListener("blip-close", (e) => seen.push((e as CustomEvent).detail));
    el.show();
    await userEvent.click(button("share"));
    await settle(50);
    expect(el.returnValue).toBe("share");
    el.show();
    expect(el.returnValue).toBe("");
    await userEvent.keyboard("{Escape}");
    await settle(50);
    expect(el.open).toBe(false);
    expect(el.returnValue).toBe("");
    expect(seen.at(-1)).toEqual({ reason: "escape", returnValue: "" });
  });

  it("treats Cancel as a choice, by its value, and opens again from an invoker with an empty answer", async () => {
    const { el, opener, button } = sheet();
    el.show();
    await userEvent.click(button("cancel"));
    await settle(50);
    expect(el.returnValue).toBe("cancel");
    await userEvent.click(opener);
    await settle();
    expect(el.open).toBe(true);
    expect(el.returnValue).toBe("");
    await el.close();
  });
});
