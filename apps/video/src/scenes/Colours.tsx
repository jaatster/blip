import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Dither, Life, Sky, bayerMask } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { Typed } from "../lib/Text";

/** Bars 17-20 of the theme: the groove again. */
export const COLOURS = { bar: 17, bars: 4 };

// The docs home's accent swatches, each a palette: the focus picks the next every three beats (1.2 s) and the whole
// screen takes it through the ordered dither, its night sky, page, ink and accent. The window shows what the accent
// paints: the one candy button, a soft one, a switch, the progress blocks.
const PALETTES = [
  { id: "", name: "Candy" },
  { id: "mint", name: "Mint" },
  { id: "grape", name: "Grape" },
  { id: "bubblegum", name: "Bubblegum" },
  { id: "ember", name: "Ember" },
];
const PICKS = [0, at(0, 3), at(1, 2), at(2, 1), at(3, 0)];
const WINDOW = at(0, 1);
const LINE = at(0, 2);
const OUT = at(4) - 8 * TICK;
const CLEAR = [[100, 22, 380, 250]] as const;

/** The screen in palette `i`. */
const Screen = ({ i }: { readonly i: number }) => {
  const palette = PALETTES[i]!;
  return (
    <AbsoluteFill data-blip-scheme="night" data-blip-palette={palette.id || undefined} style={{ background: "var(--blip-bg)" }}>
      <Sky scheme="night" palette={palette.id} avoid={CLEAR} />
      <Life avoid={CLEAR} seed={21} />

      <div style={{ position: "absolute", insetInline: 0, top: p(22), display: "grid", justifyItems: "center" }}>
        <span className="blip-display blip-pop" data-scale="4" data-pop="Your colours">Your colours</span>
      </div>

      <Beat at={WINDOW}>
        <section className="blip-box blip-window blip-pop-in" style={{ position: "absolute", left: p(134), top: p(78), inlineSize: p(212) }}>
          <header className="blip-window-bar">
            <h2 className="blip-window-title blip-display blip-pop" data-pop="Colours">Colours</h2>
          </header>
          <div className="blip-window-body" style={{ display: "grid", gap: "var(--blip-space-8)", padding: "var(--blip-space-8)" }}>
            <fieldset style={{ display: "grid", gap: "var(--blip-space-3)", margin: 0, padding: 0, border: 0 }}>
              <legend className="blip-label" style={{ padding: 0, marginBlockEnd: "var(--blip-space-3)" }}>
                Accent <span style={{ marginInlineStart: "var(--blip-space-2)", color: "var(--blip-text-muted)", textTransform: "none", letterSpacing: 0 }}>{palette.name}</span>
              </legend>
              <div style={{ display: "flex", gap: "var(--blip-space-3)" }}>
                {PALETTES.map((sw, n) => (
                  <label
                    key={sw.name}
                    className="blip-box"
                    data-blip-scheme="night"
                    data-blip-palette={sw.id || undefined}
                    data-blip-state={n === i ? "focus" : undefined}
                    style={{
                      "--blip-r": 3, "--blip-shape": "var(--blip-shape-3)", "--blip-shape-inner": "var(--blip-shape-3-inner)",
                      // Candy is no palette attribute at all, so its swatch names its own Night accent, Sky Soda.
                      ...(sw.id
                        ? { "--blip-tone": "var(--blip-accent)", "--blip-tone-light": "var(--blip-accent-light)", "--blip-tone-shade": "var(--blip-accent-shade)" }
                        : { "--blip-tone": "#00C2FA", "--blip-tone-light": "#91DDFF", "--blip-tone-shade": "#0096C3" }),
                      "--blip-tone-on": "var(--blip-ink)",
                      display: "inline-grid", placeItems: "center", inlineSize: p(14), blockSize: p(14), margin: `0 ${p(1)} ${p(1)} 0`,
                    } as CSSProperties}
                  >
                    <span style={{ display: n === i ? "block" : "none", inlineSize: p(4), blockSize: p(4), background: "var(--blip-tone-on)" }} />
                  </label>
                ))}
              </div>
            </fieldset>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--blip-space-4)" }}>
              <span className="blip-box blip-button" data-size="sm"><Icon name="play" />Play</span>
              <span className="blip-box blip-button" data-size="sm" data-variant="soft">Options</span>
              <span className="blip-box blip-switch" style={{ marginInlineStart: "auto" }}><input type="checkbox" role="switch" className="blip-box" checked readOnly /></span>
            </div>
            <div className="blip-box blip-progress"><progress max={100} value={60}>60%</progress></div>
          </div>
        </section>
      </Beat>

      <div style={{ position: "absolute", insetInline: 0, top: p(236), display: "grid", justifyItems: "center", blockSize: p(16) }}>
        <Typed text="12 palettes, or make your own." at={LINE} every={2} className="blip-outline" style={{ fontSize: p(12), fontWeight: 700 }} />
      </div>
    </AbsoluteFill>
  );
};

export const Colours = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const i = PICKS.filter((f) => f <= frame).length - 1;
  const k = ticks(frame, PICKS[i]!);
  const fading = i > 0 && k < 3;

  return (
    <Stage scheme="night">
      <Screen i={i} />
      {fading && (
        <div style={{ position: "absolute", inset: 0, mask: bayerMask(16 - 4 * (k + 1)) }}>
          <Screen i={i - 1} />
        </div>
      )}

      <Sfx name="open" at={WINDOW} volume={0.6} />
      {PICKS.slice(1).map((f, n) => <Sfx key={f} name={`blip@${[3, 5, 7, 7][n]}`} at={f} volume={0.6} />)}

      <Dither at={0} mode="in" />
      <Dither at={OUT} mode="out" />
      {music && <Music bar={COLOURS.bar} bars={COLOURS.bars} />}
    </Stage>
  );
};
