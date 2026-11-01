/**
 * BlipElement: the base of every Blip Web Component.
 *
 * Light DOM, so the global CSS styles it and it upgrades markup that already works (progressive enhancement).
 * Each connection gets an AbortSignal (`this.signal`) that aborts on disconnect: pass it to every listener, timer
 * and timeline, and nothing leaks. `static box = true` adds the candy box class.
 */
export abstract class BlipElement extends HTMLElement {
  /** Add `blip-box` to the element when it connects. */
  static box = false;
  /** Extra classes to add when it connects, e.g. "blip-tabs". */
  static classes: string[] = [];

  #controller?: AbortController;

  /** Aborts when the element disconnects. */
  get signal(): AbortSignal {
    this.#controller ??= new AbortController();
    return this.#controller.signal;
  }

  connectedCallback(): void {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const ctor = this.constructor as typeof BlipElement;
    if (ctor.box) this.classList.add("blip-box");
    if (ctor.classes.length) this.classList.add(...ctor.classes);
    // Defined by a classic script while the page is still parsing, an element upgrades before its children exist:
    // wait for them.
    if (document.readyState === "loading") {
      const signal = this.#controller.signal;
      document.addEventListener("DOMContentLoaded", () => { if (!signal.aborted) this.connected(); }, { once: true, signal });
    } else this.connected();
  }

  disconnectedCallback(): void {
    this.#controller?.abort();
    this.#controller = undefined;
    this.disconnected();
  }

  /** Set up here; use this.signal for listeners and timers. */
  protected connected(): void {}
  /** Anything this.signal does not clean up. */
  protected disconnected(): void {}

  /** Dispatches a bubbling, composed `blip-<name>` event. Returns false if a listener called preventDefault(). */
  protected emit<T>(name: string, detail?: T, cancelable = false): boolean {
    return this.dispatchEvent(new CustomEvent(`blip-${name}`, { detail, bubbles: true, composed: true, cancelable }));
  }

  /** Listens with this connection's signal. */
  protected on<K extends keyof HTMLElementEventMap>(target: EventTarget, type: K | string, fn: (e: HTMLElementEventMap[K]) => void, options: AddEventListenerOptions = {}): void {
    target.addEventListener(type, fn as EventListener, { ...options, signal: this.signal });
  }

  /**
   * Reads a boolean attribute: on when present and not "false". A framework that sets attributes on an element before
   * it is defined writes open="false" for false; that is off, as the property false is.
   */
  protected flag(name: string): boolean {
    const v = this.getAttribute(name);
    return v !== null && v !== "false";
  }

  /** Defines the element once, so loading two copies never throws. */
  static define(tag: string, ctor: CustomElementConstructor): void {
    if (typeof customElements !== "undefined" && !customElements.get(tag)) customElements.define(tag, ctor);
  }
}
