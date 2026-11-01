// The probe wrapper and a tree using it, shared by the jsdom tests and the plain-Node server render (no DOM here).
import { createElement as h } from "react";
import { createComponent } from "../dist/internal/element.js";

export const spec = {
  attributes: { label: ["label", undefined, true], open: ["open", "open", true], value: ["value", "value", true], lightDismiss: ["light-dismiss"], count: ["count"] },
  properties: ["text"],
  events: { onChange: "blip-change" },
};
export const Probe = createComponent({ tag: "x-probe", name: "Probe", ...spec });
export const tree = () => h(Probe, { label: "Coins", open: true, lightDismiss: true, count: 3, className: "blip-x" }, h("b", null, "x"));
