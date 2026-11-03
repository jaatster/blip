/**
 * Storybook's own UI in Blip: ink outlines and text, the Day scheme's pastel page, candy blue for what is
 * selected, and the brand title set in Pixel Bop (loaded by manager-head.html). Colours are the tokens' values
 * (@jaatster/blip-tokens), copied here because the manager cannot read CSS custom properties.
 */
import { create } from "storybook/theming/create";

const ink = "#1A1530"; // ink
const inkSoft = "#4A4470"; // ink-soft, text-muted
const page = "#F4F7FF"; // day bg
const sunken = "#E0E8FF"; // day surface-sunken
const lineSoft = "#B9B6EA"; // day line-soft
const blue = "#33A3FF"; // candy-blue, the day accent
const blueText = "#1660B8"; // accent-text
const pink = "#FF5FA2"; // candy-pink

export const blip = create({
  base: "light",
  brandTitle: `<span style="display:inline-flex;align-items:baseline;gap:6px;font-family:'Pixel Bop',system-ui,sans-serif;font-size:20px;line-height:1;letter-spacing:0;color:${ink};-webkit-font-smoothing:none;font-smooth:never">PIXEL<span style="color:${pink};text-shadow:2px 2px 0 ${ink}">POP</span></span>`,
  brandTarget: "_self",

  colorPrimary: pink,
  // The selected row in the sidebar: white text on it, so the darker accent text blue (5.9:1), not the candy.
  colorSecondary: blueText,

  appBg: page,
  appContentBg: "#FFFFFF",
  appPreviewBg: page,
  appHoverBg: sunken,
  appBorderColor: lineSoft,
  appBorderRadius: 4,

  fontBase: "'Pixel Operator', 'Pixelify Sans', system-ui, sans-serif",
  fontCode: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",

  textColor: ink,
  textInverseColor: "#FFFFFF",
  textMutedColor: inkSoft,

  barBg: "#FFFFFF",
  barTextColor: inkSoft,
  barHoverColor: blueText,
  barSelectedColor: blueText,

  buttonBg: "#FFFFFF",
  buttonBorder: ink,
  booleanBg: sunken,
  booleanSelectedBg: blue,

  inputBg: "#FFFFFF",
  inputBorder: ink,
  inputTextColor: ink,
  inputBorderRadius: 4,
});
