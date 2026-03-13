import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const BUILD_TIMESTAMP = Date.now();
const BUILD_ID = String(BUILD_TIMESTAMP);
const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: NO_CACHE_HEADERS,
  },
  // Inject build timestamp for dynamic versioning
  define: {
    __BUILD_TIMESTAMP__: BUILD_TIMESTAMP,
  },
  // Force cache busting on builds
  build: {
    rollupOptions: {
      output: {
        // Add hash to all chunk filenames for cache busting
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: "html-build-id",
      transformIndexHtml(html: string) {
        return html.replace("__BUILD_ID__", BUILD_ID);
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Avoid multiple React copies which can break hooks (useEffect dispatcher null)
    dedupe: ["react", "react-dom"],
  },
}));
