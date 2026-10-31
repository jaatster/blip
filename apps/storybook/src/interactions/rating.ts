/**
 * <pp-rating> interaction tests, on the example's ratings: a radio group of named stars with one tab stop; the arrow
 * keys, Home and End set the score, Space sets the focused star, a click sets it, the pointer previews; read-only
 * keeps its score and disabled has no tab stop.
 */
import type { StoryObj } from "@storybook/html-vite";
import { expect } from "storybook/test";
import { click, events, focus, focused, hover, one, press, unhover } from "../lib/play";

type Rating = HTMLElement & { value: number; max: number };

const rating = (root: HTMLElement, labelledBy: string) => {
  const element = one<Rating>(root, `pp-rating[aria-labelledby="${labelledBy}"]`);
  const stars = () => [...element.querySelectorAll<HTMLElement>(":scope > .pp-rating-star")];
  return { element, stars, star: (n: number) => stars()[n - 1]! };
};

export const KeysAndClicks: StoryObj = {
  name: "Arrow keys, Space and clicks set the score",
  play: async ({ canvasElement, step }) => {
    const { element, stars, star } = rating(canvasElement, "rt-fun");
    const changes = events<{ value: number }>(element, "pp-change");

    await step("Five named stars, the score's star the tab stop", async () => {
      expect(element).toHaveAttribute("role", "radiogroup");
      expect(element).toHaveAccessibleName("How fun was it?");
      expect(stars().map((s) => s.getAttribute("aria-label"))).toEqual(["1 star", "2 stars", "3 stars", "4 stars", "5 stars"]);
      expect(star(4)).toHaveAttribute("aria-checked", "true");
      expect(stars().map((s) => s.tabIndex)).toEqual([-1, -1, -1, 0, -1]);
    });

    await step("ArrowRight and ArrowLeft move and set it", async () => {
      focus(star(4));
      await press("{ArrowRight}");
      await focused(star(5));
      expect(element.value).toBe(5);
      await press("{ArrowLeft}{ArrowLeft}");
      await focused(star(3));
      expect(element.value).toBe(3);
      expect(star(3)).toHaveAttribute("aria-checked", "true");
    });

    await step("Home and End jump to the ends", async () => {
      await press("{Home}");
      expect(element.value).toBe(1);
      await press("{End}");
      expect(element.value).toBe(5);
      expect(changes.map((c) => c.value)).toEqual([5, 4, 3, 1, 5]);
    });

    await step("Space sets the focused star; a click sets any", async () => {
      star(2).focus();
      await press(" ");
      expect(element.value).toBe(2);
      await click(star(4));
      expect(element.value).toBe(4);
    });

    await step("The pointer previews without setting", async () => {
      await hover(star(5));
      expect(element).toHaveAttribute("data-preview");
      expect(element.value).toBe(4);
      await unhover(element);
      expect(element).not.toHaveAttribute("data-preview");
    });
  },
};

export const ReadOnlyAndDisabled: StoryObj = {
  name: "Read-only keeps its score; disabled has no tab stop",
  play: async ({ canvasElement }) => {
    const readOnly = rating(canvasElement, "rt-ro");
    expect(readOnly.element).toHaveAttribute("aria-readonly", "true");
    focus(readOnly.star(3));
    await press("{ArrowRight}");
    expect(readOnly.element.value).toBe(3);
    await click(readOnly.star(1));
    expect(readOnly.element.value).toBe(3);

    const disabled = rating(canvasElement, "rt-off");
    expect(disabled.element).toHaveAttribute("aria-disabled", "true");
    expect(disabled.stars().every((s) => s.tabIndex === -1)).toBe(true);
  },
};
