/**
 * Attract mode, as arcade games played a demo of themselves while nobody was playing: <blip-attract> plays a short
 * demo of the Blip markup inside it, again and again. A pixel pointer hops to a control and presses it, and the
 * real control responds (its click() runs: a box ticks, a toast drops in, a burst pops).
 *
 *   <blip-attract label="Typing a title and saving shows a toast"
 *               script="move #title; type #title 'Ship it'; move #save; press #save; poster; wait 2s">
 *     …a window, a field, a Save button, a toaster…
 *   </blip-attract>
 *
 * The script is steps split by ";", their selectors matched inside the element:
 *
 *   move <selector>            the pointer hops there in at most six even steps, on whole pixels, and rests a beat
 *   press <selector>           (there first) it dips a pixel with the control's pressed look, then clicks it
 *   type <selector> '<text>'   (there first) a character a pop (120 ms) into its value, each with an input event
 *   wait <time>                500ms, 2s or 2 beats (a bare number is ms)
 *   show <selector>            takes hidden off; hide <selector> puts it on
 *   poster                     the still frame is the state here (without one, the end)
 *
 * The demo is one picture: role="img" named by label, its markup inert. Between loops it undoes every change it
 * caused, so each loop starts from the same markup (the same nodes: their listeners stay). It plays while it is on
 * screen in a shown tab, from the top each time it comes back; while less motion is asked for (the device, or
 * data-blip-motion="reduce" on <html>, which <blip-motion-toggle> sets) it shows its still frame, at once.
 */
import { BlipElement, duration, frames, pixel, reducedMotion, run, warn } from "@blip/core";
import { mirror } from "./_pixel.js";

/**
 * One step, as the steps property takes it: the verb holds its selector (wait its time: ms, or as in a script), type
 * has its text, and poster marks the still frame, on its own or on a step (the state once that step is done).
 */
export type AttractStep =
  | { move: string; poster?: boolean }
  | { press: string; poster?: boolean }
  | { type: string; text: string; poster?: boolean }
  | { wait: number | string; poster?: boolean }
  | { show: string; poster?: boolean }
  | { hide: string; poster?: boolean }
  | { poster: true };

const VERBS = ["move", "press", "type", "wait", "show", "hide"], FIELDS = "input, select, textarea";

/** A time in ms: a number, or "500ms", "2s", "2 beats". NaN when it is none of those. */
const ms = (t: number | string, beat: number): number => {
  if (typeof t == "number") return t;
  const [, n, unit] = /^(\d*\.?\d+)\s*(ms|s|beats?)?$/.exec(t.trim()) ?? [];
  return Number(n ?? NaN) * (unit == "s" ? 1000 : unit?.[0] == "b" ? beat : 1);
};

/** Reads a script into steps, leaving out (and warning about) each step it cannot read. */
function read(script: string, el: Element): AttractStep[] {
  const steps: AttractStep[] = [];
  // Split on ";" outside quotes, so typed text can hold one.
  for (const part of script.match(/(?:[^;'"]|'[^']*'|"[^"]*")+/g) ?? []) {
    const step = part.trim(), [, verb = "", arg = ""] = /^(\S+)\s*([^]*)$/.exec(step) ?? [];
    // type's text is the last quoted part: the selector before it can hold quotes of its own.
    const typed = verb == "type" && /^([^]+?)\s*(['"])((?:(?!\2)[^])*)\2$/.exec(arg);
    if (!step) continue;
    if (step == "poster") steps.push({ poster: true });
    else if (typed) steps.push({ type: typed[1]!, text: typed[3]! });
    else if (VERBS.includes(verb) && verb != "type" && arg && (verb != "wait" || ms(arg, 1) >= 0)) steps.push({ [verb]: arg } as unknown as AttractStep);
    else warn("BLIP-D010", `<blip-attract> cannot read the step "${step}".`, el);
  }
  return steps;
}

/**
 * <blip-attract>: a short demo of the markup inside it, played by a pixel pointer from a script, looping while it is
 * on screen. Its markup is inert and the element is one image to assistive technology, named by label; between loops
 * every change the demo caused is undone. With less motion asked for, on the device or on the page, it shows its
 * still frame at once, and plays on when that is lifted. Show it only on a page that shows <blip-motion-toggle>.
 *
 * @summary Attract mode: a short demo of the markup inside it, a pixel pointer pressing its real controls, looping.
 * @attr {string} script - The steps, split by ";": move <selector>, press <selector>, type <selector> '<text>', wait
 * <time>, show <selector>, hide <selector>, and poster (the still frame).
 * @attr {string} label - The one sentence assistive technology reads for the demo: what it shows happening.
 * @attr {"arrow" | "glove"} [pointer="arrow"] - The pointer: the arrow, or the white glove (game screens, touch).
 */
export class BlipAttract extends BlipElement {
  static observedAttributes = ["script", "label", "pointer"];
  /** The script attribute, or null. */
  declare script: string | null;
  /** The label attribute, or null. */
  declare label: string | null;
  /** The pointer attribute: "glove", or null for the arrow. */
  declare pointer: string | null;
  #steps: AttractStep[] | null = null;
  #go = (): void => {};

  /** The steps it plays: the ones set here, else the script's. Setting them plays them from the top; null goes back
      to the script. */
  get steps(): AttractStep[] {
    return this.#steps ?? read(this.getAttribute("script") ?? "", this);
  }
  set steps(value: AttractStep[] | null) {
    if (JSON.stringify(value) == JSON.stringify(this.#steps)) return;
    this.#steps = value;
    this.#go();
  }

  attributeChangedCallback(name: string, _: string | null, value: string | null): void {
    if (name != "label") this.#go();
    else if (value) this.setAttribute("aria-label", value);
  }

  protected override connected(): void {
    const el = this, { signal } = this;
    el.setAttribute("role", "img");
    if (!el.getAttribute("aria-label")) warn("BLIP-D001", "<blip-attract> has no label: the sentence that says what it shows.", el);
    // The pointer, hidden until it has a place.
    const ptr = el.querySelector<HTMLElement>(":scope > .blip-attract-pointer") ?? el.appendChild(Object.assign(document.createElement("span"), { className: "blip-attract-pointer", hidden: true }));

    // Every change in the demo, so each loop starts from its markup: not the pointer's moves, not inert, not a child
    // the page or a framework adds to the element (made inert at once).
    let log: MutationRecord[] = [], fields: [HTMLInputElement, string, boolean][] = [];
    const keep = (records: MutationRecord[]) => {
      for (const r of records) {
        if (r.target == el) r.addedNodes.forEach((n) => n instanceof Element && n.toggleAttribute("inert", true));
        else if (r.target != ptr && r.attributeName != "inert") log.push(r);
      }
    };
    const watch = new MutationObserver(keep);
    /** The markup as it is now is where every loop starts, its fields' values too. */
    const base = () => {
      keep(watch.takeRecords());
      log = [];
      fields = [...el.querySelectorAll<HTMLInputElement>(FIELDS)].map((f) => [f, f.value, f.checked]);
    };
    /** Undoes every change since then, newest first, and puts the fields' values back. */
    const reset = () => {
      keep(watch.takeRecords());
      for (const r of log.reverse()) {
        const t = r.target as Element & CharacterData;
        if (r.attributeName) r.oldValue == null ? t.removeAttribute(r.attributeName) : t.setAttribute(r.attributeName, r.oldValue);
        else if (r.oldValue != null) t.data = r.oldValue;
        else {
          r.addedNodes.forEach((n) => (n as ChildNode).remove());
          r.removedNodes.forEach((n) => t.insertBefore(n, r.nextSibling));
        }
      }
      for (const [f, v, c] of fields) {
        if (f.value != v) f.value = v;
        f.checked = c;
      }
      base();
    };

    // The pointer: where its tip is, in whole pixels from the element's top left, and what it is over.
    let x = 0, y = 0, at: HTMLElement | undefined;
    const put = (dy = 0) => {
      const p = pixel(el);
      ptr.style.left = `${x * p}px`;
      ptr.style.top = `${(y + dy) * p}px`;
    };
    /** At rest, right of the middle, over nothing. */
    const home = () => {
      const p = pixel(el);
      [x, y] = [Math.round((el.clientWidth * 0.75) / p), Math.round(el.clientHeight / 2 / p)];
      at = undefined;
      ptr.hidden = false;
      put();
    };
    /** The place on a target for the tip: the arrow's right of and below its middle, off its words; the glove's
        fingertip on its start edge, pointing at it. */
    const aim = (t: Element): [number, number] => {
      const r = t.getBoundingClientRect(), o = el.getBoundingClientRect(), p = pixel(el), glove = el.getAttribute("pointer") == "glove";
      return [
        Math.round((r.left - o.left - el.clientLeft + r.width * (glove ? 0 : 0.75)) / p) - (glove ? 13 : 0),
        Math.round((r.top - o.top - el.clientTop + r.height * (glove ? 0.5 : 0.65)) / p) - (glove ? 3 : 0),
      ];
    };
    /** The look of what the pointer is over, forced (data-blip-state): on a field's candy box, else on the target. */
    const look = (state?: string) => {
      const b = at?.matches(FIELDS) && at.parentElement?.matches(".blip-box") ? at.parentElement : at;
      if (state) b?.setAttribute("data-blip-state", state);
      else b?.removeAttribute("data-blip-state");
    };

    /**
     * One step, as a list of timelines: playing, each is waited for in turn (each stops when signal aborts); for the
     * still frame (less motion asked for) each has already run at once, so the whole frame changes in one go.
     */
    const act = function* (s: AttractStep, signal: AbortSignal): Generator<Promise<void>, void> {
      const verb = VERBS.find((v) => v in s), arg = verb ? String((s as Record<string, unknown>)[verb]) : "";
      const beat = duration("beat", 400, el), wait = ms(arg, beat), rest = (t: number) => run([{ at: t, do: () => {} }], { signal });
      if (verb == "wait" && wait >= 0) return void (yield rest(wait));
      if (!verb || verb == "wait") return void ((s as { poster?: boolean }).poster && !verb || warn("BLIP-D010", `<blip-attract> cannot read the step ${JSON.stringify(s)}.`, el));
      let t: HTMLElement | null = null;
      try {
        t = el.querySelector(arg);
      } catch {
        /* not a selector: warned below */
      }
      if (!t) return warn("BLIP-D011", `<blip-attract>: nothing in it matches the step "${verb} ${arg}".`, el);
      if (verb == "show" || verb == "hide") return void (t.hidden = verb == "hide");
      // The pointer goes there first: in at most six even steps, a frame apart, each on a whole pixel; then a beat.
      if (t != at) look();
      at = t;
      const x0 = x, y0 = y, [x1, y1] = aim(t), n = Math.min(6, Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
      if (n) yield frames(n, duration("frame", 40, el), (i) => {
        x = x0 + Math.round(((x1 - x0) * (i + 1)) / n);
        y = y0 + Math.round(((y1 - y0) * (i + 1)) / n);
        put();
      }, { signal });
      if (signal.aborted) return;
      look("hover");
      if (n) yield rest(beat);
      if (signal.aborted || verb == "move") return;
      if (verb == "press") {
        // Down a pixel with the pressed look, up again, and the click: the real control responds.
        look("hover active");
        put(1);
        yield rest(duration("pop", 120, el));
        if (signal.aborted) return;
        look("hover");
        put();
        t.click();
      } else {
        // A character a pop, through the value's own setter, so a framework's input listener hears it too.
        const text = [...String((s as { text?: string }).text ?? "")], set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(t), "value")?.set;
        const was = set ? (t as HTMLInputElement).value : t.textContent;
        yield frames(text.length, duration("pop", 120, el), (i) => {
          const v = was + text.slice(0, i + 1).join("");
          if (set) set.call(t, v);
          else t!.textContent = v;
          t!.dispatchEvent(new Event("input", { bubbles: true }));
        }, { signal });
      }
      if (!signal.aborted) yield rest(beat);
    };

    // Plays while on screen and shown; still (the still frame) while less motion is asked for.
    let stop: AbortController | undefined, seen = false, still = reducedMotion();
    /** Starts again from the markup, the pointer at rest: the still frame at once, or the loop. */
    const go = () => {
      stop?.abort();
      const mine = (stop = new AbortController()), playing = AbortSignal.any([signal, mine.signal]), steps = this.steps;
      reset();
      home();
      if ((still = reducedMotion())) {
        // The steps up to the one marked poster (or all of them), at once.
        for (const s of steps) {
          for (const _ of act(s, playing));
          if ((s as { poster?: boolean }).poster) break;
        }
        return;
      }
      if (!seen || document.hidden) return;
      void (async () => {
        for (;;) {
          // The opening holds a beat; the end of a loop cuts back to it.
          await run([{ at: duration("beat", 400, el), do: () => {} }], { signal: playing });
          for (const s of steps) {
            if (playing.aborted) return;
            for (const p of act(s, playing)) await p;
          }
          if (playing.aborted) return;
          reset();
        }
      })();
    };

    // What it holds may need the page's scripts (what answers a click), its fonts and other elements (a toaster: a
    // second at most) first. It starts once they are in, from that markup, which is inert from then on (a demo, not
    // controls: nobody tabs into it or clicks it, and assistive technology reads only its label).
    const later = [...el.querySelectorAll(":not(:defined)")].map((e) => customElements.whenDefined(e.localName));
    const loaded = new Promise<void>((r) => (document.readyState == "complete" ? r() : addEventListener("load", () => r(), { once: true, signal })));
    void Promise.all([loaded, document.fonts.ready, Promise.race([Promise.all(later), run([{ at: 1000, do: () => {} }], { signal, instant: false })])]).then(() => {
      if (signal.aborted) return;
      for (const c of el.children) c.toggleAttribute("inert", true);
      // (Old values imply watching attributes and text.)
      watch.observe(el, { subtree: true, childList: true, attributeOldValue: true, characterDataOldValue: true });
      base();
      const io = new IntersectionObserver((e) => seen != (seen = !!e.at(-1)?.isIntersecting) && !still && go());
      const motion = () => still != reducedMotion() && go();
      const page = new MutationObserver(motion);
      // It has a new size (the page's layout changed): the pointer goes back onto what it is over.
      let size = `${el.clientWidth} ${el.clientHeight}`;
      const fit = new ResizeObserver(() => size != (size = `${el.clientWidth} ${el.clientHeight}`) && at && (([x, y] = aim(at)), put()));
      io.observe(el);
      page.observe(document.documentElement, { attributeFilter: ["data-blip-motion"] });
      fit.observe(el);
      this.on(document, "visibilitychange", () => !still && go());
      this.on(matchMedia("(prefers-reduced-motion: reduce)"), "change", motion);
      signal.addEventListener("abort", () => {
        stop?.abort();
        reset();
        for (const o of [watch, io, page, fit]) o.disconnect();
        this.#go = () => {};
      }, { once: true });
      this.#go = go;
      go();
    });
  }
}

mirror(BlipAttract, [], ["script", "label", "pointer"]);
BlipElement.define("blip-attract", BlipAttract);

declare global {
  interface HTMLElementTagNameMap {
    "blip-attract": BlipAttract;
  }
}
