/**
 * EXA · FILTRO EDITORIAL ANTI-PUBLICIDADE (2026-10-26)
 *
 * Problema: portais (CNN Brasil, Portal da Cidade) publicam conteúdo comercial disfarçado de notícia
 * ("Novo Jeep Compass 2027… saiba os preços", branded content, publieditorial, lançamento de loja/produto).
 * A EXA NÃO pode exibir marca de empresa que não é anunciante dela. Toda notícia passa por aqui antes de virar vídeo.
 *
 * Camada 1 — regras fixas (sempre ativas, sem custo): marcadores de patrocínio no endereço, no título,
 *            no resumo e no texto da matéria; frases típicas de matéria de produto/preço/oferta.
 * Camada 2 — Claude (Opus) lê título + resumo + início do texto e decide se é publicidade
 *            ou se a matéria gira em torno de uma marca/produto/serviço/preço. Ativa quando houver
 *            ANTHROPIC_API_KEY no .env. Modelo: CLAUDE_MODEL (padrão claude-opus-5-5).
 *
 * Regra de ouro: NA DÚVIDA, FICA DE FORA. Se a IA falhar, a notícia só passa se a camada 1 aprovar
 * e o log avisa que a camada 2 não rodou.
 *
 * Uso: const ok = await filtrarPublicidade(itens, log)  // itens: [{ title, descricao, url, texto? }]
 */
import "dotenv/config";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MODELO = process.env.CLAUDE_MODEL || "claude-opus-5-5";

// ---------- camada 1: regras fixas ----------
const URL_PATROCINIO = [/patrocinad/i, /branded/i, /publieditorial/i, /publi-/i, /conteudo-de-marca/i, /conteudo-patrocinado/i,
  /parceiro/i, /\/especial-publicitario\//i, /\/brand-?studio\//i, /\/curiosidades\//i /* CNN: área usada como "Branded Content" na home */];
const MARCADORES_TEXTO = ["conteúdo patrocinado", "conteudo patrocinado", "publieditorial", "informe publicitário", "informe publicitario",
  "branded content", "conteúdo de marca", "conteudo de marca", "oferecido por", "apresentado por", "patrocinado por",
  "este conteúdo é uma parceria", "conteúdo produzido em parceria", "#publi", "link de afiliado", "comissão sobre as vendas"];
const FRASES_COMERCIAIS = [/saiba (os |o )?pre[çc]os?/i, /\bpre[çc]os?\b.*\b(vers[õo]es|modelo|linha)\b/i, /\bquanto custa\b/i, /\bonde comprar\b/i,
  /\bvale a pena comprar\b/i, /\bcupom\b/i, /\bblack friday\b/i,
  /\blan[çc]a(mento)?\b.*\b(modelo|vers[ãa]o|linha|produto|cole[çc][ãa]o|app|celular|smartphone|carro|suv)\b/i,
  /\b(inaugura|abre)\b.*\b(loja|unidade|filial)\b/i, /\btestamos\b/i, /\breview\b/i, /\bmelhores (produtos|celulares|carros|marcas)\b/i];

function camada1(n) {
  const url = n.url || "", tit = n.title || "", desc = n.descricao || "", txt = (n.texto || "").slice(0, 6000).toLowerCase();
  if (URL_PATROCINIO.some(r => r.test(url))) return "endereço da matéria indica conteúdo patrocinado/de marca";
  const cab = `${tit} ${desc}`.toLowerCase();
  const m = MARCADORES_TEXTO.find(w => cab.includes(w) || txt.includes(w));
  if (m) return `marcador de patrocínio: "${m}"`;
  const f = FRASES_COMERCIAIS.find(r => r.test(tit) || r.test(desc));
  if (f) return `título/resumo com cara de matéria comercial (${f.source})`;
  return null;
}

// ---------- texto da matéria (para as duas camadas) ----------
async function textoMateria(url) {
  try {
    const html = await (await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) })).text();
    const ps = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => m[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()).filter(t => t.length > 40);
    const extra = (html.match(/(patrocinad[oa]|publieditorial|branded content|conteúdo de marca|oferecido por|apresentado por)/gi) || []).slice(0, 3).join(" | ");
    return (ps.slice(0, 10).join("\n") + (extra ? `\n[MARCADORES NA PÁGINA: ${extra}]` : "")).slice(0, 5000);
  } catch { return ""; }
}

// ---------- camada 2: Claude ----------
const PROMPT = `Você é o editor-chefe de um canal de notícias exibido em telas de elevador de prédios residenciais (EXA Mídia).
A EXA vende espaço publicitário: é PROIBIDO exibir, dentro das notícias, publicidade ou promoção de qualquer empresa, marca, produto ou serviço que não seja anunciante da EXA. Portais de notícia frequentemente disfarçam publicidade como matéria.

Para cada notícia abaixo, decida se ela pode ir ao ar. REPROVE se ocorrer qualquer um destes:
1. Conteúdo patrocinado, publieditorial, branded content, informe publicitário, parceria comercial ou link de afiliado (declarado ou evidente).
2. A matéria gira em torno de uma marca/empresa/produto/serviço específico de forma promocional: lançamento de produto, preços de versões, novo modelo, nova loja/unidade, promoção, desconto, cupom, app, serviço pago, review/teste de produto, "conheça", "saiba como contratar", ranking de produtos, roteiro que promove estabelecimento/hotel/restaurante/spa/parque pago.
3. Culinária, receitas, gastronomia, restaurantes ou comida em destaque.
APROVE notícia de interesse público em que empresas aparecem só como parte do fato (ex.: B3 suspende pregão, Petrobras anuncia resultado ao mercado, Itaipu abre vertedouro, empresa investigada, acidente, órgão público), sem tom de vitrine.
Na dúvida, REPROVE.

Responda SOMENTE um JSON: {"itens":[{"i":0,"aprovada":true|false,"marcas":["..."],"motivo":"frase curta"}]}`;

async function camada2(itens) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const corpo = itens.map((n, i) => `### ${i}\nTÍTULO: ${n.title}\nRESUMO: ${n.descricao || "-"}\nURL: ${n.url}\nTEXTO:\n${(n.texto || "").slice(0, 2500)}`).join("\n\n");
  for (let t = 1; t <= 2; t++) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", signal: AbortSignal.timeout(120000),
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODELO, max_tokens: 2000, system: PROMPT, messages: [{ role: "user", content: corpo }] }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
      const j = await r.json();
      const txt = (j.content || []).map(c => c.text || "").join("");
      const json = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
      return json.itens || [];
    } catch (e) { if (t === 2) throw e; }
  }
}

/** Devolve só as notícias aprovadas, na mesma ordem. Registra no log o que foi barrado e por quê. */
export async function filtrarPublicidade(itens, log = console.log) {
  for (const n of itens) if (!n.texto && n.url) n.texto = await textoMateria(n.url);
  const passo1 = [];
  for (const n of itens) {
    const motivo = camada1(n);
    if (motivo) log(`  [FILTRO] BARRADA (regra fixa): "${n.title}" — ${motivo}`); else passo1.push(n);
  }
  if (!passo1.length) return [];
  let veredito;
  try { veredito = await camada2(passo1); }
  catch (e) { log(`  [FILTRO] AVISO: análise do Claude falhou (${e.message}). Usando só as regras fixas.`); return passo1; }
  if (veredito === null) { log("  [FILTRO] AVISO: sem ANTHROPIC_API_KEY no .env — análise do Claude DESLIGADA, só regras fixas."); return passo1; }
  const ok = [];
  passo1.forEach((n, i) => {
    const v = veredito.find(x => x.i === i);
    if (v && v.aprovada === true) ok.push(n);
    else log(`  [FILTRO] BARRADA (Claude): "${n.title}" — ${v ? v.motivo : "sem veredito (na dúvida, fora)"}${v && v.marcas && v.marcas.length ? ` [marcas: ${v.marcas.join(", ")}]` : ""}`);
  });
  log(`  [FILTRO] ${ok.length}/${itens.length} notícias aprovadas (modelo ${MODELO}).`);
  return ok;
}
