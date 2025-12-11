import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // Inject build timestamp for dynamic versioning
  define: {
    __BUILD_TIMESTAMP__: Date.now(),
  },
  // Force cache busting on builds
  build: {
    rollupOptions: {
      output: {
        // Add hash to all chunk filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png', 'splash/*.png'],
      manifest: false, // Use external manifest file
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Force new SW to take control immediately
        sourcemap: false,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Exclude videos from precaching - they're too large
        globIgnores: ['**/*.{mp4,webm}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // Reduced to 10MB
        runtimeCaching: [
          {
            // Google Fonts - Cache First (long-lived)
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days (reduced from 1 year)
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Critical data - NEVER cache (always from network)
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*\/(pedidos|log_pagamento|notifications|parcelas|contratos).*/i,
            handler: 'NetworkOnly'
          },
          {
            // API REST - Network first with short fallback
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 10 // Only 10 seconds cache!
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Edge functions - NEVER cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            // Storage media - Cache first but validate
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-media-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 // 1 day (reduced from 7)
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Static images - StaleWhileRevalidate for freshness
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days (reduced from 30)
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // HTML & JS - Always network first
            urlPattern: /\.(html|js|css)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 // Only 1 minute!
              }
            }
          }
        ],
        // Offline Fallback
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/supabase\//, /^\/functions\//]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
