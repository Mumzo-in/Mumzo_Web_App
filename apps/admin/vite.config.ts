import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Read the repo-root `.env` instead of a per-app copy. Only `VITE_*`
  // variables are exposed to the bundle, so sharing the file with the server
  // does not leak DATABASE_URL or BETTER_AUTH_SECRET into the browser.
  envDir: path.resolve(import.meta.dirname, "../.."),
  server: {
    port: 3002,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/pages",
      routeToken: "_layout",
    }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Mumzo SuperAdmin",
        short_name: "Mumzo Admin",
        description: "Mumzo control panel — catalog, orders & ops",
        theme_color: "#1f1b3a",
      },
      pwaAssets: { disabled: false, config: true },
      devOptions: { enabled: true },
    }),
  ],
});
