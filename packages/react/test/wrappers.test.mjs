// The generated wrappers render their element with the attributes the docs show, and Icon matches iconSvg().
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { h, render, tick, version, renderToString } from "./dom.mjs";
import { Dialog, Rating, Tooltip, Toaster, Tabs, Segmented, Menu } from "../dist/generated/elements.js";
import { Counter, Hearts, Sprite } from "../dist/generated/game.js";
import { World, Typewriter } from "../dist/generated/effects.js";
import { Icon } from "../dist/icons.js";
import { iconSvg } from "@jaatster/blip-icons";

// Stand-ins under the real tags: the wrappers still import the real modules, which then leave these alone, so no
// real element connects here (jsdom lacks popover, showModal and ResizeObserver, and their timers would keep the
// test running). The elements themselves are tested in a browser by @jaatster/blip-tests.
for (const tag of ["pp-dialog", "pp-rating", "pp-tooltip", "pp-toaster", "pp-tabs", "pp-segmented", "pp-menu", "pp-counter", "pp-hearts", "pp-sprite", "pp-world", "pp-typewriter"]) {
  customElements.define(tag, class extends HTMLElement {});
}
const attrs = (el) => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]));
const quiet = async (fn) => {
  // The real elements load in the background; jsdom lacks some of what they use (popover, ResizeObserver).
  const original = console.error;
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.error = original;
  }
};

describe(`generated wrappers (React ${version})`, () => {
  test("Dialog writes open and light-dismiss and keeps its <dialog>", async () => {
    const { container } = await quiet(() => render(h(Dialog, { open: true, lightDismiss: true }, h("dialog", { className: "pp-box pp-dialog", id: "save" }))));
    const el = container.firstElementChild;
    assert.equal(el.localName, "pp-dialog");
    assert.deepEqual(attrs(el), { open: "", "light-dismiss": "" });
    assert.equal(el.querySelector("dialog#save")?.className, "pp-box pp-dialog");
  });

  test("Rating, Tooltip and Toaster map their props to the documented attributes, with their own classes", async () => {
    const r = await quiet(() => render(h("div", null, h(Rating, { name: "fun", value: 4, max: 5, readOnly: true, shape: "heart", "aria-label": "Fun" }), h(Tooltip, { htmlFor: "save", side: "bottom" }, "Saves to slot 2"), h(Toaster, { side: "top", align: "center", max: 2, dismissLabel: "Close" }))));
    const [rating, tooltip, toaster] = r.container.firstElementChild.children;
    assert.deepEqual(attrs(rating), { class: "pp-rating", name: "fun", value: "4", max: "5", readonly: "", "data-shape": "heart", "aria-label": "Fun" });
    assert.deepEqual(attrs(tooltip), { class: "pp-box pp-tooltip", for: "save", "data-side": "bottom" });
    assert.equal(tooltip.textContent, "Saves to slot 2");
    assert.deepEqual(attrs(toaster), { class: "pp-toaster", "data-side": "top", "data-align": "center", max: "2", "dismiss-label": "Close" });
  });

  test("Tabs, Segmented, Counter, Hearts, Sprite, World and Typewriter", async () => {
    const r = await quiet(() =>
      render(
        h(
          "div",
          null,
          h(Tabs, { value: "sound", activation: "manual", variant: "outline", size: "lg" }),
          h(Segmented, { name: "view", value: "grid", disabled: false, size: "sm", fullWidth: true, className: "my-view", "aria-label": "View" }),
          h(Counter, { value: 42, pad: 3, label: "Coins", sound: "coin" }),
          h(Hearts, { value: 2.5, max: 5, label: "Health" }),
          h(Sprite, { name: "coin", tone: "blue" }),
          h(World, { scheme: "night", parallax: true, clouds: "drift", zoom: 2 }),
          h(Typewriter, { mood: "happy", blips: true }, "Hello there!"),
        ),
      ),
    );
    const [tabs, segmented, counter, hearts, sprite, world, typewriter] = r.container.firstElementChild.children;
    assert.deepEqual(attrs(tabs), { class: "pp-tabs", value: "sound", activation: "manual", "data-variant": "outline", "data-size": "lg" });
    assert.deepEqual(attrs(segmented), { class: "pp-box pp-segmented my-view", name: "view", value: "grid", "data-size": "sm", "data-width": "full", "aria-label": "View" });
    assert.deepEqual(attrs(counter), { class: "pp-counter", value: "42", pad: "3", label: "Coins", sound: "coin" });
    assert.deepEqual(attrs(hearts), { class: "pp-hearts", value: "2.5", max: "5", label: "Health" });
    assert.deepEqual(attrs(sprite), { name: "coin", "data-tone": "blue" });
    assert.deepEqual(attrs(world), { scheme: "night", parallax: "", clouds: "drift", zoom: "2" });
    assert.deepEqual(attrs(typewriter), { mood: "happy", blips: "" });
    await tick();
  });

  test("Menu writes open and listens to pp-action, pp-open and pp-close", async () => {
    const seen = [];
    const r = await quiet(() => render(h(Menu, { open: true, align: "end", onAction: (e) => seen.push(`action ${e.detail.value}`), onOpen: () => seen.push("open"), onClose: () => seen.push("close") })));
    const menu = r.container.firstElementChild;
    assert.deepEqual(attrs(menu), { class: "pp-menu", open: "", "data-align": "end" });
    for (const [type, detail] of [["pp-open"], ["pp-action", { value: "dup" }], ["pp-close"]]) menu.dispatchEvent(new CustomEvent(type, { detail }));
    assert.deepEqual(seen, ["open", "action dup", "close"]);
  });

  test("Icon renders the same SVG as iconSvg(), on the server too", () => {
    // Compared as parsed DOM: React writes <path></path> where iconSvg() writes <path/>, and leaves out xmlns.
    const norm = (s) => {
      const div = document.createElement("div");
      div.innerHTML = s.replace(' xmlns="http://www.w3.org/2000/svg"', "");
      return div.innerHTML;
    };
    assert.equal(norm(renderToString(h(Icon, { name: "heart" }))), norm(iconSvg("heart")));
    assert.equal(norm(renderToString(h(Icon, { name: "coin", label: "Coins", size: "lg", className: "x" }))), norm(iconSvg("coin", { label: "Coins", size: "lg", class: "x" })));
  });
});
