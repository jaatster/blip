import { useCurrentFrame } from "remotion";
import { Beat } from "./Beat";
import { p } from "./grid";
import { Typed } from "./Text";

export const COMMAND = "npm install @jaatster/blip-components";

/**
 * Under BLIP: one ink card, so nothing has to be read against the mountains. The line types in on it from `line`; the
 * install row pops in under it from `install` (its room kept from the start, so the card never grows), with the
 * command typed `typed` letters in. (No Copy button: nobody can press one in a video.)
 */
export const Tagline = ({ card, line, install, typed = COMMAND.length }: {
  readonly card: number;
  readonly line: number;
  readonly install: number;
  readonly typed?: number;
}) => {
  const frame = useCurrentFrame();
  return (
    // The card and its row are drawn (unseen) from the first frame, so their room is held and BLIP never moves.
    <div style={{ visibility: frame >= card ? "visible" : "hidden" }}>
      <Beat at={card} from={0}>
      <div className="blip-box blip-card blip-pop-in" data-size="sm" style={{ display: "grid", gap: p(8), justifyItems: "center" }}>
        <div style={{ blockSize: p(16), display: "grid", placeItems: "center" }}>
          <Typed text="16-bit pixel modular design system" at={line} style={{ fontSize: p(13), fontWeight: 700, color: "var(--blip-white)" }} />
        </div>
        <div style={{ visibility: frame >= install ? "visible" : "hidden" }}>
          <Beat at={install} from={0}>
            <div className="blip-pop-in">
              <span className="blip-box blip-input" data-size="lg" style={{ inlineSize: p(240) }}>
                <span className="blip-input-affix" aria-hidden="true">$</span>
                <input value={COMMAND.slice(0, Math.max(0, typed))} aria-label="Install" readOnly />
              </span>
            </div>
          </Beat>
        </div>
      </div>
      </Beat>
    </div>
  );
};
