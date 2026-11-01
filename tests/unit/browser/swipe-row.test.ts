/**
 * <chu-swipe-row>: a touch swipe slides the face in whole pixels and holds it open past half the actions, a full
 * swipe runs the first action through a cancelable chu-swipe, a vertical swipe is left to the page, a mouse drag
 * does nothing, one row in a list is open at a time, and the keyboard reaches every action (More, focus, Escape).
 */
import { afterEach, beforeEach, describe, expect, inject, it } from "vitest";
import listCss from "../../../packages/components/src/list.css?raw";
import buttonCss from "../../../packages/components/src/button.css?raw";
import swipeCss from "../../../packages/components/src/swipe-row.css?raw";
import type { BlipSwipeRow, SwipeDetail } from "../../../packages/elements/src/swipe-row.ts";
import "../../../packages/elements/src/swipe-row.ts";
import { mount, press } from "../support/dom.ts";

let style: HTMLStyleElement;
beforeEach(() => {
  style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + listCss + buttonCss + swipeCss }));
  // Steps at once, so each test reads the end of a move.
  document.documentElement.dataset.chuMotion = "reduce";
});
afterEach(() => {
  style.remove();
  delete document.documentElement.dataset.chuMotion;
});

const row = (n: number, open = "") => `
  <li><chu-swipe-row class="chu-swipe-row" id="r${n}" ${open ? `open="${open}"` : ""}>
    <div class="chu-swipe-row-face"><a class="chu-box chu-list-item" data-variant="ghost" href="#m${n}">Message ${n}</a>
      <button class="chu-box chu-button chu-swipe-row-more" type="button" aria-label="More actions"><svg class="chu-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 5h2v2H1zm4 0h2v2H5zm4 0h2v2H9z"/></svg></button></div>
    <div class="chu-swipe-row-actions" data-side="start"><button class="chu-box chu-button" type="button" id="archive${n}">Archive</button></div>
    <div class="chu-swipe-row-actions" data-side="end"><button class="chu-box chu-button" type="button" id="delete${n}" data-tone="danger">Delete</button><button class="chu-box chu-button" type="button">Flag</button></div>
  </chu-swipe-row></li>`;
const list = (...open: string[]) => mount(`<ul class="chu-list" role="list" style="inline-size:360px">${open.map((o, i) => row(i + 1, o)).join("")}</ul>`);
const rowOf = (root: Element, n = 1) => root.querySelector<BlipSwipeRow>(`#r${n}`)!;
const x = (r: HTMLElement) => parseFloat(r.style.getPropertyValue("--_chu-swipe-x") || "0");

/** A finger (or a mouse) pressing at (x, y), moving by each step, and letting go. */
function swipe(el: Element, moves: [number, number][], type = "touch", end = "pointerup") {
  const r = el.getBoundingClientRect();
  let cx = r.left + r.width / 2;
  let cy = r.top + r.height / 2;
  const init = (): PointerEventInit => ({ pointerId: 7, pointerType: type, isPrimary: true, clientX: cx, clientY: cy, bubbles: true, cancelable: true, composed: true });
  el.dispatchEvent(new PointerEvent("pointerdown", init()));
  for (const [dx, dy] of moves) {
    cx += dx;
    cy += dy;
    el.dispatchEvent(new PointerEvent("pointermove", init()));
  }
  el.dispatchEvent(new PointerEvent(end, init()));
}

describe("chu-swipe-row", () => {
  it("swipes open past half its actions, in whole pixels, and says so", () => {
    const root = list("");
    const r = rowOf(root);
    const seen: unknown[] = [];
    r.addEventListener("chu-open", (e) => seen.push((e as CustomEvent).detail));
    const face = r.querySelector(".chu-swipe-row-face")!;
    const end = r.querySelector<HTMLElement>('[data-side="end"]')!.offsetWidth;
    swipe(face, [[-9, 1], [-end * 0.4, 0]]);
    expect(r.open).toBe(null);
    expect(x(r)).toBe(0);
    swipe(face, [[-9, 1], [-end * 0.7, 0]]);
    expect(r.open).toBe("end");
    expect(Math.abs(x(r))).toBeGreaterThanOrEqual(end);
    expect(Math.abs(x(r)) % 2).toBe(0);
    expect(seen).toEqual([{ side: "end" }]);
    expect(r.querySelector(".chu-swipe-row-more")!.getAttribute("aria-expanded")).toBe("true");
    expect(r.getAttribute("data-chu-moved")).toBe("end");
  });

  it("snaps every move of the face to the Blip pixel", () => {
    const r = rowOf(list(""));
    const face = r.querySelector(".chu-swipe-row-face")!;
    const b = face.getBoundingClientRect();
    face.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 3, pointerType: "touch", isPrimary: true, clientX: b.left + 200, clientY: b.top + 5, bubbles: true }));
    face.dispatchEvent(new PointerEvent("pointermove", { pointerId: 3, pointerType: "touch", isPrimary: true, clientX: b.left + 175.3, clientY: b.top + 5, bubbles: true }));
    expect(r.hasAttribute("data-chu-dragging")).toBe(true);
    expect(x(r)).toBe(-24);
    face.dispatchEvent(new PointerEvent("pointermove", { pointerId: 3, pointerType: "touch", isPrimary: true, clientX: b.left + 190.1, clientY: b.top + 5, bubbles: true }));
    expect(x(r)).toBe(-10);
    face.dispatchEvent(new PointerEvent("pointerup", { pointerId: 3, pointerType: "touch", isPrimary: true, clientX: b.left + 190.1, clientY: b.top + 5, bubbles: true }));
    expect(r.hasAttribute("data-chu-dragging")).toBe(false);
  });

  it("leaves a vertical swipe to the page, and a mouse drag alone", () => {
    const r = rowOf(list(""));
    const face = r.querySelector(".chu-swipe-row-face")!;
    swipe(face, [[2, 12], [-80, 20]]);
    expect(x(r)).toBe(0);
    expect(r.open).toBe(null);
    swipe(face, [[-12, 0], [-200, 0]], "mouse");
    expect(x(r)).toBe(0);
    expect(r.open).toBe(null);
  });

  it("asks before a full swipe runs the first action, which can be refused", () => {
    const r = rowOf(list(""));
    const face = r.querySelector(".chu-swipe-row-face")!;
    const ran: string[] = [];
    r.querySelector("#delete1")!.addEventListener("click", () => ran.push("delete"));
    let refuse = true;
    const asked: SwipeDetail[] = [];
    r.addEventListener("chu-swipe", (e) => {
      asked.push((e as CustomEvent<SwipeDetail>).detail);
      if (refuse) e.preventDefault();
    });
    swipe(face, [[-10, 0], [-290, 0]]);
    expect(asked.map((d) => [d.side, d.action.id])).toEqual([["end", "delete1"]]);
    expect(ran).toEqual([]);
    expect(r.open).toBe("end");
    refuse = false;
    r.close();
    swipe(face, [[-10, 0], [-290, 0]]);
    expect(ran).toEqual(["delete"]);
    expect(r.open).toBe(null);
  });

  it("shows the full swipe while the finger is down", () => {
    const r = rowOf(list(""));
    const face = r.querySelector(".chu-swipe-row-face")!;
    const b = face.getBoundingClientRect();
    const at = (cx: number): PointerEventInit => ({ pointerId: 4, pointerType: "touch", isPrimary: true, clientX: cx, clientY: b.top + 4, bubbles: true });
    face.dispatchEvent(new PointerEvent("pointerdown", at(b.right - 4)));
    face.dispatchEvent(new PointerEvent("pointermove", at(b.right - 40)));
    expect(r.hasAttribute("data-chu-full")).toBe(false);
    face.dispatchEvent(new PointerEvent("pointermove", at(b.left + 10)));
    expect(r.getAttribute("data-chu-full")).toBe("end");
    face.dispatchEvent(new PointerEvent("pointercancel", at(b.left + 10)));
    expect(r.hasAttribute("data-chu-full")).toBe(false);
    expect(x(r)).toBe(0);
  });

  it("swipes the other way to the start, and not at all towards a side with no actions", () => {
    const root = mount(`<ul class="chu-list" role="list" style="inline-size:360px"><li><chu-swipe-row class="chu-swipe-row" id="solo"><div class="chu-swipe-row-face"><div class="chu-list-item">Slot 1</div></div><div class="chu-swipe-row-actions" data-side="end"><button class="chu-box chu-button" type="button">Delete</button></div></chu-swipe-row></li></ul>`);
    const r = root.querySelector<BlipSwipeRow>("#solo")!;
    swipe(r.querySelector(".chu-swipe-row-face")!, [[10, 0], [150, 0]]);
    expect(x(r)).toBe(0);
    expect(r.open).toBe(null);
    const two = rowOf(list(""));
    swipe(two.querySelector(".chu-swipe-row-face")!, [[10, 0], [80, 0]]);
    expect(two.open).toBe("start");
    expect(x(two)).toBeGreaterThan(0);
  });

  it("mirrors right to left: a swipe to the left shows the start, and the face narrows from the right", () => {
    const root = list("");
    root.dir = "rtl";
    const r = rowOf(root);
    const face = r.querySelector<HTMLElement>(".chu-swipe-row-face")!;
    swipe(face, [[-10, 0], [-80, 0]]);
    expect(r.open).toBe("start");
    expect(x(r)).toBeGreaterThan(0);
    const [row, f] = [r.getBoundingClientRect(), face.getBoundingClientRect()];
    expect(Math.round(f.left - row.left)).toBe(0);
    expect(Math.round(row.right - f.right)).toBe(x(r));
  });

  it("keeps one row of a list open, and closes on a press elsewhere", () => {
    const root = list("end", "");
    const [a, b] = [rowOf(root, 1), rowOf(root, 2)];
    expect(a.open).toBe("end");
    b.show("start");
    expect(a.open).toBe(null);
    expect(b.open).toBe("start");
    const closed: string[] = [];
    b.addEventListener("chu-close", () => closed.push("b"));
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(b.open).toBe(null);
    expect(closed).toEqual(["b"]);
  });

  it("does not follow the link when the face of an open row is pressed: it closes", () => {
    const r = rowOf(list("end"));
    const link = r.querySelector("a")!;
    let followed = false;
    link.addEventListener("click", (e) => {
      followed = !e.defaultPrevented;
      e.preventDefault();
    });
    link.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", isPrimary: true }));
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
    expect(followed).toBe(false);
    expect(r.open).toBe(null);
  });

  it("opens and closes with More, and an action that gets focus shows its side", () => {
    const r = rowOf(list(""));
    const more = r.querySelector<HTMLButtonElement>(".chu-swipe-row-more")!;
    expect(more.getAttribute("aria-expanded")).toBe("false");
    more.click();
    expect(r.open).toBe("end");
    more.click();
    expect(r.open).toBe(null);
    r.querySelector<HTMLButtonElement>("#archive1")!.focus();
    expect(r.open).toBe("start");
    r.querySelector<HTMLButtonElement>("#delete1")!.focus();
    expect(r.open).toBe("end");
    expect(press("Escape")).toBe(true);
    expect(r.open).toBe(null);
    expect(document.activeElement).toBe(more);
  });

  it("closes once an action has run, and when focus leaves the row", () => {
    const root = list("", "");
    const r = rowOf(root);
    r.querySelector<HTMLButtonElement>("#delete1")!.focus();
    expect(r.open).toBe("end");
    rowOf(root, 2).querySelector("a")!.focus();
    expect(r.open).toBe(null);
    r.show();
    r.querySelector<HTMLButtonElement>("#delete1")!.click();
    return Promise.resolve().then(() => expect(r.open).toBe(null));
  });
});
