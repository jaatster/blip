/**
 * <chu-icon>: one Blip icon as inline SVG, in light DOM, so it takes the page's colour and the .chu-icon size.
 *
 *   <chu-icon name="heart"></chu-icon>                    decorative: aria-hidden
 *   <chu-icon name="heart" label="Liked"></chu-icon>      an image named "Liked" (role="img", aria-label)
 *   <chu-icon name="gamepad" data-size="lg"></chu-icon>   24 pixels square instead of 12
 *
 * It renders <svg class="chu-icon"> and keeps it in step with name, label and data-size. Markup that already holds
 * that <svg> (rendered on the server) is adopted, not replaced, so the icon shows before the script runs.
 * The element only draws: it adds no listeners or timers, so nothing needs cleaning up when it goes away.
 */
import { icons, type IconName } from "./index.js";

const SVG = "http://www.w3.org/2000/svg";
const warned = new Set<string>();

/**
 * One Blip icon as inline SVG in light DOM, so it takes the page's colour and the .chu-icon size. Markup that
 * already holds the <svg> (rendered on the server) is adopted, not replaced.
 *
 * @summary One 12 x 12 pixel icon.
 * @attr {IconName} name - The icon to draw. An unknown name draws nothing and warns once (CHU-I001).
 * @attr {string} label - Names the icon for assistive technology; without it the icon is aria-hidden.
 * @attr {"lg"} data-size - Twice the size: 24 pixels square instead of 12.
 */
export class BlipIcon extends HTMLElement {
  static observedAttributes = ["name", "label", "data-size"];

  #svg?: SVGSVGElement;
  #path?: SVGPathElement;

  /** The icon to draw. An unknown name draws nothing. */
  get name(): IconName {
    return (this.getAttribute("name") ?? "") as IconName;
  }
  set name(value: IconName) {
    this.setAttribute("name", value);
  }

  /** Names the icon for assistive technology. Leave it out when the icon only decorates text that says the same. */
  get label(): string | null {
    return this.getAttribute("label");
  }
  set label(value: string | null) {
    if (value === null) this.removeAttribute("label");
    else this.setAttribute("label", value);
  }

  connectedCallback(): void {
    this.#render();
  }

  attributeChangedCallback(): void {
    if (this.#svg) this.#render();
  }

  #render(): void {
    if (!this.#svg) {
      const found = this.querySelector<SVGSVGElement>(":scope > svg");
      const svg = found ?? document.createElementNS(SVG, "svg");
      this.#path = svg.querySelector("path") ?? svg.appendChild(document.createElementNS(SVG, "path"));
      svg.classList.add("chu-icon");
      svg.setAttribute("viewBox", "0 0 12 12");
      svg.setAttribute("fill", "currentColor");
      svg.setAttribute("shape-rendering", "crispEdges");
      if (!found) this.replaceChildren(svg);
      this.#svg = svg;
    }
    const svg = this.#svg;
    const name = this.name;
    const d = Object.hasOwn(icons, name) ? icons[name] : "";
    // A missing name is normal while a script sets one up; a wrong one is a typo worth one warning.
    if (!d && name && !warned.has(name)) {
      warned.add(name);
      console.warn(`Blip CHU-I001: <chu-icon name="${name}"> is not an icon. See @jaatster/blip-icons/icons.json for the names.`);
    }
    this.#path!.setAttribute("d", d);

    const size = this.getAttribute("data-size");
    if (size) svg.setAttribute("data-size", size);
    else svg.removeAttribute("data-size");

    const label = this.label?.trim();
    if (label) {
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", label);
      svg.removeAttribute("aria-hidden");
    } else {
      svg.removeAttribute("role");
      svg.removeAttribute("aria-label");
      svg.setAttribute("aria-hidden", "true");
    }
  }
}

if (typeof customElements !== "undefined" && !customElements.get("chu-icon")) customElements.define("chu-icon", BlipIcon);

declare global {
  interface HTMLElementTagNameMap {
    "chu-icon": BlipIcon;
  }
}
