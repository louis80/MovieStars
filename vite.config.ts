/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // Installable app (spec AC10) that keeps working offline (AC9).
    VitePWA({
      // A new version installs in the background and is used from the next launch,
      // so an update never interrupts a session.
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icons/favicon-32.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "MovieStars",
        short_name: "MovieStars",
        description: "Put a name to every face on screen, a few faces a day.",
        lang: "en",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // The app shell, fonts and code are stored on install.
        globPatterns: ["**/*.{js,css,html,woff2,png,svg}"],
        // Latin letters (with accents) are stored; other scripts load when online.
        globIgnores: ["**/inter-cyrillic*", "**/inter-greek*", "**/inter-vietnamese*"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // Photos and posters of people already seen stay available offline.
            urlPattern: ({ url }) => url.origin === "https://image.tmdb.org",
            handler: "CacheFirst",
            options: {
              cacheName: "tmdb-images",
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
