import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const plugins = [
  react(),
  tailwindcss(),
  VitePWA({
    registerType: "autoUpdate",
    injectRegister: "auto",
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
      // tRPC istekleri ASLA cache'lenmesin
      navigateFallbackDenylist: [/^\/api/, /^\/trpc/],
      runtimeCaching: [
        {
          // HTML navigation requests: prefer fresh network so a new
          // deploy doesn't leave clients pinned to an old shell.
          // 3 s timeout falls back to cache when offline.
          urlPattern: ({ request }) => request.mode === "navigate",
          handler: "NetworkFirst",
          options: {
            cacheName: "html-pages",
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 20, maxAgeSeconds: 86400 },
          },
        },
        {
          // Hashed JS/CSS/woff2 chunks under /assets. SWR lets clients
          // boot from cache when a chunk request fails (eliminates the
          // transient ERR_FAILED we were seeing on flaky networks).
          urlPattern: /\/assets\/.*\.(js|css|woff2)$/,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "static-assets",
            expiration: { maxEntries: 60, maxAgeSeconds: 86400 * 30 },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com/,
          handler: "StaleWhileRevalidate",
          options: { cacheName: "google-fonts" },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com/,
          handler: "CacheFirst",
          options: {
            cacheName: "gstatic-fonts",
            expiration: { maxAgeSeconds: 31536000 },
          },
        },
        // tRPC için runtime cache YOK → default network-first.
      ],
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
    },
    manifest: {
      name: "Viyana Bütçe Planlayıcı",
      short_name: "Viyana Bütçe",
      description: "Aile bütçe takip uygulaması",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      theme_color: "#3B82F6",
      background_color: "#0A0A0A",
      lang: "tr",
      categories: ["finance", "productivity"],
      icons: [
        {
          src: "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/icon-512-maskable.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/icons/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
          purpose: "any",
        },
      ],
    },
    devOptions: {
      enabled: false,
    },
  }),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
