import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA setup.
// The service worker caches the APP SHELL (html, js, css, icons) plus
// OpenStreetMap map tiles (for the offline map).
// API calls (/sync, /sos, ...) must never be cached: they are excluded from the
// navigation fallback and have no runtime caching rule.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png',
        'icons/apple-touch-icon.png',
      ],
      // The manifest is a hand-written file: public/manifest.webmanifest,
      // linked from index.html. Do not generate a second one here.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/sync/,
          /^\/sos/,
          /^\/users/,
          /^\/trip/,
          /^\/alerts/,
          /^\/patrol-units/,
          /^\/sms/,
          /^\/demo/,
        ],
        runtimeCaching: [
          {
            // Map tiles only. Must match the host in VITE_TILE_URL.
            urlPattern: ({ url }) => url.hostname.endsWith('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
});