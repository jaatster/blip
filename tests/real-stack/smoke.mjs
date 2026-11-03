/**
 * The smoke checks scripts/real-stack.mjs runs on every app, in Playwright's Chromium. Each app renders the same
 * parts with the same ids, in its own framework's way, so one set of checks reads them all:
 *
 *   look         Pixel Bop and Pixel Operator load and are used; the tokens are there; a button is a candy box (its
 *                ink outline and fill are drawn, the browser's own button look is gone).
 *   tabs         Tabs as the docs write them ([data-smoke=tabs]): the second tab shows its panel.
 *   toast        The README's Save game button shows a toast.
 *   dialog       #open-dialog opens the dialog through the app's state; #close-dialog and Escape close it, and the
 *                app's state follows (#dialog-state).
 *   late-tabs    Tabs and panels that arrive after load, and one added later (#add-tab), are wired and work.
 *   combobox     Options a search fills in as you type are offered, and the one chosen reaches the app (#place).
 *   field        An error the app shows after submit joins the control's aria-describedby and marks it invalid,
 *                and both go when the error does.
 *   lazy-dialog  A dialog whose element is defined after the app mounted, bound to false, stays closed; then opens
 *                and closes (Vue and Svelte).
 *   tailwind     Tailwind's utilities beat the components (mt-8, px-12, text-red-600) and a button without them looks
 *                exactly as it does with Blip's CSS alone (reference.html): the same styles and the same pixels.
 *   reset        The same for an app's own reset, imported into the base layer as the start page says.
 *   kits         The start page's React imports, one from each entry (game, blocks, effects, icons): the kits'
 *                elements upgrade, the world draws, and the kits' CSS styles them.
 *
 * Every page must also load without a failed request, an uncaught error, a console error or a Blip
 * diagnostic ("clean").
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

export const launch = (options) => chromium.launch(options);

/** What the checks read in the page, as window.smoke. Runs before the page's own scripts. */
function helpers() {
  const text = (el) => el?.textContent?.trim() ?? "";
  const panel = (t) => document.getElementById(t.getAttribute("aria-controls") ?? "");
  window.smoke = {
    /** Has a face of each family loaded? */
    loaded(...families) {
      return families.every((family) => [...document.fonts].some((f) => f.family.replace(/["']/g, "") === family && f.status === "loaded"));
    },
    /** The tabs inside a section: wired to their panels, and whether only `name`'s panel shows. */
    tabs(sel, name) {
      const tabs = [...document.querySelectorAll(`${sel} [role="tab"]`)];
      const wired = tabs.length > 0 && tabs.every((t) => t.id && panel(t)?.getAttribute("role") === "tabpanel" && panel(t).getAttribute("aria-labelledby") === t.id);
      const shows = !name || tabs.every((t) => {
        const on = text(t) === name;
        const p = panel(t);
        return t.getAttribute("aria-selected") === String(on) && !!p && (on ? !p.hidden && p.checkVisibility() : p.hidden);
      });
      const focus = document.activeElement;
      return { count: tabs.length, wired, shows, focused: focus?.getAttribute("role") === "tab" ? text(focus) : "" };
    },
    /** A dialog, and what the app's state says about it. */
    dialog(id, state) {
      return { open: !!document.getElementById(id)?.open, state: text(document.querySelector(state)) };
    },
    /** The combobox's options on offer, and what was chosen. */
    combobox() {
      const input = document.querySelector("#place");
      const list = document.getElementById(input?.getAttribute("aria-controls") ?? "");
      const offered = list ? [...list.querySelectorAll('[role="option"]')].filter((o) => !o.hidden && o.checkVisibility()).map(text).sort() : [];
      return { offered: offered.join(", "), value: input?.value, expanded: input?.getAttribute("aria-expanded"), state: text(document.querySelector("#place-state")) };
    },
    /** The field: what describes the control, the error showing, and aria-invalid. */
    field() {
      const input = document.querySelector("#player");
      const field = input.closest(".blip-field");
      const help = field.querySelector(".blip-field-help");
      const error = field.querySelector(".blip-field-error");
      return {
        ids: (input.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean),
        help: help?.id ?? "",
        error: error && !error.hidden && text(error) ? error.id : "",
        invalid: input.getAttribute("aria-invalid"),
      };
    },
    /** A button's look: computed styles of it and of its two drawn layers. */
    styles(sel) {
      const el = document.querySelector(sel);
      const out = {};
      const own = [
        "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-transform", "text-decoration-line", "text-shadow", "color",
        "background-color", "background-image", "padding-top", "padding-right", "padding-bottom", "padding-left", "border-top-width", "border-top-style", "border-radius",
        "box-sizing", "min-height", "height", "width", "display", "vertical-align", "box-shadow", "outline-style", "opacity", "filter",
      ];
      const drawn = ["background-color", "background-image", "mask-image", "mask-size", "mask-position", "inset", "translate"];
      for (const [part, props] of [["", own], ["::before", drawn], ["::after", drawn]]) {
        const s = getComputedStyle(el, part || null);
        for (const p of props) out[`${part}${part ? " " : ""}${p}`] = s.getPropertyValue(p);
      }
      return out;
    },
  };
}

/** Waits for fn (run in the page) to return something truthy; fails with `what`, and what `show` reads then. */
async function until(page, what, fn, arg, show) {
  try {
    await page.waitForFunction(fn, arg, { polling: 50 });
  } catch (e) {
    if (!/Timeout/i.test(e.message)) throw e;
    const now = show ? ` (${JSON.stringify(await page.evaluate(show, arg).catch(() => null))})` : "";
    throw new Error(`timed out waiting for ${what}${now}`);
  }
}
function assert(ok, message) {
  if (!ok) throw new Error(message);
}

const CHECKS = {
  async look(page) {
    await until(page, "Pixel Bop and Pixel Operator to load", () => window.smoke.loaded("Pixel Bop", "Pixel Operator"));
    const r = await page.evaluate(() => {
      const button = document.querySelector("#open-dialog");
      const heading = document.querySelector(".blip-display");
      const probe = document.body.appendChild(document.createElement("span"));
      probe.style.color = "var(--blip-ink)";
      const ink = getComputedStyle(probe).color;
      probe.remove();
      const s = getComputedStyle(button);
      const before = getComputedStyle(button, "::before");
      const after = getComputedStyle(button, "::after");
      return {
        buttonFont: s.fontFamily, headingFont: heading ? getComputedStyle(heading).fontFamily : "(no .blip-display)",
        token: getComputedStyle(document.documentElement).getPropertyValue("--blip-ink").trim(), ink,
        outline: before.backgroundColor, outlineMask: before.maskImage, fillMask: after.maskImage,
        border: s.borderTopWidth, background: s.backgroundColor, height: button.getBoundingClientRect().height,
      };
    });
    assert(r.token.toLowerCase() === "#1a1530", `--blip-ink is "${r.token}": tokens.css did not load`);
    assert(/^"?Pixel Operator/.test(r.buttonFont), `the button's font is ${r.buttonFont}`);
    assert(/Pixel Bop/.test(r.headingFont), `the .blip-display heading's font is ${r.headingFont}`);
    assert(r.outlineMask.includes("url(") && r.outline === r.ink, `the button has no ink outline (::before is ${r.outline}, masked by ${r.outlineMask.slice(0, 40)})`);
    assert(r.fillMask.includes("url("), "the button's fill is not drawn (::after has no mask)");
    assert(r.border === "0px" && r.background === "rgba(0, 0, 0, 0)", `the button keeps the browser's look (border ${r.border}, background ${r.background})`);
    assert(r.height >= 24, `the button is ${r.height} px high`);
  },

  async tabs(page) {
    const sections = await page.locator("[data-smoke=tabs]").evaluateAll((els) => els.map((el) => `#${el.id}`));
    assert(sections.length, "no [data-smoke=tabs] section");
    for (const sel of sections) {
      const tabs = page.locator(`${sel} [role="tab"]`);
      const first = (await tabs.nth(0).textContent()).trim();
      const second = (await tabs.nth(1).textContent()).trim();
      const show = ([s]) => window.smoke.tabs(s);
      await until(page, `${sel} to be wired, "${first}" showing`, ([s, n]) => { const t = window.smoke.tabs(s, n); return t.wired && t.shows; }, [sel, first], show);
      await tabs.nth(1).click();
      await until(page, `${sel}: "${second}" to show its panel`, ([s, n]) => window.smoke.tabs(s, n).shows, [sel, second], show);
      await tabs.nth(0).click();
      await until(page, `${sel}: "${first}" to show its panel again`, ([s, n]) => window.smoke.tabs(s, n).shows, [sel, first], show);
    }
  },

  async toast(page) {
    await page.locator("#readme").getByRole("button", { name: "Save game" }).click();
    await page.locator(".blip-toast", { hasText: "Saved" }).waitFor({ state: "visible" }).catch(() => {
      throw new Error('Save game showed no "Saved" toast');
    });
  },

  async dialog(page) {
    const is = ([open]) => { const d = window.smoke.dialog("save", "#dialog-state"); return d.open === open && d.state === (open ? "open" : "closed"); };
    const show = () => window.smoke.dialog("save", "#dialog-state");
    await page.click("#open-dialog");
    await until(page, "the dialog to open from state", is, [true], show);
    assert(await page.locator("dialog#save").isVisible(), "the dialog is open but not visible");
    await page.click("#close-dialog");
    await until(page, "the dialog to close from state", is, [false], show);
    await page.click("#open-dialog");
    await until(page, "the dialog to open again", is, [true], show);
    await page.keyboard.press("Escape");
    await until(page, "Escape to close the dialog, and the app's state to follow", is, [false], show);
  },

  async "late-tabs"(page) {
    const sel = "#late-tabs";
    const show = ([s]) => window.smoke.tabs(s);
    const shows = ([s, n]) => window.smoke.tabs(s, n).shows;
    await until(page, "three tabs to arrive", ([s]) => window.smoke.tabs(s).count === 3, [sel], show);
    await until(page, "the tabs that arrived to be wired, Alpha's panel showing", ([s, n]) => { const t = window.smoke.tabs(s, n); return t.wired && t.shows; }, [sel, "Alpha"], show);
    await page.locator(sel).getByRole("tab", { name: "Gamma" }).click();
    await until(page, "Gamma to show its panel", shows, [sel, "Gamma"], show);
    await page.keyboard.press("ArrowLeft");
    await until(page, "ArrowLeft to select and focus Beta", ([s, n]) => { const t = window.smoke.tabs(s, n); return t.shows && t.focused === n; }, [sel, "Beta"], show);
    await page.click("#add-tab");
    await until(page, "the added tab to be wired", ([s]) => { const t = window.smoke.tabs(s); return t.count === 4 && t.wired; }, [sel], show);
    await page.locator(sel).getByRole("tab", { name: "Delta" }).click();
    await until(page, "the added tab to show its panel", shows, [sel, "Delta"], show);
  },

  async combobox(page) {
    const show = () => window.smoke.combobox();
    const input = page.locator("#place");
    await input.click();
    await input.pressSequentially("ca", { delay: 40 });
    await until(page, 'the options found for "ca" to be offered', ([want]) => window.smoke.combobox().offered === want, ["Canyon, Castle, Crystal caves"], show);
    await input.pressSequentially("s", { delay: 40 });
    await until(page, 'the options found for "cas" to be offered', ([want]) => window.smoke.combobox().offered === want, ["Castle"], show);
    await page.getByRole("option", { name: "Castle" }).click();
    await until(page, "Castle to be chosen, and to reach the app's state", () => { const c = window.smoke.combobox(); return c.value === "Castle" && c.expanded === "false" && c.state === "Castle"; }, null, show);
    // With the list closed, Escape clears the field.
    await input.press("Escape");
    await until(page, "Escape to clear the field, and the app's state to follow", () => { const c = window.smoke.combobox(); return c.value === "" && c.state === ""; }, null, show);
  },

  async field(page) {
    const show = () => window.smoke.field();
    await until(page, "the help to describe the field", () => { const f = window.smoke.field(); return f.help && f.ids.includes(f.help); }, null, show);
    await page.click("#submit");
    await until(page, "the error shown after submit to join aria-describedby and mark the field invalid", () => { const f = window.smoke.field(); return f.error && f.ids.includes(f.error) && f.ids.includes(f.help) && f.invalid === "true"; }, null, show);
    const { error } = await page.evaluate(show);
    await page.locator("#player").fill("Pip");
    await until(page, "the error, its description and aria-invalid to go when the app takes the error away", ([id]) => { const f = window.smoke.field(); return !f.error && !f.ids.includes(id) && f.invalid !== "true"; }, [error], show);
  },

  async "lazy-dialog"(page) {
    const is = ([open]) => { const d = window.smoke.dialog("lazy", "#lazy-state"); return d.open === open && d.state === (open ? "open" : "closed"); };
    const show = () => window.smoke.dialog("lazy", "#lazy-state");
    await until(page, "the dialog element to be defined", () => document.documentElement.hasAttribute("data-defined") && !!customElements.get("blip-dialog"));
    // Two frames and a moment: whatever would open it on load has happened.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 150)))));
    const s = await page.evaluate(() => ({ open: document.getElementById("lazy").open, attr: document.querySelector("blip-dialog").getAttribute("open") }));
    assert(!s.open, `the dialog opened on load (blip-dialog open=${JSON.stringify(s.attr)})`);
    await page.click("#open-lazy");
    await until(page, "the dialog to open from state", is, [true], show);
    await page.keyboard.press("Escape");
    await until(page, "Escape to close it, and the app's state to follow", is, [false], show);
  },

  async tailwind(page, ctx) {
    const r = await page.evaluate(() => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const probe = document.body.appendChild(document.createElement("span"));
      probe.style.color = "var(--color-red-600)";
      const red = getComputedStyle(probe).color;
      probe.remove();
      const b = getComputedStyle(document.querySelector("#tw-button"));
      const p = getComputedStyle(document.querySelector("#tw-text"));
      return { rem, mt: parseFloat(b.marginTop), pl: parseFloat(b.paddingLeft), pr: parseFloat(b.paddingRight), color: p.color, red, pmt: parseFloat(p.marginTop) };
    });
    assert(r.mt === 2 * r.rem, `mt-8 gives the Blip button a margin of ${r.mt} px, not ${2 * r.rem}`);
    assert(r.pl === 3 * r.rem && r.pr === 3 * r.rem, `px-12 gives the Blip button padding of ${r.pl} and ${r.pr} px, not ${3 * r.rem}`);
    assert(r.color === r.red && r.red !== "rgb(0, 0, 0)", `text-red-600 gives the text ${r.color}, not ${r.red}`);
    assert(r.pmt === 2 * r.rem, `mt-8 gives the paragraph a margin of ${r.pmt} px`);
    await sameLook(page, ctx, "Tailwind");
  },

  /** The start page's recipe for an app's own reset: in the base layer, under Blip, it leaves buttons alone. */
  async reset(page, ctx) {
    await sameLook(page, ctx, "the app's reset");
  },

  async kits(page) {
    await until(page, "the kits' elements to upgrade and the world to draw", () => !!customElements.get("blip-world") && !!customElements.get("blip-dialogue") && !!document.querySelector("#kits blip-world canvas"));
    const r = await page.evaluate(() => {
      const s = (sel) => getComputedStyle(document.querySelector(sel));
      return {
        hud: s("#kits .blip-hud").display, hero: s("#kits .blip-hero").isolation, world: s("#kits blip-world").position,
        dialogue: s("#kits .blip-dialogue").getPropertyValue("--blip-r").trim(), icon: !!document.querySelector("#kits svg.blip-icon path[d]"),
      };
    });
    assert(r.hud === "flex", `game.css did not style the HUD (display ${r.hud})`);
    assert(r.dialogue === "4", "game.css did not style the dialogue box");
    assert(r.hero === "isolate", `blocks.css did not style the hero (isolation ${r.hero})`);
    assert(r.world === "absolute", `effects.css did not place the world (position ${r.world})`);
    assert(r.icon, "the Icon drew no SVG path");
  },
};

/** A Blip button with no utilities, here and on a page with Blip's CSS alone: the same styles and pixels. */
async function sameLook(page, { url, context }, what) {
  const reference = await context.newPage();
  try {
    await reference.goto(`${url}/reference.html`);
    await until(reference, "the reference page, its button's font loaded", () => document.documentElement.hasAttribute("data-mounted") && window.smoke.loaded("Pixel Operator"));
    await until(page, "the button's font to load", () => window.smoke.loaded("Pixel Operator"));
    // Neither button under the pointer: hovered, a box lifts in its ring, which is not what is compared here.
    await Promise.all([page, reference].map((p) => p.mouse.move(p.viewportSize().width - 1, p.viewportSize().height - 1)));
    const [here, there] = await Promise.all([page, reference].map((p) => p.evaluate(() => window.smoke.styles("#tw-plain"))));
    const diff = Object.keys(there).filter((k) => here[k] !== there[k]).map((k) => `${k}: ${here[k]} (with Blip alone: ${there[k]})`);
    assert(!diff.length, `with ${what}, a Blip button changes: ${diff.join("; ")}`);
    const [a, b] = await Promise.all([page, reference].map((p) => p.locator("#tw-plain").screenshot()));
    assert(a.equals(b), `with ${what}, a Blip button draws different pixels from the same button with Blip alone`);
  } finally {
    await reference.close();
  }
}

/**
 * Opens each page and runs its checks. Returns one result per check, and one for the page's console and network
 * ("clean"). On a failure, a picture of the page goes to `shots`.
 */
export async function run(browser, url, pages, { shots, dev = false }) {
  const results = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  context.setDefaultTimeout(dev ? 20_000 : 10_000);
  await context.addInitScript(helpers);
  try {
    for (const { path, checks } of pages) {
      const page = await context.newPage();
      const noise = [];
      page.on("pageerror", (e) => noise.push(`uncaught: ${e.message}`));
      page.on("console", (m) => {
        const text = m.text();
        if (m.type() === "error") noise.push(`console error: ${text.slice(0, 300)}`);
        else if (/Blip BLIP-/.test(text)) noise.push(`diagnostic: ${text.slice(0, 300)}`);
      });
      page.on("response", (r) => {
        if (r.status() >= 400 && r.url().startsWith(url) && !r.url().endsWith("/favicon.ico")) noise.push(`${r.status()} ${r.url().slice(url.length)}`);
      });
      const open = async () => {
        await page.goto(url + path, { waitUntil: "load" });
        await page.waitForFunction(() => document.documentElement.hasAttribute("data-mounted"), null, { timeout: 40_000 });
      };
      try {
        // A dev server compiles and optimises on the first visit (Vite may reload the page once): go twice.
        if (dev) {
          await open();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(500);
          noise.length = 0;
        }
        await open();
      } catch (e) {
        results.push({ page: path, check: "load", ok: false, error: e.message.split("\n")[0] });
        await page.screenshot({ path: shot(shots, path, "load"), fullPage: true }).catch(() => {});
        await page.close();
        continue;
      }
      for (const check of checks) {
        const t0 = Date.now();
        try {
          await CHECKS[check](page, { url, context });
          results.push({ page: path, check, ok: true, ms: Date.now() - t0 });
        } catch (e) {
          results.push({ page: path, check, ok: false, ms: Date.now() - t0, error: e.message.split("\n")[0] });
          await page.screenshot({ path: shot(shots, path, check), fullPage: true }).catch(() => {});
        }
      }
      await page.waitForTimeout(100);
      results.push(noise.length ? { page: path, check: "clean", ok: false, error: [...new Set(noise)].join(" | ") } : { page: path, check: "clean", ok: true });
      await page.close();
    }
  } finally {
    await context.close();
  }
  return results;
}

function shot(dir, path, check) {
  mkdirSync(dir, { recursive: true });
  return join(dir, `${path.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "index"}-${check}.png`);
}
