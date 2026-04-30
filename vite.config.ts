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
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

// Editor-companion script tag (only injected in development).
// In production builds the placeholder is stripped, leaving zero traces in the HTML source.
const DEV_EDITOR_SCRIPT =
  '<script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>';
const DEV_EDITOR_PLACEHOLDER = "<!-- DEV_EDITOR_SCRIPT_PLACEHOLDER -->";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: NO_CACHE_HEADERS,
  },
  define: {
    __BUILD_TIMESTAMP__: BUILD_TIMESTAMP,
  },
  build: {
    rollupOptions: {
      output: {
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
      name: "html-build-id-and-editor",
      transformIndexHtml(html: string) {
        // Replace BUILD_ID placeholders.
        let out = html.split("__BUILD_ID__").join(BUILD_ID);
        // Inject editor companion script only in dev. In prod the placeholder comment is removed entirely.
        if (mode === "development") {
          out = out.replace(DEV_EDITOR_PLACEHOLDER, DEV_EDITOR_SCRIPT);
        } else {
          out = out.replace(DEV_EDITOR_PLACEHOLDER, "");
        }
        return out;
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
