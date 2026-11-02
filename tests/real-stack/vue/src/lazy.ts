// A dialog whose element is defined only after the app has mounted (a module loaded later, a split route), bound
// as the start page says (?bind=docs: open || undefined) or straight to the boolean (?bind=plain).
import { createApp } from "vue";
import Lazy from "./Lazy.vue";
import "./style.css";

createApp(Lazy, { bind: new URLSearchParams(location.search).get("bind") ?? "docs" }).mount("#app");
setTimeout(() => import("@jaatster/blip-elements/dialog").then(() => document.documentElement.setAttribute("data-defined", "")), 200);
