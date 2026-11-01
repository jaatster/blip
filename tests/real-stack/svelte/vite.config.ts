import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

// Svelte needs no setting for blip-* tags.
export default defineConfig({
  plugins: [svelte()],
  build: { rolldownOptions: { input: ["index.html", "lazy.html"] } },
});
