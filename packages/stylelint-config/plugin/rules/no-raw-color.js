/**
 * blip/no-raw-color: colours come from tokens.
 *
 * Rejects hex colours, colour functions (rgb(), hsl(), oklch(), color()…) and named colours. Allowed: var() of a
 * token, transparent, currentColor, inherit (and the other CSS-wide keywords), color-mix() of allowed colours, and
 * system colours (Canvas, CanvasText, Highlight…) inside @media (forced-colors: active).
 *
 * Masks are exempt: a mask layer's colour only carries its alpha, so `linear-gradient(#000 0 0)` in a mask is not a
 * colour anyone sees. That covers mask declarations, and custom properties that feed a mask in the same stylesheet
 * (directly or through other custom properties), plus the candy box's shapes (--pp-shape…), which the box uses as
 * its mask.
 *
 * Options: true, or [true, { ignoreProperties: [names or "/regex/"], maskProperties: [names or "/regex/"] }].
 */
import stylelint from "stylelint";
import { docs, inForcedColors, isStringOrRegExp, matches, valueIndex, valueParser, varsIn } from "../utils.js";

const ruleName = "blip/no-raw-color";
const messages = stylelint.utils.ruleMessages(ruleName, {
  hex: (v) => `Raw colour "${v}". Use a colour token: var(--pp-ink), var(--pp-surface), var(--pp-candy-blue)…`,
  fn: (v) => `Raw colour function "${v}()". Use a colour token, or color-mix() of tokens.`,
  named: (v) => `Named colour "${v}". Use a colour token; only transparent, currentColor and inherit are allowed.`,
  system: (v) => `System colour "${v}" outside @media (forced-colors: active). Use a colour token here.`,
});

const FUNCTIONS = new Set(["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color", "device-cmyk"]);
const ALLOWED = new Set(["transparent", "currentcolor", "inherit", "initial", "unset", "revert", "revert-layer"]);
// CSS Color 4 system colours, and the deprecated ones browsers still map (except Background, Menu, Scrollbar and
// Window, which are too often plain words).
const SYSTEM = new Set(
  "accentcolor accentcolortext activetext buttonborder buttonface buttontext canvas canvastext field fieldtext graytext highlight highlighttext linktext mark marktext selecteditem selecteditemtext visitedtext activeborder activecaption appworkspace buttonhighlight buttonshadow captiontext inactiveborder inactivecaption inactivecaptiontext infobackground infotext menutext threeddarkshadow threedface threedhighlight threedlightshadow threedshadow windowframe windowtext".split(" "),
);
const NAMED = new Set(
  "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen".split(" "),
);
/** Properties whose words are names, not colours. */
const NAMES = /^(?:font|font-family|animation|animation-name|transition|transition-property|will-change|counter-(?:reset|increment|set)|grid(?:-template)?(?:-areas)?|grid-(?:area|row|column)(?:-start|-end)?|container(?:-name)?|view-transition-name|view-transition-class|anchor-name|position-anchor|anchor-scope|timeline-scope|scroll-timeline(?:-name)?|view-timeline(?:-name)?|list-style(?:-type)?|content|quotes)$/i;
const MASK = /^(?:-webkit-)?mask(?:-image|-border(?:-source)?)?$/i;

const rule = (primary, secondary = {}) => (root, result) => {
  const valid = stylelint.utils.validateOptions(
    result,
    ruleName,
    { actual: primary, possible: [true] },
    { actual: secondary, possible: { ignoreProperties: [isStringOrRegExp], maskProperties: [isStringOrRegExp] }, optional: true },
  );
  if (!valid) return;
  const maskProps = secondary?.maskProperties ?? ["/^--pp-shape(?:-\\d+)?(?:-inner)?$/"];

  // Which custom properties feed a mask here: those a mask reads, and (repeatedly) those they read.
  const reads = new Map();
  const feeding = new Set();
  root.walkDecls((decl) => {
    if (decl.prop.startsWith("--")) reads.set(decl.prop, [...(reads.get(decl.prop) ?? []), ...varsIn(decl.value)]);
    if (MASK.test(decl.prop)) for (const v of varsIn(decl.value)) feeding.add(v);
  });
  for (const prop of reads.keys()) if (matches(maskProps, prop)) feeding.add(prop);
  for (let grew = true; grew; ) {
    grew = false;
    for (const prop of [...feeding]) {
      for (const v of reads.get(prop) ?? []) {
        if (!feeding.has(v)) {
          feeding.add(v);
          grew = true;
        }
      }
    }
  }

  root.walkDecls((decl) => {
    if (MASK.test(decl.prop) || feeding.has(decl.prop)) return;
    if (NAMES.test(decl.prop) || matches(secondary?.ignoreProperties, decl.prop)) return;
    const forced = inForcedColors(decl);
    const report = (message, word, index) =>
      stylelint.utils.report({ result, ruleName, node: decl, message, word, index: valueIndex(decl) + index, endIndex: valueIndex(decl) + index + word.length });
    valueParser(decl.value).walk((n) => {
      if (n.type === "string" || n.type === "comment") return false;
      if (n.type === "function") {
        const name = n.value.toLowerCase();
        if (name === "url" || name === "attr" || name === "format" || name === "local") return false;
        if (FUNCTIONS.has(name)) {
          report(messages.fn(n.value), n.value, n.sourceIndex);
          return false;
        }
        return undefined;
      }
      if (n.type !== "word") return undefined;
      const w = n.value.toLowerCase();
      if (/^#[0-9a-f]{3,8}$/.test(w)) report(messages.hex(n.value), n.value, n.sourceIndex);
      else if (ALLOWED.has(w)) return undefined;
      else if (NAMED.has(w)) report(messages.named(n.value), n.value, n.sourceIndex);
      else if (SYSTEM.has(w) && !forced) report(messages.system(n.value), n.value, n.sourceIndex);
      return undefined;
    });
  });
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = { url: docs(ruleName) };

export default stylelint.createPlugin(ruleName, rule);
