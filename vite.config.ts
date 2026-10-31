import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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

// https://vitejs.dev/config/
export default defineConfig(() => ({
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
      // segunda página: o player das telas novas (examidia.com.br/tela/), leve e separado do site
      input: {
        main: path.resolve(__dirname, "index.html"),
        tela: path.resolve(__dirname, "tela/index.html"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  plugins: [
    react(),
    {
      name: "static-pages",
      configureServer(server: any) {
        server.middlewares.use((req: any, _res: any, next: any) => {
          if (req.url === "/proposta-jorbel" || req.url === "/proposta-jorbel/") {
            req.url = "/proposta-jorbel/index.html";
          }
          if (req.url === "/tela" || req.url?.startsWith("/tela?") || req.url?.startsWith("/tela/?") || req.url === "/tela/") {
            req.url = "/tela/index.html" + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "");
          }
          if (req.url === "/midiakit-sindicos" || req.url === "/midiakit-sindicos/") {
            req.url = "/midiakit-sindicos/index.html";
          }
          next();
        });
      },
    },
    {
      name: "html-build-id",
      transformIndexHtml(html: string) {
        return html.split("__BUILD_ID__").join(BUILD_ID);
      },
      // versão publicada, lida pelo próprio site (mesma origem): o aparelho só recarrega se a página
      // aberta for mais velha que a publicada. Antes comparava com a função get-app-version, que
      // ninguém atualizava (parada em abril) → o app recarregava em toda abertura e a cada 5 min.
      generateBundle(this: any) {
        this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ version: BUILD_ID }) });
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
