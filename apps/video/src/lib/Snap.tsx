import { useLayoutEffect, useRef, type ReactNode } from "react";
import { W } from "./Pixels";

/**
 * Keeps its children on whole Blip pixels. Centring something of any size can leave it half a pixel out, and then the
 * candy box's stepped edges and the pixel font lose pixels (labels garble, outlines break). Snap measures where it
 * landed on the stage and shifts it back by the fraction, so its top left is a whole pixel from the stage's.
 */
export const Snap = ({ children }: { readonly children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current, stage = el?.closest(".v-stage");
    if (!el || !stage) return;
    el.style.translate = "";
    const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(), px = s.width / W;
    const off = (v: number) => ((v % px) + px) % px;
    const dx = off(r.left - s.left), dy = off(r.top - s.top);
    if (dx || dy) el.style.translate = `${-dx * (4 / px)}px ${-dy * (4 / px)}px`;
  });
  return <div ref={ref} style={{ display: "inline-block" }}>{children}</div>;
};
