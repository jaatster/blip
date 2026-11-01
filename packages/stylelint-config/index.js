/**
 * @blip/stylelint-config: the shareable config.
 *
 *   // stylelint.config.mjs
 *   export default { extends: ["@blip/stylelint-config"] };
 *
 * Turns on the four Blip rules (see README.md). Combine it with any other config; it sets nothing else.
 */
import plugin from "./plugin/index.js";

export default {
  plugins: [plugin],
  rules: {
    "blip/no-raw-color": true,
    "blip/whole-pixels": true,
    "blip/stepped-motion": true,
    "blip/known-tokens": true,
  },
};
