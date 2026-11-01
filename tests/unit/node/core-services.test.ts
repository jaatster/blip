/**
 * @jaatster/blip-core's swappable services (the clock, seeded random numbers, the sound sink), the time-of-day schemes and
 * the diagnostics: the pure parts, which need no DOM.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { provide, seeded, services } from "../../../packages/core/src/js/services.ts";
import { schemeAt } from "../../../packages/core/src/js/scheme.ts";
import { checkName, warn } from "../../../packages/core/src/js/diagnostics.ts";

const take = (next: () => number, n: number) => Array.from({ length: n }, next);

describe("seeded", () => {
  it("gives the same sequence for the same seed", () => {
    expect(take(seeded(42), 1000)).toEqual(take(seeded(42), 1000));
  });

  it("gives a different sequence for a different seed", () => {
    expect(take(seeded(42), 8)).not.toEqual(take(seeded(43), 8));
  });

  it("keeps to the mulberry32 sequence (worlds and screenshots drawn from a seed depend on it)", () => {
    expect(take(seeded(42), 4).map((v) => v.toFixed(8))).toMatchInlineSnapshot(`
      [
        "0.60110375",
        "0.44829056",
        "0.85246579",
        "0.66973404",
      ]
    `);
  });

  it("returns numbers in [0, 1), spread evenly", () => {
    const values = take(seeded(7), 20_000);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    expect(mean).toBeGreaterThan(0.49);
    expect(mean).toBeLessThan(0.51);
    const tenths = Array.from({ length: 10 }, (_, i) => values.filter((v) => Math.floor(v * 10) === i).length);
    for (const n of tenths) expect(n).toBeGreaterThan(1800);
  });

  it("treats a seed as an unsigned 32-bit number", () => {
    expect(take(seeded(42 + 2 ** 32), 5)).toEqual(take(seeded(42), 5));
    expect(take(seeded(-1), 5)).toEqual(take(seeded(2 ** 32 - 1), 5));
  });
});

describe("provide", () => {
  const restores: (() => void)[] = [];
  const use = (next: Parameters<typeof provide>[0]) => restores.push(provide(next));
  afterEach(() => {
    while (restores.length) restores.pop()!();
  });

  it("replaces random numbers with a seeded sequence", () => {
    use({ seed: 7 });
    expect(take(services.random, 6)).toEqual(take(seeded(7), 6));
  });

  it("freezes the clock", () => {
    const noon = new Date("2026-06-21T12:00:00");
    use({ clock: () => noon });
    expect(services.now()).toBe(noon);
    expect(services.now()).toBe(noon);
  });

  it("puts the previous services back, innermost first, without losing the outer sequence's place", () => {
    const outer = seeded(1);
    const expected = take(outer, 4);
    const restoreOuter = provide({ seed: 1, clock: () => new Date("2026-01-01T08:00:00") });
    try {
      expect(services.random()).toBe(expected[0]);
      const restoreInner = provide({ seed: 2, clock: () => new Date("2026-01-01T20:00:00") });
      expect(services.random()).toBe(seeded(2)());
      expect(services.now().getHours()).toBe(20);
      restoreInner();
      expect(services.now().getHours()).toBe(8);
      expect(services.random()).toBe(expected[1]);
      expect(services.random()).toBe(expected[2]);
    } finally {
      restoreOuter();
    }
    expect(services.now().getFullYear()).toBeGreaterThanOrEqual(2025);
  });

  it("only replaces what it is given", () => {
    use({ seed: 3 });
    use({ clock: () => new Date("2026-03-03T03:03:03") });
    expect(take(services.random, 3)).toEqual(take(seeded(3), 3));
    expect(services.now().getMinutes()).toBe(3);
  });

  it("routes sounds to the provided sink, and is silent by default", () => {
    expect(() => services.sound().play("coin")).not.toThrow();
    const play = vi.fn();
    use({ sound: { play } });
    services.sound().play("coin", { rate: 1.5 });
    expect(play).toHaveBeenCalledWith("coin", { rate: 1.5 });
  });
});

describe("services.between", () => {
  const restores: (() => void)[] = [];
  afterEach(() => {
    while (restores.length) restores.pop()!();
  });

  it("returns whole numbers from min to max inclusive, every one of them", () => {
    restores.push(provide({ seed: 11 }));
    const rolls = Array.from({ length: 6000 }, () => services.between(1, 6));
    expect(rolls.every((n) => Number.isInteger(n) && n >= 1 && n <= 6)).toBe(true);
    expect(new Set(rolls)).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it("maps the ends of [0, 1) to min and max", () => {
    restores.push(provide({ random: () => 0 }));
    expect(services.between(600, 1499)).toBe(600);
    restores.push(provide({ random: () => 0.999999999 }));
    expect(services.between(600, 1499)).toBe(1499);
  });
});

describe("schemeAt", () => {
  const at = (h: number, m = 0) => schemeAt(new Date(2026, 0, 15, h, m));

  it.each([
    [0, 0, "night"],
    [5, 59, "night"],
    [6, 0, "day"],
    [12, 0, "day"],
    [16, 59, "day"],
    [17, 0, "sunset"],
    [18, 59, "sunset"],
    [19, 0, "night"],
    [23, 59, "night"],
  ] as const)("%i:%s is %s", (h, m, scheme) => {
    expect(at(h, m)).toBe(scheme);
  });

  it("follows the local clock, whatever the date", () => {
    expect(schemeAt(new Date(2026, 5, 21, 17, 30))).toBe("sunset");
    expect(schemeAt(new Date(2030, 11, 31, 6, 0))).toBe("day");
  });
});

describe("diagnostics", () => {
  const flag = globalThis as { BLIP_DIAGNOSTICS?: boolean };
  afterEach(() => {
    delete flag.BLIP_DIAGNOSTICS;
    vi.restoreAllMocks();
  });

  it("warns with the code and a docs link, once per message", () => {
    flag.BLIP_DIAGNOSTICS = true;
    const log = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    warn("CHU-T999", "A test warning, once.");
    warn("CHU-T999", "A test warning, once.");
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]![0]).toBe("Blip CHU-T999: A test warning, once.\n  https://jaatster.com/blip/diagnostics/#chu-t999");
  });

  it("stays quiet when turned off, and away from localhost", () => {
    const log = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    flag.BLIP_DIAGNOSTICS = false;
    warn("CHU-T998", "Never shown.");
    delete flag.BLIP_DIAGNOSTICS;
    warn("CHU-T998", "Not shown in Node either: there is no location.");
    expect(log).not.toHaveBeenCalled();
  });

  it("checkName warns about an element with no accessible name", () => {
    flag.BLIP_DIAGNOSTICS = true;
    const log = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const element = (attrs: Record<string, string>, text = "") =>
      ({ localName: "chu-thing", textContent: text, getAttribute: (n: string) => attrs[n] ?? null }) as unknown as Element;
    checkName(element({ "aria-label": "Save" }));
    checkName(element({}, "  Save  "));
    checkName(element({ "aria-labelledby": "title" }));
    expect(log).not.toHaveBeenCalled();
    checkName(element({}, "   "), "CHU-A777");
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]![0]).toContain("Blip CHU-A777: <chu-thing> has no accessible name.");
  });
});
