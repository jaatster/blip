/**
 * The game sprites as pixel maps, and the renderer that turns a map into crisp SVG. No DOM here, so build scripts
 * and servers can use it too.
 *
 * A map is the sprite's fill, one character per pixel, rows split by "/". The one-pixel ink outline is added round
 * the fill automatically (4-neighbour, so corners come out notched, as on the candy box); "o" inside the fill draws
 * ink lines. A leading "!" leaves the outline off (sparkles belong to the sky, as on the TV).
 *
 *   o ink   w white            l c s   the sprite's tone: light, base, shade (data-tone changes it)
 *   y Y d   yellow             g G h   slate (iron, and empty hearts and stars)
 *   n N m   orange (wood)      k K     cream and cream shade (paper, glass, gloves)
 *   b B v   blue               r R x   red
 */

/** name: [default tone, map] */
const MAPS: Record<string, [string, string]> = {
  coin: ["yellow", ".yyyy./ywYYYY/ywYYdY/ywYYdY/yYYYdY/YYYYdY/YYYYYd/.dddd."],
  gem: ["purple", "..wlllc../.wlllcccs/llllccccs/lcccssssc/.lccssss./..lcsss../...lcs.../....s...."],
  heart: ["red", "lwl...llc/wlcc.cccs/lcccccccs/ccccccccs/.ccccccs./..cccss../...sss.../....s...."],
  "heart-half": ["red", "lwl...ggG/wlcc.GGGh/lccccGGGh/cccccGGGh/.ccccGGh./..ccchh../...ssh.../....s...."],
  "heart-empty": ["slate", "ggg...ggG/ggGG.GGGh/gGGGGGGGh/GGGGGGGGh/.GGGGGGh./..GGGhh../...hhh.../....h...."],
  star: ["yellow", ".....l...../....lwl..../....llc..../lllllcccccs/.llcccccss./..lcccccs../...ccccs.../..ccccsss../..ccs.sss../.cs.....ss."],
  "star-empty": ["slate", ".....g...../....ggg..../....ggG..../gggggGGGGGh/.ggGGGGGhh./..gGGGGGh../...GGGGh.../..GGGGhhh../..GGh.hhh../.Gh.....hh."],
  key: ["orange", ".lll......../lwccl......./lc.cllllllll/lccccccccccs/.sss...ss.ss/.......ss..."],
  potion: ["red", "..nNNNm../..mmmmm../...kwk.../...kwk.../..wllll../.wwlcccs./lwlccccss/lwcccccss/lccccccss/.ccccsss./..sssss.."],
  chest: ["orange", ".lglllllllgl./lcGcccccccGcs/lcGcckkkccGcs/sshsskoksshss/oooookokooooo/lcGccKKKccGcs/ccGcccccccGcs/ccGcccccccGcs/sshssssssshss"],
  trophy: ["orange", "..wllllllll../llllllylccscc/l.llcyYdccs.c/ll.lccdcss.cc/....lccss..../.....ccs...../......c....../.....lcs...../....gGGGh..../...gGGGGGh.../...hhhhhhh..."],
  padlock: ["orange", "..ggggggh../.gG.....Gh./.gG.....Gh./.gG.....Gh./lllllllllll/lwccccccccs/ccccooocccs/cccccoccccs/cccccoccccs/sssssssssss"],
  pointer: ["neutral", "..kkk......./.kwwwkkkkkk./kwwwwwwwwwwk/kwwwwwKKKKK./kwwwwwo...../kwwwwwo...../.KwwwwK...../..KKKK......"],
  arrow: ["accent", "wllllllc/.cccccs./..ccss../...cs..."],
  sparkle: ["yellow", "!..y../..y../yywyy/..y../..y.."],
  "sparkle-small": ["yellow", "!.y./ywy/.y."],
  sword: ["blue", ".........kw/........kwk/.......kwk./......kwk../.....kwk.../.l..kwk..../.cl.wk...../..cl......./..hccc...../.hG..c...../hG........./h.........."],
  shield: ["blue", "lllllllllll/lwlllklllcs/lccckwkcccs/lckkkwkkkcs/lccckwkcccs/lccckwkcccs/.lcckwkccs./.lccckccss./..lccccss../...lccss.../....lcs..../.....s....."],
  clock: ["red", "..lllll../.lkkkkkc./lkkkokkkc/lkkkokkkc/lkkkoooks/ckkkkkkks/.ckkkkks./..sssss.."],
};

const PALETTE: Record<string, string> = {
  o: "--blip-ink", w: "--blip-white",
  y: "--blip-candy-yellow-light", Y: "--blip-candy-yellow", d: "--blip-candy-yellow-shade",
  g: "--blip-candy-slate-light", G: "--blip-candy-slate", h: "--blip-candy-slate-shade",
  n: "--blip-candy-orange-light", N: "--blip-candy-orange", m: "--blip-candy-orange-shade",
  k: "--blip-candy-cream", K: "--blip-candy-cream-shade",
  b: "--blip-candy-blue-light", B: "--blip-candy-blue", v: "--blip-candy-blue-shade",
  r: "--blip-candy-red-light", R: "--blip-candy-red", x: "--blip-candy-red-shade",
};
const TONE: Record<string, [string, string]> = { l: ["light", "-light"], c: ["base", ""], s: ["shade", "-shade"] };

/** The sprites there are. */
export const spriteNames: readonly string[] = Object.keys(MAPS);

/** A sprite's default tone: its own candy ("red" for the potion), or undefined for an unknown name. */
export const toneOf = (name: string): string | undefined => MAPS[name]?.[0];

/** A sprite's pixels with its outline: rows of characters, "." for clear. */
export function pixels(name: string): string[] | undefined {
  const entry = MAPS[name];
  return entry && outline(entry[1]);
}

/** A map of your own (rows split by "/") with the ink outline added round its fill, as the sprites have. */
export function outline(map: string): string[] {
  const bare = map.startsWith("!");
  const fill = (bare ? map.slice(1) : map).split("/");
  if (bare) return fill;
  const w = Math.max(...fill.map((r) => r.length)) + 2;
  const at = (x: number, y: number) => (fill[y - 1]?.[x - 1] ?? ".") !== ".";
  return Array.from({ length: fill.length + 2 }, (_, y) =>
    Array.from({ length: w }, (_, x) =>
      at(x, y) ? fill[y - 1]![x - 1]! : at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1) ? "o" : ".",
    ).join(""),
  );
}

/** One SVG path per colour, each row's runs merged: M x y h n v 1 h -n z. */
export function paths(rows: readonly string[]): Map<string, string> {
  const out = new Map<string, string>();
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const ch = row[x]!;
      let n = 1;
      while (row[x + n] === ch) n++;
      if (ch !== ".") out.set(ch, (out.get(ch) ?? "") + `M${x} ${y}h${n}v1h-${n}z`);
      x += n;
    }
  });
  return out;
}

const candy = (tone: string, part: string) => (tone === "accent" ? `--blip-accent${part}` : `--blip-candy-${tone === "neutral" ? "cream" : tone}${part}`);

/** The CSS colour for a pixel key in a sprite whose default tone is `tone`. */
export function colour(key: string, tone: string): string {
  const t = TONE[key];
  if (t) return `var(--blip-sprite-${t[0]}, var(${candy(tone, t[1])}))`;
  return `var(${PALETTE[key] ?? "--blip-ink"})`;
}

/**
 * A sprite as an SVG string: whole pixels, token colours, an ink outline. One sprite pixel is one Blip pixel
 * (sprites.css sizes it from --blip-pixel). Unknown names give an empty string.
 *
 *   sprite("coin")                      sprite("potion", { tone: "blue", label: "Mana potion" })
 */
export function sprite(name: string, options: { tone?: string; label?: string } = {}): string {
  const rows = pixels(name);
  if (!rows) return "";
  const w = rows[0]!.length, h = rows.length, tone = MAPS[name]![0];
  const a11y = options.label ? `role="img" aria-label="${options.label.replace(/[&"<]/g, (c) => `&#${c.charCodeAt(0)};`)}"` : `aria-hidden="true"`;
  let body = "";
  for (const [key, d] of paths(rows)) body += `<path fill="${colour(key, tone)}" d="${d}"/>`;
  return `<svg class="blip-sprite" data-sprite="${name}"${options.tone ? ` data-tone="${options.tone}"` : ""} viewBox="0 0 ${w} ${h}" width="${2 * w}" height="${2 * h}" style="--_w:${w};--_h:${h}" shape-rendering="crispEdges" focusable="false" ${a11y}>${body}</svg>`;
}
