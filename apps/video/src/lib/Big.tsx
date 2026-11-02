import type { CSSProperties, ReactNode } from "react";
import { Snap } from "./Snap";

/**
 * Blip's pixel switch at two or three times the stage's pixel, centred on whole pixels: everything inside is drawn
 * natively bigger (sizes, radii, bands and text all count the bigger pixel), never scaled after it is drawn, which
 * would break the pixel font. Inside it, p(n) counts the bigger pixels.
 */
export const Big = ({ x = 2, children, style }: { readonly x?: 2 | 3; readonly children: ReactNode; readonly style?: CSSProperties }) => (
  <Snap>
    <div className={`v-x${x}`} data-blip-pixel="" style={style}>{children}</div>
  </Snap>
);
