import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "node:child_process": path.resolve(process.cwd(), "src/shims/child_process.ts"),
    },
  },
});
