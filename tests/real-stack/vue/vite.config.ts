import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  // As the start page says: let Vue leave chu-* tags to the browser.
  plugins: [vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("chu-") } } })],
  build: { rolldownOptions: { input: ["index.html", "lazy.html"] } },
});
