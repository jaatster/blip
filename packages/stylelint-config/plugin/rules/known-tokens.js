/**
 * blip/known-tokens: every var(--blip-…) names something that exists.
 *
 * A --blip-* custom property read with var() must be a token from @blip/tokens (its manifest.json), a public
 * property of a Blip package (public-properties.json: the properties the packages declare, register with
 * @property, or document in their CSS headers and docs), or declared in the same stylesheet. Anything else is a typo
 * or an undocumented hook, and the message suggests the nearest names. Private names (--_*) are not checked.
 *
 * Options: true, or [true, { allow: ["--blip-my-thing", "/^--blip-app-/"] }].
 */
import { createRequire } from "node:module";
import stylelint from "stylelint";
import { docs, isStringOrRegExp, matches, nearest, valueIndex, valueParser } from "../utils.js";

const ruleName = "blip/known-tokens";
const messages = stylelint.utils.ruleMessages(ruleName, {
  unknown: (name, near) =>
    `Unknown token "${name}".${near.length ? ` Did you mean ${near.map((n) => `"${n}"`).join(" or ")}?` : ""} Use a token from @blip/tokens, a documented public property, or declare it in this stylesheet.`,
});

const require = createRequire(import.meta.url);
const load = (id) => {
  try {
    return require(id);
  } catch {
    return null;
  }
};
const tokens = (load("@blip/tokens/manifest.json") ?? []).map((t) => t.cssVar);
const publicProps = load("../../public-properties.json")?.properties ?? [];
/** Every name known before looking at a stylesheet. */
export const KNOWN = new Set([...tokens, ...publicProps]);

const rule = (primary, secondary = {}) => (root, result) => {
  const valid = stylelint.utils.validateOptions(
    result,
    ruleName,
    { actual: primary, possible: [true] },
    { actual: secondary, possible: { allow: [isStringOrRegExp] }, optional: true },
  );
  if (!valid) return;
  if (!tokens.length) {
    stylelint.utils.report({ result, ruleName, node: root, message: `${ruleName}: cannot read @blip/tokens/manifest.json. Install @blip/tokens.`, index: 0, endIndex: 0 });
    return;
  }

  const local = new Set();
  // (A walker stops when its callback returns false: keep these as statements.)
  root.walkDecls((d) => {
    if (d.prop.startsWith("--blip-")) local.add(d.prop);
  });
  root.walkAtRules("property", (a) => {
    local.add(a.params.trim());
  });

  root.walkDecls((decl) => {
    const at = valueIndex(decl);
    valueParser(decl.value).walk((n) => {
      if (n.type !== "function" || n.value.toLowerCase() !== "var") return;
      const name = n.nodes[0]?.value ?? "";
      if (!name.startsWith("--blip-") || KNOWN.has(name) || local.has(name) || matches(secondary?.allow, name)) return;
      const index = at + n.nodes[0].sourceIndex;
      stylelint.utils.report({ result, ruleName, node: decl, message: messages.unknown(name, nearest(name, KNOWN)), word: name, index, endIndex: index + name.length });
    });
  });
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = { url: docs(ruleName) };

export default stylelint.createPlugin(ruleName, rule);
