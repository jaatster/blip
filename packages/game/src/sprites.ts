/**
 * Sprites: the game kit's art as whole-pixel SVG in token colours. sprite(name) returns the SVG as a string (for
 * servers, templates and canvas-free games); <pp-sprite name="coin"> draws one in place.
 *
 *   <pp-sprite name="coin"></pp-sprite>
 *   <pp-sprite name="potion" data-tone="blue" aria-label="Mana potion"></pp-sprite>
 */
import { PixelElement } from "@jaatster/blip-core";
import { sprite } from "./_pixels.js";

export { sprite, spriteNames, pixels } from "./_pixels.js";

export class PixelSprite extends PixelElement {
  static observedAttributes = ["name", "aria-label"];
  #drawn = "";

  /** The sprite's name: coin, heart, potion… (see spriteNames). */
  get name(): string {
    return this.getAttribute("name") ?? "";
  }
  set name(value: string) {
    this.setAttribute("name", value);
  }

  protected override connected(): void {
    this.#draw();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#draw();
  }

  #draw(): void {
    const label = this.getAttribute("aria-label");
    // Named sprites are pictures; unnamed ones are decoration.
    if (label) {
      this.setAttribute("role", "img");
      this.removeAttribute("aria-hidden");
    } else {
      this.removeAttribute("role");
      this.setAttribute("aria-hidden", "true");
    }
    if (this.#drawn === this.name) return;
    this.#drawn = this.name;
    this.innerHTML = sprite(this.name);
  }
}

PixelElement.define("pp-sprite", PixelSprite);

declare global {
  interface HTMLElementTagNameMap {
    "pp-sprite": PixelSprite;
  }
}
