import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import crypto from "crypto";

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
    // player do /tela: no build normal o hls.js é import dinâmico; no legado (ver "tela-legado") vem em arquivo à parte
    __TELA_LEGADO__: false,
    __HLS_URL__: JSON.stringify(""),
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
    {
      // O /tela roda em TV box e player IPTV com o navegador do sistema parado no Chrome 5x–7x, que não
      // entende o JavaScript moderno do build normal (tela preta). Depois do build, gera o player de novo
      // em um único arquivo clássico rebaixado para o Chrome 51 (Android 7) e troca o <script type="module"> do /tela por ele.
      // Se algo der errado aqui, o /tela continua com o build normal (nunca quebra a publicação do site).
      name: "tela-legado",
      apply: "build" as const,
      async closeBundle() {
        const dist = path.resolve(__dirname, "dist");
        const html = path.join(dist, "tela", "index.html");
        if (!fs.existsSync(html) || process.env.EXA_TELA_LEGADO === "0") return;
        try {
          const { build } = await import("vite");
          // hls.js (só a câmera ao vivo usa) em arquivo ES5 à parte, carregado sob demanda
          const hlsFonte = fs.readFileSync(path.resolve(__dirname, "node_modules/hls.js/dist/hls.light.min.js"), "utf8");
          const hlsNome = `assets/tela-hls-${crypto.createHash("sha256").update(hlsFonte).digest("hex").slice(0, 10)}.js`;
          fs.writeFileSync(path.join(dist, hlsNome), hlsFonte);
          const saida: any = await build({
            configFile: false,
            logLevel: "warn",
            root: __dirname,
            publicDir: false,
            plugins: [react()],
            resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
            define: {
              "process.env.NODE_ENV": JSON.stringify("production"),
              __BUILD_TIMESTAMP__: BUILD_TIMESTAMP,
              __TELA_LEGADO__: true,
              __HLS_URL__: JSON.stringify("/" + hlsNome),
            },
            build: {
              write: false,
              target: ["chrome51"],
              cssTarget: ["chrome51"],
              minify: "esbuild",
              lib: { entry: path.resolve(__dirname, "src/tela/main.tsx"), formats: ["iife"], name: "ExaTelaPlayer", fileName: () => "tela-legado.js" },
              rollupOptions: { output: { inlineDynamicImports: true } },
            },
          });
          const itens: any[] = (Array.isArray(saida) ? saida : [saida]).flatMap((o: any) => o.output || []);
          const js = itens.find((o) => o.type === "chunk")?.code as string | undefined;
          const css = itens.filter((o) => o.type === "asset" && String(o.fileName).endsWith(".css")).map((o) => String(o.source)).join("\n");
          if (!js) throw new Error("sem código no build legado");
          const h = (t: string) => crypto.createHash("sha256").update(t).digest("hex").slice(0, 10);
          const jsNome = `assets/tela-legado-${h(js)}.js`;
          fs.writeFileSync(path.join(dist, jsNome), js);
          let tags = `<script defer src="/${jsNome}"></script>`;
          if (css) {
            const cssNome = `assets/tela-legado-${h(css)}.css`;
            fs.writeFileSync(path.join(dist, cssNome), css);
            tags = `<link rel="stylesheet" href="/${cssNome}">\n    ` + tags;
          }
          let pagina = fs.readFileSync(html, "utf8");
          pagina = pagina
            .replace(/\s*<script type="module"[^>]*><\/script>/g, "")
            .replace(/\s*<link rel="modulepreload"[^>]*>/g, "")
            .replace(/\s*<link rel="stylesheet" crossorigin href="\/assets\/[^"]+\.css">/g, "")
            .replace("</body>", `    ${tags}\n  </body>`);
          fs.writeFileSync(html, pagina);
          console.log(`[tela-legado] ${jsNome} (${Math.round(js.length / 1024)} KB)`);
        } catch (e) {
          console.warn("[tela-legado] mantendo o build normal do /tela:", (e as Error)?.message || e);
        }
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
