/**
 * <pp-menu> interaction tests, on the example's live "Level" menu: ArrowDown opens it on the first item, the arrows,
 * Home and End rove (skipping the disabled item), letters jump by typeahead, Space toggles a checkbox item and keeps
 * the menu open, ArrowRight and ArrowLeft open and close the submenu, Enter chooses, and Escape closes and gives
 * focus back to the button.
 */
import type { StoryObj } from "@storybook/html-vite";
import { expect, waitFor } from "storybook/test";
import { escape, events, focus, focused, press, wait } from "../lib/play";

const levelMenu = (root: HTMLElement) => {
  // The live menu: the pp-menu element (the static picture above it is a plain, inert copy).
  const element = [...root.querySelectorAll("pp-menu")].find((m) => m.querySelector(':scope > [role="menu"][aria-label="Level"]'))!;
  const button = element.querySelector<HTMLElement>(":scope > button")!;
  const list = element.querySelector<HTMLElement>(':scope > [role="menu"]')!;
  const item = (label: string) => [...list.querySelectorAll<HTMLElement>('[role^="menuitem"]')].find((i) => i.textContent?.trim().startsWith(label))!;
  const open = () => list.matches(":popover-open");
  return { element, button, list, item, open };
};

export const KeyboardPath: StoryObj = {
  name: "Open, rove, typeahead, Escape",
  play: async ({ canvasElement, step }) => {
    const { element, button, list, item, open } = levelMenu(canvasElement);
    const chosen = events<{ value: string; checked?: boolean }>(element, "pp-action");

    await step("The button is wired as a menu button", async () => {
      expect(button).toHaveAttribute("aria-haspopup", "menu");
      expect(button).toHaveAttribute("aria-controls", list.id);
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    await step("ArrowDown opens the menu on its first item", async () => {
      focus(button);
      await press("{ArrowDown}");
      await waitFor(() => expect(open()).toBe(true));
      await focused(item("New level"));
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    await step("Arrows, End and Home rove; the disabled item is skipped", async () => {
      await press("{ArrowDown}");
      await focused(item("Duplicate"));
      await press("{End}");
      await focused(item("Delete level"));
      await press("{ArrowUp}");
      await focused(item("Last used")); // Publish (disabled) is skipped
      await press("{Home}");
      await focused(item("New level"));
      await press("{ArrowUp}");
      await focused(item("Delete level")); // wraps
    });

    await step("Typing a letter jumps to the next item that starts with it", async () => {
      await press("g");
      await focused(item("Grid"));
      await wait(600); // the typeahead forgets after 500 ms
      await press("l");
      await focused(item("Last used"));
    });

    await step("Space toggles a checkbox item and leaves the menu open", async () => {
      await wait(600);
      await press("h");
      await focused(item("Hitboxes"));
      expect(item("Hitboxes")).toHaveAttribute("aria-checked", "false");
      await press(" ");
      expect(item("Hitboxes")).toHaveAttribute("aria-checked", "true");
      expect(chosen.at(-1)).toMatchObject({ value: "hitboxes", checked: true });
      expect(open()).toBe(true);
    });

    await step("Escape closes the menu and gives focus back to its button", async () => {
      await escape();
      await waitFor(() => expect(open()).toBe(false));
      await focused(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  },
};

export const SubmenuAndChoose: StoryObj = {
  name: "Submenu, then Enter chooses",
  play: async ({ canvasElement, step }) => {
    const { element, button, item, open } = levelMenu(canvasElement);
    const chosen = events<{ value: string }>(element, "pp-action");
    const sub = item("Export").closest("pp-menu")!;
    const subList = sub.querySelector<HTMLElement>(':scope > [role="menu"]')!;
    const subItem = (label: string) => [...subList.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((i) => i.textContent?.trim() === label)!;

    await step("ArrowRight on Export opens the submenu on its first item", async () => {
      focus(button);
      await press("{ArrowDown}");
      await focused(item("New level"));
      await press("{ArrowDown}{ArrowDown}");
      await focused(item("Export"));
      expect(item("Export")).toHaveAttribute("aria-haspopup", "menu");
      await press("{ArrowRight}");
      await waitFor(() => expect(subList.matches(":popover-open")).toBe(true));
      await focused(subItem("PNG picture"));
      expect(open()).toBe(true); // the parent stays open
    });

    await step("ArrowLeft closes the submenu, back on Export", async () => {
      await press("{ArrowLeft}");
      await waitFor(() => expect(subList.matches(":popover-open")).toBe(false));
      await focused(item("Export"));
    });

    await step("Enter on an item chooses it, closes the menu and returns focus", async () => {
      await press("{ArrowUp}");
      await focused(item("Duplicate"));
      await press("{Enter}");
      await waitFor(() => expect(open()).toBe(false));
      expect(chosen.at(-1)?.value).toBe("duplicate");
      await focused(button);
    });
  },
};
