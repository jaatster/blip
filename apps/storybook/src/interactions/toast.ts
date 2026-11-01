/**
 * <blip-toaster> interaction tests, on the example's live toaster: a toast is announced through the toaster's live
 * region (assertively for danger), its countdown pauses while the pointer is over the toaster and picks up where it
 * left off, and Escape closes the focused toast.
 */
import type { StoryObj } from "@storybook/html-vite";
import { expect, waitFor } from "storybook/test";
import { click, escape, focus, hover, one, unhover, wait } from "../lib/play";

type Toaster = HTMLElement & { add(options: { title: string; body?: string; tone?: string; duration?: number }): { close(): void; closed: Promise<void> } };

const live = (root: HTMLElement) => {
  const toaster = one<Toaster>(root, "blip-toaster");
  const button = (name: string) => [...root.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.trim() === name)!;
  const polite = toaster.querySelector<HTMLElement>(':scope > [role="status"]')!;
  const assertive = toaster.querySelector<HTMLElement>(':scope > [role="alert"]')!;
  const toast = (title: string) => [...toaster.querySelectorAll<HTMLElement>(".blip-toast")].find((t) => t.getAttribute("aria-label") === title);
  return { toaster, button, polite, assertive, toast };
};

export const AnnounceAndPause: StoryObj = {
  name: "Announced; paused while hovered",
  play: async ({ canvasElement, step }) => {
    const { toaster, button, polite, assertive, toast } = live(canvasElement);

    await step("The toaster is a labelled region with a polite and an assertive live region", async () => {
      expect(toaster).toHaveAttribute("role", "region");
      expect(toaster).toHaveAccessibleName("Notifications");
      expect(polite).toBeTruthy();
      expect(assertive).toBeTruthy();
    });

    await step("Save shows a toast and announces it politely", async () => {
      await click(button("Save"));
      await waitFor(() => expect(toast("Saved to slot 2")).toBeVisible());
      await waitFor(() => expect(polite).toHaveTextContent("Saved to slot 2."));
    });

    await step("A danger toast is announced assertively and stays", async () => {
      await click(button("Fail an upload"));
      await waitFor(() => expect(assertive).toHaveTextContent("Couldn’t upload your replay."));
      expect(toast("Couldn’t upload your replay")?.querySelector(".blip-toast-timer")).toBeNull();
    });

    await step("Hovering pauses every countdown; leaving resumes it", async () => {
      toaster.add({ title: "Quick tip", duration: 700 });
      const quick = toast("Quick tip")!;
      await hover(quick);
      await waitFor(() => expect(toaster).toHaveAttribute("data-paused"));
      await wait(1000);
      expect(toast("Quick tip")).toBeVisible(); // its 700 ms ran out while paused, and it is still here
      await unhover(quick);
      await waitFor(() => expect(toaster).not.toHaveAttribute("data-paused"));
      await waitFor(() => expect(toast("Quick tip")).toBeUndefined(), { timeout: 3000 });
    });

    await step("Escape closes the focused toast", async () => {
      const close = toast("Saved to slot 2")!.querySelector<HTMLButtonElement>(".blip-toast-close")!;
      focus(close);
      await escape();
      await waitFor(() => expect(toast("Saved to slot 2")).toBeUndefined());
    });
  },
};
