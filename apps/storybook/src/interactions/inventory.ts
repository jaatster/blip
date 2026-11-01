/**
 * <chu-inventory> interaction tests, on the example's backpack: a single-select listbox of slots with one tab stop;
 * Left and Right move along, Up and Down by a whole row (five columns), Home and End jump, letters jump by
 * typeahead, and Enter, Space or a click selects and fires chu-select.
 */
import type { StoryObj } from "@storybook/html-vite";
import { expect } from "storybook/test";
import { click, events, focus, focused, one, press, wait } from "../lib/play";

const backpack = (root: HTMLElement) => {
  const element = one<HTMLElement>(root, "chu-inventory");
  const slots = () => [...element.querySelectorAll<HTMLElement>(".chu-slot")];
  const slot = (label: string) => slots().find((s) => s.getAttribute("aria-label") === label)!;
  return { element, slots, slot };
};

export const GridKeysAndSelect: StoryObj = {
  name: "Two-dimensional keys, typeahead and select",
  play: async ({ canvasElement, step }) => {
    const { element, slots, slot } = backpack(canvasElement);
    const picked = events<{ value: string; index: number }>(element, "chu-select");

    await step("A labelled listbox of options, with one tab stop", async () => {
      expect(element).toHaveAttribute("role", "listbox");
      expect(element).toHaveAccessibleName(/Backpack/);
      expect(slots().every((s) => s.getAttribute("role") === "option")).toBe(true);
      expect(slots().filter((s) => s.tabIndex === 0)).toHaveLength(1);
      expect(slot("Moon key, rare")).toHaveAttribute("aria-selected", "true");
    });

    await step("Right moves along; Down and Up move by a row of five", async () => {
      focus(slots()[0]!);
      await press("{ArrowRight}");
      await focused(slots()[1]!);
      await press("{ArrowDown}");
      await focused(slots()[6]!);
      await press("{ArrowUp}");
      await focused(slots()[1]!);
      await press("{ArrowLeft}{ArrowLeft}");
      await focused(slots()[0]!); // no wrapping at the start
    });

    await step("End and Home jump to the last and first slot", async () => {
      await press("{End}");
      await focused(slots().at(-1)!);
      await press("{ArrowDown}");
      await focused(slots().at(-1)!); // no row below
      await press("{Home}");
      await focused(slots()[0]!);
    });

    await step("A letter jumps to the next item named with it", async () => {
      await press("c");
      await focused(slot("Coins, 99"));
      await wait(600);
      await press("h");
      await focused(slot("Heart container, epic"));
    });

    await step("Enter selects; one slot is selected at a time", async () => {
      await press("{Enter}");
      expect(slot("Heart container, epic")).toHaveAttribute("aria-selected", "true");
      expect(slot("Moon key, rare")).toHaveAttribute("aria-selected", "false");
      expect(picked.at(-1)).toEqual(expect.objectContaining({ value: "Heart container, epic", index: 8 }));
    });

    await step("A click selects too", async () => {
      await click(slot("Old chest"));
      expect(slot("Old chest")).toHaveAttribute("aria-selected", "true");
      expect(slots().filter((s) => s.getAttribute("aria-selected") === "true")).toHaveLength(1);
      expect(picked.at(-1)?.index).toBe(10);
    });
  },
};
