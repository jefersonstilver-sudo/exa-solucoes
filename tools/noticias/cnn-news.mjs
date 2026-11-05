/**
 * EXA Notícias Brasil — DOOH EXA Mídia (layout 2026-10-23)
 * Fonte: cnnbrasil.com.br (manchete, resumo e foto da matéria; crédito "CNN Brasil" na tela; QR leva à matéria)
 * Fluxo: scrape da home → filtro editorial → detalhes de cada matéria → imagens → HTML (canvas) → MP4 → publica
 * Padrão: 50 s, 5 notícias, formato das telas (exa-noticias-layout.mjs). .env opcional: BRASIL_DURACAO, BRASIL_NOTICIAS
 * Se a publicação falhar, tenta uma versão curta (35 s, 3 notícias). Versão anterior: cnn-news-v1-antigo.mjs
 */
import "dotenv/config";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { salvarStatus, carimbo, arquivarVideo } from "./status.mjs";
import { registrarResumo } from "./registrar-resumo.mjs";
import { filtrarPublicidade } from "./filtro-editorial.mjs";
import { montarHTML } from "./exa-noticias-layout.mjs";
import { OUTPUT_DIR, UA, criarLog, abrirNavegador, baixarImagens, gravarComRetentativa, publicarVideo, sleep } from "./exa-render.mjs";

const log = criarLog("BRASIL");
const ORDER_NOTICIAS = process.env.EXA_ORDER_ID || "c08f3154-e0dc-4c39-b8a2-721d8acdde7f";
const DURACAO = Number(process.env.BRASIL_DURACAO || 50);
const QTD = Number(process.env.BRASIL_NOTICIAS || 5);

// Tela de condomínio: sem culinária, sem violência pesada, sem política partidária/eleitoral, sem fofoca.
const BLOCKED_WORDS = [
  "pudim", "receita", "receitas", "culinária", "culinaria", "gastronômic", "sobremesa", "bolo ", "bolo de", "doce de", "torta", "brigadeiro",
  "chef ", "cozinha", "buffet", "bufê", "ingrediente", "confeitaria", "restaurante", "comida", "lanche", "vinho", "cerveja", "drinks",
  "/gastronomia/", "/receitas/", "/receita/",
  "estupro", "estuprada", "estuprador", "abuso sexual", "violência sexual", "assassinado", "assassinato", "homicídio", "feminicídio",
  "pedofilia", "pedófilo", "pornografia", "aborto", "corpo em", "corpos", "cadáver", "esquartej", "chacina",
  "lula", "bolsonaro", "pt ", " pt", "petista", "bolsonarista", "candidato", "candidata", "eleitor", "pesquisa eleitoral", "compra de votos",
];
const CATS_BLOQUEADAS = ["autor", "ao-vivo", "videos", "blogs", "colunas", "tabela", "eleicoes", "politica", "pop", "style", "bbb", "horoscopo"];
const CATEGORY_LABELS = {
  economia: "ECONOMIA", macroeconomia: "ECONOMIA", investimentos: "ECONOMIA", negocios: "NEGÓCIOS", "minhas-financas": "SEU BOLSO",
  internacional: "MUNDO", saude: "SAÚDE", tecnologia: "TECNOLOGIA", esportes: "ESPORTES", entretenimento: "CULTURA",
  nacional: "BRASIL", educacao: "EDUCAÇÃO", viagemegastronomia: "VIAGEM", viagem: "VIAGEM", auto: "AUTO", ciencia: "CIÊNCIA",
  "meio-ambiente": "MEIO AMBIENTE", lifestyle: "BEM-ESTAR",
};
const rotulo = cat => CATEGORY_LABELS[cat] || "BRASIL";

async function buscarNoticiasCNN() {
  log("Buscando notícias de cnnbrasil.com.br...");
  const browser = await abrirNavegador(log);
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.goto("https://www.cnnbrasil.com.br/", { waitUntil: "networkidle2", timeout: 45000 });
  try { await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "OK"); if (b) b.click(); }); await sleep(800); } catch {}
  await page.evaluate(() => window.scrollBy(0, 3000)); await sleep(2000);
  const lista = await page.evaluate(() => {
    const out = [], seen = new Set();
    document.querySelectorAll("a").forEach(a => {
      const href = a.href; if (!href.includes("cnnbrasil.com.br/") || href.includes("stories.cnn") || seen.has(href)) return;
      const img = a.querySelector("img"); if (!img) return;
      let title = ((a.querySelector("h2, h3, h4") || {}).textContent || a.getAttribute("title") || "").trim(); if (title.length < 20) return;
      const m = href.match(/cnnbrasil\.com\.br\/(?:economia\/money\/)?([^\/]+)\/(?:([^\/]+)\/)?/);
      seen.add(href); out.push({ url: href, title, cat: m?.[1] || "", sub: m?.[2] || "", imgSrc: img.src || img.dataset.src || "" });
    });
    return out;
  });
  await browser.close();
  log(`${lista.length} notícias encontradas`);
  const ok = lista.filter(n => {
    if (CATS_BLOQUEADAS.includes(n.cat)) return false;
    if (n.cat === "viagemegastronomia" && n.sub !== "viagem") return false; // só viagem; gastronomia nunca
    const t = `${n.title} ${n.url}`.toLowerCase(); return !BLOCKED_WORDS.some(w => t.includes(w));
  });
  log(`${ok.length} após filtro editorial`);
  return ok;
}

/** og:title / og:description / data / og:image de cada matéria (mais confiável que a home). */
async function detalhes(n) {
  try {
    const html = await (await fetch(n.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) })).text();
    const meta = p => (html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]+content=["']([^"']*)["']`, "i")) ||
                       html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${p}["']`, "i")) || [])[1] || "";
    const dec = s => s.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const t = dec(meta("og:title")).replace(/\s*\|\s*CNN Brasil.*$/i, "").trim(); if (t.length > 15) n.title = t;
    n.descricao = dec(meta("og:description"));
    n.publicado = meta("article:published_time") || null;
    const img = dec(meta("og:image")); if (img) n.imgSrc = img;
  } catch (e) { log(`  detalhes falharam (${n.url.slice(-50)}): ${e.message}`); }
  if (n.imgSrc) n.imgSrc = n.imgSrc.replace(/\?w=\d+(&|&amp;)h=\d+/, "?w=1280&h=720").replace(/&amp;/g, "&");
  return n;
}

function escolher(lista, qtd) {
  const sel = [], usadas = new Set();
  for (const n of lista) { if (sel.length >= qtd) break; if (!usadas.has(n.cat)) { sel.push(n); usadas.add(n.cat); } }
  for (const n of lista) { if (sel.length >= qtd) break; if (!sel.includes(n)) sel.push(n); }
  return sel;
}

async function episodio(itens, resto, dur, nome) {
  const ticker = resto.slice(0, 4).map(n => n.title).join("   •   ") || "Notícias completas em cnnbrasil.com.br";
  const html = montarHTML({ tema: "brasil", dur, data: new Date(), ticker,
    noticias: itens.map(n => ({ titulo: n.title, url: n.url, descricao: n.descricao, publicado: n.publicado, imgBuffer: n.imgBuffer, cat: rotulo(n.cat === "economia" ? n.sub || n.cat : n.cat), fonte: "FONTE: CNN BRASIL" })) });
  const htmlPath = join(OUTPUT_DIR, `${nome}.html`); writeFileSync(htmlPath, html, "utf-8");
  const mp4 = join(OUTPUT_DIR, `${nome}.mp4`); await gravarComRetentativa(log, htmlPath, mp4, dur); return mp4;
}

async function main() {
  const inicio = new Date();
  salvarStatus("brasil", { iniciado_em: inicio.toISOString(), ok: false, etapa: "buscando noticias" });
  log("========================================");
  log("=== EXA NOTÍCIAS BRASIL (layout 2026) ===");
  log("========================================");
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const lista = await buscarNoticiasCNN();
  // EDIÇÃO ATUALIZADA: matérias da CNN que precisam entrar e abrir o vídeo (ex.: notícia urgente que não estava na home).
  // Uso: node cnn-news.mjs --incluir <url-cnn> [--incluir <url-cnn> ...]   (ou .env BRASIL_INCLUIR=url1,url2)
  const fixas = [];
  const argv = process.argv.slice(2);
  argv.forEach((a, i) => { if (a === "--incluir" && argv[i + 1]) fixas.push(argv[i + 1]); });
  (process.env.BRASIL_INCLUIR || "").split(",").map(s => s.trim()).filter(Boolean).forEach(u => fixas.push(u));
  for (const url of fixas.reverse()) {
    if (!/^https:\/\/www\.cnnbrasil\.com\.br\//.test(url)) { log(`  [FIXA] ignorada (não é da CNN Brasil): ${url}`); continue; }
    const m = url.match(/cnnbrasil\.com\.br\/(?:economia\/money\/)?([^\/]+)\/(?:([^\/]+)\/)?/);
    const ja = lista.findIndex(n => n.url.replace(/\/$/, "") === url.replace(/\/$/, ""));
    if (ja >= 0) lista.splice(ja, 1);
    lista.unshift({ url, title: "", cat: m?.[1] || "", sub: m?.[2] || "", imgSrc: "", fixa: true });
    log(`  [FIXA] abre o vídeo: ${url}`);
  }
  if (lista.length === 0) { log("ERRO: nenhuma notícia aproveitável"); process.exit(1); }
  const candidatas = [...lista.filter(n => n.fixa), ...escolher(lista.filter(n => !n.fixa), QTD + 8)];
  for (const n of candidatas) await detalhes(n);
  const semBloqueio = candidatas.filter(n => !BLOCKED_WORDS.some(w => `${n.title} ${n.descricao || ""}`.toLowerCase().includes(w)));
  // filtro anti-publicidade (regras fixas + Claude): nenhuma marca de não-anunciante vai ao ar
  const validas = await filtrarPublicidade(semBloqueio, log);
  if (validas.length < 3) { log(`ERRO: só ${validas.length} notícias aprovadas pelo filtro editorial — não publico (o vídeo anterior continua no ar).`); process.exit(3); }
  // 05/11/2026: a faixa de rodapé só usa matérias APROVADAS pelo filtro de propaganda (antes passava matéria barrada, ex.: Nissan Kicks)
  const itens = validas.slice(0, QTD), resto = validas.filter(n => !itens.includes(n));
  itens.forEach((n, i) => log(`  ${i + 1}. [${n.cat}] ${n.title}`));
  const bufs = await baixarImagens(log, itens.map(n => n.imgSrc));
  itens.forEach((n, i) => n.imgBuffer = bufs[i]);

  salvarStatus("brasil", { etapa: "gravando" });
  let mp4 = await episodio(itens, resto, DURACAO, "breaking-news");
  const titulo = `Notícias Brasil ${carimbo(inicio)}`;
  const arquivo = arquivarVideo(mp4, "noticias-brasil");
  salvarStatus("brasil", { etapa: "publicando", gerado_em: new Date().toISOString(), titulo, arquivo });
  let ok = publicarVideo(log, mp4, titulo, ORDER_NOTICIAS);
  if (!ok && DURACAO > 35) {
    log(`Publicação falhou com ${DURACAO} s — gerando versão curta (35 s, 3 notícias)...`);
    mp4 = await episodio(itens.slice(0, 3), resto, 35, "breaking-news-curto");
    ok = publicarVideo(log, mp4, titulo, ORDER_NOTICIAS);
  }
  salvarStatus("brasil", { ok, etapa: ok ? "concluido" : "falha na publicacao", publicado_em: ok ? new Date().toISOString() : null });
  if (!ok) { log("ERRO: publicação falhou"); process.exit(2); }
  await registrarResumo("brasil", titulo, itens.map(n => ({ titulo: n.title, url: n.url, cat: rotulo(n.cat === "economia" ? n.sub || n.cat : n.cat) })), log);
  log("=== NOTÍCIAS BRASIL CONCLUÍDO ===");
}

main().catch(err => {
  try { salvarStatus("brasil", { ok: false, etapa: "erro", erro: err.message, erro_em: new Date().toISOString() }); } catch {}
  log(`ERRO FATAL: ${err.message}`); console.error(err); process.exit(1);
});
