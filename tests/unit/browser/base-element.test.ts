/**
 * PixelElement's flag(): a boolean attribute is on when it is present and not "false". Vue, Svelte and React write
 * open="false" on an element defined after they render; that must read as off, as the property false does.
 */
import { describe, expect, it } from "vitest";
import { PixelElement } from "@jaatster/blip-core";
import { mount } from "../support/dom.ts";

let n = 0;
/** Defines a fresh element (tags can't be redefined) that reads its "open" attribute with flag() when it connects. */
function define() {
  const tag = `pp-base-flag-${++n}`;
  class FlagElement extends PixelElement {
    seen: boolean | undefined;
    protected override connected(): void {
      this.seen = this.flag("open");
    }
    read(name: string): boolean {
      return this.flag(name);
    }
  }
  return { tag, define: () => PixelElement.define(tag, FlagElement) };
}

describe("flag()", () => {
  it("is on for a present attribute, empty or with any value but \"false\"", () => {
    const { tag, define: go } = define();
    go();
    const el = mount(`<${tag}></${tag}>`) as HTMLElement & { read(name: string): boolean };
    expect(el.read("open")).toBe(false);
    for (const value of ["", "open", "true", "False", "0"]) {
      el.setAttribute("open", value);
      expect(el.read("open"), `open="${value}"`).toBe(true);
    }
    el.setAttribute("open", "false");
    expect(el.read("open")).toBe(false);
    el.removeAttribute("open");
    expect(el.read("open")).toBe(false);
  });

  it("reads open=\"false\", written before the element was defined, as off when it upgrades", () => {
    const { tag, define: go } = define();
    // As a framework renders it: the attribute is in place before the tag has a definition.
    const off = mount(`<${tag} open="false"></${tag}>`) as HTMLElement & { seen?: boolean };
    const on = mount(`<${tag} open></${tag}>`) as HTMLElement & { seen?: boolean };
    expect(off.seen).toBeUndefined();
    go();
    expect(off.seen).toBe(false);
    expect(on.seen).toBe(true);
  });
});
