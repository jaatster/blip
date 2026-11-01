/**
 * blip/stepped-motion: motion snaps.
 *
 * Timing functions are only steps(…), step-start, step-end or var(--blip-ease-N) (the stepped motion tokens), never
 * an easing curve (ease, ease-in, ease-out, ease-in-out, linear, cubic-bezier(), linear()). Checked in
 * transition-timing-function and animation-timing-function (also inside @keyframes), and in the transition and
 * animation shorthands, where leaving the timing function out is an easing curve too (the default is ease), unless:
 * the duration is 0 (nothing moves), a later longhand in the same rule sets it, or the layer reads a custom property
 * that may hold it.
 *
 * Options: true.
 */
import stylelint from "stylelint";
import { docs, layers, valueIndex, valueParser } from "../utils.js";

const ruleName = "blip/stepped-motion";
const messages = stylelint.utils.ruleMessages(ruleName, {
  curve: (v) => `Easing curve "${v}". Motion snaps: use steps(N, jump-end), step-start, step-end or var(--blip-ease-N).`,
  other: (v) => `"${v}" is not a stepped timing function. Use steps(N, jump-end), step-start, step-end or var(--blip-ease-N).`,
  implicit: (prop) => `This ${prop} has no timing function, so it eases (the default is ease). Add steps(N, jump-end) or var(--blip-ease-N).`,
});

const CURVE_WORDS = new Set(["ease", "ease-in", "ease-out", "ease-in-out", "linear"]);
const CURVE_FUNCTIONS = new Set(["cubic-bezier", "linear"]);
const WIDE = new Set(["inherit", "initial", "unset", "revert", "revert-layer"]);
/** Custom properties that hold durations or delays, never a timing function. */
const TIME_VAR = /^--(?:blip-duration-|blip-delay|_?(?:blip-)?(?:dur|duration|delay|time|steps)\b)/;

const stepped = (n) =>
  (n.type === "function" && n.value.toLowerCase() === "steps") ||
  (n.type === "word" && /^step-(?:start|end)$/i.test(n.value)) ||
  (n.type === "function" && n.value.toLowerCase() === "var" && /^--blip-ease-/.test(n.nodes[0]?.value ?? ""));
const curve = (n) => (n.type === "word" && CURVE_WORDS.has(n.value.toLowerCase())) || (n.type === "function" && CURVE_FUNCTIONS.has(n.value.toLowerCase()));
const time = (n) => {
  if (n.type !== "word") return null;
  const u = valueParser.unit(n.value);
  return u && /^m?s$/i.test(u.unit) ? Number(u.number) : null;
};

const rule = (primary) => (root, result) => {
  if (!stylelint.utils.validateOptions(result, ruleName, { actual: primary, possible: [true] })) return;

  root.walkDecls((decl) => {
    const prop = decl.prop.toLowerCase();
    const at = valueIndex(decl);
    const report = (message, word, index) => stylelint.utils.report({ result, ruleName, node: decl, message, word, index: at + index, endIndex: at + index + word.length });
    const parsed = valueParser(decl.value);

    if (prop === "transition-timing-function" || prop === "animation-timing-function") {
      for (const layer of layers(parsed.nodes)) {
        for (const n of layer) {
          if (n.type === "space" || n.type === "comment") continue;
          if (stepped(n) || (n.type === "word" && WIDE.has(n.value.toLowerCase()))) continue;
          const text = valueParser.stringify(n);
          report(curve(n) ? messages.curve(text) : messages.other(text), text, n.sourceIndex);
        }
      }
      return;
    }
    if (prop !== "transition" && prop !== "animation") return;

    // A later longhand in the same rule sets the timing for every layer.
    const later = [];
    for (let s = decl.next(); s; s = s.next()) if (s.type === "decl") later.push(s.prop.toLowerCase());
    if (later.includes(`${prop}-timing-function`)) return;

    for (const layer of layers(parsed.nodes)) {
      const parts = layer.filter((n) => n.type !== "space" && n.type !== "comment");
      if (!parts.length) continue;
      if (parts.length === 1 && parts[0].type === "word" && (parts[0].value.toLowerCase() === "none" || WIDE.has(parts[0].value.toLowerCase()))) continue;
      let ok = false;
      let bad = false;
      for (const n of parts) {
        if (stepped(n)) ok = true;
        else if (curve(n)) {
          bad = true;
          const text = valueParser.stringify(n);
          report(messages.curve(text), text, n.sourceIndex);
        }
      }
      if (ok || bad) continue;
      // No timing function. Fine if nothing moves (no duration, or a duration of 0), or if a custom property that
      // is not a duration may carry one.
      const isTimeVar = (n) => n.type === "function" && n.value.toLowerCase() === "var" && TIME_VAR.test(n.nodes[0]?.value ?? "");
      const duration = parts.find((n) => time(n) !== null || isTimeVar(n) || (n.type === "function" && /^(?:calc|min|max|clamp)$/i.test(n.value) && /duration|\d(?:m?s)\b/.test(valueParser.stringify(n))));
      if (!duration || time(duration) === 0) continue;
      const maybeTiming = parts.some((n) => n !== duration && n.type === "function" && n.value.toLowerCase() === "var" && !isTimeVar(n));
      if (maybeTiming) continue;
      report(messages.implicit(prop), valueParser.stringify(layer).trim(), layer[0].sourceIndex);
    }
  });
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = { url: docs(ruleName) };

export default stylelint.createPlugin(ruleName, rule);
