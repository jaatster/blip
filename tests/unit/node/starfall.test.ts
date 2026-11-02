/**
 * Starfall, the game template's rules (apps/docs/public/js/starfall/engine.js): moving and jumping, what hurts, what
 * is picked up, Bramble's bridge, the chest, the checkpoint and the goal, on small levels made for each; and level
 * 1-1 itself, checked for what its design promises.
 */
import { describe, expect, it } from "vitest";
// @ts-expect-error: plain JavaScript, served as is by the docs site
import { TILE, buildBridge, createGame, parse, resume, save, step } from "../../../apps/docs/public/js/starfall/engine.js";
// @ts-expect-error: plain JavaScript, served as is by the docs site
import { LEVEL } from "../../../apps/docs/public/js/starfall/level.js";

type Input = Partial<Record<"left" | "right" | "up" | "down" | "jump" | "swipe", boolean>>;
type Game = ReturnType<typeof createGame>;

/** A level from rows, with the ground under them; play starts at once. */
function level(...rows: string[]) {
  const w = rows[0]!.length;
  const game = createGame({ rows: [...rows, "#".repeat(w), "#".repeat(w)], time: 300 }, { view: 320 });
  game.mode = "play";
  return game;
}
/** Steps n times with the same buttons; returns every event. */
function run(game: Game, n: number, input: Input = {}) {
  const events: { type: string; [k: string]: unknown }[] = [];
  for (let i = 0; i < n; i++) {
    step(game, input);
    events.push(...game.events);
  }
  return events;
}
const types = (events: { type: string }[]) => events.map((e) => e.type);
/** Steps with the same buttons until something happens (at most n steps); returns that event. */
function until(game: Game, type: string, input: Input = {}, n = 600) {
  for (let i = 0; i < n; i++) {
    step(game, input);
    const e = game.events.find((x: { type: string }) => x.type === type);
    if (e) return e;
  }
  return undefined;
}
/** Puts Pip in the air right over an enemy, to fall on it. */
const over = (game: Game, i: number) => Object.assign(game.pip, { x: game.map.enemies[i].x + 1, y: game.map.enemies[i].y - 30, vx: 0, vy: 0 });
/** The highest Pip's feet get, in pixels above where they started, over n steps of the buttons. */
function rise(game: Game, n: number, input: Input) {
  const from = game.pip.y;
  let top = from;
  for (let i = 0; i < n; i++) {
    step(game, input);
    top = Math.min(top, game.pip.y);
  }
  return from - top;
}

describe("moving", () => {
  it("runs up to its top speed and stops when let go", () => {
    const g = level("@...........................", "............................");
    run(g, 5);
    run(g, 40, { right: true });
    expect(g.pip.vx).toBe(1.5);
    run(g, 20);
    expect(g.pip.vx).toBe(0);
  });

  it("jumps about four tiles held, and a tap barely one", () => {
    const held = level(".......", ".......", ".......", ".......", ".......", ".......", "@......");
    run(held, 3);
    const high = rise(held, 60, { jump: true });
    expect(high).toBeGreaterThan(3.5 * TILE);
    expect(high).toBeLessThan(4.5 * TILE);
    const tap = level(".......", ".......", ".......", ".......", ".......", ".......", "@......");
    run(tap, 3);
    step(tap, { jump: true });
    expect(rise(tap, 60, {})).toBeLessThan(1.6 * TILE);
  });

  it("still jumps a few steps after running off an edge, and when pressed just before landing", () => {
    const g = level("@.....", "##....", "......", "......");
    run(g, 3);
    let left = 0;
    while (g.pip.ground && left++ < 100) step(g, { right: true });
    run(g, 3, { right: true });
    expect(types(run(g, 1, { right: true, jump: true }))).toContain("jump");

    const b = level("@.....", "......", "......", "......", "......", "......");
    run(b, 2);
    expect(b.pip.ground).toBe(false);
    // Pressed in the air, a few steps before landing: the jump waits for the ground.
    let n = 0;
    while (!b.pip.ground && n++ < 100) step(b, { jump: b.pip.y + b.pip.h > 6 * TILE - 12 });
    expect(types(run(b, 1, { jump: true }))).toContain("jump");
  });

  it("drops through a plank with down and jump, never through the ground", () => {
    const g = level("@.....", "---...", "......", "......");
    run(g, 20);
    expect(g.pip.ground).toBe(true);
    const on = g.pip.y;
    run(g, 1, { down: true, jump: true });
    run(g, 20);
    expect(g.pip.y).toBeGreaterThan(on + TILE);
  });
});

describe("what hurts", () => {
  it("a puddle costs a heart and puts Pip back on safe ground", () => {
    const g = level("@.......", "###..###", "###~~###");
    run(g, 10);
    const safe = { ...g.pip };
    expect(until(g, "splash", { right: true })).toBeDefined();
    expect(g.stats.hearts).toBe(2);
    expect(g.pip.y).toBe(safe.y);
    expect(g.pip.x).toBeLessThan(3 * TILE);
    expect(g.pip.hurt).toBeGreaterThan(0);
  });

  it("jumping on a Grub defeats it and bounces; walking into one hurts", () => {
    const stomp = level("@.......", "........", "........", "........", "........", "...g....");
    run(stomp, 5);
    over(stomp, 0);
    expect(until(stomp, "defeat", {}, 60)).toMatchObject({ kind: "grub", how: "stomp", points: 100 });
    expect(stomp.pip.vy).toBeLessThan(0);
    expect(stomp.stats.hearts).toBe(3);

    const walk = level("@.....g.");
    run(walk, 5);
    run(walk, 80, { right: true });
    expect(walk.stats.hearts).toBe(2);
    expect(walk.stats.enemies).toBe(0);
  });

  it("a swipe defeats a Grub in front, and stomps in a row score double each", () => {
    const g = level("@..g....");
    run(g, 2);
    Object.assign(g.pip, { x: 2 * TILE - 4 });
    g.pip.face = 1;
    const events = run(g, 12, { swipe: true });
    expect(events.find((e) => e.type === "defeat")).toMatchObject({ how: "swipe" });

    // Off one Grub and onto the next without touching the ground: each stomp in the air scores double.
    const chain = level("@.......", "........", "........", "........", "........", "..g...g.");
    run(chain, 5);
    over(chain, 0);
    const first = until(chain, "defeat", {}, 60);
    over(chain, 1);
    const second = until(chain, "defeat", {}, 60);
    expect([first?.points, second?.points]).toEqual([100, 200]);
  });

  it("the game is over when the last heart goes", () => {
    const g = level("@.......", "###..###", "###~~###");
    g.stats.hearts = 1;
    run(g, 10);
    expect(types(run(g, 120, { right: true }))).toContain("over");
    expect(g.mode).toBe("over");
  });
});

describe("what is picked up", () => {
  it("coins, stars and potions count, and a block hit from below gives a coin once", () => {
    const g = level("......", "...B..", "......", "......", "@o*+..");
    g.stats.hearts = 2;
    run(g, 5);
    run(g, 40, { right: true });
    expect(g.stats.coins).toBe(1);
    expect(g.stats.stars).toEqual([0]);
    expect(g.stats.hearts).toBe(3);
    Object.assign(g.pip, { x: 3 * TILE + 2, vx: 0 });
    run(g, 20);
    run(g, 40, { jump: true });
    run(g, 40);
    expect(g.stats.coins).toBe(2);
    run(g, 40, { jump: true });
    expect(g.stats.coins).toBe(2);
  });

  it("the chest stays shut without the key, and gives up its star with it", () => {
    const g = level("@..k...C...");
    run(g, 5);
    const events = run(g, 120, { right: true });
    expect(types(events)).toEqual(expect.arrayContaining(["key", "chest"]));
    expect(g.chestOpen).toBe(true);
    const star = g.map.items.find((i: { hidden?: boolean }) => i.hidden);
    expect(star).toBeDefined();

    const shut = level("@......C...");
    run(shut, 5);
    expect(types(run(shut, 120, { right: true }))).toContain("locked");
    expect(shut.chestOpen).toBe(false);
  });
});

describe("Bramble, the checkpoint and the goal", () => {
  it("talking stops the game; paid, Bramble lays the bridge a plank at a time", () => {
    const g = level("@.b........", "#####____##", "#####~~~~##");
    run(g, 5);
    while (!g.near.bramble) step(g, { right: true });
    run(g, 20);
    expect(types(run(g, 1, { up: true }))).toContain("talk");
    expect(g.mode).toBe("talk");
    expect(buildBridge(g)).toBe(true);
    resume(g);
    const planks = run(g, 40).filter((e) => e.type === "plank");
    expect(planks).toHaveLength(4);
    run(g, 200, { right: true });
    expect(g.pip.x).toBeGreaterThan(9 * TILE);
    expect(g.stats.hearts).toBe(3);
  });

  it("the checkpoint is where Continue starts, with what was had", () => {
    const g = level("@.oo.F.....");
    run(g, 5);
    expect(types(run(g, 80, { right: true }))).toContain("checkpoint");
    const kept = save(g);
    const again = createGame({ rows: g.map.rows.map((r: string[]) => r.join("")), time: 300 }, { from: kept });
    expect(again.pip.x).toBeCloseTo(kept.checkpoint.x);
    expect(again.stats.coins).toBe(2);
  });

  it("the flag scores by height, then the level is clear", () => {
    const g = level("......|....", "......|....", "......|....", "@.....E....");
    run(g, 5);
    const events = run(g, 400, { right: true });
    expect(events.find((e) => e.type === "goal")?.points).toBe(100);
    expect(types(events)).toContain("clear");
    expect(g.mode).toBe("clear");
  });
});

describe("level 1-1", () => {
  const map = parse(LEVEL);

  it("is fifteen tiles high, every row as long", () => {
    expect(LEVEL.rows).toHaveLength(15);
    expect(new Set(LEVEL.rows.map((r: string) => r.length)).size).toBe(1);
  });

  it("has a start, a checkpoint, Bramble's bridge, the chest, a goal and a hint for every sign", () => {
    expect(map.start && map.flag && map.bramble && map.bridge && map.chest && map.goal).toBeTruthy();
    expect(map.signs).toHaveLength(LEVEL.hints.length);
  });

  it("has three stars, one of them in the chest, and one key", () => {
    const stars = map.items.filter((i: { kind: string }) => i.kind === "star");
    expect(stars).toHaveLength(3);
    expect(stars.filter((s: { hidden?: boolean }) => s.hidden)).toHaveLength(1);
    expect(map.items.filter((i: { kind: string }) => i.kind === "key")).toHaveLength(1);
  });

  it("has enough coins before Bramble to pay him, with room to miss a few", () => {
    const coins = map.items.filter((i: { kind: string; x: number }) => i.kind === "coin" && i.x < map.bramble.x).length;
    const blocks = [...map.blocks.values()].filter((b: { c: number; gives: string }) => b.c * TILE < map.bramble.x && b.gives === "coin").length;
    expect(coins + blocks).toBeGreaterThanOrEqual(38);
  });

  it("can be played from start to the first puddle without a crash", () => {
    const g = createGame(LEVEL);
    run(g, 100);
    run(g, 240, { right: true });
    expect(g.pip.x).toBeGreaterThan(10 * TILE);
  });

  // Every promise the level makes can be kept with Pip's own jumps.
  const at = (ch: string) => {
    const r = LEVEL.rows.findIndex((row: string) => row.includes(ch));
    return { c: LEVEL.rows[r].indexOf(ch), r };
  };
  const fresh = () => Object.assign(createGame(LEVEL), { mode: "play" });
  const stand = (g: Game, c: number, top: number) => Object.assign(g.pip, { x: c * TILE + 2, y: top * TILE - g.pip.h, vx: 0, vy: 0 });
  /** Walks right to the edge of what Pip stands on, then jumps, letting go of right after `air` steps. */
  function hop(g: Game, air = 26) {
    for (let i = 0; i < 60 && g.pip.ground; i++) {
      const ahead = Math.floor((g.pip.x + g.pip.w + 2) / TILE), r = Math.floor((g.pip.y + g.pip.h) / TILE);
      if (".~".includes(g.map.rows[r][ahead])) break;
      step(g, { right: true });
    }
    for (let i = 0; i < 60; i++) {
      step(g, { right: i < air, jump: i < 30 });
      if (i > 3 && g.pip.ground) break;
    }
    run(g, 5);
  }

  /** The stars out in the open, left to right (the third is in the chest). */
  const stars = LEVEL.rows.flatMap((row: string, r: number) => [...row].flatMap((ch, c) => (ch === "*" ? [{ c, r }] : []))).sort((a: { c: number }, b: { c: number }) => a.c - b.c);

  it("keeps the first star on the ledge, a full jump above the tall stepping stone", () => {
    const g = fresh();
    stand(g, stars[0].c, 10);
    run(g, 3);
    run(g, 90, { jump: true });
    expect(g.stats.stars).toHaveLength(1);
  });

  it("crosses the treetops to the key, from the tree by Bramble", () => {
    const g = fresh();
    stand(g, at("b").c - 9, 12);
    run(g, 5);
    for (let i = 0; i < 2; i++) {
      for (let s = 0; s < 60; s++) {
        step(g, { right: s < 30, jump: s < 30 });
        if (s > 3 && g.pip.ground) break;
      }
    }
    for (let i = 0; i < 3; i++) hop(g);
    expect(g.stats.key).toBe(true);
    expect(g.stats.hearts).toBe(3);
  });

  it("hides the third star on a pillar only a bounce off a Plip reaches", () => {
    const g = fresh();
    const plip = g.map.enemies.filter((e: { kind: string }) => e.kind === "plip").at(-1);
    expect(plip.x).toBeLessThan(stars[1].c * TILE);
    Object.assign(g.pip, { x: plip.x, y: plip.y - 40 });
    // Down onto the Plip with jump held, then towards the pillar on the way up.
    for (let i = 0; i < 120; i++) step(g, { jump: true, right: i > 8 });
    expect(g.stats.stars).toHaveLength(1);
  });

  it("puts the flag a running jump from the top of the stairs", () => {
    const g = fresh();
    stand(g, at("E").c - 6, 5);
    run(g, 5);
    const events = run(g, 200, { right: true, jump: true });
    expect(types(events)).toContain("goal");
  });
});
