/**
 * Lints the packages' CSS with Blip's own rules (packages/stylelint-config).
 *
 *   pnpm lint:css
 *
 * Every stylelint-disable comment needs a reason after "--" (a documented exception), and one that no longer
 * hides anything is reported.
 */
export default {
  extends: ["./packages/stylelint-config/index.js"],
  reportDescriptionlessDisables: true,
  reportNeedlessDisables: true,
  reportInvalidScopeDisables: true,
  rules: {
    "blip/no-raw-color": [
      true,
      {
        // Mask layers carry only alpha. Besides the box's shapes, --_g is the glyph mask of the components
        // (AUTHORING rule 9), set in each component and applied by _control.css, _choice.css, stat.css and window.css.
        maskProperties: ["/^--blip-shape(?:-\\d+)?(?:-inner)?$/", "--_g"],
      },
    ],
  },
};
