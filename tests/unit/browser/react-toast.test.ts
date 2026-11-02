/**
 * toast() from @jaatster/blip-react hands back the same handle as @jaatster/blip-elements, at once: close() works straight
 * away, even in the first moments of a page while the toaster element is still loading (a toast closed then never
 * shows), and `closed` settles once it has gone.
 */
import { describe, expect, it, vi } from "vitest";

// The toaster module, from its source, arriving a little late, as a lazily loaded chunk does.
vi.mock("@jaatster/blip-elements/toast", async () => {
  await new Promise((done) => setTimeout(done, 50));
  return import("../../../packages/elements/src/toast.ts");
});
const { toast } = await import("../../../packages/react/src/toast.ts");

const shown = () => [...document.querySelectorAll(".blip-toast")].filter((t) => !(t as HTMLElement).hidden).map((t) => t.getAttribute("aria-label"));

describe("@jaatster/blip-react toast()", () => {
  it("returns { close, closed } at once while the toaster loads; closed then, the toast never shows", async () => {
    const early = toast("Saving…");
    expect(Object.keys(early).sort()).toEqual(["close", "closed"]);
    early.close();
    await early.closed;
    expect(shown()).toEqual([]);
  });

  it("shows a toast asked for while loading, and closes it with the same handle", async () => {
    const handle = toast({ title: "Saved to slot 2", tone: "success" });
    await vi.waitFor(() => expect(shown()).toEqual(["Saved to slot 2"]));
    handle.close();
    await handle.closed;
    expect(shown()).toEqual([]);
  });

  it("once loaded, returns the element's own handle", async () => {
    const handle = toast("Copied");
    expect(shown()).toEqual(["Copied"]);
    handle.close();
    await handle.closed;
    document.querySelector("blip-toaster")?.remove();
  });
});
