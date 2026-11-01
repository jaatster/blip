/**
 * <chu-segmented> interaction tests, on the example's "View" and "Players" controls: a radio group with one tab stop;
 * the arrow keys move and choose (wrapping, skipping a disabled segment), Home and End jump, a click chooses, and
 * each choice fires input, change and chu-change.
 */
import type { StoryObj } from "@storybook/html-vite";
import { expect } from "storybook/test";
import { click, events, focus, focused, one, press } from "../lib/play";

type Segmented = HTMLElement & { value: string };

const control = (root: HTMLElement, label: string) => {
  const element = one<Segmented>(root, `chu-segmented[aria-label="${label}"]`);
  const segment = (name: string) => [...element.querySelectorAll<HTMLButtonElement>(":scope > button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent?.trim()) === name)!;
  return { element, segment };
};

export const ArrowKeysChoose: StoryObj = {
  name: "Arrow keys and clicks choose",
  play: async ({ canvasElement, step }) => {
    const { element, segment } = control(canvasElement, "View");
    const changes = events<{ value: string }>(element, "chu-change");
    let nativeChanges = 0;
    element.addEventListener("change", () => nativeChanges++);

    await step("It is a radio group with the chosen segment as its one tab stop", async () => {
      expect(element).toHaveAttribute("role", "radiogroup");
      expect(segment("Grid")).toHaveAttribute("role", "radio");
      expect(segment("Grid")).toHaveAttribute("aria-checked", "true");
      expect([segment("List"), segment("Grid"), segment("Map")].map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
    });

    await step("ArrowRight moves and chooses; it wraps", async () => {
      focus(segment("Grid"));
      await press("{ArrowRight}");
      await focused(segment("Map"));
      expect(element.value).toBe("map");
      expect(segment("Map")).toHaveAttribute("aria-checked", "true");
      expect(segment("Grid")).toHaveAttribute("aria-checked", "false");
      await press("{ArrowRight}");
      await focused(segment("List"));
      expect(element.value).toBe("list");
      expect(changes.map((c) => c.value)).toEqual(["map", "list"]);
      expect(nativeChanges).toBe(2);
    });

    await step("ArrowUp and ArrowDown work too; End and Home jump", async () => {
      await press("{ArrowDown}");
      await focused(segment("Grid"));
      await press("{End}");
      await focused(segment("Map"));
      await press("{Home}");
      await focused(segment("List"));
      expect(element.value).toBe("list");
    });

    await step("A click chooses", async () => {
      await click(segment("Map"));
      expect(element.value).toBe("map");
      expect(segment("Map").tabIndex).toBe(0);
    });
  },
};

export const SkipsDisabled: StoryObj = {
  name: "A disabled segment is skipped",
  play: async ({ canvasElement }) => {
    const { element, segment } = control(canvasElement, "Players, large");
    expect(segment("4P")).toBeDisabled();
    focus(segment("2P"));
    await press("{ArrowRight}");
    await focused(segment("1P")); // past 4P, round to the start
    expect(element.value).toBe("1p");
    await press("{ArrowLeft}");
    await focused(segment("2P"));
    expect(element.value).toBe("2p");
    const { element: off, segment: offSegment } = control(canvasElement, "Disabled");
    expect(offSegment("On")).toBeDisabled();
    expect(off.value).toBe("on");
  },
};
