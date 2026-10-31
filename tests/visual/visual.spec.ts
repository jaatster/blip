/**
 * Every example in Day, Sunset and Night at 1280 wide, and the ones that change on a phone at 390 wide, compared
 * pixel for pixel with the baselines in __screenshots__/<platform>/<package>/<example>-<scheme>-<width>.png.
 */
import { test, expect } from "@playwright/test";
import { examples, RESPONSIVE, id } from "../page/manifest.js";
import { openExample, type Scheme } from "../page/open.js";

const SCHEMES: Scheme[] = ["day", "sunset", "night"];
const WIDTHS = [
  { width: 1280, height: 720, only: () => true },
  { width: 390, height: 844, only: (name: string) => RESPONSIVE.includes(name) },
];

for (const { width, height, only } of WIDTHS) {
  test.describe(`${width} wide`, () => {
    test.use({ viewport: { width, height } });
    for (const example of examples.filter((e) => only(e.name))) {
      for (const scheme of SCHEMES) {
        test(`${id(example)} ${scheme} ${width}`, async ({ page }) => {
          await openExample(page, example, scheme);
          await expect(page).toHaveScreenshot([example.pkg, `${example.name}-${scheme}-${width}.png`], { fullPage: true });
        });
      }
    }
  });
}

test("every responsive example exists", () => {
  for (const name of RESPONSIVE) expect(examples.some((e) => e.name === name), `no example named ${name}`).toBe(true);
});
