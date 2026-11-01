/**
 * The Blip stylelint plugin: four rules that keep CSS inside the system.
 *
 *   blip/no-raw-color     colours come from tokens
 *   blip/whole-pixels     sizes are whole Blip pixels
 *   blip/stepped-motion   timing functions are steps, never easing curves
 *   blip/known-tokens     every var(--chu-…) is a real token or public property
 */
import noRawColor from "./rules/no-raw-color.js";
import wholePixels from "./rules/whole-pixels.js";
import steppedMotion from "./rules/stepped-motion.js";
import knownTokens from "./rules/known-tokens.js";

export default [noRawColor, wholePixels, steppedMotion, knownTokens];
