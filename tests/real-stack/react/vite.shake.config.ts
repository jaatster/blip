// One page per build (SHAKE=plain, button or tabs), so each page's JavaScript is measured on its own.
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const page = process.env.SHAKE ?? "button";

export default defineConfig({
  plugins: [react()],
  root: "shake",
  logLevel: "warn",
  build: { outDir: `../dist-shake/${page}`, emptyOutDir: true, rolldownOptions: { input: `shake/${page}.html` } },
});
