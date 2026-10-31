import { addons } from "storybook/manager-api";
import { blip } from "./theme";

addons.setConfig({
  theme: blip,
  sidebar: { showRoots: true },
  toolbar: { zoom: { hidden: false } },
});
