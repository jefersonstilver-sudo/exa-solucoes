/**
 * EXA Notícias Foz do Iguaçu — LAYOUT OFICIAL (aprovado em 26/10/2026, "v5")
 * Fonte: foz.portaldacidade.com (parceria EXA × Portal da Cidade)
 *
 * Fluxo: home do Portal → detalhes de cada matéria (título, foto, data, texto) → filtros
 *        (política, culinária/violência, mais de 36 h, anti-publicidade com Claude) → Claude escreve
 *        palavra de impacto, chip, manchete, 2 pontos e cores do assunto → fotos → HTML (foz-layout/)
 *        → quadros (puppeteer) → MP4 1080×890 (yuv420p, faixa de TV) → publica no pedido Notícias Foz.
 *
 * Layout: 50 s · abertura FOZ HOJE + data grande + logos EXA/Portal · até 6 notícias (~7,3 s cada:
 *         foto cheia + palavra → layout editorial com "O QUE SABER", QR e logo do Portal) · encerramento.
 *
 * Uso:  node foz-news.mjs            (gera e publica)
 *       node foz-news.mjs --teste    (gera o vídeo e NÃO publica — para conferir)
 * .env: EXA_ORDER_FOZ, ANTHROPIC_API_KEY, CLAUDE_MODEL (opcional), FOZ_NOTICIAS (padrão 6)
 * Versões anteriores: foz-news-com-filtro-v2.mjs, foz-news-antes-filtro.mjs, foz-news-v1-antigo.mjs
 */
import "dotenv/config";
import puppeteer from "puppeteer";
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { salvarStatus, carimbo, arquivarVideo } from "./status.mjs";
import { filtrarPublicidade } from "./filtro-editorial.mjs";
import { registrarResumo } from "./registrar-resumo.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "output");
const FRAMES_DIR = join(OUTPUT_DIR, "_frames");
const LAYOUT = join(__dirname, "foz-layout");
const ASSETS = join(__dirname, "assets");
const ORDER_FOZ = process.env.EXA_ORDER_FOZ || "9cb8da99-ddb3-491c-b58c-63871eadc4cb";
const QTD = Math.min(6, Number(process.env.FOZ_NOTICIAS || 6));
let DUR = 50; const FPS = 30, W = 1080, H = 890; // DUR cai para ~7,3 s por notícia quando há menos de 6 (01/11)
const TESTE = process.argv.includes("--teste");
const MODELO = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const FFMPEG_WINGET = "C:/Users/jefer/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe";
const FFMPEG = existsSync(FFMPEG_WINGET) ? FFMPEG_WINGET : "ffmpeg";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const BASE = "https://foz.portaldacidade.com";

const BLOCKED_WORDS = [
  "pudim", "receita", "receitas", "culinária", "culinaria", "gastronomia", "gastronômic", "sobremesa", "bolo ", "bolo de", "doce de",
  "torta", "brigadeiro", "chef ", "cozinha", "prato ", "pratos", "ingrediente", "confeitaria", "restaurante", "comida", "lanche",
  "almoço", "jantar", "café da manhã", "vinho", "cerveja", "drinks", "buffet", "bufê",
  "estupro", "estuprada", "estuprador", "abuso sexual", "violência sexual", "assassinado", "assassinato", "homicídio", "feminicídio",
  "pedofilia", "pedófilo", "pornografia",
  "lula", "bolsonaro", "petista", "bolsonarista", "compra de votos", "candidato", "candidata", "eleições", "eleição", "eleitor",
];
const CATS_FORA = ["/politica/"]; // política fica de fora do Notícias Foz

function log(msg) {
  const line = `[${new Date().toLocaleString("pt-BR")}] [FOZ] ${msg}`;
  console.log(line);
  try { appendFileSync(join(__dirname, "daily-dooh.log"), line + "\n", "utf-8"); } catch {}
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 2026-11-01 (CEO): o Notícias Foz NUNCA fica com a data velha. Guardamos o que já foi ao ar (7 dias) e a última
// edição completa (textos + fotos). Prioridade: notícia nova que ainda não passou → notícia recente que já passou
// → repetir a última edição só para completar. Com isso, todo dia sai um vídeo com a data do dia.
const HIST = join(OUTPUT_DIR, "_foz-historico.json");
const ULTIMA = join(OUTPUT_DIR, "_foz-ultima-edicao.json");
const lerJSON = (f, pad) => { try { return JSON.parse(readFileSync(f, "utf-8")); } catch { return pad; } };
function jaExibidas() { const h = lerJSON(HIST, []); const lim = Date.now() - 7 * 86400e3; return new Set(h.filter(x => Date.parse(x.em) > lim).map(x => x.url)); }
function registrarExibidas(itens) {
  const lim = Date.now() - 7 * 86400e3; const h = lerJSON(HIST, []).filter(x => Date.parse(x.em) > lim);
  for (const n of itens) h.push({ url: n.url, titulo: n.titulo, em: new Date().toISOString() });
  try { writeFileSync(HIST, JSON.stringify(h, null, 1), "utf-8"); } catch (e) { log(`  aviso: histórico não gravado (${e.message})`); }
}
const dec = s => (s || "").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
const esc = s => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const corta = (s, n) => (s || "").length <= n ? (s || "") : s.slice(0, n).replace(/\s+\S*$/, "") + "…";

async function abrirNavegador(extra = []) {
  const args = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run", "--no-default-browser-check", ...extra];
  for (let t = 1; t <= 4; t++) {
    try { const o = { headless: "new", args, protocolTimeout: 180000 }; if (t === 4) o.channel = "chrome"; return await puppeteer.launch(o); }
    catch (e) { log(`  Chrome não abriu (tentativa ${t}/4): ${String(e.message).split("\n")[0]}`); if (t === 4) throw e; await sleep(20000 * t); }
  }
}

// ---------------- 1. notícias do Portal ----------------
async function listaDaHome(page) {
  log("Buscando notícias de foz.portaldacidade.com (navegador)...");
  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => window.scrollBy(0, 2500)); await sleep(1500);
  const out = await page.evaluate(() => {
    const vistos = new Set(), r = [];
    document.querySelectorAll('a[href*="/noticias/"]').forEach(a => {
      const url = a.href.split(/[?#]/)[0];
      if (vistos.has(url) || url.split("/").length < 6) return;
      const t = (a.querySelector("h2,h3,.title,p") || a).textContent.trim();
      if (t.length < 20) return; vistos.add(url); r.push({ url });
    });
    return r;
  });
  log(`${out.length} links de notícias na home`);
  return out.slice(0, 24);
}

async function detalhes(page, n) {
  try {
    await page.goto(n.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    const d = await page.evaluate(() => {
      const meta = p => (document.querySelector(`meta[property="${p}"],meta[name="${p}"]`) || {}).content || "";
      let pub = meta("article:published_time");
      for (const s of document.querySelectorAll('script[type="application/ld+json"]')) { const m = s.textContent.match(/"datePublished"\s*:\s*"([^"]+)"/); if (m) { pub = m[1]; break; } }
      if (!pub) { const t = document.querySelector("time[datetime]"); if (t) pub = t.getAttribute("datetime"); }
      const ps = [...document.querySelectorAll("p")].map(p => p.textContent.replace(/\s+/g, " ").trim()).filter(t => t.length > 60 && !/^Publicado em/i.test(t) && !/^Home /.test(t)).slice(0, 8);
      const marc = (document.body.innerText.match(/[^\n]{0,60}(conte[uú]do patrocinado|publieditorial|informe publicit[aá]rio|conte[uú]do de marca|patrocinado por|oferecido por)[^\n]{0,40}/gi) || []).slice(0, 3);
      return { title: meta("og:title") || document.title, descricao: meta("og:description"), img: meta("og:image"), publicado: pub || null, texto: ps.join("\n") + (marc.length ? "\n[MARCADORES NA PÁGINA: " + marc.join(" | ") + "]" : "") };
    });
    Object.assign(n, d);
    n.title = (n.title || "").replace(/\s*[-|]\s*Portal da Cidade.*$/i, "").trim();
  } catch (e) { log(`  detalhes falharam (${n.url.slice(-50)}): ${e.message}`); }
  return n;
}

// ---------------- 2. Claude: edição dos textos ----------------
const PROMPT_EDICAO = `Você é o editor do "Notícias Foz", vídeo mudo de 50 s exibido em telas de elevador de prédios residenciais de Foz do Iguaçu (EXA Mídia, em parceria com o Portal da Cidade).
Recebe notícias já aprovadas pelo filtro. Escolha as ${QTD} mais relevantes e úteis para o morador HOJE (prefira as mais recentes e de interesse da cidade; as marcadas "JÁ EXIBIDA EM EDIÇÃO ANTERIOR" só entram para completar, depois de todas as inéditas; evite duas sobre o mesmo assunto — se houver uma atualização, use só a mais nova). Nunca política.
Para cada escolhida escreva, em português do Brasil, SEM inventar nada além do texto da matéria e sem citar nacionalidade de suspeitos:
- "i": índice da notícia recebida
- "cat": editoria em MAIÚSCULAS, até 14 caracteres (ex.: CIDADE, ECONOMIA, ESPORTE, EDUCAÇÃO, MEIO AMBIENTE, SORTE, SAÚDE, TRÂNSITO)
- "palavra": palavra de impacto de 1 a 2 palavras, até 11 caracteres, terminando com "." ou "!" (ex.: "Vertedouro.", "R$ 5,60.", "Quina!", "Semifinal.")
- "chip": frase-resumo de até 48 caracteres
- "manchete": duas linhas separadas por "<br>", cada linha com até 28 caracteres
- "pontos": exatamente 2 frases com fatos concretos da matéria, cada uma com até 78 caracteres
- "tema": null, OU, só quando o assunto principal tem cores próprias muito conhecidas (ex.: Foz do Iguaçu FC "Azulão" = azul royal), {"chip":"#hex escuro","hl":"#hex claro legível com texto escuro"}
Entregue usando a ferramenta edicao_noticias_foz, na ordem em que devem aparecer (a 1ª é a mais forte e vira a capa). Prefira notícias de serviço e interesse da cidade; evite que mais da metade sejam crimes/polícia.`;

const FERRAMENTA_EDICAO = {
  name: "edicao_noticias_foz",
  description: "Entrega a edição das notícias escolhidas para o vídeo Notícias Foz, na ordem de exibição.",
  input_schema: { type: "object", required: ["itens"], properties: { itens: { type: "array", minItems: 3, maxItems: 6, items: {
    type: "object", required: ["i", "cat", "palavra", "chip", "manchete", "pontos"],
    properties: {
      i: { type: "integer", description: "índice da notícia recebida" },
      cat: { type: "string", description: "editoria em MAIÚSCULAS, até 14 caracteres" },
      palavra: { type: "string", description: "palavra de impacto, até 11 caracteres, termina com . ou !" },
      chip: { type: "string", description: "frase-resumo até 48 caracteres" },
      manchete: { type: "string", description: "duas linhas separadas por <br>, cada uma até 28 caracteres" },
      pontos: { type: "array", minItems: 2, maxItems: 2, items: { type: "string", description: "fato concreto até 78 caracteres" } },
      tema: { type: ["object", "null"], properties: { chip: { type: "string" }, hl: { type: "string" } } } } } } } },
};

export async function editarComClaude(lista) {
  const key = process.env.ANTHROPIC_API_KEY; if (!key) return null;
  const corpo = lista.map((n, i) => `### ${i}\nTÍTULO: ${n.title}\nDATA: ${n.publicado || "?"}${n.jaExibida ? "\nJÁ EXIBIDA EM EDIÇÃO ANTERIOR: sim" : ""}\nRESUMO: ${n.descricao || "-"}\nTEXTO:\n${(n.texto || "").slice(0, 2200)}`).join("\n\n");
  for (let t = 1; t <= 3; t++) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal: AbortSignal.timeout(150000),
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        // resposta estruturada (tool use): o Claude preenche o formulário, sem JSON em texto livre que pode quebrar
        body: JSON.stringify({ model: MODELO, max_tokens: 6000, system: PROMPT_EDICAO, messages: [{ role: "user", content: corpo }],
          tools: [FERRAMENTA_EDICAO], tool_choice: { type: "auto" } }) });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
      const j = await r.json();
      const uso = (j.content || []).find(c => c.type === "tool_use");
      let itens = uso?.input?.itens;
      if (!Array.isArray(itens)) { // plano B: JSON no texto
        const txt = (j.content || []).map(c => c.text || "").join("");
        try { itens = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1)).itens; } catch { itens = null; }
      }
      if (!Array.isArray(itens) || !itens.length) throw new Error(`resposta sem itens (stop_reason: ${j.stop_reason})`);
      return itens;
    } catch (e) { log(`  edição Claude falhou (tentativa ${t}/3): ${e.message}`); if (t === 3) return null; await sleep(5000); }
  }
}

export function edicaoSimples(lista) { // sem Claude: textos derivados do título e do texto
  return lista.slice(0, QTD).map((n, i) => {
    const frases = (n.texto || n.descricao || "").split(/(?<=[.!?])\s+/).filter(f => f.length > 30);
    const pal = n.title.split(/\s+/).find(w => w.length > 4) || "Foz";
    const t = corta(n.title, 56), meio = t.lastIndexOf(" ", Math.min(28, t.length));
    return { i, cat: "FOZ DO IGUAÇU", palavra: corta(pal, 10) + ".", chip: corta(n.title, 48), manchete: meio > 0 ? t.slice(0, meio) + "<br>" + t.slice(meio + 1) : t,
      pontos: [corta(frases[0] || n.descricao || "", 78), corta(frases[1] || "Leia a matéria completa no Portal da Cidade.", 78)], tema: null };
  });
}

// ---------------- 3. fotos ----------------
function fotoGrande(u) {
  const m = (u || "").match(/https:\/\/bucket\.portaldacidade\.com\/.+/);
  return m ? `https://image.portaldacidade.com/unsafe/1600x0/${m[0]}` : u;
}
async function baixarFoto(u) {
  for (let t = 1; t <= 2; t++) {
    try { const r = await fetch(fotoGrande(u), { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
      const b = Buffer.from(await r.arrayBuffer()); if (r.ok && b.length > 5000) return b; } catch {}
    await sleep(1500);
  }
  return null;
}
const mime = b => b[0] === 0x89 ? "image/png" : b[0] === 0x52 && b[8] === 0x57 ? "image/webp" : "image/jpeg";

// ---------------- 4. HTML do layout ----------------
const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export function montarHTML(news, imgs, assets = ASSETS, layout = LAYOUT, data = new Date()) {
  const b64 = f => readFileSync(f).toString("base64");
  const fontes = ["bsBl", "mrXb", "mrBd", "mrSb", "jbBd"].map(f => `@font-face{font-family:${f};src:url(data:font/woff;base64,${b64(join(assets, "fonts", f + ".woff"))})}`).join("");
  const IMG = { portal: "data:image/png;base64," + b64(join(assets, "portal-da-cidade.png")) };
  news.forEach((n, i) => { if (imgs[i]) { IMG["n" + i] = `data:${mime(imgs[i])};base64,` + imgs[i].toString("base64"); n.img = "n" + i; } else n.img = null; });
  const capa = news.find(n => n.img); IMG.capa = capa ? IMG[capa.img] : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontes}${readFileSync(join(layout, "estilo.css"), "utf-8")}</style></head><body><div id="stage"></div>
<script>window.NEWS=${JSON.stringify(news)};window.IMG=${JSON.stringify(IMG)};window.DUR_TOTAL=${DUR};window.DATA_TXT=${JSON.stringify(`${DIAS[data.getDay()]}, ${data.getDate()} de ${MESES[data.getMonth()]}`)};const LOGO=${readFileSync(join(assets, "exa-logo.json"), "utf-8")};</script>
<script>${readFileSync(join(assets, "qrcode-generator.js"), "utf-8")}</script><script>${readFileSync(join(layout, "cena.js"), "utf-8")}</script></body></html>`;
}

// ---------------- 5. gravação ----------------
function limparFrames() {
  if (!existsSync(FRAMES_DIR)) { mkdirSync(FRAMES_DIR, { recursive: true }); return; }
  for (const f of readdirSync(FRAMES_DIR)) if (/\.(png|jpg)$/.test(f)) unlinkSync(join(FRAMES_DIR, f));
}
async function gravar(htmlFile, mp4File) {
  const total = DUR * FPS; log(`Gravando ${mp4File} (${DUR}s, ${total} quadros, ${W}x${H})...`);
  limparFrames();
  const browser = await abrirNavegador(["--allow-file-access-from-files"]);
  try {
    const page = await browser.newPage(); await page.setViewport({ width: W, height: H });
    await page.goto(`file:///${htmlFile.replace(/\\/g, "/").replace(/^\/+/, "")}`, { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction("window.__ready === true", { timeout: 120000 }); await sleep(800);
    for (let i = 0; i < total; i++) {
      await page.evaluate(t => window.renderAt(t), i / FPS);
      await page.screenshot({ path: join(FRAMES_DIR, `frame-${String(i).padStart(5, "0")}.jpg`), type: "jpeg", quality: 92, clip: { x: 0, y: 0, width: W, height: H } });
      if (i % 150 === 0) log(`  Quadro ${i}/${total} (${Math.round(i / total * 100)}%)`);
    }
  } finally { await browser.close(); }
  log("Encodando MP4 (yuv420p, faixa de TV — formato seguro para os NUCs)...");
  execSync(`"${FFMPEG}" -y -framerate ${FPS} -i "${FRAMES_DIR}/frame-%05d.jpg" -vf "scale=${W}:${H}:in_range=full:out_range=tv,format=yuv420p" -color_range tv -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -movflags +faststart -an "${mp4File}"`, { stdio: "inherit", timeout: 900000 });
  log(`Vídeo salvo: ${mp4File}`);
}
async function gravarComRetentativa(html, mp4) {
  for (let t = 1; t <= 3; t++) { try { await gravar(html, mp4); return; } catch (e) { log(`ERRO na gravação (tentativa ${t}/3): ${e.message}`); await sleep(15000); } }
  throw new Error("Gravação falhou 3 vezes");
}
function publicarVideo(videoPath, titulo, orderId) {
  log(`Publicando: ${titulo}`);
  try {
    const output = execSync(`node "publish-video.mjs" "${videoPath}" "${titulo}" "${orderId}"`, {
      cwd: __dirname,
      encoding: "utf-8",
      timeout: 900000,
      maxBuffer: 10 * 1024 * 1024,
    });
    if (output) for (const line of output.trimEnd().split(/\r?\n/)) log(`[PUBLICADOR] ${line}`);
    return true;
  } catch (err) {
    const output = [err.stdout, err.stderr].filter(Boolean).join("\n");
    if (output) for (const line of output.trimEnd().split(/\r?\n/)) log(`[PUBLICADOR] ${line}`);
    log(`Erro publicação (status=${err.status ?? "indisponível"}, signal=${err.signal ?? "nenhum"}, timeout=${err.killed ? "sim" : "não"}): ${err.message}`);
    return false;
  }
}

// ---------------- main ----------------
async function main() {
  const inicio = new Date();
  salvarStatus("foz", { iniciado_em: inicio.toISOString(), ok: false, etapa: "buscando noticias", erro: null, erro_em: null });
  log("========================================");
  log(`=== EXA NOTÍCIAS FOZ — LAYOUT OFICIAL${TESTE ? " (TESTE — não publica)" : ""} ===`);
  log("========================================");
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const nav = await abrirNavegador(); let todas;
  try {
    const page = await nav.newPage(); await page.setUserAgent(UA);
    todas = await listaDaHome(page);
    todas = todas.filter(n => !CATS_FORA.some(c => n.url.includes(c)));
    for (const n of todas) await detalhes(page, n);
  } finally { await nav.close(); }
  const agora = Date.now();
  // 2026-11-01: em fim de semana/feriado o Portal publica pouco. Antes: só matérias de até 36 h → em 01/11 sobraram 2
  // e o Foz não subiu. Agora a janela abre aos poucos (36 h → 60 h → 96 h) até ter 6 notícias aprovadas (mínimo 3).
  const idadeH = n => n.publicado ? (agora - Date.parse(n.publicado)) / 3600e3 : 0;
  const base = todas.filter(n => n.title && n.img)
    .filter(n => !BLOCKED_WORDS.some(w => `${n.title} ${n.descricao || ""} ${n.url}`.toLowerCase().includes(w)))
    .filter(n => idadeH(n) < 96)
    .sort((a, b) => (Date.parse(b.publicado || 0) || 0) - (Date.parse(a.publicado || 0) || 0));
  log(`${base.length} notícias de até 96 h depois dos filtros fixos (${base.filter(n => idadeH(n) < 36).length} de até 36 h)`);
  const aprovadas = await filtrarPublicidade(base.slice(0, 18), log);
  for (const janela of [36, 60, 96]) {
    todas = aprovadas.filter(n => idadeH(n) < janela);
    if (todas.length >= QTD || janela === 96) { log(`Janela usada: até ${janela} h → ${todas.length} notícias aprovadas.`); break; }
  }
  // não exibidas primeiro (mais recentes antes); as que já passaram ficam no fim, só para completar
  const vistas = jaExibidas();
  todas.forEach(n => { n.jaExibida = vistas.has(n.url); });
  todas.sort((a, b) => (a.jaExibida - b.jaExibida) || ((Date.parse(b.publicado || 0) || 0) - (Date.parse(a.publicado || 0) || 0)));
  log(`Inéditas: ${todas.filter(n => !n.jaExibida).length} · já exibidas nos últimos 7 dias: ${todas.filter(n => n.jaExibida).length}`);

  let escolhidas = [], imgs = [];
  if (todas.length) {
    salvarStatus("foz", { etapa: "editando textos" });
    let ed = todas.length >= 3 ? await editarComClaude(todas) : null;
    if (!ed || !ed.length) { if (todas.length >= 3) log("  AVISO: usando edição simples (sem Claude)."); ed = edicaoSimples(todas); }
    escolhidas = ed.filter(e => todas[e.i]).slice(0, QTD).map(e => ({ jaExibida: !!todas[e.i].jaExibida, url: todas[e.i].url, foto: todas[e.i].img, titulo: todas[e.i].title, foco: null, lista: "", resumo: "",
    tema: e.tema && e.tema.chip && e.tema.hl ? { chip: e.tema.chip, hl: e.tema.hl } : null,
    palavra: esc(corta(e.palavra, 12)), chip: esc(corta(e.chip, 52)), cat: esc(corta((e.cat || "FOZ").toUpperCase(), 16)),
    manchete: (e.manchete || "").split(/<br\s*\/?>/i).map(l => esc(corta(l.trim(), 32))).slice(0, 2).join("<br>"),
    pontos: (e.pontos || []).slice(0, 2).map(p => esc(corta(p, 84))) }));
    log("Baixando fotos das matérias...");
    for (const n of escolhidas) { const b = await baixarFoto(n.foto); imgs.push(b); log(`  Foto ${imgs.length}: ${b ? b.length + " bytes" : "FALHOU (usa fundo azul)"}`); }
    escolhidas.forEach(n => { delete n.foto; });
  }
  // completa até 3 com a última edição (mesmos textos e fotos), sem repetir a mesma matéria
  if (escolhidas.length < 3) {
    const ult = lerJSON(ULTIMA, null);
    const reserva = (ult && Array.isArray(ult.itens) ? ult.itens : []).filter(x => !escolhidas.some(e => e.url === x.url));
    for (const x of reserva) { if (escolhidas.length >= 3) break; const { img64, ...item } = x; escolhidas.push(item); imgs.push(img64 ? Buffer.from(img64, "base64") : null); }
    if (reserva.length) log(`Pouca notícia nova hoje — completei com a edição anterior (${ult.titulo || "sem título"}). A data do vídeo é a de hoje.`);
  }
  if (!escolhidas.length) { log("ERRO: nenhuma notícia nova e nenhuma edição anterior guardada — não publico (o vídeo anterior continua no ar)."); process.exit(3); }
  escolhidas.forEach((n, i) => log(`  ${i + 1}. [${n.cat}] ${n.palavra} — ${n.titulo}${n.jaExibida ? " (já exibida)" : ""}`));

  DUR = escolhidas.length >= 6 ? 50 : Math.round(3.4 + 3.0 + escolhidas.length * 7.3);
  log(`Duração do vídeo: ${DUR} s (${escolhidas.length} notícia(s)).`);
  const htmlPath = join(OUTPUT_DIR, "foz-news.html"); writeFileSync(htmlPath, montarHTML(escolhidas, imgs), "utf-8");
  salvarStatus("foz", { etapa: "gravando" });
  const mp4 = join(OUTPUT_DIR, "foz-news.mp4");
  await gravarComRetentativa(htmlPath, mp4);
  const titulo = `Notícias Foz ${carimbo(inicio)}`;
  const arquivo = arquivarVideo(mp4, TESTE ? "noticias-foz-TESTE" : "noticias-foz");
  salvarStatus("foz", { etapa: TESTE ? "teste gerado" : "publicando", gerado_em: new Date().toISOString(), titulo, arquivo });
  if (TESTE) { log(`=== TESTE CONCLUÍDO — vídeo em ${arquivo} (não publicado) ===`); return; }
  const ok = publicarVideo(mp4, titulo, ORDER_FOZ);
  salvarStatus("foz", { ok, etapa: ok ? "concluido" : "falha na publicacao", publicado_em: ok ? new Date().toISOString() : null });
  if (!ok) { log("ERRO: publicação falhou"); process.exit(2); }
  registrarExibidas(escolhidas);
  try { writeFileSync(ULTIMA, JSON.stringify({ titulo, em: new Date().toISOString(), itens: escolhidas.map((n, i) => ({ ...n, img64: imgs[i] ? imgs[i].toString("base64") : null })) }), "utf-8"); }
  catch (e) { log(`  aviso: última edição não guardada (${e.message})`); }
  await registrarResumo("foz", titulo, escolhidas.map(n => ({ titulo: n.titulo, url: n.url, cat: n.cat })), log);
  log("=== EXA NOTÍCIAS FOZ CONCLUÍDO ===");
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("foz-news.mjs")) {
  main().catch(err => {
    try { salvarStatus("foz", { ok: false, etapa: "erro", erro: err.message, erro_em: new Date().toISOString() }); } catch {}
    log(`ERRO FATAL: ${err.message}`); console.error(err); process.exit(1);
  });
}
