/**
 * blip/whole-pixels: every size is a whole number of Blip pixels.
 *
 * Lengths come from tokens (--pp-space-N, --pp-radius-N, --pp-control-*, --pp-size-*, --pp-pixel), from
 * calc(N * var(--pp-pixel)) with a whole N, or from a component's own --_p. Rejected in declaration values:
 *
 * - raw absolute lengths (px, pt, pc, cm, mm, q, in), except 0, and 1px (or -1px) inside
 *   @media (forced-colors: active), where system borders are a device pixel;
 * - font-relative lengths (em, rem, ex, cap, ic): text sizes come from --pp-size-*;
 * - a fraction of a pixel: calc(1.5 * var(--pp-pixel)), calc(var(--pp-pixel) / 2).
 *
 * Allowed: percentages, viewport and container units, fr, and the text measures ch and lh (line length and
 * line count). At-rule parameters (@media and @container breakpoints) are not sizes on screen and are not checked.
 * Documented exceptions take a stylelint-disable comment with a reason, or the allow option.
 *
 * Options: true, or [true, { allow: ["0.5px", "/regex/"], ignoreProperties: [names or "/regex/"] }].
 */
import stylelint from "stylelint";
import { docs, inForcedColors, isStringOrRegExp, matches, valueIndex, valueParser } from "../utils.js";

const ruleName = "blip/whole-pixels";
const messages = stylelint.utils.ruleMessages(ruleName, {
  raw: (v) => `Raw length "${v}". Count it in pixels: calc(N * var(--pp-pixel)), or a token (--pp-space-N, --pp-radius-N, --pp-control-*).`,
  font: (v) => `Font-relative length "${v}". Text sizes come from --pp-size-*; other sizes are counted in pixels.`,
  hairline: (v) => `"${v}" is for system borders inside @media (forced-colors: active) only. Elsewhere use var(--pp-pixel).`,
  fraction: (v) => `A fraction of a pixel: "${v}". Sizes are a whole number of var(--pp-pixel).`,
});

const ABSOLUTE = new Set(["px", "pt", "pc", "cm", "mm", "q", "in"]);
const FONT = new Set(["em", "rem", "ex", "rex", "cap", "rcap", "ic", "ric"]);
const MATH = new Set(["calc", "min", "max", "clamp", "round", "mod", "rem"]);
const PIXEL = /^--(?:pp-pixel|_p)$/;

const isPixel = (n) => n?.type === "function" && n.value.toLowerCase() === "var" && PIXEL.test(n.nodes[0]?.value ?? "");
const number = (n) => {
  if (n?.type !== "word") return null;
  const u = valueParser.unit(n.value);
  return u && u.unit === "" ? Number(u.number) : null;
};

const rule = (primary, secondary = {}) => (root, result) => {
  const valid = stylelint.utils.validateOptions(
    result,
    ruleName,
    { actual: primary, possible: [true] },
    { actual: secondary, possible: { allow: [isStringOrRegExp], ignoreProperties: [isStringOrRegExp] }, optional: true },
  );
  if (!valid) return;

  root.walkDecls((decl) => {
    if (matches(secondary?.ignoreProperties, decl.prop)) return;
    const forced = inForcedColors(decl);
    const at = valueIndex(decl);
    const report = (message, word, index) => stylelint.utils.report({ result, ruleName, node: decl, message, word, index: at + index, endIndex: at + index + word.length });

    valueParser(decl.value).walk((n) => {
      if (n.type === "string" || n.type === "comment") return false;
      if (n.type === "function") {
        const name = n.value.toLowerCase();
        if (name === "url" || name === "attr") return false;
        if (MATH.has(name)) {
          // N * pixel, pixel * N with a fractional N, and pixel / N.
          const parts = n.nodes.filter((x) => x.type !== "space");
          parts.forEach((op, i) => {
            if (op.type !== "word" && op.type !== "div") return;
            const [l, r] = [parts[i - 1], parts[i + 1]];
            const text = () => valueParser.stringify([l, { type: "space", value: " " }, op, { type: "space", value: " " }, r]);
            if (op.value === "*") {
              const k = isPixel(l) ? number(r) : isPixel(r) ? number(l) : null;
              if (k !== null && !Number.isInteger(k)) report(messages.fraction(text()), valueParser.stringify(n), n.sourceIndex);
            } else if (op.value === "/" && isPixel(l)) {
              const k = number(r);
              if (k !== null && k !== 1 && k !== -1) report(messages.fraction(text()), valueParser.stringify(n), n.sourceIndex);
            }
          });
        }
        return undefined;
      }
      if (n.type !== "word") return undefined;
      const u = valueParser.unit(n.value);
      if (!u || !u.unit) return undefined;
      const unit = u.unit.toLowerCase();
      const value = Number(u.number);
      if (value === 0 || matches(secondary?.allow, n.value)) return undefined;
      if (ABSOLUTE.has(unit)) {
        if (unit === "px" && Math.abs(value) === 1) {
          if (!forced) report(messages.hairline(n.value), n.value, n.sourceIndex);
        } else report(messages.raw(n.value), n.value, n.sourceIndex);
      } else if (FONT.has(unit)) report(messages.font(n.value), n.value, n.sourceIndex);
      return undefined;
    });
  });
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = { url: docs(ruleName) };

export default stylelint.createPlugin(ruleName, rule);
