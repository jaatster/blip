// The test page's loader. Freezes the clock and seeds randomness before any element module loads (one @jaatster/blip-core
// instance, through the import map), then loads every stylesheet, the example, and every element module, and marks
// <body data-ready> once fonts are in and the page has stopped changing.
import { provide } from "@jaatster/blip-core";

provide({ clock: () => new Date("2026-06-21T12:00:00"), seed: 42 });

const q = new URLSearchParams(location.search);
const root = document.documentElement;
root.dataset.chuScheme = q.get("scheme") ?? "day";
if (q.get("pixel")) root.dataset.chuPixel = q.get("pixel");

// The tests pass the manifest they read from the packages; opened by hand, the page uses the gallery's.
const manifest = window.__CHU_MANIFEST__ ?? (await (await fetch("/specimen/gallery.json", { cache: "no-store" })).json());
const wanted = q.get("example") ?? "components/button";
const example = manifest.examples.find((e) => `${e.pkg}/${e.name}` === wanted);
if (!example) throw new Error(`No example "${wanted}". Try one of: ${manifest.examples.map((e) => `${e.pkg}/${e.name}`).join(", ")}`);
document.title = `${wanted}: Blip example`;

// Every stylesheet, in order, loaded before the example goes in.
await Promise.all(manifest.css.map((href) => new Promise((resolve, reject) => {
  const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href });
  link.onload = resolve;
  link.onerror = () => reject(new Error(`Stylesheet ${href} did not load.`));
  document.head.append(link);
})));

const response = await fetch(example.url, { cache: "no-store" });
if (!response.ok) throw new Error(`${example.url}: ${response.status}`);
document.getElementById("example").innerHTML = await response.text();

// Elements upgrade the markup already in place, as in the gallery.
for (const src of manifest.js) await import(src);

await document.fonts.ready;
await settle();
await frames(2);
document.body.dataset.ready = "";

/** Resolves once nothing in the document has changed for `quiet` ms (a world redrawn after a resize, a live region
    filled a beat late), or after `max` ms. */
function settle(quiet = 150, max = 4000) {
  return new Promise((resolve) => {
    let timer = setTimeout(done, quiet);
    const cap = setTimeout(done, max);
    const watch = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(done, quiet);
    });
    watch.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
    function done() {
      watch.disconnect();
      clearTimeout(timer);
      clearTimeout(cap);
      resolve();
    }
  });
}

function frames(n) {
  return new Promise((resolve) => {
    const tick = () => (--n <= 0 ? resolve() : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  });
}
