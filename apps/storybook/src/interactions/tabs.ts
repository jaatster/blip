/**
 * <pp-tabs> interaction tests, on the example's own markup: automatic activation follows the arrow keys (skipping the
 * disabled tab, wrapping round, Home and End), manual activation moves focus and waits for Enter or Space, and Tab
 * comes back to the selected tab.
 */
import type { StoryObj } from "@storybook/html-vite";
import { expect } from "storybook/test";
import { events, focus, focused, one, press } from "../lib/play";

const tabsNamed = (root: HTMLElement, label: string) => {
  const list = one(root, `[role="tablist"][aria-label="${label}"]`);
  const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
  const tab = (name: string) => tabs.find((t) => t.textContent?.trim().startsWith(name))!;
  const panel = (t: HTMLElement) => document.getElementById(t.getAttribute("aria-controls") ?? "")!;
  return { list, element: list.closest("pp-tabs")!, tabs, tab, panel };
};

export const ArrowKeysSelect: StoryObj = {
  name: "Arrow keys select (automatic)",
  play: async ({ canvasElement, step }) => {
    const { element, tabs, tab, panel } = tabsNamed(canvasElement, "Settings");
    const changes = events<{ index: number }>(element, "pp-change");

    await step("Tabs and panels are wired to each other", async () => {
      for (const t of tabs) {
        expect(t.getAttribute("aria-controls")).toBeTruthy();
        expect(panel(t)).toHaveAttribute("aria-labelledby", t.id);
      }
      expect(tabs.filter((t) => t.tabIndex === 0)).toEqual([tab("General")]);
    });

    await step("ArrowRight moves to Sound and shows its panel", async () => {
      focus(tab("General"));
      await press("{ArrowRight}");
      await focused(tab("Sound"));
      expect(tab("Sound")).toHaveAttribute("aria-selected", "true");
      expect(tab("General")).toHaveAttribute("aria-selected", "false");
      expect(panel(tab("Sound"))).toBeVisible();
      expect(panel(tab("General"))).not.toBeVisible();
      expect(changes.at(-1)?.index).toBe(1);
    });

    await step("End skips the disabled tab; ArrowRight wraps to the first", async () => {
      await press("{End}");
      await focused(tab("Controls"));
      expect(tab("Online")).toHaveAttribute("aria-selected", "false");
      await press("{ArrowRight}");
      await focused(tab("General"));
      expect(tab("General")).toHaveAttribute("aria-selected", "true");
    });

    await step("ArrowLeft wraps to the last usable tab; Home goes back", async () => {
      await press("{ArrowLeft}");
      await focused(tab("Controls"));
      await press("{Home}");
      await focused(tab("General"));
      expect(element).toHaveAttribute("selected", "0");
    });
  },
};

export const ManualActivation: StoryObj = {
  name: "Manual activation: Enter and Space select",
  play: async ({ canvasElement, step }) => {
    const { tab, panel } = tabsNamed(canvasElement, "Account");

    await step("ArrowDown moves focus without selecting", async () => {
      focus(tab("Profile"));
      await press("{ArrowDown}");
      await focused(tab("Security"));
      expect(tab("Profile")).toHaveAttribute("aria-selected", "true");
      expect(tab("Security")).toHaveAttribute("aria-selected", "false");
      expect(panel(tab("Security"))).not.toBeVisible();
    });

    await step("Enter selects the focused tab", async () => {
      await press("{Enter}");
      expect(tab("Security")).toHaveAttribute("aria-selected", "true");
      expect(panel(tab("Security"))).toBeVisible();
      expect(panel(tab("Profile"))).not.toBeVisible();
    });

    await step("Space selects too", async () => {
      await press("{ArrowDown}");
      await focused(tab("Alerts"));
      await press(" ");
      expect(tab("Alerts")).toHaveAttribute("aria-selected", "true");
    });

    await step("Tab leaves for the panel; Shift+Tab comes back to the selected tab", async () => {
      await press("{ArrowUp}");
      await focused(tab("Security"));
      await press("{Tab}");
      await focused(panel(tab("Alerts")));
      await press("{Shift>}{Tab}{/Shift}");
      await focused(tab("Alerts"));
    });
  },
};
