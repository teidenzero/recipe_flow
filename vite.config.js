import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/recipe_flow/",
  plugins: [react()],
  root: "./",
  css: {
    postcss: "./postcss.config.js",
  },
});
