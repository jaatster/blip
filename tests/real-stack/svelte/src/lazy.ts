// A dialog whose element is defined only after the app has mounted (a module loaded later, a split route), bound
// as the start page says (?bind=docs: open || undefined) or straight to the boolean (?bind=plain).
import { mount } from "svelte";
import Lazy from "./Lazy.svelte";
import "./app.css";

mount(Lazy, { target: document.getElementById("app")!, props: { bind: new URLSearchParams(location.search).get("bind") ?? "docs" } });
setTimeout(() => import("@blip/elements/dialog").then(() => document.documentElement.setAttribute("data-defined", "")), 200);
