import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  // Read the repo-root `.env` instead of a per-app copy. Only `VITE_*`
  // variables are exposed to the bundle, so sharing the file with the server
  // does not leak DATABASE_URL or BETTER_AUTH_SECRET into the browser.
  envDir: fileURLToPath(new URL("../..", import.meta.url)),
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/pages",
      routeToken: "_layout",
    }),
    viteReact(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "Mumzo",
        short_name: "Mumzo",
        description:
          "Mumzo — the deepest shelf for the tiniest humans. Quick commerce for moms & babies. Launching in Hyderabad",
        theme_color: "#C85277",
        background_color: "#FEF8F5",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        navigateFallback: "/index.html",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    // Allow HTTPS tunnel hosts such as ngrok during local OAuth/MCP testing.
    allowedHosts: true,
    port: 3001,
    proxy: {
      // Keep browser requests same-origin during local MCP/OAuth testing.
      // The frontend ngrok host serves /api and forwards it to the local backend.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
