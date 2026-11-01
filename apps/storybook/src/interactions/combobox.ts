/**
 * <blip-combobox> interaction tests, on the example's "Start in" field: typing filters the list and completes the first
 * match (the completion selected, so typing on replaces it), Enter takes it; the arrow keys open the list and move
 * the active option; Escape closes the list, then clears the field; no match says so.
 */
import type { StoryObj } from "@storybook/html-vite";
import { expect, waitFor } from "storybook/test";
import { escape, events, focus, one, press } from "../lib/play";

type Combobox = HTMLElement & { value: string; open: boolean };

const startIn = (root: HTMLElement) => {
  const input = one<HTMLInputElement>(root, "input#cb-world");
  const element = input.closest("blip-combobox") as Combobox;
  const listbox = document.getElementById(input.getAttribute("aria-controls") ?? "")!;
  const option = (label: string) => [...listbox.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent === label)!;
  const shown = () => [...listbox.querySelectorAll<HTMLElement>('[role="option"]')].filter((o) => !o.hidden).map((o) => o.textContent);
  const activeOption = () => document.getElementById(input.getAttribute("aria-activedescendant") ?? "")?.textContent ?? null;
  return { input, element, listbox, option, shown, activeOption };
};

const empty = async (input: HTMLInputElement) => {
  focus(input);
  input.select();
  await press("{Backspace}");
};

export const FilterAndComplete: StoryObj = {
  name: "Type to filter, Enter to take the completion",
  play: async ({ canvasElement, step }) => {
    const { input, element, shown, activeOption } = startIn(canvasElement);
    const changes = events<{ value: string }>(element, "blip-change");

    await step("The field is a combobox over its own list", async () => {
      expect(input).toHaveAttribute("role", "combobox");
      expect(input).toHaveAttribute("aria-autocomplete", "both");
      expect(input).toHaveValue("Crystal caves");
      expect(element.value).toBe("caves");
    });

    await step("Typing filters and completes the first match", async () => {
      await empty(input);
      await press("c");
      await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "true"));
      expect(shown()).toEqual(["Crystal caves", "Cloud castle", "Coral reef", "Volcano"]);
      // What was typed stays as typed; the rest of the match is filled in and selected.
      expect(input.value).toBe("crystal caves");
      expect([input.selectionStart, input.selectionEnd]).toEqual([1, "crystal caves".length]);
      await press("o");
      expect(shown()).toEqual(["Coral reef"]);
      expect(input.value).toBe("coral reef");
      expect(activeOption()).toBe("Coral reef");
    });

    await step("Enter takes it: the list closes and the value is the option's", async () => {
      await press("{Enter}");
      expect(input).toHaveAttribute("aria-expanded", "false");
      expect(input).toHaveValue("Coral reef");
      expect(element.value).toBe("reef");
      expect(changes.at(-1)).toEqual({ value: "reef" });
    });

    await step("No match says so", async () => {
      await empty(input);
      await press("zz");
      expect(shown()).toEqual([]);
      await waitFor(() => expect(element.querySelector('[role="status"]')).toHaveTextContent("No world by that name"));
    });
  },
};

export const ArrowKeysAndEscape: StoryObj = {
  name: "Arrow keys choose; Escape closes, then clears",
  play: async ({ canvasElement, step }) => {
    const { input, element, shown, activeOption } = startIn(canvasElement);

    await step("ArrowDown opens every suggestion on the current one", async () => {
      focus(input);
      await press("{ArrowDown}");
      await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "true"));
      expect(shown()).toHaveLength(7);
      expect(activeOption()).toBe("Crystal caves");
    });

    await step("ArrowDown and ArrowUp move the active option, wrapping round", async () => {
      await press("{ArrowDown}");
      expect(activeOption()).toBe("Sky islands");
      await press("{ArrowUp}{ArrowUp}{ArrowUp}");
      expect(activeOption()).toBe("Volcano");
      expect(document.activeElement).toBe(input); // focus never leaves the field
    });

    await step("Enter takes the active option", async () => {
      await press("{Enter}");
      expect(input).toHaveValue("Volcano");
      expect(element.value).toBe("volcano");
      expect(input).toHaveAttribute("aria-expanded", "false");
    });

    await step("Escape closes an open list, then clears the field", async () => {
      await press("{ArrowDown}");
      await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "true"));
      await escape();
      expect(input).toHaveAttribute("aria-expanded", "false");
      expect(input).toHaveValue("Volcano");
      await escape();
      expect(input).toHaveValue("");
    });
  },
};
