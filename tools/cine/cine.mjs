/**
 * Cine Cataratas na NUVEM (GitHub Actions) — 05/11/2026
 * O site de ingressos (webcinecataratas.com) bloqueia servidores (Cloudflare). Então:
 *   filmes + cartazes  → cinecataratas.com.br/categoria-produto/em-cartaz/ (site do cinema, abre normal)
 *   classificação/formato → página de cada filme; se faltar, aproveita a semana anterior
 *   horários → o PC do escritório lê webcinecataratas.com toda quinta 14h e grava em cine_programacao (05/11/2026);
 *              com essa leitura da semana, filmes/cartazes/horários vêm DELA (o site de ingressos é a base).
 *              Sem ela: o vídeo mostra "SESSÕES E INGRESSOS NO QR" (QR rastreado CINE1).
 * Ambiente: CINE_ESPERAR_PC=<min> espera a leitura do PC chegar; CINE_REPESCAGEM=1 só publica se faltar algo.
 * Layout: V2 "Estreias em sequência" (aprovado pelo Cine em 04/11/2026), vertical 1080x1920, 15 s.
 * Publica no pedido do Cine + Hotel Cataratas trocando SÓ o vídeo do Cine (tools/noticias/publish-video.mjs).
 * Ambiente: NOTICIAS_PUBLICAR=0 só gera.
 */
import puppeteer from "puppeteer";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { generateVerticalHtml, saveVerticalHtml } from "./generate-vertical-v2.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "output"); mkdirSync(OUT, { recursive: true });
const FR = join(OUT, "_frames"); const FPS = 30, DUR = 15, W = 1080, H = 1920;
const PEDIDO = "b4b2f33a-d37d-40a8-98fb-77177fa0b35f";
const ANTERIOR = join(OUT, "_cine-semana-anterior.json"), SEMENTE = join(__dirname, "semana-anterior.json");
const log = m => console.log(`[cine] ${m}`);
const sleep = ms => new Promise(r => setTimeout(r, ms));
// mesmo filme com nome levemente diferente (ex.: "DO OUTRO LADO DAS REDES" → "O OUTRO LADO DAS REDES")
const PARADAS = new Set(["O", "A", "OS", "AS", "DO", "DA", "DOS", "DAS", "DE", "E", "UM", "UMA"]);
const fichas = t => new Set(norm(t).split(" ").filter(w => w && !PARADAS.has(w)));
function mesmoFilme(a, b) { const A = fichas(a), B = fichas(b); if (!A.size || !B.size) return norm(a) === norm(b);
  let i = 0; for (const x of A) if (B.has(x)) i++; return i / new Set([...A, ...B]).size >= 0.75; }
const norm = s => String(s || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[–—-]\s*PRE[- ]?ESTREIA/, "").replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

function semana() {
  const n = new Date(), d = n.getDay(), qui = new Date(n); qui.setDate(n.getDate() - (d >= 4 ? d - 4 : d + 3)); qui.setHours(0, 0, 0, 0);
  const prox = new Date(qui); prox.setDate(qui.getDate() + 7);
  const M = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"], p = x => String(x).padStart(2, "0");
  return { qui, rotulo: `qui${p(qui.getDate())}-qui${p(prox.getDate())}-${M[qui.getMonth()]}` };
}

async function buscarFilmes(browser) {
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36");
  await page.goto("https://cinecataratas.com.br/categoria-produto/em-cartaz/", { waitUntil: "networkidle2", timeout: 60000 });
  const lista = await page.evaluate(() => [...document.querySelectorAll("li.product, .products .product")].map(li => {
    const a = li.querySelector("a[href*='/produto/'], a.woocommerce-LoopProduct-link, a");
    const t = li.querySelector(".woocommerce-loop-product__title, h2, h3");
    const img = li.querySelector("img");
    let src = img ? (img.getAttribute("data-src") || img.currentSrc || img.src || "") : "";
    const ss = img ? (img.getAttribute("srcset") || "") : "";
    if (ss) { const maior = ss.split(",").map(x => x.trim().split(/\s+/)).sort((a, b) => parseInt(b[1]) - parseInt(a[1]))[0]; if (maior) src = maior[0]; }
    return { title: (t?.textContent || "").trim(), link: a?.href || "", thumb: src };
  }).filter(x => x.title));
  log(`${lista.length} filmes no site: ${lista.map(x => x.title).join(" | ")}`);
  const filmes = [];
  for (const f of lista) {
    let og = "", texto = "";
    try {
      await page.goto(f.link, { waitUntil: "domcontentloaded", timeout: 45000 });
      og = await page.$eval("meta[property='og:image']", e => e.content).catch(() => "");
      texto = await page.evaluate(() => (document.querySelector(".summary, .product, main") || document.body).innerText).catch(() => "");
    } catch (e) { log(`  página de "${f.title}" falhou: ${e.message}`); }
    const cartaz = (og || f.thumb).replace(/-\d+x\d+(\.\w+)$/, "$1");
    const mClass = texto.match(/classifica[çc][ãa]o[^\n:]*[:\s]+(livre|L|10|12|14|16|18)\b/i) || texto.match(/\b(10|12|14|16|18)\s*anos\b/i) || texto.match(/\b(livre)\b/i);
    const mDur = texto.match(/(\d{2,3})\s*min/i);
    filmes.push({ title: f.title, link: f.link, posterUrl: cartaz, rating: mClass ? (/livre|^L$/i.test(mClass[1]) ? "L" : mClass[1]) : "", duration: mDur ? mDur[1] + "min" : "", trecho: texto.slice(0, 400) });
  }
  // cartazes como data URI (o HTML é gravado offline)
  for (const f of filmes) {
    try {
      const r = await fetch(f.posterUrl, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000) });
      const b = Buffer.from(await r.arrayBuffer());
      if (!r.ok || b.length < 3000) throw new Error(`HTTP ${r.status} ${b.length}b`);
      const tipo = r.headers.get("content-type") || (/\.png$/i.test(f.posterUrl) ? "image/png" : /\.webp$/i.test(f.posterUrl) ? "image/webp" : "image/jpeg");
      f.poster = `data:${tipo};base64,${b.toString("base64")}`;
      log(`  cartaz ${f.title}: ${(b.length / 1024).toFixed(0)} KB`);
    } catch (e) { log(`  cartaz ${f.title} FALHOU (${e.message})`); f.poster = ""; }
  }
  await page.close();
  return filmes.filter(f => f.poster);
}

const SUPA = (process.env.SUPABASE_URL || "https://aakenoljsycyrcrchgxj.supabase.co").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = async path => { const r = await fetch(SUPA + path, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(60000) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); };

// leitura do site de ingressos feita pelo PC nesta semana (desde quinta 00h)
async function programacaoDoPC(qui) {
  if (!KEY) return null;
  const j = await sb(`/rest/v1/cine_programacao?criado_em=gte.${qui.toISOString()}&order=criado_em.desc&limit=1&select=id,criado_em,filmes`);
  return j?.[0] || null;
}
// avisa SÓ o CEO (o cliente nunca fica sabendo de erro) — 05/11/2026
async function avisarCeo(texto) {
  if (!KEY || process.env.NOTICIAS_PUBLICAR === "0") return;
  try {
    const r = await fetch(`${SUPA}/functions/v1/zapi-send-message`, { method: "POST", signal: AbortSignal.timeout(30000),
      headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ agentKey: "sofia", phone: "45998090000", message: "Jeferson, aqui é a Sofia. 🎬 *Cine Cataratas (vídeo da semana)*\n\n" + texto }) });
    log(`Aviso ao CEO: HTTP ${r.status}`);
  } catch (e) { log(`Aviso ao CEO falhou: ${e.message}`); }
}
// sobe a versão Instagram no Storage e grava o link no envio semanal da Sofia (ela manda quando o cliente quiser)
async function guardarInstagram(arq, rotulo) {
  const caminho = `cine-instagram/${Date.now()}_Cine-Instagram-30s-${rotulo}.mp4`;
  const up = await fetch(`${SUPA}/storage/v1/object/sofia-videos/${caminho}`, { method: "POST", signal: AbortSignal.timeout(300000),
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "video/mp4", "x-upsert": "true" }, body: readFileSync(arq) });
  if (!up.ok) throw new Error(`Storage HTTP ${up.status} ${(await up.text()).slice(0, 150)}`);
  const url = `${SUPA}/storage/v1/object/public/sofia-videos/${caminho}`;
  const r = await fetch(`${SUPA}/rest/v1/sofia_envio_semanal?pedido_id=eq.${PEDIDO}`, { method: "PATCH", signal: AbortSignal.timeout(60000),
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ extra_url: url, extra_nome: `Cine Cataratas ${rotulo} - versão Instagram 30s`, extra_em: new Date().toISOString() }) });
  log(`Versão Instagram guardada para a Sofia: HTTP ${r.status}`);
}
async function principalAtual() {
  const j = await sb(`/rest/v1/pedido_videos?pedido_id=eq.${PEDIDO}&is_base_video=eq.true&select=created_at,videos(nome)`);
  return j?.[0] ? { quando: new Date(j[0].created_at), nome: j[0].videos?.nome || "" } : null;
}

async function gravar(htmlPath, mp4, dur = DUR) {
  if (existsSync(FR)) readdirSync(FR).forEach(f => unlinkSync(join(FR, f))); else mkdirSync(FR, { recursive: true });
  const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"] });
  const p = await b.newPage(); await p.setViewport({ width: W, height: H });
  await p.goto("file://" + htmlPath, { waitUntil: "load", timeout: 60000 });
  await p.waitForFunction(() => window.__ready === true, { timeout: 30000 }).catch(() => {});
  await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
  for (let i = 0; i < FPS * dur; i++) {
    await p.evaluate(s => window.__seek(s), i / FPS);
    await p.screenshot({ path: join(FR, `f-${String(i).padStart(5, "0")}.png`) });
    if (i % 90 === 0) log(`  quadro ${i}/${FPS * dur}`);
  }
  await b.close();
  execSync(`ffmpeg -v error -y -framerate ${FPS} -i "${FR}/f-%05d.png" -vf "scale=${W}:${H}:in_range=full:out_range=tv,format=yuv420p" -color_range tv -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart -an "${mp4}"`, { stdio: "inherit" });
  readdirSync(FR).forEach(f => unlinkSync(join(FR, f)));
}

async function main() {
  const { qui, rotulo } = semana();
  log(`=== Cine Cataratas · semana ${rotulo} ===`);
  let pc = null;
  const esperar = Number(process.env.CINE_ESPERAR_PC || 0);
  for (let t = 0; ; t++) {
    try { pc = await programacaoDoPC(qui); } catch (e) { log(`não li a programação do PC (${e.message})`); }
    if (pc || t >= esperar) break;
    if (t === 0) log(`Aguardando a leitura do site de ingressos pelo PC (até ${esperar} min)...`);
    await sleep(60000);
  }
  if (process.env.CINE_REPESCAGEM === "1") {
    const p = await principalAtual().catch(() => null);
    const desta = p && p.quando >= qui, semH = p && /sem hor/i.test(p.nome);
    if (desta && (!semH || !pc || new Date(pc.criado_em) <= p.quando)) { log(`Repescagem: nada a fazer (no ar: "${p.nome}").`); return; }
    log(`Repescagem: ${!desta ? "o vídeo no ar é de outra semana" : "chegou a leitura do PC com horários"} — gero de novo.`);
  }
  let filmes;
  if (pc) {
    log(`Programação do site de ingressos (lida pelo PC em ${new Date(pc.criado_em).toLocaleString("pt-BR")}): ${pc.filmes.length} filmes.`);
    filmes = pc.filmes.filter(f => f.title && String(f.poster || "").startsWith("data:image"))
      .map(f => ({ title: String(f.title).trim(), poster: f.poster, showtimes: (f.showtimes || []).map(h => String(h).trim().padStart(5, "0")), room: f.room || "", format: f.format || "", rating: f.rating || "", duration: f.duration || "" }));
    for (const f of filmes) log(`  ${f.title} | ${f.rating || "?"} | ${f.room} | ${f.showtimes.join(" ")}`);
  } else {
    log("Sem leitura do PC nesta semana: filmes do site do cinema, SEM horários.");
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
    try { filmes = await buscarFilmes(browser); } finally { await browser.close(); }
  }
  const comHorarios = filmes.some(f => f.showtimes?.length);
  if (filmes.length < 2) { log(`ERRO: só ${filmes.length} filme(s) com cartaz — não gero (o vídeo atual continua).`); await avisarCeo(`Não consegui gerar o vídeo novo (só ${filmes.length} filme com cartaz). O da semana passada continua no ar. O cliente não foi avisado.`); process.exit(3); }

  // semana anterior: estreias + completar classificação/formato
  let prev = null; for (const f of [ANTERIOR, SEMENTE]) { if (!prev && existsSync(f)) try { prev = JSON.parse(readFileSync(f, "utf-8")); } catch {} }
  const antes = new Map((prev?.movies || []).map(m => [norm(m.title), m]));
  const acharAntes = t => antes.get(norm(t)) || [...antes.values()].find(m => mesmoFilme(m.title, t));
  for (const f of filmes) {
    // "– PRÉ-ESTREIA" sai do título (quebrava em 3 linhas) e vai para a linha de detalhes
    if (/pr[ée][- ]?estreia/i.test(f.title)) { f.title = f.title.replace(/\s*[–—-]\s*pr[ée][- ]?estreia\s*$/i, "").trim(); f.room = "Pré-estreia"; }
    const a = acharAntes(f.title); if (a) { f.rating = f.rating || a.rating || ""; f.format = f.format || a.format || ""; }
  }
  const prevDaSemana = prev && new Date(prev.timestamp) >= qui;   // rodou de novo na mesma semana: mantém a base
  const base = prevDaSemana ? (prev.base || []) : [...antes.keys()];
  const estreias = base.length ? filmes.filter(f => !base.some(b => b === norm(f.title) || mesmoFilme(b, f.title))).map(f => f.title) : [];
  log(`Estreias: ${estreias.length ? estreias.join(", ") : "nenhuma (mostra os filmes em cartaz)"}`);
  // estreias primeiro; o resto na ordem do site
  filmes.sort((a, b) => (estreias.includes(b.title) ? 1 : 0) - (estreias.includes(a.title) ? 1 : 0));

  const SO_IG = process.env.CINE_SO_INSTAGRAM === "1";   // só a versão Instagram (não mexe nas telas)
  const mp4 = join(OUT, `Cine-VERTICAL-15s-${rotulo}.mp4`);
  if (!SO_IG) {
    const htmlPath = saveVerticalHtml(generateVerticalHtml(filmes, { estreias }));
    log("Gravando o vídeo (15 s)..."); await gravar(htmlPath, mp4); log(`Vídeo pronto: ${mp4}`);
  }
  // versão de 30 s para o Instagram do cinema (a Sofia oferece ao cliente) — falha aqui não atrapalha a publicação
  let mp4ig = "";
  try {
    const hIg = saveVerticalHtml(generateVerticalHtml(filmes, { estreias, instagram: true, duracao: 30 }), "cinema-dooh-instagram.html");
    mp4ig = join(OUT, `Cine-INSTAGRAM-30s-${rotulo}.mp4`);
    log("Gravando a versão Instagram (30 s)..."); await gravar(hIg, mp4ig, 30); log(`Instagram pronto: ${mp4ig}`);
  } catch (e) { log(`Aviso: versão Instagram falhou (${e.message})`); mp4ig = ""; }
  writeFileSync(join(OUT, "filmes.json"), JSON.stringify(filmes.map(({ poster, ...r }) => r), null, 1));

  const publicar = process.env.NOTICIAS_PUBLICAR !== "0";
  if (SO_IG) { if (publicar && mp4ig) await guardarInstagram(mp4ig, rotulo); log("Só Instagram: telas não foram mexidas."); }
  else if (publicar) {
    const titulo = `Cine Cataratas ${rotulo}${comHorarios ? "" : " sem horarios"}`;
    log(`Publicando "${titulo}" (troca só o vídeo do Cine)...`);
    try {
      execSync(`node "${join(__dirname, "..", "noticias", "publish-video.mjs")}" "${mp4}" "${titulo}" "${PEDIDO}"`, { stdio: "inherit", env: { ...process.env, LIMPAR_SO: "cine|cinema" } });
    } catch (e) { log(`ERRO na publicação (código ${e.status}).`); await avisarCeo(`O vídeo da semana foi gerado mas a publicação falhou (código ${e.status}). O cliente não foi avisado. Veja o GitHub Actions "Cine Cataratas".`); process.exit(2); }
    if (!comHorarios) await avisarCeo(`Publiquei o vídeo da semana SEM horários: o PC do escritório não entregou a leitura do site de ingressos (estava desligado?). Ao ligar o PC, rode "ENVIAR PROGRAMACAO CINE AGORA.bat" (pasta cinema-dooh) que a repescagem refaz com horários. O cliente não foi avisado de nada.`);
    if (mp4ig) await guardarInstagram(mp4ig, rotulo).catch(e => log(`Aviso: não guardei a versão Instagram (${e.message})`));
  } else log("Teste: não publicado.");
  // guarda a semana para a próxima comparação
  writeFileSync(ANTERIOR, JSON.stringify({ timestamp: prevDaSemana ? prev.timestamp : new Date().toISOString(), base, movies: filmes.map(({ poster, trecho, ...r }) => r) }, null, 1));
  log("=== CINE CONCLUÍDO ===");
}
main().catch(async e => { log(`ERRO: ${e.message}`); await avisarCeo(`Erro ao gerar o vídeo da semana: ${String(e.message).slice(0, 200)}. O da semana passada continua no ar. O cliente não foi avisado.`); process.exit(1); });
