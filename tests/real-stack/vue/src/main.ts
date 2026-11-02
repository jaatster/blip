// The start page's main.ts: define the elements, then mount (and the CSS, as Vite's template imports it).
import "@jaatster/blip-elements/dialog";
import "@jaatster/blip-elements/tabs";
import "@jaatster/blip-elements/combobox";
import "@jaatster/blip-elements/field";
import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";

createApp(App).mount("#app");
