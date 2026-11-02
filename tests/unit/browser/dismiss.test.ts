/**
 * dismiss: closes a floating thing on Escape, or on a press or focus outside it (and outside anything that counts as
 * inside, such as its button).
 */
import { describe, expect, it, vi } from "vitest";
import { dismiss } from "@jaatster/blip-core";
import { mount, press } from "../support/dom.ts";

function popup() {
  const root = mount(`<div><button class="trigger">Open</button><div class="popup"><button class="inner">Inside</button></div><button class="other">Elsewhere</button></div>`);
  const [trigger, popupEl, inner, other] = [".trigger", ".popup", ".inner", ".other"].map((s) => root.querySelector<HTMLElement>(s)!);
  const onDismiss = vi.fn();
  const stop = new AbortController();
  dismiss(popupEl!, { onDismiss, inside: () => [trigger!], signal: stop.signal });
  return { trigger: trigger!, popup: popupEl!, inner: inner!, other: other!, onDismiss, stop: () => stop.abort() };
}
const pointerdown = (el: Element) => el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, composed: true }));

describe("dismiss", () => {
  it("dismisses on Escape", () => {
    const p = popup();
    p.inner.focus();
    press("Escape");
    expect(p.onDismiss).toHaveBeenCalledWith("escape");
  });

  it("leaves Escape alone once something nearer has handled it", () => {
    const p = popup();
    p.inner.addEventListener("keydown", (e) => e.preventDefault());
    p.inner.focus();
    press("Escape");
    expect(p.onDismiss).not.toHaveBeenCalled();
  });

  it("ignores other keys", () => {
    const p = popup();
    p.inner.focus();
    press("Enter");
    press("Tab");
    expect(p.onDismiss).not.toHaveBeenCalled();
  });

  it("dismisses on a press outside", () => {
    const p = popup();
    pointerdown(p.other);
    expect(p.onDismiss).toHaveBeenCalledWith("outside");
    pointerdown(document.body);
    expect(p.onDismiss).toHaveBeenCalledTimes(2);
  });

  it("does not dismiss on a press inside, or on what counts as inside", () => {
    const p = popup();
    pointerdown(p.inner);
    pointerdown(p.popup);
    pointerdown(p.trigger);
    expect(p.onDismiss).not.toHaveBeenCalled();
  });

  it("dismisses when focus moves outside, not when it moves within", () => {
    const p = popup();
    p.inner.focus();
    p.trigger.focus();
    expect(p.onDismiss).not.toHaveBeenCalled();
    p.other.focus();
    expect(p.onDismiss).toHaveBeenCalledWith("outside");
  });

  it("stops listening when its signal aborts", () => {
    const p = popup();
    p.stop();
    p.inner.focus();
    press("Escape");
    pointerdown(p.other);
    p.other.focus();
    expect(p.onDismiss).not.toHaveBeenCalled();
  });
});
