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
      // A réplica da tela do elevador (public/painel-web/ui, idêntica à dos NUCs) roda também na TV vertical do prédio
      // (APK, Chrome 7x). O código dos NUCs usa ?. / ?? (Chrome 80) e o CSS usa inset (87) e gap no flex (84): no TV box
      // o script dos vídeos e o dos avisos nem carregavam e o layout desmontava. Só na cópia publicada (dist):
      // JS rebaixado para o Chrome 51, CSS com inset expandido, compat/gap.js injetado e ?v= para não ficar em cache velho.
      name: "painel-web-legado",
      apply: "build" as const,
      async closeBundle() {
        const ui = path.resolve(__dirname, "dist", "painel-web", "ui");
        if (!fs.existsSync(ui) || process.env.EXA_PAINEL_LEGADO === "0") return;
        try {
          const esb: any = await import("esbuild");
          const v = BUILD_ID;
          const pastaJs = path.join(ui, "scripts");
          for (const f of fs.readdirSync(pastaJs).filter((x: string) => x.endsWith(".js"))) {
            const p = path.join(pastaJs, f);
            let fonte = fs.readFileSync(p, "utf8");
            if (f === "lives.js") {
              // só na cópia web (TV do prédio): com câmeras escolhidas para a TV, não soma as câmeras extras (Argentina,
              // Ponte da Integração). O NUC nunca recebe "escolhidas", então nele nada muda.
              const de = "if (Array.isArray(lista)) return comExtras(lista.filter(x => x && x.url));";
              if (fonte.includes(de)) fonte = fonte.replace(de, "if (Array.isArray(lista)) return (data && data.escolhidas) ? lista.filter(x => x && x.url) : comExtras(lista.filter(x => x && x.url));");
              else console.warn("[painel-web-legado] lives.js mudou: câmeras escolhidas da TV não aplicadas");
            }
            const r = await esb.transform(fonte, { loader: "js", target: "chrome51", charset: "utf8" });
            fs.writeFileSync(p, r.code);
          }
          for (const f of fs.readdirSync(ui).filter((x: string) => x.endsWith(".css"))) {
            const p = path.join(ui, f);
            const r = await esb.transform(fs.readFileSync(p, "utf8"), { loader: "css", target: "chrome74", charset: "utf8" });
            fs.writeFileSync(p, r.code);
          }
          for (const f of fs.readdirSync(ui).filter((x: string) => x.endsWith(".html"))) {
            const p = path.join(ui, f);
            let h = fs.readFileSync(p, "utf8");
            // scripts e estilos dentro do HTML
            const blocos: [string, string][] = [];
            for (const m of h.matchAll(/<script>([\s\S]*?)<\/script>/g)) blocos.push([m[0], "<script>" + (await esb.transform(m[1], { loader: "js", target: "chrome51", charset: "utf8" })).code + "</script>"]);
            for (const m of h.matchAll(/<style>([\s\S]*?)<\/style>/g)) blocos.push([m[0], "<style>" + (await esb.transform(m[1], { loader: "css", target: "chrome74", charset: "utf8" })).code + "</style>"]);
            for (const [a, b] of blocos) h = h.split(a).join(b);
            h = h.replace(/(<script src="\.\/scripts\/[^"?]+\.js)"/g, `$1?v=${v}"`).replace(/(<link rel="stylesheet" href="[^"?:]+\.css)"/g, `$1?v=${v}"`);
            h = h.replace("</body>", `  <script src="../compat/gap.js?v=${v}"></script>\n</body>`);
            // modo leve só na TV (?tela=1): tira animações contínuas e recorta a câmera (compat/tv.css)
            h = h.replace("</head>", `  <link rel="stylesheet" href="../compat/tv.css?v=${v}">\n  <script>if (/[?&]tela=1(&|$)/.test(location.search)) document.documentElement.className += " tv-leve";</script>\n  <script src="../compat/hora.js?v=${v}"></script>\n  <script src="../compat/tv.js?v=${v}"></script>\n</head>`);
            fs.writeFileSync(p, h);
          }
          console.log("[painel-web-legado] réplica rebaixada para TV box (Chrome 51+)");
        } catch (e) {
          console.warn("[painel-web-legado] mantendo os arquivos originais:", (e as Error)?.message || e);
        }
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
