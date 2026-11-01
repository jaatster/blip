import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { rolldownOptions: { input: ["index.html", "reversed.html", "own.html", "reference.html"] } },
});
