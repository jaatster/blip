/**
 * <chu-wheel>: one or more wheels of options with a candy band across the middle, as on a phone's time picker.
 * Each wheel is a spin button (the arrow keys, Page Up and Down, Home and End); a mouse wheel, a drag or a finger
 * turns it, and it settles onto a row in steps. Form-associated: the value goes with the form.
 *
 *   <chu-wheel class="chu-box chu-wheel" name="alarm" data-type="time" value="07:30" aria-label="Alarm"></chu-wheel>
 *   <chu-wheel class="chu-box chu-wheel" name="born" data-type="date" value="1990-05-17" min="1900"></chu-wheel>
 *   <chu-wheel class="chu-box chu-wheel" name="size" aria-label="Size">
 *     <select aria-label="Size"><option value="s">Small</option><option value="m" selected>Medium</option></select>
 *   </chu-wheel>
 *
 * Custom wheels come from <select> children (a plain select without JavaScript): one wheel per select, one row per
 * option. The element hides and disables the selects it reads, and any <input> left inside as a fallback, so only the
 * wheel's own value is sent. Events: input as the middle row changes, change when it settles, then chu-change.
 */
import { BlipElement, frames, reducedMotion } from "@jaatster/blip-core";
import { unFalse, watch } from "./_dom.js";

type Options = { v: string; t: string }[];
interface Wheel {
  key: string;
  band: HTMLElement;
  list: HTMLElement;
  opts: Options;
  /** The middle row, and how many rows can be chosen (the last days of a short month can't). */
  i: number;
  n: number;
  /** Where the list is, in rows (a fraction while it moves); and what stops its settling. */
  at: number;
  stop?: AbortController;
}

/** How far each key turns a wheel, in rows: Home and End go as far as there is. */
const KEYS: Record<string, number> = { ArrowUp: 1, ArrowDown: -1, PageUp: 5, PageDown: -5, Home: -1e9, End: 1e9 };
const pad = (n: number, d = 2) => String(n).padStart(d, "0");
const el = (cls: string, parent: Element) => parent.appendChild(Object.assign(document.createElement("div"), { className: cls }));

/**
 * One or more wheels of options with a candy band across the middle. Each wheel is a spin button. Form-associated:
 * the value goes with the form.
 *
 * @summary Wheels of options: a time, a date or your own.
 * @attr {string} name - The form field name.
 * @attr {string} value - Time "HH:MM" (24-hour), date "YYYY-MM-DD", or the custom wheels' values joined by spaces.
 * Without one: now, today, or each select's selected option.
 * @attr {"time" | "date"} data-type - Builds the wheels for a time (hours, minutes and AM/PM where the language uses
 * it) or a date (day, month and year in the language's order). Without it, one wheel per <select> inside.
 * @attr {"sm" | "md" | "lg"} [data-size="md"] - Rows 12, 16 or 20 pixels high.
 * @attr {"full"} data-width - Fills its container; the wheels share the width.
 * @attr {"accent" | "info" | "success" | "warning" | "danger" | "neutral" | "red" | "orange" | "yellow" | "green" | "teal" |
 * "blue" | "purple" | "pink" | "slate"} data-tone - The band's candy.
 * @attr {"12" | "24"} hours - A 12- or 24-hour clock (time). The language decides by default.
 * @attr {number} [minute-step=1] - Minutes between rows (time).
 * @attr {number} min - The first year on the wheel (date). Default: a hundred years ago.
 * @attr {number} max - The last year on the wheel (date). Default: twenty years ahead.
 * @attr {boolean} disabled - Switched off (also follows a disabled fieldset). "false" is off.
 * @fires {CustomEvent<{ value: string }>} chu-change - A wheel settled on a new value (after input and change).
 */
export class BlipWheel extends BlipElement {
  static formAssociated = true;
  static box = true;
  static classes = ["chu-wheel"];
  static observedAttributes = ["value", "disabled"];

  #internals = this.attachInternals();
  #wheels: Wheel[] = [];
  #initial: string | null = null;
  /** The value last sent with input, and with change. */
  #sent = "";
  #committed = "";

  get value(): string {
    return this.#value();
  }
  set value(v: string) {
    // The attribute may hold this value already while the wheels show another: turn them either way.
    this.setAttribute("value", v);
    this.#set(v);
  }
  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  get #type(): string | undefined {
    return this.dataset.type;
  }
  /** Its own disabled, or a disabled fieldset's. */
  get #off(): boolean {
    return this.matches(":disabled");
  }

  protected connected(): void {
    this.#internals.role = "group";
    this.#build();
    // Selects or options a framework renders later are read as they come.
    watch(this, this.signal, () => this.#build());
    this.on(this, "keydown", (e) => {
      const w = this.#at(e.target);
      const by = KEYS[e.key];
      if (!w || this.#off || !by) return;
      e.preventDefault();
      this.#go(w, w.i + by);
    });
    // A mouse wheel's notch, or a trackpad's swipe, a row at a time.
    let sum = 0;
    this.on(this, "wheel", (e) => {
      const w = this.#at(e.target);
      if (!w || this.#off) return;
      e.preventDefault();
      sum += e.deltaY * (e.deltaMode ? 40 : 1);
      if (Math.abs(sum) < 40) return;
      this.#go(w, w.i + Math.sign(sum));
      sum = 0;
    }, { passive: false });
    this.on(this, "pointerdown", (e) => this.#drag(e));
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if ((name === "disabled" && unFalse(this, name, value)) || !this.#wheels.length) return;
    if (name === "value") this.#set(value ?? "");
    else this.#sync();
  }

  formResetCallback(): void {
    this.#set(this.#initial!);
  }
  formDisabledCallback(): void {
    this.#sync();
  }

  #at(target: EventTarget | null): Wheel | undefined {
    return this.#wheels.find((w) => w.band.parentElement!.contains(target as Node));
  }
  #wheel(key: string): Wheel | undefined {
    return this.#wheels.find((w) => w.key === key);
  }
  #num(key: string): number {
    const w = this.#wheel(key);
    return w ? +w.opts[w.i]!.v : 0;
  }

  /** The wheels: from the type, or one per select. */
  #build(): void {
    const lang = (this.closest("[lang]") as HTMLElement | null)?.lang || undefined;
    const name = (k: string) => new Intl.DisplayNames(lang, { type: "dateTimeField" }).of(k)!;
    const num = (n: number, d = 1) => new Intl.NumberFormat(lang, { minimumIntegerDigits: d, useGrouping: false }).format(n);
    const range = (from: number, to: number, step = 1, d = 1): Options =>
      Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => ({ v: "" + (from + i * step), t: num(from + i * step, d) }));
    // The wheels in the order the language writes the parts, each named in the language ("hour", "Stunde").
    const order = (o: Intl.DateTimeFormatOptions, all: Record<string, Options>): [string, string, Options][] =>
      new Intl.DateTimeFormat(lang, { timeZone: "UTC", ...o }).formatToParts(Date.UTC(2000, 0, 1, 13)).filter((p) => all[p.type]).map((p) => [p.type, name(p.type), all[p.type]!]);
    let specs: [string, string, Options][] = [];
    const values: string[] = [];
    for (const c of this.querySelectorAll<HTMLSelectElement | HTMLInputElement>(":scope > :is(select, input)")) {
      c.hidden = c.disabled = true;
      // A select with no options yet makes no wheel: its options come later.
      if ("options" in c && c.length) {
        specs.push(["", c.ariaLabel ?? c.labels[0]?.textContent ?? "", [...c.options].map((o) => ({ v: o.value, t: o.label }))]);
        values.push(c.value);
      }
    }
    const now = new Date();
    // Now, in local time: "YYYY-MM-DDTHH:MM…".
    const iso = new Date(+now - now.getTimezoneOffset() * 6e4).toISOString();
    let start = values.join(" ");
    if (this.#type === "time") {
      const hours = this.getAttribute("hours");
      const h12 = hours ? hours === "12" : /h1[12]/.test(new Intl.DateTimeFormat(lang, { hour: "numeric" }).resolvedOptions().hourCycle ?? "");
      const am = new Intl.DateTimeFormat(lang, { hour: "numeric", hour12: true, timeZone: "UTC" });
      const period = (h: number) => am.formatToParts(Date.UTC(2000, 0, 1, h)).find((p) => p.type === "dayPeriod")?.value ?? "";
      specs = order({ hour: "numeric", minute: "2-digit", hour12: h12 }, {
        hour: h12 ? range(0, 11).map((o, i) => ({ v: o.v, t: num(i || 12) })) : range(0, 23, 1, 2),
        minute: range(0, 59, Math.max(1, +this.getAttribute("minute-step")! || 1), 2),
        dayPeriod: [{ v: "0", t: period(1) }, { v: "1", t: period(13) }],
      });
      start = iso.slice(11, 16);
    } else if (this.#type === "date") {
      const year = (a: string, d: number) => +this.getAttribute(a)! || now.getFullYear() + d;
      const month = new Intl.DateTimeFormat(lang, { month: "long", timeZone: "UTC" });
      specs = order({ day: "numeric", month: "long", year: "numeric" }, {
        day: range(1, 31),
        month: range(1, 12).map((o) => ({ v: o.v, t: month.format(Date.UTC(2000, +o.v - 1, 1)) })),
        year: range(year("min", -100), year("max", 20)),
      });
      start = iso.slice(0, 10);
    }
    for (const w of this.#wheels) w.band.parentElement!.remove();
    this.#wheels = specs.map(([key, label, opts]) => {
      const col = el("chu-wheel-column", this);
      col.dataset.key = key;
      const band = el("chu-box chu-wheel-band", col);
      const list = el("chu-wheel-list", col);
      Object.assign(band, { role: "spinbutton", ariaLabel: label });
      list.ariaHidden = "true";
      for (const o of opts) el("chu-wheel-option", list).textContent = o.t;
      return { key, band, list, opts, i: 0, n: opts.length, at: 0 };
    });
    this.#initial ??= this.getAttribute("value") ?? start;
    this.#set(this.getAttribute("value") ?? start);
  }

  /** The value the wheels show. */
  #value(): string {
    if (this.#type === "time") return `${pad(this.#num("hour") + 12 * this.#num("dayPeriod"))}:${pad(this.#num("minute"))}`;
    if (this.#type === "date") return `${pad(this.#num("year"), 4)}-${pad(this.#num("month"))}-${pad(this.#num("day"))}`;
    return this.#wheels.map((w) => w.opts[w.i]?.v ?? "").join(" ");
  }

  /** Turns the wheels to a value, at once and without events. */
  #set(value: string): void {
    // The row at or before n: a minute between steps goes to the step before it.
    const find = (key: string, n: number) => {
      const w = this.#wheel(key);
      if (w) this.#show(w, w.opts.findLastIndex((o) => +o.v <= n));
    };
    const parts = value.split(/[-:]/).map(Number);
    for (const w of this.#wheels) w.n = w.opts.length;
    if (this.#type === "time") {
      const [h = 0, m = 0] = parts;
      find("hour", this.#wheel("dayPeriod") ? h % 12 : h);
      find("minute", m);
      find("dayPeriod", h >= 12 ? 1 : 0);
    } else if (this.#type === "date") {
      const [y = 0, m = 1, d = 1] = parts;
      find("year", y);
      find("month", m);
      find("day", d);
      this.#days();
    } else {
      const vs = this.#wheels.length > 1 ? value.split(" ") : [value];
      this.#wheels.forEach((w, k) => this.#show(w, w.opts.findIndex((o) => o.v === vs[k])));
    }
    this.#committed = this.#sent = this.#value();
    this.#sync();
  }

  /** A short month shows only its days: the rest are hidden, and the day steps back if it was one of them. */
  #days(): void {
    const day = this.#wheel("day");
    if (!day) return;
    day.n = new Date(this.#num("year"), this.#num("month"), 0).getDate();
    [...day.list.children].forEach((r, i) => ((r as HTMLElement).hidden = i >= day.n));
    if (day.i >= day.n) this.#show(day, day.n - 1);
  }

  /** Puts a wheel's middle row at i (the list at `at`, in rows), at once. */
  #show(w: Wheel, i: number, at?: number): void {
    w.i = Math.min(w.n - 1, Math.max(0, i));
    w.at = at ?? w.i;
    w.list.style.setProperty("--_chu-wheel-at", "" + w.at);
    [...w.list.children].forEach((r, k) => r.toggleAttribute("data-current", k === w.i));
    // The built wheels count in numbers (a minute, a year); custom wheels count rows. The words are the value text.
    const o = w.opts;
    const num = (k: number) => (this.#type ? o[k]!.v : "" + (k + 1));
    for (const [a, v] of [["now", num(w.i)], ["min", num(0)], ["max", num(w.n - 1)], ["text", o[w.i]!.t]]) w.band.setAttribute(`aria-value${a}`, v!);
  }

  /** Moves a wheel to row i in a few steps (at once with reduced motion), and commits the value. */
  #go(w: Wheel, i: number, from = w.at): void {
    w.stop?.abort();
    const stop = (w.stop = new AbortController());
    this.#show(w, i, from);
    const to = w.i;
    // Four steps a row (a quarter row each), never more than four.
    const n = reducedMotion() ? 1 : Math.min(4, Math.ceil(Math.abs(to - from) * 4)) || 1;
    this.#changed(true);
    void frames(n, 40, (k) => this.#show(w, to, from + ((to - from) * (k + 1)) / n), { signal: AbortSignal.any([this.signal, stop.signal]) });
  }

  /** A drag (mouse, pen or finger): the list follows a whole pixel at a time, then settles on the nearest row (or
      the row tapped), further after a flick. */
  #drag(e: PointerEvent): void {
    const w = this.#at(e.target);
    if (!w || this.#off || e.button) return;
    e.preventDefault();
    w.band.focus();
    w.stop?.abort();
    const col = w.band.parentElement!;
    const tapped = (e.target as Element).closest(".chu-wheel-option");
    const r = (w.list.firstElementChild as HTMLElement).offsetHeight || 32;
    const from = w.at;
    let lastY = e.clientY;
    let lastT = e.timeStamp;
    let speed = 0;
    let moved = false;
    const drag = new AbortController();
    const signal = drag.signal;
    col.setPointerCapture(e.pointerId);
    col.addEventListener("pointermove", (m) => {
      if (m.pointerId !== e.pointerId) return;
      moved ||= Math.abs(m.clientY - e.clientY) > 4;
      speed = (lastY - m.clientY) / (m.timeStamp - lastT || 1) / r;
      lastY = m.clientY;
      lastT = m.timeStamp;
      const at = Math.min(w.n - 1, Math.max(0, from + (e.clientY - m.clientY) / r));
      this.#show(w, Math.round(at), at);
      this.#changed(false);
    }, { signal });
    const end = (u: PointerEvent) => {
      if (u.pointerId !== e.pointerId) return;
      drag.abort();
      // A flick goes on for about 150 ms; a pause before letting go stops it.
      const flick = u.timeStamp - lastT < 100 ? speed * 150 : 0;
      this.#go(w, moved ? Math.round(w.at + flick) : tapped ? [...w.list.children].indexOf(tapped) : w.i);
    };
    for (const type of ["pointerup", "pointercancel"]) col.addEventListener(type, end as EventListener, { signal });
  }

  /** Sends input when the value changed, and change and chu-change when it is committed. */
  #changed(commit: boolean): void {
    this.#days();
    const v = this.#value();
    this.#sync();
    if (v !== this.#sent) {
      this.#sent = v;
      this.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (commit && v !== this.#committed) {
      this.#committed = v;
      this.dispatchEvent(new Event("change", { bubbles: true }));
      this.emit("change", { value: v });
    }
  }

  /** Disabled, and the form value. */
  #sync(): void {
    const off = this.#off;
    for (const w of this.#wheels) {
      w.band.tabIndex = off ? -1 : 0;
      w.band.ariaDisabled = off ? "true" : null;
    }
    this.#internals.setFormValue(this.#value());
  }
}

BlipElement.define("chu-wheel", BlipWheel);

declare global {
  interface HTMLElementTagNameMap {
    "chu-wheel": BlipWheel;
  }
}
