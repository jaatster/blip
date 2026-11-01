/**
 * Renders an example fragment as the gallery does: the markup as written, in a wrapper. Blip's elements in it
 * upgrade here and connect when Storybook attaches the wrapper, so every story starts from the real markup.
 */
export function example(html: string): HTMLElement {
  const root = document.createElement("div");
  root.className = "chu-sb-example";
  root.innerHTML = html;
  return root;
}
