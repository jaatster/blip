// The element wrapper runtime (createComponent), with probe elements standing in for Blip's: the same
// behaviour in React 18 and 19 (run once per version by the test script).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { act, h, render, tick, version, renderToString, hydrate } from "./dom.mjs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createComponent } from "../dist/internal/element.js";
import { spec, tree as probeTree } from "./probe.mjs";

console.log(`React ${version}`);

/** An element with the shapes that trip React 19: a getter-only property and a setter that needs a connection. */
class Probe extends HTMLElement {
  static observedAttributes = ["open"];
  seen = null;
  early = false;
  #text = "";
  textSets = 0;
  get label() {
    return this.getAttribute("label") ?? "";
  }
  get open() {
    return this.hasAttribute("open");
  }
  set open(on) {
    if (!this.isConnected) this.early = true;
    else this.toggleAttribute("open", !!on);
  }
  get value() {
    return this.getAttribute("value") ?? "";
  }
  set value(v) {
    this.setAttribute("value", v);
  }
  get text() {
    return this.#text;
  }
  set text(v) {
    this.#text = v;
    this.textSets++;
  }
  connectedCallback() {
    this.seen = Object.fromEntries([...this.attributes].map((a) => [a.name, a.value]));
  }
}
customElements.define("x-probe", Probe);

const P = createComponent({ tag: "x-probe", name: "Probe", ...spec });

describe(`createComponent (React ${version})`, () => {
  test("writes attributes before the element connects, without touching its properties", async () => {
    const { container } = await render(h(P, { label: "Coins", open: true, lightDismiss: true, count: 3, value: "a" }));
    const el = container.firstElementChild;
    assert.deepEqual(el.seen, { label: "Coins", open: "", "light-dismiss": "", count: "3", value: "a" });
    assert.equal(el.early, false, "the open setter ran before the element connected");
  });

  test("leaves false and undefined attributes out, and removes them when they turn off", async () => {
    const r = await render(h(P, { open: true, lightDismiss: true }));
    const el = r.container.firstElementChild;
    await r.rerender(h(P, { open: false, lightDismiss: undefined }));
    assert.equal(el.hasAttribute("open"), false);
    assert.equal(el.hasAttribute("light-dismiss"), false);
  });

  test("forwards the ref to the element", async () => {
    let got = null;
    const { container } = await render(h(P, { ref: (el) => (got = el) }));
    assert.equal(got, container.firstElementChild);
    assert.ok(got instanceof Probe);
  });

  test("assigns a property only the element has, once, and again when it changes", async () => {
    const r = await render(h(P, { text: "hi" }));
    const el = r.container.firstElementChild;
    assert.equal(el.text, "hi");
    await r.rerender(h(P, { text: "hi", count: 1 }));
    assert.equal(el.textSets, 1, "an unchanged property was assigned again");
    await r.rerender(h(P, { text: "bye" }));
    assert.equal(el.text, "bye");
  });

  test("keeps a mirrored property in step when its prop changes, and leaves the element's own choice otherwise", async () => {
    const r = await render(h(P, { value: "a" }));
    const el = r.container.firstElementChild;
    el.value = "b"; // the element changed itself (a click)
    await r.rerender(h(P, { value: "a", count: 2 }));
    assert.equal(el.value, "b", "an unchanged prop overwrote the element's own value");
    await r.rerender(h(P, { value: "c" }));
    assert.equal(el.value, "c");
  });

  test("waits for the element's definition before assigning properties", async () => {
    class Late extends HTMLElement {
      #text = "";
      get text() {
        return this.#text;
      }
      set text(v) {
        this.#text = v;
      }
    }
    const L = createComponent({ tag: "x-late", name: "Late", properties: ["text"] });
    const { container } = await render(h(L, { text: "later" }));
    const el = container.firstElementChild;
    assert.equal(Object.hasOwn(el, "text"), false, "a property was set on the element before it was defined");
    customElements.define("x-late", Late);
    await tick();
    assert.equal(el.text, "later");
  });

  test("calls the latest on<Event> handler for the chu-* event, and stops when it is removed", async () => {
    const calls = [];
    const r = await render(h(P, { onChange: () => calls.push("first") }));
    const el = r.container.firstElementChild;
    await r.rerender(h(P, { onChange: (e) => calls.push(`second ${e.detail.value}`) }));
    await act(async () => el.dispatchEvent(new CustomEvent("chu-change", { detail: { value: 7 }, bubbles: true })));
    await r.rerender(h(P, {}));
    await act(async () => el.dispatchEvent(new CustomEvent("chu-change", { detail: { value: 8 } })));
    assert.deepEqual(calls, ["second 7"]);
  });

  test("passes other props through and renders children, unless the element draws its own", async () => {
    const { container } = await render(h(P, { id: "p", className: "chu-x", "data-tone": "pink", "aria-label": "Probe" }, h("span", null, "inside")));
    const el = container.firstElementChild;
    assert.equal(el.id, "p");
    assert.equal(el.getAttribute("class"), "chu-x");
    assert.equal(el.getAttribute("data-tone"), "pink");
    assert.equal(el.getAttribute("aria-label"), "Probe");
    assert.equal(el.innerHTML, "<span>inside</span>");
    const E = createComponent({ tag: "x-probe", name: "Empty", empty: true });
    const r2 = await render(h(E, null, "ignored"));
    assert.equal(r2.container.firstElementChild.innerHTML, "");
  });

  test("a text child is also the element's text", async () => {
    const T = createComponent({ tag: "x-probe", name: "Text", properties: ["text"], textChildren: true });
    const r = await render(h(T, null, "Blip"));
    const el = r.container.firstElementChild;
    assert.equal(el.textContent, "Blip");
    assert.equal(el.text, "Blip");
    await r.rerender(h(T, null, "Pixel Bop"));
    assert.equal(el.text, "Pixel Bop");
  });

  test("renders attributes on the server and hydrates without warnings", async () => {
    const tree = () => h(P, { label: "Coins", open: true, lightDismiss: true, count: 3, className: "chu-x" }, h("b", null, "x"));
    // (React 18 warns that useLayoutEffect does nothing on the server: only because this server render has a DOM.
    // In a real server there is no document, and the wrapper uses useEffect.)
    const original = console.error;
    const said = [];
    console.error = (...args) => said.push(args.map(String).join(" "));
    const html = renderToString(tree());
    console.error = original;
    assert.deepEqual(said.filter((s) => !s.includes("useLayoutEffect does nothing on the server")), []);
    const probe = document.createElement("div");
    probe.innerHTML = html;
    const el = probe.firstElementChild;
    assert.deepEqual(
      [...el.attributes].map((a) => [a.name, a.value]).sort(),
      [["class", "chu-x"], ["count", "3"], ["label", "Coins"], ["light-dismiss", ""], ["open", ""]],
    );
    const { errors } = await hydrate(html, tree());
    assert.deepEqual(errors, []);
  });

  test("hydrates HTML from a real server (no DOM there, so plain attribute names)", async () => {
    const react18 = process.execArgv.some((a) => a.includes("react-18"));
    const here = (f) => fileURLToPath(new URL(f, import.meta.url));
    const html = execFileSync(process.execPath, [...(react18 ? ["--import", here("./react-18.mjs")] : []), here("./server.mjs")], { encoding: "utf8" });
    assert.match(html, /^<x-probe class="chu-x" label="Coins" open="" light-dismiss="" count="3"><b>x<\/b><\/x-probe>$/);
    const { container, errors } = await hydrate(html, probeTree());
    assert.deepEqual(errors, []);
    assert.equal(container.firstElementChild.getAttribute("open"), "");
  });
});
