// As the start page says for Vue and Svelte: define the elements, then mount (and the CSS, as Vite's template
// imports it).
import "@jaatster/blip-elements/dialog";
import "@jaatster/blip-elements/tabs";
import "@jaatster/blip-elements/combobox";
import "@jaatster/blip-elements/field";
import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";

mount(App, { target: document.getElementById("app")! });
