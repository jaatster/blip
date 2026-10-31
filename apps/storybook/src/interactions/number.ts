/**
 * <pp-number> interaction tests, on the example's fields: the minus and plus step the real input (which keeps the
 * focus) and commit a change; held, they repeat; Page Up and Page Down step ten, clamped; a button goes off at its end
 * of the range, and both are off when the input is read-only or disabled.
 */
import type { StoryObj } from "@storybook/html-vite";
import { expect, fireEvent, waitFor } from "storybook/test";
import { click, events, focus, one, press, wait } from "../lib/play";

const stepper = (root: HTMLElement, id: string) => {
  const input = one<HTMLInputElement>(root, `input#${id}`);
  const element = input.closest("pp-number")!;
  const [down, up] = [...element.querySelectorAll<HTMLButtonElement>(".pp-number-step")];
  return { input, element, down: down!, up: up! };
};

export const ButtonsAndKeys: StoryObj = {
  name: "Buttons, Page Up and Page Down",
  play: async ({ canvasElement, step }) => {
    const { input, element, down, up } = stepper(canvasElement, "nu-lives");
    const changes = events<{ value: string }>(element, "pp-change");

    await step("The buttons are named, control the input and stay out of the tab order", async () => {
      expect(down).toHaveAccessibleName("Decrease");
      expect(up).toHaveAccessibleName("Increase");
      expect(up).toHaveAttribute("aria-controls", "nu-lives");
      expect([down.tabIndex, up.tabIndex]).toEqual([-1, -1]);
    });

    await step("Plus and minus step once and commit", async () => {
      focus(input);
      await click(up);
      expect(input).toHaveValue(4);
      await waitFor(() => expect(changes.at(-1)).toEqual({ value: "4" }));
      expect(document.activeElement).toBe(input); // the pointer never took the focus
      await click(down);
      await click(down);
      expect(input).toHaveValue(2);
    });

    await step("Page Up steps ten, clamped to the maximum, and plus goes off", async () => {
      focus(input);
      await press("{PageUp}");
      expect(input).toHaveValue(9);
      expect(up).toBeDisabled();
      expect(down).toBeEnabled();
      expect(changes.at(-1)).toEqual({ value: "9" });
    });

    await step("Page Down steps ten, clamped to the minimum, and minus goes off", async () => {
      await press("{PageDown}");
      expect(input).toHaveValue(1);
      expect(down).toBeDisabled();
      expect(up).toBeEnabled();
    });
  },
};

export const HoldToRepeat: StoryObj = {
  name: "Held, plus repeats until let go",
  play: async ({ canvasElement }) => {
    const { input, up } = stepper(canvasElement, "nu-potions");
    expect(input).toHaveValue(0);
    fireEvent.pointerDown(up, { button: 0, pointerId: 1, pointerType: "mouse" });
    await wait(800); // once at once, again after a beat (400 ms), then every 100 ms
    fireEvent.pointerUp(up, { button: 0, pointerId: 1, pointerType: "mouse" });
    const held = input.valueAsNumber;
    expect(held).toBeGreaterThanOrEqual(3);
    await wait(300);
    expect(input.valueAsNumber).toBe(held); // stopped when let go
  },
};

export const ReadOnlyAndDisabled: StoryObj = {
  name: "Read-only and disabled turn both buttons off",
  play: async ({ canvasElement }) => {
    for (const id of ["nu-readonly", "nu-disabled"]) {
      const { down, up } = stepper(canvasElement, id);
      expect(down).toBeDisabled();
      expect(up).toBeDisabled();
    }
    const top = stepper(canvasElement, "nu-max");
    expect(top.up).toBeDisabled();
    expect(top.down).toBeEnabled();
  },
};
