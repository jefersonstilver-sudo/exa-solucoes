/**
 * EXA Notícias · layout 2026 (Manual de Marca EXA)
 * Monta o HTML do episódio a partir dos dados do dia. Sem puppeteer aqui — só dados e HTML,
 * para poder ser testado isoladamente.
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, "assets");
const b64 = p => readFileSync(p).toString("base64");

// formato das telas: padrão 1080×890 (2026-10-23); pode mudar no .env com EXA_LARGURA / EXA_ALTURA
export const LARGURA = Number(process.env.EXA_LARGURA || process.env.FOZ_LARGURA || 1080), ALTURA = Number(process.env.EXA_ALTURA || process.env.FOZ_ALTURA || 890);

// ---------- datas ----------
const DIAS = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"];
const DIAS_CURTOS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MESES = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
export function datas(d = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return {
    dataLonga: `${DIAS[d.getDay()]} · ${d.getDate()} DE ${MESES[d.getMonth()]} DE ${d.getFullYear()}`,
    dataCurta: `${DIAS_CURTOS[d.getDay()]} ${p(d.getDate())}/${p(d.getMonth() + 1)}`,
  };
}

// ---------- previsão do tempo (Open-Meteo, sem chave) ----------
const WMO = c => c === 0 ? ["Céu limpo", "SOL"] : c <= 2 ? ["Parcialmente nublado", "SOL/NUVENS"] : c === 3 ? ["Nublado", "NUBLADO"] :
  c <= 48 ? ["Neblina", "NEBLINA"] : c <= 57 ? ["Garoa", "GAROA"] : c <= 67 ? ["Chuva", "CHUVA"] : c <= 77 ? ["Neve", "NEVE"] :
  c <= 82 ? ["Pancadas de chuva", "CHUVA"] : ["Tempestade", "TEMPESTADE"];
export async function previsaoFoz() {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=-25.5163&longitude=-54.5854&current=temperature_2m,weather_code" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSao_Paulo&forecast_days=4";
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error("Open-Meteo HTTP " + r.status);
  const j = await r.json(); const dd = j.daily;
  const [cond, condCurta] = WMO(dd.weather_code[0]);
  const dias = [1, 2, 3].map(i => { const dt = new Date(dd.time[i] + "T12:00:00");
    return [DIAS_CURTOS[dt.getDay()], Math.round(dd.temperature_2m_max[i]), Math.round(dd.temperature_2m_min[i]), Math.round(dd.precipitation_probability_max[i] ?? 0)]; });
  const chuvosos = dias.filter(d => d[3] >= 70);
  const alerta = chuvosos.length ? ["CHUVA À VISTA", `${chuvosos.map(d => d[0]).join(", ")}: chance`, `de ${Math.max(...chuvosos.map(d => d[3]))}% de chuva`] : null;
  return { atual: Math.round(j.current.temperature_2m), min: Math.round(dd.temperature_2m_min[0]), max: Math.round(dd.temperature_2m_max[0]),
    cond, condCurta, chuva: Math.round(dd.precipitation_probability_max[0] ?? 0), dias, alerta };
}

// ---------- texto das notícias ----------
const CATS = { nacional: "BRASIL", internacional: "MUNDO", tecnologia: "TECNOLOGIA", entretenimento: "ENTRETENIMENTO", pop: "ENTRETENIMENTO", auto: "AUTO", ciencia: "CIÊNCIA", economia: "ECONOMIA", policial: "SEGURANÇA", cidade: "CIDADE", educacao: "EDUCAÇÃO", cultura: "CULTURA", turismo: "TURISMO",
  regiao: "REGIÃO", saude: "SAÚDE", esporte: "ESPORTE", esportes: "ESPORTE", politica: "POLÍTICA", geral: "GERAL", tecnologia: "TECNOLOGIA", meio: "MEIO AMBIENTE" };
export function categoria(url, tag = "") {
  const m = (url || "").match(/\/noticias\/([^/]+)\//); const k = m ? m[1].split("-")[0] : "";
  return CATS[k] || (tag ? tag.toUpperCase().slice(0, 18) : "FOZ DO IGUAÇU");
}
export function resumo(desc, max = 88) {
  if (!desc) return ""; let s = desc.replace(/\s+/g, " ").trim(); if (s.length <= max) return s;
  s = s.slice(0, max); s = s.slice(0, s.lastIndexOf(" ")); return s.replace(/[,;:\-–]$/, "") + "…";
}
/** Número de destaque: valor em R$, quantidade com unidade, horário ou "HOJE/ONTEM". */
export function destaque(titulo, desc, publicado) {
  const t = `${titulo} ${desc || ""}`;
  let m = t.match(/R\$\s?([\d.,]+)\s?(bilh(?:ão|ões)|milh(?:ão|ões)|mil)?/i);
  if (m) { const u = (m[2] || "").toLowerCase(); const suf = u.startsWith("bilh") ? " BI" : u.startsWith("milh") ? " MI" : u === "mil" ? " MIL" : "";
    return { big: `R$${m[1].replace(/,00$/, "")}${suf}`, bigL: "EM DESTAQUE" }; }
  m = titulo.match(/(\d{1,3}(?:\.\d{3})*|\d+)\s+(vagas|pessoas|presos|homens|mortos|feridos|obras|casos|alunos|cursos|carros|veículos|empresas|empregos|leitos|papagaios|municípios|cidades|bairros|famílias|anos|dias|km|toneladas|mm)/i);
  if (m) return { big: m[1], bigL: m[2].toUpperCase() };
  m = titulo.match(/(\d{1,2})h(\d{2})?/i); if (m) return { big: `${m[1]}H${m[2] || ""}`, bigL: "HORÁRIO" };
  m = t.match(/\b(\d+)\s?%/); if (m) return { big: `${m[1]}%`, bigL: "EM DESTAQUE" };
  if (/gr[áa]tis|gratuit/i.test(titulo)) return { big: "GRÁTIS", bigL: "" };
  if (publicado) { const d = new Date(publicado), h = new Date(); const mesmoDia = d.toDateString() === h.toDateString();
    return { big: mesmoDia ? "HOJE" : "ONTEM", bigL: `${String(d.getHours()).padStart(2, "0")}H${String(d.getMinutes()).padStart(2, "0")}` }; }
  return { big: "", bigL: "" };
}

// ---------- HTML ----------
function mime(buf) { return buf[0] === 0x89 ? "image/png" : buf[0] === 0x52 && buf[8] === 0x57 ? "image/webp" : "image/jpeg"; }
/**
 * @param dados { tema:'foz'|'brasil'|'curiosidades', dur, data:Date, ticker,
 *                noticias:[{titulo,url,tag,descricao,publicado,imgBuffer, cat?, fonte?}] }
 *   curiosidades: titulo = texto com <em>destaque</em>, cat = tema, fonte = fonte, url = link
 */
export function montarHTML(dados) {
  const tema = dados.tema || "foz";
  const d = datas(dados.data || new Date());
  const itens = dados.noticias.map(n => tema === "curiosidades"
    ? { cat: (n.cat || "").toUpperCase(), head: n.titulo, url: n.url, fonte: n.fonte || "" }
    : { cat: n.cat || categoria(n.url, n.tag), head: n.titulo, sub: resumo(n.descricao), url: n.url, fonte: n.fonte, ...destaque(n.titulo, n.descricao, n.publicado) });
  // layout 2026-10-23: abertura de 4 s + itens; sem previsão do tempo, sem tela final (QR em cada item), sem logos durante o conteúdo
  const DATA = { tema, dur: dados.dur, segIntro: 4.0, ...d, itens, ticker: (dados.ticker || "") + "   •   " };
  const IMGS = {};
  if (tema === "foz") IMGS.portal = "data:image/png;base64," + b64(join(ASSETS, "portal-da-cidade.png"));
  dados.noticias.forEach((n, i) => { if (n.imgBuffer && n.imgBuffer.length > 1000) IMGS["n" + i] = `data:${mime(n.imgBuffer)};base64,` + n.imgBuffer.toString("base64"); });
  const fontes = ["bsBl", "mrXb", "mrBd", "mrSb", "jbBd"].map(f =>
    `@font-face{font-family:${f};src:url(data:font/woff;base64,${b64(join(ASSETS, "fonts", f + ".woff"))}) format('woff');font-display:block}`).join("\n");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>EXA ${tema} · ${d.dataCurta}</title>
<style>${fontes}
html,body{margin:0;height:100%;background:#000;overflow:hidden}body{display:flex;align-items:center;justify-content:center}
canvas{width:100vw;height:${(100 * ALTURA / LARGURA).toFixed(3)}vw;max-height:100vh;max-width:${(100 * LARGURA / ALTURA).toFixed(3)}vh}</style></head>
<body><canvas id="cv" width="${LARGURA}" height="${ALTURA}"></canvas>
<script>window.DATA=${JSON.stringify(DATA)};window.IMGS=${JSON.stringify(IMGS)};const LOGO=${readFileSync(join(ASSETS, "exa-logo.json"), "utf-8")};</script>
<script>${readFileSync(join(ASSETS, "qrcode-generator.js"), "utf-8")}</script>
<script>${readFileSync(join(ASSETS, "exa-noticias-scene.js"), "utf-8")}</script></body></html>`;
}
