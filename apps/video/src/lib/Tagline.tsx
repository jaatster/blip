import { useCurrentFrame } from "remotion";
import { Beat } from "./Beat";
import { p } from "./grid";
import { Icon } from "./Icon";
import { Typed } from "./Text";

export const COMMAND = "npm install @jaatster/blip-components";

/**
 * Under BLIP: one ink card, so nothing has to be read against the mountains. The line types in on it from `line`; the
 * install row pops in under it from `install` (its room kept from the start, so the card never grows), with the
 * command typed `typed` letters in and its Copy button pressed or done.
 */
export const Tagline = ({ card, line, install, typed = COMMAND.length, copy = "rest" }: {
  readonly card: number;
  readonly line: number;
  readonly install: number;
  readonly typed?: number;
  readonly copy?: "rest" | "press" | "done";
}) => {
  const frame = useCurrentFrame();
  return (
    <Beat at={card}>
      <div className="blip-box blip-card blip-pop-in" data-size="sm" style={{ visibility: frame >= card ? "visible" : "hidden", display: "grid", gap: p(8), justifyItems: "center" }}>
        <div style={{ blockSize: p(16), display: "grid", placeItems: "center" }}>
          <Typed text="16-bit pixel modular design system" at={line} style={{ fontSize: p(13), fontWeight: 700, color: "var(--blip-white)" }} />
        </div>
        <div style={{ visibility: frame >= install ? "visible" : "hidden" }}>
          <Beat at={install}>
            <div className="blip-cluster blip-pop-in" data-gap="4" style={{ flexWrap: "nowrap" }}>
              <span className="blip-box blip-input" data-size="lg" style={{ inlineSize: p(214) }}>
                <span className="blip-input-affix" aria-hidden="true">$</span>
                <input value={COMMAND.slice(0, Math.max(0, typed))} aria-label="Install" readOnly />
              </span>
              <span className="blip-box blip-button" data-size="lg" data-blip-state={copy === "press" ? "active" : undefined}>
                <Icon name={copy === "done" ? "check" : "copy"} />
                {copy === "done" ? "Copied" : "Copy"}
              </span>
            </div>
          </Beat>
        </div>
      </div>
    </Beat>
  );
};
