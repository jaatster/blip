// A browser-like global scope (jsdom) for the tests, and a React root to render into.
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
const { window } = dom;
for (const key of Object.getOwnPropertyNames(window)) {
  if (key in globalThis || key.startsWith("_")) continue;
  try {
    globalThis[key] = window[key];
  } catch {
    // read-only in Node: leave Node's own
  }
}
// Node has its own events and abort signals; the DOM only accepts jsdom's.
for (const key of ["Event", "CustomEvent", "EventTarget", "AbortController", "AbortSignal", "KeyboardEvent", "MouseEvent"]) {
  Object.defineProperty(globalThis, key, { value: window[key], configurable: true, writable: true });
}
Object.defineProperty(globalThis, "window", { value: window, configurable: true });
Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { act, createElement, version } = await import("react");
const { createRoot, hydrateRoot } = await import("react-dom/client");
const { renderToString } = await import("react-dom/server");
export { act, createElement as h, version, renderToString };

/** Renders an element into a fresh container; returns it with rerender() and unmount(). */
export async function render(element) {
  const container = document.body.appendChild(document.createElement("div"));
  const root = createRoot(container);
  await act(async () => root.render(element));
  return {
    container,
    rerender: (next) => act(async () => root.render(next)),
    unmount: () => act(async () => root.unmount()),
  };
}

/** Hydrates server HTML; returns the console errors React reported. */
export async function hydrate(html, element) {
  const container = document.body.appendChild(document.createElement("div"));
  container.innerHTML = html;
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args.map(String).join(" "));
  try {
    await act(async () => hydrateRoot(container, element, { onRecoverableError: (e) => errors.push(String(e)) }));
  } finally {
    console.error = original;
  }
  return { container, errors };
}

/** Lets pending promises (whenDefined) settle. */
export const tick = () => act(async () => new Promise((r) => setTimeout(r, 0)));
