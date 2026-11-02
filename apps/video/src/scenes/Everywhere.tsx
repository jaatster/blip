import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { STEP, TICK, at, p } from "../lib/grid";
import { Life, Sky } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed, letterLands } from "../lib/Text";
import { Dissolve, MOSAIC_FRAMES } from "../lib/Transitions";

/** Bars 41-44 of the theme. */
export const EVERYWHERE = { bar: 41, bars: 4 };

// Use it everywhere: on the left the heading, its line and the targets as tags on a card, each lighting in turn; on
// the right an accordion in a window, whose rows open one at a time (the chevron stepping round) on the target's
// real line from its real file: the HTML (with the button it makes, live), a Web Component, React, the tokens for
// Android and iOS, and Figma's variables. A row every 48 frames (two beats and a half), the last held to the end.
const TITLE = [...letterLands("Use it", at(0), STEP), ...letterLands("everywhere", at(0, 1, 2), STEP)];
const LINE = at(0, 3, 2);
const FIRST = at(1);
const EACH = 48;
const CLEAR = [[10, 8, 470, 262]] as const;

type Target = { readonly name: string; readonly file: string; readonly code: readonly string[]; readonly live?: boolean };
const TARGETS: readonly Target[] = [
  { name: "HTML and CSS", file: "index.html", code: ['<button class="blip-box blip-button">', "  Press start", "</button>"], live: true },
  { name: "Web Components", file: "@jaatster/blip-elements", code: ['<blip-tabs class="blip-tabs">', "  …", "</blip-tabs>"] },
  { name: "React", file: "@jaatster/blip-react", code: ['<Button variant="soft"', '  tone="danger" size="sm">', "  Delete save</Button>"] },
  { name: "Android and iOS", file: "BlipTokens.kt · BlipTokens.swift", code: ["accent = Color(0xFF00C2FA),", "accent: Color(blipHex: 0x00C2FA),"] },
  { name: "Figma", file: "figma/variables.json", code: ['"name": "palette/night/accent/base",', '"Candy": { "g": 0.76078, "b": 0.98039 },'] },
];
const opens = TARGETS.map((_, i) => FIRST + i * EACH);

export const Everywhere = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const cur = opens.filter((f) => f <= frame).length - 1;

  return (
    <Stage scheme="night" mosaicOut={at(4) - MOSAIC_FRAMES}>
      <AbsoluteFill>
        <Sky scheme="night" avoid={CLEAR} />
        <Life avoid={CLEAR} seed={51} shooting={[at(2, 2)]} />
      </AbsoluteFill>

      <div style={{ position: "absolute", left: p(16), top: p(16), display: "grid", gap: p(4), justifyItems: "start" }}>
        <DropTitle text="Use it" lands={TITLE.slice(0, 6)} scale={2} outline={1} />
        <DropTitle text="everywhere" lands={TITLE.slice(6)} scale={2} outline={1} />
        <div style={{ blockSize: p(34), inlineSize: p(170), marginBlockStart: p(4) }}>
          <Typed text="HTML, Web Components and React. Tokens for Android, iOS and Figma." at={LINE} every={1} className="blip-outline" style={{ fontSize: p(9), fontWeight: 700 }} />
        </div>
      </div>

      <Beat at={FIRST - STEP} from={FIRST - STEP}>
        <article className="blip-box blip-card blip-pop-in" data-size="sm" style={{ position: "absolute", left: p(16), top: p(114), inlineSize: p(170) }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: p(4) }}>
            {TARGETS.map((t, i) => (
              <Beat key={t.name} at={i === cur ? opens[i]! : FIRST - STEP}>
                <span className={`blip-box blip-tag${i === cur ? " blip-pop-in" : ""}`} data-variant={i === cur ? "candy" : i < cur ? "soft" : "outline"} data-tone={i === cur ? "accent" : "neutral"}>
                  {t.name}
                </span>
              </Beat>
            ))}
          </div>
        </article>
      </Beat>

      <Beat at={FIRST - 2 * STEP} from={FIRST - 2 * STEP}>
        <section className="blip-box blip-window blip-pop-in" style={{ position: "absolute", left: p(200), top: p(16), inlineSize: p(264) }}>
          <header className="blip-window-bar">
            <h2 className="blip-window-title blip-display blip-pop" data-pop="One system">One system</h2>
          </header>
          <div className="blip-window-body" style={{ padding: p(6) }}>
            <div className="blip-accordion">
              {TARGETS.map((t, i) => (
                <Beat key={t.name} at={i === cur ? opens[i]! : 0}>
                  <details className="blip-accordion-item" open={i === cur}>
                    <summary className="blip-box blip-accordion-summary" data-blip-state={i === cur && frame < opens[i]! + 3 * TICK ? "active" : undefined}>
                      {t.name}
                      <span className="blip-accordion-chevron" />
                    </summary>
                    <div className="blip-accordion-panel">
                      <div style={{ display: "grid", gap: p(3) }}>
                        <span style={{ color: "var(--blip-text-muted)", fontSize: p(7) }}>{t.file}</span>
                        <div style={{ display: "grid", justifyItems: "start", gap: p(4) }}>
                          <pre style={{ margin: 0, fontSize: p(8), lineHeight: 1.4, color: "var(--blip-text)", whiteSpace: "pre" }}>
                            <code>{t.code.join("\n")}</code>
                          </pre>
                          {t.live && (
                            <span className="blip-box blip-button blip-pop-in" data-size="sm" style={{ visibility: frame >= opens[i]! + 4 * STEP ? "visible" : "hidden" }}>
                              Press start
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                </Beat>
              ))}
            </div>
          </div>
        </section>
      </Beat>

      {[...new Set(TITLE)].map((f, i) => <Sfx key={f} name={i % 8 ? `step@${[0, 2, 3, 5, 7, 8, 10, 12][i % 8]}` : "step"} at={f} volume={0.4} />)}
      <Sfx name="open" at={FIRST - 2 * STEP} volume={0.5} />
      {opens.map((f, i) => <Sfx key={f} name={i ? `blip@${[0, 3, 5, 7, 5][i]}` : "blip"} at={f} volume={0.6} />)}
      <Sfx name="select" at={opens[0]! + 4 * STEP} volume={0.5} />
      <Sfx name="success" at={opens.at(-1)! + 2 * STEP} volume={0.5} />

      {music && <Music bar={EVERYWHERE.bar} bars={EVERYWHERE.bars} />}
      <Dissolve at={0} mode="in" seed={7} />
    </Stage>
  );
};
