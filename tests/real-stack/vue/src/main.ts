// The start page's main.ts: define the elements, then mount (and the CSS, as Vite's template imports it).
import "@blip/elements/dialog";
import "@blip/elements/tabs";
import "@blip/elements/combobox";
import "@blip/elements/field";
import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";

createApp(App).mount("#app");
