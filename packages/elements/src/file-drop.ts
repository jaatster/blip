/**
 * <blip-file-drop>: drop files on the tray, or click it to browse. Picked files join a list (with multiple, they add
 * up; without it, the new file replaces the old), and each has a remove button. The files live in the native
 * <input type="file"> inside, so they go with the form. Dropped files that don't match accept are left out.
 *
 *   <blip-file-drop class="blip-file-drop">
 *     <label class="blip-box blip-file-drop-zone">
 *       <input type="file" name="shots" multiple accept="image/*">
 *       <strong>Drop screenshots here</strong> <span>or click to browse</span>
 *     </label>
 *   </blip-file-drop>
 *
 * Attributes: remove-label (the remove buttons' name, before the file name: "Remove"). Property: files.
 * Events: blip-change { files } when the list changes; blip-reject { files } for dropped files that don't match. An
 * input rendered later, or swapped by a framework, is taken up as it comes.
 */
import { BlipElement, warn } from "@blip/core";
import { both, elementsChanged, observe } from "./_dom.js";

/** Does a file match an accept list (".png, image/*, application/pdf")? */
const accepts = (accept: string, f: File): boolean =>
  !accept.trim() ||
  accept.split(",").some((raw) => {
    const a = raw.trim().toLowerCase();
    return a.startsWith(".") ? f.name.toLowerCase().endsWith(a) : a.endsWith("/*") ? f.type.startsWith(a.slice(0, -1)) : f.type === a;
  });

const size = (n: number): string =>
  new Intl.NumberFormat(undefined, { style: "unit", unit: n < 1e6 ? "kilobyte" : "megabyte", unitDisplay: "short", maximumFractionDigits: 1 }).format(
    Math.max(0.1, n / (n < 1e6 ? 1e3 : 1e6)),
  );

const key = (f: File) => `${f.name}/${f.size}/${f.lastModified}`;

/**
 * A tray to drop files on, or click to browse. The files live in the native <input type="file"> inside, so they go
 * with the form; each picked file gets a row with a remove button.
 *
 * @summary Drop files, or click to browse.
 * @attr {string} [remove-label="Remove"] - Put before each file name on its remove button.
 * @fires {CustomEvent<{ files: File[] }>} blip-change - The list changed: files picked, dropped or removed.
 * @fires {CustomEvent<{ files: File[] }>} blip-reject - Dropped files that do not match the input's accept.
 */
export class BlipFileDrop extends BlipElement {
  static classes = ["blip-file-drop"];

  #files: File[] = [];
  #depth = 0;
  #own = false;
  /** The input wired now, and what aborts its wiring when it goes. */
  #field: HTMLInputElement | null = null;
  #wiring?: AbortController;

  get input(): HTMLInputElement | null {
    return this.querySelector('input[type="file"]');
  }
  /** The picked files, in order. */
  get files(): File[] {
    return [...this.#files];
  }

  protected connected(): void {
    this.#field = null;
    this.#wire();
    // An input rendered later, or swapped by a framework, is taken up when it arrives.
    observe(this, this.signal, () => this.#wire(), (r) => elementsChanged(r) && !(r.target as Element).closest(".blip-file-drop-list"));
    if (!this.input && this.children.length) warn("BLIP-E001", "<blip-file-drop> needs an <input type=file> inside.", this);

    const drag = (e: DragEvent, by: number) => {
      const input = this.input;
      if (!input || !e.dataTransfer?.types.includes("Files") || input.matches(":disabled")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      this.#depth = Math.max(0, this.#depth + by);
      this.toggleAttribute("data-dragover", this.#depth > 0);
    };
    this.on(this, "dragenter", (e) => drag(e as DragEvent, 1));
    this.on(this, "dragover", (e) => drag(e as DragEvent, 0));
    this.on(this, "dragleave", (e) => drag(e as DragEvent, -1));
    this.on(this, "drop", (e) => {
      const files = (e as DragEvent).dataTransfer?.files;
      this.#depth = 0;
      this.removeAttribute("data-dragover");
      if (!files?.length || !this.input || this.input.matches(":disabled")) return;
      e.preventDefault();
      this.#add([...files]);
    });
    // Picked with the browser's dialog: add them to the list (capture, so the list is right before anyone looks).
    this.on(
      this,
      "change",
      (e) => {
        const input = this.input;
        if (!input || e.target !== input || this.#own) return;
        this.#add([...(input.files ?? [])], true);
      },
      { capture: true },
    );
    this.on(this, "click", (e) => {
      const b = (e.target as Element).closest<HTMLButtonElement>(".blip-file-drop-remove");
      if (!b || !this.contains(b)) return;
      const items = [...this.querySelectorAll(".blip-file-drop-item")];
      const i = items.indexOf(b.closest(".blip-file-drop-item")!);
      if (i < 0) return;
      this.#files.splice(i, 1);
      this.#commit();
      // Keep the keyboard in the list: the next file's button, else the previous one, else the tray.
      const next = this.querySelectorAll<HTMLButtonElement>(".blip-file-drop-remove");
      (next[i] ?? next[i - 1] ?? this.input)?.focus();
    });
  }

  /** Reads the files of the input there is now (once per input) and draws the list. */
  #wire(): void {
    const input = this.input;
    if (!input || input === this.#field) return;
    this.#wiring?.abort();
    this.#field = input;
    const signal = both(this.signal, (this.#wiring = new AbortController()).signal);
    this.#files = [...(input.files ?? [])];
    this.#render();
    // A form reset empties the input without an event: read it again once the reset is done.
    input.form?.addEventListener("reset", () =>
      setTimeout(() => {
        this.#files = [...(input.files ?? [])];
        this.#render();
      }), { signal });
  }

  #add(list: File[], picked = false): void {
    const input = this.input!;
    const ok = picked ? list : list.filter((f) => accepts(input.accept, f));
    const rejected = list.filter((f) => !ok.includes(f));
    if (rejected.length) this.emit("reject", { files: rejected });
    if (!ok.length && !picked) return;
    const seen = new Set<string>();
    this.#files = (input.multiple ? [...this.#files, ...ok] : ok.slice(-1)).filter((f) => !seen.has(key(f)) && !!seen.add(key(f)));
    this.#commit(picked);
  }

  /** Puts the list back into the input, redraws it, and says so. */
  #commit(fromInput = false): void {
    const input = this.input!;
    const dt = new DataTransfer();
    for (const f of this.#files) dt.items.add(f);
    input.files = dt.files;
    this.#render();
    if (!fromInput) {
      this.#own = true;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      this.#own = false;
    }
    this.emit("change", { files: this.files });
  }

  #render(): void {
    const input = this.input!;
    let list = this.querySelector<HTMLUListElement>(".blip-file-drop-list");
    if (!list) {
      list = document.createElement("ul");
      list.className = "blip-file-drop-list";
      this.append(list);
    }
    const remove = this.getAttribute("remove-label") ?? "Remove";
    list.replaceChildren(
      ...this.#files.map((f) => {
        const li = document.createElement("li");
        li.className = "blip-box blip-file-drop-item";
        li.innerHTML = '<span class="blip-file-drop-name"></span><span class="blip-file-drop-size"></span><button type="button" class="blip-box blip-file-drop-remove" data-variant="ghost"><span aria-hidden="true"></span></button>';
        const [name, bytes, b] = li.children as unknown as [HTMLElement, HTMLElement, HTMLButtonElement];
        name.textContent = f.name;
        name.title = f.name;
        bytes.textContent = size(f.size);
        b.setAttribute("aria-label", `${remove} ${f.name}`);
        b.disabled = input.matches(":disabled");
        return li;
      }),
    );
  }
}

BlipElement.define("blip-file-drop", BlipFileDrop);

declare global {
  interface HTMLElementTagNameMap {
    "blip-file-drop": BlipFileDrop;
  }
}
