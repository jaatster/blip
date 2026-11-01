/**
 * <chu-tooltip> interaction tests, on the example's live "Save" tooltip: it describes its trigger, shows after a beat
 * on hover and hides when the pointer leaves, shows at once on keyboard focus, and Escape hides it while the trigger
 * keeps focus (WCAG 1.4.13: dismissable without moving).
 */
import type { StoryObj } from "@storybook/html-vite";
import { expect, waitFor } from "storybook/test";
import { escape, focused, hover, one, press, unhover } from "../lib/play";

const saveTip = (root: HTMLElement) => {
  const trigger = one<HTMLButtonElement>(root, "button#tip-save");
  const tip = one<HTMLElement>(root, 'chu-tooltip[for="tip-save"]');
  const shown = () => tip.matches(":popover-open");
  return { trigger, tip, shown };
};

export const HoverFocusEscape: StoryObj = {
  name: "Hover, focus and Escape",
  play: async ({ canvasElement, step }) => {
    const { trigger, tip, shown } = saveTip(canvasElement);

    await step("It describes its trigger, shown or not", async () => {
      expect(tip).toHaveAttribute("role", "tooltip");
      expect(trigger).toHaveAccessibleDescription("Save to slot 2 (Ctrl+S)");
      expect(shown()).toBe(false);
    });

    await step("Hover shows it after a beat; leaving hides it", async () => {
      await hover(trigger);
      await waitFor(() => expect(shown()).toBe(true), { timeout: 2000 });
      expect(["top", "bottom"]).toContain(tip.dataset.side); // above, unless there is no room
      await unhover(trigger);
      await waitFor(() => expect(shown()).toBe(false), { timeout: 2000 });
    });

    await step("Keyboard focus shows it at once", async () => {
      // Tab to the trigger from the label just before it.
      const before = trigger.previousElementSibling as HTMLElement;
      before.tabIndex = -1;
      before.focus();
      await press("{Tab}");
      await focused(trigger);
      await waitFor(() => expect(shown()).toBe(true), { timeout: 500 });
    });

    await step("Escape hides it and the trigger keeps focus", async () => {
      await escape();
      await waitFor(() => expect(shown()).toBe(false));
      expect(document.activeElement).toBe(trigger);
    });

    await step("Leaving with Tab hides it", async () => {
      await press("{Shift>}{Tab}{/Shift}");
      await press("{Tab}");
      await focused(trigger);
      await waitFor(() => expect(shown()).toBe(true));
      await press("{Tab}");
      await waitFor(() => expect(shown()).toBe(false));
    });
  },
};
