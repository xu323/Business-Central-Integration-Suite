import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-radix": [
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-tooltip",
          ],
          "vendor-i18n": [
            "i18next",
            "i18next-browser-languagedetector",
            "react-i18next",
            "date-fns",
          ],
          "vendor-charts": ["recharts"],
          "vendor-table": [
            "@tanstack/react-table",
            "react-hook-form",
            "@hookform/resolvers",
            "zod",
            "react-number-format",
            "cmdk",
          ],
          // Heavy export libs are only needed when the user clicks Export.
          "vendor-export": ["xlsx", "jspdf", "jspdf-autotable"],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      "/health": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
