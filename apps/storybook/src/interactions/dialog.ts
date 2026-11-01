/**
 * <blip-dialog> interaction tests, on the example's live "Save game" dialog: it opens as a modal from its invoker
 * button, keeps focus inside (the page behind is inert), closes on Escape through a cancelable blip-before-close and
 * gives focus back to the button that opened it; a listener can refuse the close.
 */
import type { StoryObj } from "@storybook/html-vite";
import { expect, waitFor } from "storybook/test";
import { click, escape, events, focus, focused, one, press } from "../lib/play";

interface CloseDetail {
  reason: string;
  returnValue?: string;
}

const saveDialog = (root: HTMLElement) => {
  const dialog = one<HTMLDialogElement>(root, "dialog#save-dialog");
  const element = dialog.closest("blip-dialog")!;
  const opener = one<HTMLButtonElement>(root, 'button[commandfor="save-dialog"][command="show-modal"]');
  const button = (name: string) => [...dialog.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent?.trim()) === name)!;
  return { dialog, element, opener, button };
};

const openFrom = async (opener: HTMLButtonElement, dialog: HTMLDialogElement) => {
  focus(opener);
  await press("{Enter}");
  await waitFor(() => expect(dialog.open).toBe(true));
};

export const FocusTrapAndEscape: StoryObj = {
  name: "Focus stays inside; Escape closes and returns focus",
  play: async ({ canvasElement, step }) => {
    const { dialog, element, opener } = saveDialog(canvasElement);
    const closes = events<CloseDetail>(element, "blip-close");

    await step("The button opens it as a modal, with focus inside", async () => {
      await openFrom(opener, dialog);
      expect(dialog.matches(":modal")).toBe(true);
      expect(element).toHaveAttribute("open");
      await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    });

    await step("Tab and Shift+Tab never leave the dialog; the page behind is inert", async () => {
      for (let i = 0; i < 8; i++) {
        await press(i % 3 === 2 ? "{Shift>}{Tab}{/Shift}" : "{Tab}");
        const now = document.activeElement;
        expect(now === document.body || dialog.contains(now)).toBe(true);
      }
      opener.focus();
      expect(document.activeElement).not.toBe(opener);
    });

    await step("Escape closes it and focus goes back to the button", async () => {
      focus(dialog.querySelector<HTMLElement>('input[value="1"]')!);
      await escape();
      await waitFor(() => expect(dialog.open).toBe(false));
      expect(element).not.toHaveAttribute("open");
      expect(closes.at(-1)?.reason).toBe("escape");
      await focused(opener);
    });
  },
};

export const BeforeCloseCancel: StoryObj = {
  name: "blip-before-close can refuse",
  play: async ({ canvasElement, step }) => {
    const { dialog, element, opener, button } = saveDialog(canvasElement);
    const asked = events<CloseDetail>(element, "blip-before-close");
    const closes = events<CloseDetail>(element, "blip-close");
    let refuse = true;
    element.addEventListener("blip-before-close", (e) => refuse && e.preventDefault());

    await step("Escape asks, is refused, and the dialog stays open", async () => {
      await openFrom(opener, dialog);
      await escape();
      await waitFor(() => expect(asked.at(-1)?.reason).toBe("escape"));
      expect(dialog.open).toBe(true);
      expect(closes).toHaveLength(0);
    });

    await step("The Cancel button asks too, and is refused", async () => {
      await click(button("Cancel"));
      await waitFor(() => expect(asked.at(-1)).toMatchObject({ reason: "button", returnValue: "cancel" }));
      expect(dialog.open).toBe(true);
    });

    await step("Allowed, Save closes it with its value and focus goes back", async () => {
      refuse = false;
      await click(button("Save"));
      await waitFor(() => expect(dialog.open).toBe(false));
      expect(closes.at(-1)).toMatchObject({ reason: "submit", returnValue: "save" });
      expect(element.returnValue).toBe("save");
      await focused(opener);
    });
  },
};
