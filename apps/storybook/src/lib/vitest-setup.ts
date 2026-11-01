/**
 * Runs before the stories under Vitest: hands the interaction helpers (play.ts) Vitest's userEvent, which drives the
 * real browser through Playwright, so key presses are trusted (Escape closes native dialogs and popovers, Tab moves
 * focus as the browser does, hover is a real pointer).
 */
import { userEvent } from "vitest/browser";

(globalThis as { __chuTrustedInput?: unknown }).__chuTrustedInput = userEvent;
