/**
 * <pp-choices> interaction tests, on the example's title screen: one choice is in the tab order, Up and Down move
 * between the choices (wrapping, past the one you can't take), and taking one sends pp-action, as a menu or a
 * command palette does, with the button, its value, its place and its words. The one you can't take sends nothing.
 */
import type { StoryObj } from "@storybook/html-vite";
import { expect } from "storybook/test";
import { events, focus, focused, press } from "../lib/play";

const titleScreen = (root: HTMLElement) => {
  const element = root.querySelector<HTMLElement>("pp-choices")!;
  const choice = (value: string) => element.querySelector<HTMLButtonElement>(`button[value="${value}"]`)!;
  return { element, choice, buttons: [...element.querySelectorAll<HTMLButtonElement>("button")] };
};

export const KeysAndAction: StoryObj = {
  name: "Up and Down, then Enter sends pp-action",
  play: async ({ canvasElement, step }) => {
    const { element, choice, buttons } = titleScreen(canvasElement);
    const taken = events<{ item: HTMLElement; value: string; index: number; label: string }>(element, "pp-action");

    await step("One choice is in the tab order", async () => {
      expect(buttons.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    });

    await step("Down and Up move, wrapping past the choice you can't take", async () => {
      focus(choice("new"));
      await press("{ArrowDown}");
      await focused(choice("continue"));
      await press("{ArrowDown}{ArrowDown}");
      await focused(choice("new")); // Options, then round past Credits
      await press("{ArrowUp}");
      await focused(choice("options"));
    });

    await step("Enter takes the choice: pp-action with its button, value, place and words", async () => {
      await press("{Enter}");
      expect(taken).toEqual([{ item: choice("options"), value: "options", index: 2, label: "Options" }]);
    });

    await step("The choice you can't take sends nothing", async () => {
      choice("credits").click(); // aria-disabled: a pointer can still press it (the test runner's click won't)
      expect(taken).toHaveLength(1);
    });
  },
};
