/**
 * <pp-file-drop>: drop files on the tray, or click it to browse. Picked files join a list (with multiple, they add
 * up; without it, the new file replaces the old), and each has a remove button. The files live in the native
 * <input type="file"> inside, so they go with the form. Dropped files that don't match accept are left out.
 *
 *   <pp-file-drop class="pp-file-drop">
 *     <label class="pp-box pp-file-drop-zone">
 *       <input type="file" name="shots" multiple accept="image/*">
 *       <strong>Drop screenshots here</strong> <span>or click to browse</span>
 *     </label>
 *   </pp-file-drop>
 *
 * Attributes: remove-label (the remove buttons' name, before the file name: "Remove"). Property: files.
 * Events: pp-change { files } when the list changes; pp-reject { files } for dropped files that don't match.
 */
import { PixelElement, warn } from "@jaatster/blip-core";

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
 * @fires {CustomEvent<{ files: File[] }>} pp-change - The list changed: files picked, dropped or removed.
 * @fires {CustomEvent<{ files: File[] }>} pp-reject - Dropped files that do not match the input's accept.
 */
export class PixelFileDrop extends PixelElement {
  static classes = ["pp-file-drop"];

  #files: File[] = [];
  #depth = 0;
  #own = false;

  get input(): HTMLInputElement | null {
    return this.querySelector('input[type="file"]');
  }
  /** The picked files, in order. */
  get files(): File[] {
    return [...this.#files];
  }

  protected connected(): void {
    const input = this.input;
    if (!input) return warn("PP-E001", "<pp-file-drop> needs an <input type=file> inside.", this);
    this.#files = [...(input.files ?? [])];
    this.#render();

    const drag = (e: DragEvent, by: number) => {
      if (!e.dataTransfer?.types.includes("Files") || input.matches(":disabled")) return;
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
      if (!files?.length || input.matches(":disabled")) return;
      e.preventDefault();
      this.#add([...files]);
    });
    // Picked with the browser's dialog: add them to the list (capture, so the list is right before anyone looks).
    this.on(
      this,
      "change",
      (e) => {
        if (e.target !== input || this.#own) return;
        this.#add([...(input.files ?? [])], true);
      },
      { capture: true },
    );
    // A form reset empties the input without an event: read it again once the reset is done.
    if (input.form) {
      this.on(input.form, "reset", () =>
        setTimeout(() => {
          this.#files = [...(input.files ?? [])];
          this.#render();
        }),
      );
    }
    this.on(this, "click", (e) => {
      const b = (e.target as Element).closest<HTMLButtonElement>(".pp-file-drop-remove");
      if (!b || !this.contains(b)) return;
      const items = [...this.querySelectorAll(".pp-file-drop-item")];
      const i = items.indexOf(b.closest(".pp-file-drop-item")!);
      if (i < 0) return;
      this.#files.splice(i, 1);
      this.#commit();
      // Keep the keyboard in the list: the next file's button, else the previous one, else the tray.
      const next = this.querySelectorAll<HTMLButtonElement>(".pp-file-drop-remove");
      (next[i] ?? next[i - 1] ?? input).focus();
    });
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
    let list = this.querySelector<HTMLUListElement>(".pp-file-drop-list");
    if (!list) {
      list = document.createElement("ul");
      list.className = "pp-file-drop-list";
      this.append(list);
    }
    const remove = this.getAttribute("remove-label") ?? "Remove";
    list.replaceChildren(
      ...this.#files.map((f) => {
        const li = document.createElement("li");
        li.className = "pp-box pp-file-drop-item";
        li.innerHTML = '<span class="pp-file-drop-name"></span><span class="pp-file-drop-size"></span><button type="button" class="pp-box pp-file-drop-remove" data-variant="ghost"><span aria-hidden="true"></span></button>';
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

PixelElement.define("pp-file-drop", PixelFileDrop);

declare global {
  interface HTMLElementTagNameMap {
    "pp-file-drop": PixelFileDrop;
  }
}
