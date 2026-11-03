import { useLayoutEffect, useRef } from "react";
import { p } from "./grid";
import "./parade.css";
import { SNIPPETS, type Snippet } from "./snippets";

/**
 * One part, its real markup drawn at the stage's pixel, whole: as wide as it draws, centred in its row's height. Its
 * clock-driven animations (pop-ins, letters dropping, a tally counting up) are finished, so it shows how it settles;
 * looping ones hold their first frame. Scroll-driven ones follow their scroller as usual. Marked as a Beat of its own,
 * so a Beat round it leaves these alone; contained, so nothing positioned in it gets out.
 */
const Cell = ({ s, h }: { readonly s: Snippet; readonly h: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    for (const a of ref.current?.getAnimations({ subtree: true }) ?? []) {
      if (a.timeline !== document.timeline) continue;
      const end = a.effect?.getComputedTiming().endTime;
      if (typeof end === "number" && Number.isFinite(end)) a.finish();
      else {
        a.pause();
        a.currentTime = 0;
      }
    }
  });
  return (
    <div ref={ref} data-beat="" style={{ position: "relative", contain: "layout", blockSize: p(h), flex: "none", display: "flex", alignItems: "center" }}>
      {/* At least as wide as it drew in the docs, so a part that fills its container (a progress bar, a tab row) keeps it. */}
      <div className="v-parade-item" style={{ minInlineSize: p(s.w) }} dangerouslySetInnerHTML={{ __html: s.html }} />
    </div>
  );
};

/**
 * The parade: the parts that read well whole (lib/snippets.ts) in three rows across the whole stage, dealt in turn so
 * each row mixes controls, labels, feedback and game pieces, gliding in alternating directions. `k` (0 to 1) is how far
 * along they are: each row travels its own length less the stage's, so every part crosses the screen, in whole Blip
 * pixels a frame.
 */
const ROWS = 3;
const ROW_H = 44, ROW_GAP = 10, GAP = 16, EDGE = 16;
export const PARADE_H = ROWS * ROW_H + (ROWS - 1) * ROW_GAP;

const Row = ({ items, dir, k }: { readonly items: readonly Snippet[]; readonly dir: 1 | -1; readonly k: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const px = parseFloat(getComputedStyle(el).getPropertyValue("--blip-pixel")) || 4;
    const travel = Math.max(0, Math.round(el.offsetWidth / px) - 480);
    const off = Math.round(k * travel);
    el.style.translate = `calc(${dir < 0 ? -off : off - travel} * var(--blip-pixel)) 0`;
  });
  return (
    <div ref={ref} style={{ display: "flex", gap: p(GAP), inlineSize: "max-content", paddingInline: p(EDGE), blockSize: p(ROW_H) }}>
      {items.map((s) => <Cell key={s.slug} s={s} h={ROW_H} />)}
    </div>
  );
};

export const Parade = ({ top, k }: { readonly top: number; readonly k: number }) => (
  <div style={{ position: "absolute", left: 0, top: p(top), display: "grid", gap: p(ROW_GAP) }}>
    {Array.from({ length: ROWS }, (_, r) => (
      <Row key={r} items={SNIPPETS.filter((_, i) => i % ROWS === r)} dir={r % 2 ? 1 : -1} k={k} />
    ))}
  </div>
);
