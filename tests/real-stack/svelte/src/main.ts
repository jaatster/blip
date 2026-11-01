// As the start page says for Vue and Svelte: define the elements, then mount (and the CSS, as Vite's template
// imports it).
import "@blip/elements/dialog";
import "@blip/elements/tabs";
import "@blip/elements/combobox";
import "@blip/elements/field";
import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";

mount(App, { target: document.getElementById("app")! });
