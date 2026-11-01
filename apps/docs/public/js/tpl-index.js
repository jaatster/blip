// The templates overview: each live preview is a whole page, so it loads only after this page has, and only once it
// comes near the window. Until then its frame is empty, in the page's colour.
const frames = [...document.querySelectorAll(".tpl-preview iframe[data-src]")];
const load = (f) => {
  if (f.dataset.src) f.src = f.dataset.src;
  delete f.dataset.src;
};
function start() {
  if (!("IntersectionObserver" in window)) return frames.forEach(load);
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { load(e.target); io.unobserve(e.target); }
  }, { rootMargin: "200px 0px" });
  frames.forEach((f) => io.observe(f));
}
if (document.readyState === "complete") start();
else addEventListener("load", start, { once: true });
