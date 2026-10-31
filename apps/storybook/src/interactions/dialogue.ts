/**
 * <pp-dialogue> interaction tests, on the example's text boxes: a press while a page types shows the rest of it at
 * once (skip), the next press turns the page (advance), each page is announced whole, and after the last page comes
 * pp-done, or the choices when there are some.
 */
import type { StoryObj } from "@storybook/html-vite";
import { expect, waitFor } from "storybook/test";
import { events, focus, press } from "../lib/play";

type Dialogue = HTMLElement & { page: number; typing: boolean; pages: HTMLElement[]; advance(): void };

const boxes = (root: HTMLElement) => [...root.querySelectorAll<Dialogue>("pp-dialogue")];
const parts = (box: Dialogue) => ({
  next: box.querySelector<HTMLButtonElement>(":scope > .pp-dialogue-next")!,
  live: box.querySelector<HTMLElement>(':scope > [aria-live="polite"]')!,
  current: () => box.pages.find((p) => p.hasAttribute("data-current"))!,
  /** What the page shows: the typed text, without the rest still waiting in its hidden span. */
  shown: () => {
    const page = box.pages.find((p) => p.hasAttribute("data-current"))!;
    const clone = page.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".pp-dialogue-rest").forEach((r) => r.remove());
    return clone.textContent?.replace(/\s+/g, " ").trim() ?? "";
  },
});

export const SkipAndAdvance: StoryObj = {
  name: "Skip the typing, then turn the page",
  play: async ({ canvasElement, step }) => {
    const box = boxes(canvasElement)[0]!;
    const { next, live, current, shown } = parts(box);
    const turns = events<{ page: number; pages: number }>(box, "pp-next");
    const done = events(box, "pp-done");
    const first = "Ah, a traveller! The rope bridge to Starfall Meadow washed out in last night's storm, and the ferry won't run till spring.";

    await step("A labelled group; the whole page is announced while it types", async () => {
      expect(box).toHaveAttribute("role", "group");
      expect(box).toHaveAccessibleName("Bramble");
      await waitFor(() => expect(live).toHaveTextContent(`Bramble: ${first}`));
      expect(shown().length).toBeLessThan(first.length); // frozen mid-sentence (data-pp-typed)
      expect(next).toHaveAccessibleName("Show all text");
    });

    await step("Enter on the arrow shows the rest of the page at once", async () => {
      focus(next);
      await press("{Enter}");
      expect(shown()).toBe(first);
      expect(box.typing).toBe(false);
      expect(next).toHaveAccessibleName("Next");
      expect(box.page).toBe(0);
    });

    await step("The next press turns the page; a press while it types skips again", async () => {
      await press("{Enter}");
      expect(box.page).toBe(1);
      expect(current()).toBe(box.pages[1]);
      expect(turns.at(-1)).toEqual({ page: 1, pages: 2 });
      await waitFor(() => expect(live).toHaveTextContent("Bramble: I could patch it up before sunset"));
      if (box.typing) await press(" ");
      expect(shown()).toBe("I could patch it up before sunset, for thirty coins. Or for that shiny key of yours.");
      expect(next).toHaveAccessibleName("Continue");
    });

    await step("After the last page, the next press sends pp-done", async () => {
      expect(done).toHaveLength(0);
      await press("{Enter}");
      expect(done).toHaveLength(1);
    });
  },
};

export const ChoicesAfterTheLastPage: StoryObj = {
  name: "The last page leads to the choices",
  play: async ({ canvasElement, step }) => {
    const box = boxes(canvasElement)[1]!;
    const { next } = parts(box);
    const choices = box.querySelector<HTMLElement>("pp-choices")!;
    const picked = events<{ value: string }>(choices, "pp-choice");
    const choice = (value: string) => choices.querySelector<HTMLButtonElement>(`button[value="${value}"]`)!;

    await step("Finishing the page shows the choices and hides the arrow", async () => {
      if (box.typing) box.advance(); // skip the typing, as a press would
      await waitFor(() => expect(box).toHaveAttribute("data-choosing"));
      expect(next.hidden).toBe(true);
    });

    await step("Up and Down move between the choices, past the one you can't take", async () => {
      box.focus(); // focuses what comes next: the choices
      await waitFor(() => expect(choices.contains(document.activeElement)).toBe(true));
      expect(document.activeElement).toBe(choice("trade"));
      await press("{ArrowDown}");
      expect(document.activeElement).toBe(choice("later"));
      await press("{ArrowDown}");
      expect(document.activeElement).toBe(choice("trade")); // wraps, skipping "pay"
    });

    await step("Enter takes a choice", async () => {
      await press("{Enter}");
      expect(picked.at(-1)).toMatchObject({ value: "trade" });
    });
  },
};
