// =====================================================================
// NANDO - cerebro (Claude + ferramentas). Conversa curta e natural com o sindico.
// =====================================================================
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  Predio, nomeBase, ehAdmin, prediosDoTelefone, todosPredios, sincronizarLegado, listarArquivosPainel, enviarAoPainel, removerDoPainel,
  tituloPainel, dataApi, registrarOcorrencia, enviarContatoSofia, historico, fmtData, slug, carimbo,
  b64ParaBytes, bytesParaB64, telefoneCanonico, pngComAviso, primeiroNome, SITE_URL, MODO_TESTE, horaLocalIso, qrDataUrl, tokenPredio, tokenCarteira, pedirFotos, enviarImagem, enviarDocumento,
} from "./nando-core.ts";
import { ICONES, urlIcone, listaTemas } from "./nando-icones.ts";

const BUCKET = "nando-midia";
const LIMITE_AVISOS = 10;
const MODELOS = [Deno.env.get("NANDO_MODEL") || "claude-sonnet-5-5", "claude-sonnet-4-5"];

export interface Contexto {
  sb: SupabaseClient;
  tel: string;
  nomePessoa: string;
  admin: boolean;
  predios: Predio[];          // predios que pode gerenciar
  predioAtual: Predio | null;
  midias: Record<string, { mime: string; caminho: string; url: string }>; // midias recebidas (id -> arquivo salvo)
  registros: string[];        // o que as ferramentas fizeram neste turno (vira memoria)
  inicio?: number;            // quando esta resposta comecou (rascunhos de antes disso sao descartados ao criar um novo)
}

function quem(c: Contexto) { return `${c.nomePessoa || "sem nome"} (+${telefoneCanonico(c.tel)})`; }
function urlPublica(c: Contexto, caminho: string) {
  return c.sb.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
}
function idCurto(id: string) { return id.slice(0, 8); }

async function acharAviso(c: Contexto, id: string) {
  // o sindico ve so os 8 primeiros caracteres do id (ex: [3f2a91bc])
  const pre = String(id || "").trim().toLowerCase().replace(/[^0-9a-f]/g, "").slice(0, 8);
  if (pre.length !== 8) throw new Error("Código de aviso inválido. Use listar_avisos para ver os códigos.");
  const { data: rows, error } = await c.sb.from("nando_avisos").select("*")
    .gte("id", `${pre}-0000-0000-0000-000000000000`).lte("id", `${pre}-ffff-ffff-ffff-ffffffffffff`).limit(2);
  if (error) throw error;
  const a = (rows || [])[0];
  if (!a) throw new Error("Não encontrei esse aviso. Use listar_avisos para ver os códigos.");
  if (!c.admin && !c.predios.some((p) => p.id === a.building_id)) throw new Error("Esse aviso é de um prédio que esta pessoa não administra.");
  return a;
}

async function predioDoCodigo(c: Contexto, codigo: string): Promise<Predio> {
  const cod = String(codigo || "").trim();
  const lista = c.admin ? await todosPredios(c.sb) : c.predios;
  const norm = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const alvo = norm(cod);
  let p = lista.find((x) => x.codigo === cod || x.id === cod || norm(x.nome) === alvo);
  if (!p && alvo.length >= 3) {
    const parecidos = lista.filter((x) => norm(x.nome).includes(alvo) || alvo.includes(norm(x.nome)));
    if (parecidos.length === 1) p = parecidos[0];
    else if (parecidos.length > 1) throw new Error(`Mais de um prédio parecido: ${parecidos.map((x) => `${x.nome} (${x.codigo})`).join("; ")}. Pergunte qual.`);
  }
  if (!p) throw new Error("Prédio não encontrado entre os que esta pessoa administra. Use listar_predios para ver os nomes e códigos.");
  return p;
}

async function predioPorId(c: Contexto, id: string): Promise<Predio> {
  const lista = c.admin ? await todosPredios(c.sb) : c.predios;
  const p = lista.find((x) => x.id === id);
  if (!p) throw new Error("Prédio do aviso não encontrado ou sem permissão.");
  return p;
}

async function salvarArquivo(c: Contexto, caminho: string, bytes: Uint8Array, mime: string) {
  const { error } = await c.sb.storage.from(BUCKET).upload(caminho, bytes, { contentType: mime, upsert: true });
  if (error) throw new Error("Falha ao salvar arquivo: " + error.message);
  return urlPublica(c, caminho);
}

async function criarPrevia(c: Contexto, avisoId: string): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, "");
  await c.sb.from("nando_previas").insert({ token, aviso_id: avisoId, expira_em: new Date(Date.now() + 10 * 60000).toISOString() });
  return `${SITE_URL}/nando/previa/${token}`;
}

async function iconeDataUrl(tema: string): Promise<string | null> {
  const u = urlIcone(tema);
  if (!u) return null;
  const r = await fetch(u);
  if (!r.ok) return null;
  return "data:image/png;base64," + bytesParaB64(new Uint8Array(await r.arrayBuffer()));
}

// wallpaper abstrato (luzes e arcos) na cor do tema - 3 por cor, gerados pela EXA
async function wallpaper(cor: string): Promise<string | null> {
  const c = String(cor || "").replace("#", "").toLowerCase();
  const arq = (FUNDOS.includes(c) ? c : "7c3aed") + "-" + (1 + Math.floor(Math.random() * 3));
  try {
    const r = await fetch(`https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/public/nando/wallpapers/${arq}.jpg`);
    if (!r.ok) return null;
    return "data:image/jpeg;base64," + bytesParaB64(new Uint8Array(await r.arrayBuffer()));
  } catch { return null; }
}

// fundo em degrade (mesh) da cor do tema; nunca usar o icone ampliado como fundo
const FUNDOS = ["0a84ff", "f5a400", "ff5a1f", "5e5ce6", "30b0c7", "ff2d55", "bf5af2", "34c759", "ff9f0a", "8e8e93", "a2845e", "ff3b30", "ffcc00", "7c3aed"];
async function fundoGradiente(cor: string): Promise<string | null> {
  const c = String(cor || "").replace("#", "").toLowerCase();
  const arq = FUNDOS.includes(c) ? c : "7c3aed";
  try {
    const r = await fetch(`https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/public/nando/fundos/${arq}.jpg`);
    if (!r.ok) return null;
    return "data:image/jpeg;base64," + bytesParaB64(new Uint8Array(await r.arrayBuffer()));
  } catch { return null; }
}

// Foto de fundo do Pixabay (licenca sem credito obrigatorio; a regra da API pede baixar e guardar a imagem,
// por isso ela vai embutida no proprio aviso, sem link para o Pixabay)
async function fotoPixabay(busca: string): Promise<{ url: string; credito: string } | null> {
  const key = Deno.env.get("PIXABAY_API_KEY");
  if (!key) return null;
  try {
    const q = encodeURIComponent(busca.slice(0, 90));
    const r = await fetch(`https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${q}&image_type=photo&orientation=vertical&safesearch=true&per_page=20&order=popular`, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) { console.error("[NANDO] pixabay", r.status); return null; }
    const j = await r.json();
    const lista = (j.hits || []).filter((x: any) => x?.webformatURL);
    if (!lista.length) return null;
    const foto = lista[Math.floor(Math.random() * Math.min(6, lista.length))];
    const img = await fetch(foto.webformatURL, { signal: AbortSignal.timeout(15000) });
    if (!img.ok) return null;
    const tipo = (img.headers.get("content-type") || "image/jpeg").split(";")[0];
    return { url: `data:${tipo};base64,` + bytesParaB64(new Uint8Array(await img.arrayBuffer())), credito: `Pixabay (${foto.user || "autor"})` };
  } catch (err) { console.error("[NANDO] pixabay", (err as Error).message); return null; }
}

// Foto de fundo do Unsplash (segue as regras da API: usa o link original da foto, registra o download e da o credito)
async function fotoUnsplash(busca: string): Promise<{ url: string; credito: string } | null> {
  const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!key) return null;
  try {
    const q = encodeURIComponent(busca.slice(0, 60));
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${q}&orientation=portrait&content_filter=high&per_page=8`, {
      headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" }, signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) { console.error("[NANDO] unsplash", r.status); return null; }
    const j = await r.json();
    const lista = (j.results || []).filter((x: any) => x?.urls?.raw);
    if (!lista.length) return null;
    const foto = lista[Math.floor(Math.random() * Math.min(4, lista.length))];
    // obrigatorio pela Unsplash: avisar o "download" quando a foto e usada
    if (foto.links?.download_location) fetch(foto.links.download_location, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => {});
    const raw = String(foto.urls.raw);
    const url = raw + (raw.includes("?") ? "&" : "?") + "w=1080&h=1920&fit=crop&crop=entropy&q=72&fm=jpg";
    return { url, credito: `Foto: ${foto.user?.name || "Unsplash"} / Unsplash` };
  } catch (err) { console.error("[NANDO] unsplash", (err as Error).message); return null; }
}

function parseData(s: unknown): Date | null {
  if (!s) return null;
  let t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) t += "T00:00:00";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(t)) t += "-03:00"; // horario de Brasilia
  const d = new Date(t);
  return isNaN(+d) ? null : d;
}


// ---------------------------------------------------------------- serie de cartoes e arquivo original
type Visual = { icone: (t: string) => Promise<string | undefined>; foto: string | null; qr?: string; qrAlvo: string; qrLegenda?: string };

// Distribui os itens entre os cartoes: no maximo 6 por cartao e 4 no cartao que leva o QR code,
// para o QR nunca ficar por cima dos itens. Ate 5 cartoes.
export function paginar<T>(itens: T[], comQr: boolean): T[][] | null {
  const total = itens.length, capUlt = comQr ? 4 : 6;
  let n = 1;
  while (6 * (n - 1) + capUlt < total) n++;
  if (n > 5) return null;
  const ult = Math.min(capUlt, Math.max(total - 6 * (n - 1), Math.ceil(total / n)));
  const resto = total - ult;
  const pags: T[][] = [];
  let i = 0;
  for (let k = 0; k < n - 1; k++) {
    const qtd = Math.min(6, Math.ceil((resto - i) / (n - 1 - k)));
    pags.push(itens.slice(i, i + qtd)); i += qtd;
  }
  pags.push(itens.slice(i));
  return pags.filter((x) => x.length || !total);
}

async function criarSerie(c: Contexto, p: Predio, e: any, v: Visual, extra: Record<string, unknown> = {}): Promise<string | { criados: any[]; totalItens: number; grupo: string }> {
  const sb = c.sb;
  const cartoes: any[] = Array.isArray(e.cartoes) && e.cartoes.length ? e.cartoes : [{ titulo: e.titulo, quando: e.quando, texto: e.texto, itens: e.itens }];
  const itensBrutos = cartoes.flatMap((cd: any) => Array.isArray(cd?.itens) ? cd.itens : []).filter((x: any) => String(x?.texto || "").trim());
  const titulo = String(e.titulo || cartoes[0]?.titulo || "Aviso").replace(/\s*\(?\d+\s*\/\s*\d+\)?\s*$/, "").replace(/[:\-–]\s*$/, "").trim().slice(0, 60);
  const quando = (e.quando || cartoes[0]?.quando) ? String(e.quando || cartoes[0]?.quando).slice(0, 60) : undefined;
  let paginas: any[][];
  if (itensBrutos.length) {
    const pg = paginar(itensBrutos, !!v.qr);
    if (!pg) return `São ${itensBrutos.length} itens: não cabem em 5 cartões. Junte itens parecidos (sem perder nenhuma regra) e tente de novo.`;
    paginas = pg;
  } else paginas = cartoes.map(() => []);
  const total = paginas.length;
  const tema = ICONES[e.tema] ? e.tema : "megafone";
  const cor = /^#[0-9a-f]{6}$/i.test(e.cor || "") ? e.cor : ICONES[tema].cor;
  let fundo: string | undefined, nitido = false, credito: string | null = null;
  const f = e.busca_foto ? await fotoPixabay(String(e.busca_foto)) : null;
  if (f) { fundo = f.url; credito = f.credito; } else { fundo = (await wallpaper(cor)) || (await fundoGradiente(cor)) || undefined; nitido = !!fundo; }
  const grupo = crypto.randomUUID();
  const ini = parseData(e.inicio), fim = parseData(e.fim);
  const criados: any[] = [];
  for (let k = 0; k < total; k++) {
    const pag = paginas[k];
    const itens = pag.length ? await Promise.all(pag.map(async (it: any) => ({ icone: await v.icone(String(it?.tema || "")), texto: String(it?.texto || "").slice(0, 90) }))) : undefined;
    const ultimo = k === total - 1;
    const dados: any = {
      v: 1, titulo, quando, texto: !itensBrutos.length ? (String(cartoes[k]?.texto || "").slice(0, 160) || undefined) : undefined,
      itens, assinatura: e.assinatura || `Administração do ${p.nome}`, cor, icone: await v.icone(tema), foto: v.foto || undefined,
      fundo, fundo_nitido: nitido || undefined, parte: total > 1 ? `${k + 1}/${total}` : undefined,
      qr: ultimo ? v.qr : undefined, qr_legenda: ultimo ? v.qrLegenda : undefined,
    };
    const { data: a, error } = await sb.from("nando_avisos").insert({
      building_id: p.id, cliente_id: p.cliente_id, tipo: "nando", titulo: (total > 1 ? `${titulo} (${k + 1}/${total})` : titulo).slice(0, 70), status: "rascunho",
      segundos: clampSeg(e.segundos || 20), inicio: (ini || new Date()).toISOString(), fim: fim ? fim.toISOString() : null,
      lembrar_em: e.lembrar_dias ? new Date(Date.now() + e.lembrar_dias * 86400000).toISOString() : null,
      criado_por_tel: telefoneCanonico(c.tel), criado_por_nome: c.nomePessoa,
      conteudo: { ...extra, ...(e.__destinos ? { destinos: e.__destinos } : {}), tema, grupo, serie: total > 1, parte: k + 1, total, opcao: k + 1, credito_foto: credito, qr_alvo: v.qrAlvo || null,
        campos: { ...dados, icone: undefined, fundo: undefined, qr: undefined, itens: pag.map((x: any) => x?.texto) } },
    }).select("*").single();
    if (error) throw error;
    const url = await salvarArquivo(c, `avisos/${a.id}.nando.json`, new TextEncoder().encode(JSON.stringify(dados)), "application/json");
    await sb.from("nando_avisos").update({ conteudo: { ...a.conteudo, arquivo_url: url } }).eq("id", a.id);
    a.conteudo = { ...a.conteudo, arquivo_url: url };
    await historico(sb, a.id, quem(c), total > 1 ? `criou rascunho (série, cartão ${k + 1}/${total})` : "criou rascunho");
    criados.push(a);
  }
  c.registros.push(`${total > 1 ? "série" : "cartão"} criado: ${criados.map((a, k) => `cartão ${k + 1} = [${idCurto(a.id)}]`).join(", ")}; ${itensBrutos.length} itens`);
  return { criados, totalItens: itensBrutos.length, grupo };
}

async function criarArquivoOriginal(c: Contexto, p: Predio, e: any, extra: Record<string, unknown> = {}): Promise<string | any> {
  const m = c.midias[e.midia_id] || await midiaSalva(c, e.midia_id);
  if (!m) return "Não encontrei esse arquivo. Peça para a pessoa enviar de novo.";
  const tipo = m.mime === "application/pdf" ? "pdf" : m.mime.startsWith("image/") ? "imagem" : null;
  if (!tipo) return "Esse arquivo não é imagem nem PDF.";
  const ini = parseData(e.inicio), fim = parseData(e.fim);
  const { data: a, error } = await c.sb.from("nando_avisos").insert({
    building_id: p.id, cliente_id: p.cliente_id, tipo, titulo: String(e.titulo || "Aviso").slice(0, 70), status: "rascunho",
    segundos: clampSeg(e.segundos_original || e.segundos || 30), inicio: (ini || new Date()).toISOString(), fim: fim ? fim.toISOString() : null,
    lembrar_em: e.lembrar_dias ? new Date(Date.now() + e.lembrar_dias * 86400000).toISOString() : null,
    origem_url: m.url, criado_por_tel: telefoneCanonico(c.tel), criado_por_nome: c.nomePessoa, conteudo: { ...extra, ...(e.__destinos ? { destinos: e.__destinos } : {}), midia_id: e.midia_id, grupo: crypto.randomUUID() },
  }).select("*").single();
  if (error) throw error;
  await historico(c.sb, a.id, quem(c), "criou rascunho");
  c.registros.push(`rascunho ${idCurto(a.id)} criado: ${a.titulo}`);
  return a;
}

async function prepararVisual(c: Contexto, e: any, qrMidia?: string): Promise<Visual | string> {
  let foto: string | null = null;
  if (e.midia_foto_id) {
    const m = c.midias[e.midia_foto_id] || await midiaSalva(c, e.midia_foto_id);
    if (m && m.mime.startsWith("image/")) { const r = await fetch(m.url); foto = `data:${m.mime};base64,` + bytesParaB64(new Uint8Array(await r.arrayBuffer())); }
  }
  const icCache = new Map<string, string | null>();
  const icone = async (t: string) => { const k = ICONES[t] ? t : "megafone"; if (!icCache.has(k)) icCache.set(k, await iconeDataUrl(k)); return icCache.get(k) || undefined; };
  let qr: string | undefined, qrAlvo = "";
  const idQr = qrMidia || e.qr_midia_id;
  if (idQr) {
    const mq = c.midias[idQr] || await midiaSalva(c, idQr);
    if (!mq) return "Arquivo para o QR code não encontrado (midia_id).";
    qrAlvo = mq.url;
  }
  if (qrAlvo) qr = await qrDataUrl(qrAlvo);
  return { icone, foto, qr, qrAlvo, qrLegenda: qr ? String(e.qr_legenda || "Aponte a câmera e veja o documento completo").slice(0, 60) : undefined };
}

// ---------------------------------------------------------------- ferramentas
export const FERRAMENTAS = [
  {
    name: "escolher_predio",
    description: "Define em qual prédio a conversa está trabalhando. Use o código do prédio (ex: '003'). Obrigatório antes de mexer em avisos quando a pessoa administra mais de um prédio.",
    input_schema: { type: "object", properties: { codigo: { type: "string" } }, required: ["codigo"] },
  },
  {
    name: "listar_predios",
    description: "Lista os prédios em que a pessoa pode mexer (o Jeferson/administrador: TODOS os prédios ativos), com nome, código e quantos avisos estão no ar. Use sempre que perguntarem quais prédios podem mexer ou quando não souber o código.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "listar_avisos",
    description: "Lista os avisos do prédio atual (no ar, agendados e com problema; rascunhos NUNCA aparecem), com código, tempo de tela, início, saída, lembrete e quem criou.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "criar_aviso_nando",
    description: "Cria um RASCUNHO de aviso animado do Nando (modelo fixo: ícone 3D, título, quando/onde, texto curto, assinatura) e devolve o link de prévia de 10 minutos. Não publica.",
    input_schema: {
      type: "object",
      properties: { predios: { type: "array", items: { type: "string" }, description: "SE o aviso vai para mais de um prédio: nomes/códigos (ou ['todos']). A prévia já mostra todos os prédios de destino e a assinatura de cada um." }, exceto: { type: "array", items: { type: "string" } }, 
        titulo: { type: "string", description: "Curto e forte, ATÉ 30 caracteres (letras grandes, lido de longe). Ex: 'Falta d'água no sábado'" },
        quando: { type: "string", description: "Data/horário/local em uma linha, ATÉ 35 caracteres. Ex: 'Sáb 26/10 · 8h às 14h'" },
        texto: { type: "string", description: "Frase curta e amigável, ATÉ 110 caracteres (o aviso é lido de longe no elevador)" },
        assinatura: { type: "string", description: "Ex: 'Administração do Edifício Saint Peter'" },
        tema: { type: "string", description: "Tema do ícone 3D (uma das chaves da biblioteca)" },
        cor: { type: "string", description: "Cor de destaque em #RRGGBB (opcional; padrão do tema)" },
        midia_id: { type: "string", description: "Opcional: id de uma FOTO enviada pelo síndico para aparecer em destaque" },
        itens: {
          type: "array", maxItems: 6,
          description: "Opcional: lista de regras/itens, cada um com ícone 3D próprio (ex: regras da piscina). ATÉ 6 por cartão; texto de cada item ATÉ 70 caracteres, direto (ex: 'Proibido som alto'). Com itens, o campo texto pode ficar vazio.",
          items: { type: "object", properties: { tema: { type: "string" }, texto: { type: "string" } }, required: ["texto"] },
        },
        cartoes: {
          type: "array", maxItems: 5,
          description: "Use para uma SÉRIE (conteúdo que não cabe num cartão só, ex: 18 regras da piscina = 3 cartões de 6). Cada cartão: titulo, quando, texto, itens. A série tem UM visual só (não gera 3 variações) e vai ao ar inteira, um cartão depois do outro.",
          items: { type: "object", properties: { titulo: { type: "string", description: "Título do cartão SEM numeração (o '1/3' já aparece sozinho no canto)" }, quando: { type: "string" }, texto: { type: "string" }, itens: { type: "array", items: { type: "object", properties: { tema: { type: "string" }, texto: { type: "string" } } } } } },
        },
        qr_midia_id: { type: "string", description: "Opcional: midia_id do PDF/imagem original que o síndico mandou. Coloca um QR code no aviso que abre o documento completo no celular. Use em todo resumo de documento." },
        qr_url: { type: "string", description: "Opcional: link https para o QR code (quando não for um arquivo enviado)" },
        qr_legenda: { type: "string", description: "Texto ao lado do QR, ATÉ 50 caracteres. Padrão: 'Aponte a câmera e veja o documento completo'" },
        variacoes: {
          type: "array", maxItems: 3,
          description: "SEMPRE 3 variações visuais para o síndico escolher. As opções 1 e 2 usam foto desfocada (busca_foto diferente em cada); a opção 3 é sempre um wallpaper abstrato na cor escolhida (não precisa de busca_foto). Varie tema de ícone e cor entre elas. Pode trazer titulo/quando/texto alternativos (ex: uma mais formal, outra mais leve).",
          items: { type: "object", properties: { tema: { type: "string" }, cor: { type: "string" }, busca_foto: { type: "string" }, titulo: { type: "string" }, quando: { type: "string" }, texto: { type: "string" } } },
        },
        busca_foto: { type: "string", description: "2 a 4 palavras EM INGLÊS para buscar a foto de fundo (banco Pixabay), ligadas ao tema e ao clima do aviso (ex: 'quiet night city', 'water tap kitchen', 'elevator lobby', 'pool summer'). Evite pessoas em destaque." },
        segundos: { type: "number", description: "Tempo na tela (5 a 120). Padrão 15" },
        inicio: { type: "string", description: "Início 'YYYY-MM-DDTHH:MM' (horário de Brasília). Vazio = assim que publicar" },
        fim: { type: "string", description: "Saída automática 'YYYY-MM-DDTHH:MM'. Vazio = sem data de saída" },
        lembrar_dias: { type: "number", description: "Lembrar o síndico após N dias (opcional)" },
      },
      required: ["titulo", "tema"],
    },
  },
  {
    name: "descartar_rascunhos",
    description: "Descarta TODOS os rascunhos não publicados desta pessoa. Use quando ela cancelar, disser que não quer, não gostou ou mudar de assunto sem publicar. Rascunho nunca fica guardado.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "criar_opcoes_documento",
    description: "Para imagem ou PDF com texto (comunicado, regras, cartaz): cria de uma vez TODAS as opções numa prévia só: (1) cartões do Nando com TODOS os itens (se houver lista), (2) resumo com QR do documento completo (se fizer sentido), (3) o arquivo original como está. O síndico escolhe pelo número. Os itens são distribuídos sozinhos entre os cartões (até 6 por cartão; o cartão com QR leva menos).",
    input_schema: {
      type: "object",
      properties: { predios: { type: "array", items: { type: "string" }, description: "SE o aviso vai para mais de um prédio: nomes/códigos (ou ['todos']). A prévia já mostra todos os prédios de destino e a assinatura de cada um." }, exceto: { type: "array", items: { type: "string" } }, 
        midia_id: { type: "string", description: "midia_id da imagem/PDF recebido" },
        titulo: { type: "string", description: "Título curto dos cartões, SEM numeração (ex: 'Regras da piscina')" },
        quando: { type: "string", description: "Linha curta de destaque (ex: 'Aberta das 8h às 22h')" },
        tema: { type: "string" }, cor: { type: "string" }, busca_foto: { type: "string" }, assinatura: { type: "string" },
        itens: { type: "array", description: "TODOS os itens/regras do documento, na ordem, cada um com tema de ícone e texto curto (até 70 caracteres). Não deixe nenhum de fora.", items: { type: "object", properties: { tema: { type: "string" }, texto: { type: "string" } }, required: ["texto"] } },
        resumo: { type: "object", description: "Opcional: resumo para o cartão com QR (comunicados). titulo até 30, quando até 35, texto até 110.", properties: { titulo: { type: "string" }, quando: { type: "string" }, texto: { type: "string" } } },
        titulo_original: { type: "string", description: "Título do aviso do arquivo original (só para a lista)" },
        segundos: { type: "number" }, inicio: { type: "string" }, fim: { type: "string" }, lembrar_dias: { type: "number" },
      },
      required: ["midia_id", "titulo", "tema"],
    },
  },
  {
    name: "ver_arquivo",
    description: "Abre de novo uma foto ou PDF que a pessoa mandou antes (pelo midia_id), para você ler o conteúdo. Use sempre que precisar do conteúdo de um arquivo de mensagens anteriores. Nunca diga que não consegue ver um arquivo sem usar esta ferramenta.",
    input_schema: { type: "object", properties: { midia_id: { type: "string" } }, required: ["midia_id"] },
  },
  {
    name: "link_dos_avisos",
    description: "Gera o link da página com os avisos no ar e agendados, desenhados como na tela, com o rodízio, o tempo de cada um, quando sai e quem criou. Padrão: só o prédio atual (vale 1 hora). Com todos=true: a CARTEIRA inteira (todos os prédios que a pessoa pode mexer, numa página só, sempre atualizada, vale 24 horas) — ofereça esse para quem cuida de mais de um prédio. Ofereça depois de publicar, alterar ou listar avisos.",
    input_schema: { type: "object", properties: { todos: { type: "boolean" } } },
  },
  {
    name: "criar_aviso_arquivo",
    description: "Cria um RASCUNHO a partir de uma imagem ou PDF que o síndico enviou (publicado como está, sem distorcer) e devolve o link de prévia. Não publica.",
    input_schema: {
      type: "object",
      properties: { predios: { type: "array", items: { type: "string" }, description: "SE o aviso vai para mais de um prédio: nomes/códigos (ou ['todos']). A prévia já mostra todos os prédios de destino e a assinatura de cada um." }, exceto: { type: "array", items: { type: "string" } }, 
        midia_id: { type: "string" }, titulo: { type: "string" },
        segundos: { type: "number" }, inicio: { type: "string" }, fim: { type: "string" }, lembrar_dias: { type: "number" },
      },
      required: ["midia_id", "titulo"],
    },
  },
  {
    name: "publicar_aviso",
    description: "Publica um rascunho já aprovado pelo síndico. Para publicar o MESMO aviso em vários prédios: 'predios' com os códigos ou nomes (ou ['todos'] = todos os prédios que a pessoa pode mexer) e, se quiser, 'exceto'. As cópias ficam ligadas (mesmo grupo): depois dá para alterar ou tirar de todos de uma vez. Cada prédio recebe a assinatura dele. O painel atualiza em até ~10 minutos.",
    input_schema: { type: "object", properties: { aviso: { type: "string" }, predios: { type: "array", items: { type: "string" } }, exceto: { type: "array", items: { type: "string" } },
      repetir: { type: "object", description: "SÓ para aviso que se repete (ex: coleta de lixo toda terça; dedetização todo dia 10). O Nando coloca e tira sozinho em cada vez. frequencia: diaria|semanal|mensal; dias_semana: 0=dom..6=sáb; dia_mes: 1-28; hora_inicio/hora_fim 'HH:MM' (quando aparece e some naquele dia); ate: 'AAAA-MM-DD' opcional.",
        properties: { frequencia: { type: "string", enum: ["diaria", "semanal", "mensal"] }, dias_semana: { type: "array", items: { type: "number" } }, dia_mes: { type: "number" },
          hora_inicio: { type: "string" }, hora_fim: { type: "string" }, ate: { type: "string" } }, required: ["frequencia", "hora_inicio", "hora_fim"] } },
      required: ["aviso"] },
  },
  {
    name: "alterar_aviso",
    description: "Altera tempo de tela, início, saída ou lembrete de um aviso (rascunho ou publicado). Para mudar texto/visual, crie um rascunho novo.",
    input_schema: {
      type: "object",
      properties: { aviso: { type: "string" }, segundos: { type: "number" }, inicio: { type: "string" }, fim: { type: "string" }, sem_fim: { type: "boolean" }, lembrar_dias: { type: "number" },
        todos_os_predios: { type: "boolean", description: "true = aplica em TODOS os prédios onde esse mesmo aviso foi publicado junto (o grupo)" } },
      required: ["aviso"],
    },
  },
  {
    name: "remover_aviso",
    description: "Tira um aviso do painel AGORA. Só use quando a pessoa pedir claramente para tirar aquele aviso. Se o aviso foi publicado junto em vários prédios, use todos_os_predios=true quando ela pedir para tirar de todos (ou 'predios' para só alguns).",
    input_schema: { type: "object", properties: { aviso: { type: "string" }, todos_os_predios: { type: "boolean" }, predios: { type: "array", items: { type: "string" } } }, required: ["aviso"] },
  },
  {
    name: "editar_aviso",
    description: "Muda o TEXTO de um aviso animado do Nando já publicado (ou rascunho) sem criar outro: título, quando/onde, texto, itens ou assinatura. Republica no painel e tira a versão antiga. Com todos_os_predios=true muda em todos os prédios do mesmo grupo (cada um mantém a assinatura dele). Num cartão de série, muda só aquele cartão.",
    input_schema: { type: "object", properties: { aviso: { type: "string" }, titulo: { type: "string" }, quando: { type: "string" }, texto: { type: "string" },
      itens: { type: "array", items: { type: "string" }, description: "a lista completa nova de itens deste cartão" }, assinatura: { type: "string" }, todos_os_predios: { type: "boolean" } }, required: ["aviso"] },
  },
  {
    name: "enviar_imagem_whatsapp",
    description: "Manda para a pessoa, aqui no WhatsApp, a versão em IMAGEM do aviso (vertical, formato de celular, com o nome do prédio) para ela encaminhar nos grupos de WhatsApp do condomínio. Só use quando a pessoa ACEITAR (depois de perguntar). Série: manda todos os cartões em ordem. Aviso que é imagem/PDF do síndico: manda o próprio arquivo. A imagem do Nando chega em 1 a 3 minutos.",
    input_schema: { type: "object", properties: { aviso: { type: "string" } }, required: ["aviso"] },
  },
  {
    name: "listar_repeticoes",
    description: "Lista os avisos que se repetem (do prédio atual, ou de todos os prédios da pessoa com todos=true), com a regra e a próxima vez.",
    input_schema: { type: "object", properties: { todos: { type: "boolean" } } },
  },
  {
    name: "parar_repeticao",
    description: "Para um aviso que se repete (código da repetição, de listar_repeticoes). Tira também a próxima vez já agendada. Com todos_os_predios=true para em todos os prédios onde foi criada junto.",
    input_schema: { type: "object", properties: { codigo: { type: "string" }, todos_os_predios: { type: "boolean" } }, required: ["codigo"] },
  },
  {
    name: "salvar_preferencia",
    description: "Guarda uma preferência do prédio (ex: chave 'sem_data' valor 'lembrar_30d'; 'assinatura' 'Síndica Michelli').",
    input_schema: { type: "object", properties: { chave: { type: "string" }, valor: { type: "string" } }, required: ["chave", "valor"] },
  },
  {
    name: "registrar_ocorrencia",
    description: "Avisa o Jeferson (responsável da EXA) de um problema: numero_desconhecido (com nome, se é síndico/gestor e de qual prédio), recusa, erro, dificuldade, reclamacao.",
    input_schema: { type: "object", properties: { tipo: { type: "string" }, descricao: { type: "string" } }, required: ["tipo", "descricao"] },
  },
  {
    name: "enviar_contato_sofia",
    description: "Envia o cartão de contato da Sofia (comercial da EXA) para quem quer anunciar ou vender algo.",
    input_schema: { type: "object", properties: {} },
  },
];

// Rascunho NAO fica guardado: se o sindico nao publicou, nao gostou.
// Ao criar algo novo numa nova mensagem, os rascunhos que essa pessoa deixou antes sao descartados
// (os criados nesta mesma resposta continuam, para ela escolher entre eles).
async function descartarAnteriores(c: Contexto, buildingId: string) {
  const ate = new Date(c.inicio || Date.now()).toISOString();
  await c.sb.from("nando_avisos").update({ status: "removido", removido_por: "rascunho não publicado (descartado)", removido_em: new Date().toISOString() })
    .eq("building_id", buildingId).eq("status", "rascunho").eq("criado_por_tel", telefoneCanonico(c.tel)).lt("created_at", ate);
}
async function descartarTodosDaPessoa(c: Contexto): Promise<number> {
  const { data } = await c.sb.from("nando_avisos").update({ status: "removido", removido_por: "rascunho cancelado pelo síndico", removido_em: new Date().toISOString() })
    .eq("status", "rascunho").eq("criado_por_tel", telefoneCanonico(c.tel)).select("id");
  return (data || []).length;
}
async function descartarRascunhos(c: Contexto, buildingId: string) {
  const { data } = await c.sb.from("nando_avisos").select("id").eq("building_id", buildingId).eq("status", "rascunho")
    .lt("created_at", new Date(Date.now() - 86400000).toISOString());
  const ids = (data || []).map((a: any) => a.id);
  if (ids.length) await c.sb.from("nando_avisos").update({ status: "removido", removido_por: "rascunho descartado", removido_em: new Date().toISOString() }).in("id", ids);
}

async function avisosAtivos(c: Contexto, buildingId: string) {
  const { count } = await c.sb.from("nando_avisos").select("id", { count: "exact", head: true })
    .eq("building_id", buildingId).in("status", ["no_ar", "agendado"]);
  return count || 0;
}

// prédios-alvo a partir de nomes/códigos (aceita "todos") menos os "exceto"
async function resolverAlvos(c: Contexto, lista: unknown, exceto: unknown): Promise<Predio[]> {
  const nomes = (Array.isArray(lista) ? lista : []).map((x) => String(x));
  const todos = c.admin ? await todosPredios(c.sb) : c.predios;
  let alvos: Predio[] = [];
  if (nomes.some((n) => /^(todos|todos os meus|all)$/i.test(n.trim()))) alvos = [...todos];
  else for (const n of nomes) { const p = await predioDoCodigo(c, n); if (!alvos.some((x) => x.id === p.id)) alvos.push(p); }
  const fora: string[] = [];
  for (const n of (Array.isArray(exceto) ? exceto : []).map((x) => String(x))) fora.push((await predioDoCodigo(c, n)).id);
  return alvos.filter((p) => !fora.includes(p.id));
}

// avisos do mesmo grupo de prédios (publicados juntos), que a pessoa pode mexer
async function doLote(c: Contexto, a: any, filtro?: Predio[]): Promise<any[]> {
  if (!a.conteudo?.lote) return [a];
  const { data } = await c.sb.from("nando_avisos").select("*").eq("conteudo->>lote", a.conteudo.lote).in("status", ["no_ar", "agendado", "erro"]);
  const pode = c.admin ? null : new Set(c.predios.map((p) => p.id));
  let rows = (data || []).filter((r: any) => !pode || pode.has(r.building_id));
  // na serie, o grupo e por cartao: fica so o mesmo cartao (parte) em cada predio
  rows = rows.filter((r: any) => (r.conteudo?.parte || 1) === (a.conteudo?.parte || 1) || !a.conteudo?.serie);
  if (filtro?.length) rows = rows.filter((r: any) => filtro.some((p) => p.id === r.building_id));
  return rows.length ? rows : [a];
}

// copia do aviso do Nando para outro predio: troca a assinatura padrao pela do predio novo
async function ajustarAssinatura(c: Contexto, copia: any, origemNome: string, p: Predio) {
  if (copia.tipo !== "nando" || !copia.conteudo?.arquivo_url) return copia;
  const r = await fetch(copia.conteudo.arquivo_url); if (!r.ok) return copia;
  const dados = await r.json();
  // troca o nome do predio de origem pelo do predio novo onde quer que apareca ("Administração do Edifício X" -> "... Y");
  // assinatura sem o nome do predio (ex: "Síndica Michelli") fica como esta
  const ass = String(dados.assinatura || "");
  const esc = origemNome.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!origemNome.trim() || !new RegExp(esc, "i").test(ass)) return copia;
  dados.assinatura = ass.replace(new RegExp(esc, "ig"), p.nome);
  const url = await salvarArquivo(c, `avisos/${copia.id}.nando.json`, new TextEncoder().encode(JSON.stringify(dados)), "application/json");
  const conteudo = { ...copia.conteudo, arquivo_url: url, campos: { ...(copia.conteudo.campos || {}), assinatura: dados.assinatura } };
  await c.sb.from("nando_avisos").update({ conteudo }).eq("id", copia.id);
  return { ...copia, conteudo };
}

// ---------------- avisos que se repetem
const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
function horaOk(h: unknown) { const m = /^(\d{1,2})(?::|h)?(\d{2})?$/.exec(String(h || "").trim()); if (!m) return null; const hh = +m[1], mm = +(m[2] || 0); return hh < 24 && mm < 60 ? `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}` : null; }
export function regraTexto(r: any): string {
  const q = r.frequencia === "diaria" ? "todo dia" : r.frequencia === "mensal" ? `todo dia ${r.dia_mes}` :
    `toda ${(r.dias_semana || []).map((d: number) => DIAS[d]).join(", ")}`.replace("toda sábado", "todo sábado").replace("toda domingo", "todo domingo");
  return `${q}, das ${r.hora_inicio} às ${r.hora_fim}${r.ate ? ` (até ${String(r.ate).split("-").reverse().join("/")})` : ""}`;
}
// proxima vez (inicio/fim) depois de "depois"
export function proximaVez(r: any, depois: Date | null): { inicio: Date; fim: Date } | null {
  const agora = new Date();
  const hoje = horaLocalIso(agora).slice(0, 10);
  for (let k = 0; k < 62; k++) {
    const dia = new Date(new Date(`${hoje}T12:00:00-03:00`).getTime() + k * 86400000);
    const ymd = horaLocalIso(dia).slice(0, 10);
    if (r.ate && ymd > r.ate) return null;
    const ds = new Date(`${ymd}T12:00:00-03:00`).getUTCDay(), dm = +ymd.slice(8, 10);
    const casa = r.frequencia === "diaria" || (r.frequencia === "semanal" && (r.dias_semana || []).includes(ds)) || (r.frequencia === "mensal" && dm === +r.dia_mes);
    if (!casa) continue;
    const inicio = new Date(`${ymd}T${r.hora_inicio}:00-03:00`);
    let fim = new Date(`${ymd}T${r.hora_fim}:00-03:00`);
    if (fim <= inicio) fim = new Date(fim.getTime() + 86400000);
    if (fim <= agora) continue;
    if (depois && inicio <= depois) continue;
    return { inicio, fim };
  }
  return null;
}
function validarRegra(r: any): string | null {
  if (!r || !["diaria", "semanal", "mensal"].includes(r.frequencia)) return "frequência inválida (diaria, semanal ou mensal)";
  r.hora_inicio = horaOk(r.hora_inicio); r.hora_fim = horaOk(r.hora_fim);
  if (!r.hora_inicio || !r.hora_fim) return "informe hora_inicio e hora_fim no formato HH:MM";
  if (r.frequencia === "semanal") { r.dias_semana = (r.dias_semana || []).map(Number).filter((d: number) => d >= 0 && d <= 6); if (!r.dias_semana.length) return "informe os dias da semana (0=domingo..6=sábado)"; }
  if (r.frequencia === "mensal") { r.dia_mes = Math.round(Number(r.dia_mes)); if (!(r.dia_mes >= 1 && r.dia_mes <= 28)) return "dia do mês entre 1 e 28"; }
  if (r.ate && !/^\d{4}-\d{2}-\d{2}$/.test(r.ate)) return "data final no formato AAAA-MM-DD";
  return null;
}
// cria (e publica com data de inicio/fim) a proxima vez de cada repeticao que comeca nas proximas 24 h
export async function gerarOcorrencias(sb: SupabaseClient, soEstas?: string[]): Promise<string[]> {
  let q = sb.from("nando_recorrencias").select("*").eq("ativo", true);
  if (soEstas?.length) q = q.in("id", soEstas);
  const { data: recs } = await q;
  const log: string[] = [];
  for (const r of recs || []) {
    try {
      const prox = proximaVez(r.regra, r.ultima_inicio ? new Date(r.ultima_inicio) : null);
      if (!prox) { await sb.from("nando_recorrencias").update({ ativo: false }).eq("id", r.id); log.push(`repetição ${idCurto(r.id)} terminou`); continue; }
      if (prox.inicio.getTime() - Date.now() > 24 * 3600000) continue;
      const { data: modelos } = await sb.from("nando_avisos").select("*").eq("conteudo->>modelo_rep", r.id);
      if (!modelos?.length) { await sb.from("nando_recorrencias").update({ ativo: false }).eq("id", r.id); continue; }
      const c: Contexto = { sb, tel: r.criado_por_tel || "", nomePessoa: r.criado_por_nome || "", admin: true, predios: [], predioAtual: null, midias: {}, registros: [] };
      const p = await predioPorId(c, r.building_id);
      for (const m of modelos.sort((x: any, y: any) => (x.conteudo?.parte || 0) - (y.conteudo?.parte || 0))) {
        const { conteudo } = m;
        const { data: linha, error } = await sb.from("nando_avisos").insert({ ...m, id: undefined, created_at: undefined, updated_at: undefined, arquivo: null, status: "rascunho",
          removido_por: null, removido_em: null, inicio: prox.inicio.toISOString(), fim: prox.fim.toISOString(), lembrar_em: null,
          conteudo: { ...conteudo, modelo_rep: undefined, ocorrencia_de: r.id, ...(r.lote ? { lote: `${r.lote}:${prox.inicio.toISOString()}` } : {}) } }).select("*").single();
        if (error) throw error;
        const arquivo = await publicarEm(c, linha, p);
        const st = prox.inicio > new Date(Date.now() + 60000) ? "agendado" : "no_ar";
        await sb.from("nando_avisos").update({ arquivo, status: st }).eq("id", linha.id);
        await historico(sb, linha.id, "Nando (repetição)", "publicou", { predio: p.nome, repeticao: idCurto(r.id) });
      }
      await sb.from("nando_recorrencias").update({ ultima_inicio: prox.inicio.toISOString() }).eq("id", r.id);
      log.push(`repetição ${idCurto(r.id)}: ${p.nome} ${fmtData(prox.inicio)}`);
    } catch (err) {
      log.push(`repetição ${idCurto(r.id)} falhou: ${(err as Error).message}`);
      await registrarOcorrencia(sb, { tipo: "erro_publicacao", telefone: r.criado_por_tel || "", nome: r.criado_por_nome || "", building_id: r.building_id, descricao: `Repetição ${idCurto(r.id)} não publicou: ${(err as Error).message}` }).catch(() => {});
    }
  }
  return log;
}

async function publicarEm(c: Contexto, a: any, p: Predio): Promise<string> {
  // arquivo final
  let bytes: Uint8Array, mime: string, ext: string;
  if (a.tipo === "nando") {
    const r = await fetch(a.conteudo.arquivo_url); if (!r.ok) throw new Error("arquivo do aviso indisponível");
    bytes = await pngComAviso(await r.json()); mime = "image/png"; ext = "png";
  } else {
    const r = await fetch(a.origem_url); if (!r.ok) throw new Error("arquivo do aviso indisponível");
    bytes = new Uint8Array(await r.arrayBuffer());
    mime = a.tipo === "pdf" ? "application/pdf" : (r.headers.get("content-type") || "image/jpeg");
    ext = a.tipo === "pdf" ? "pdf" : (mime.includes("png") ? "png" : "jpg");
  }
  const nome = `nando_${slug(a.titulo)}_${carimbo()}.${ext}`;
  await enviarAoPainel(p.cliente_id, { nome, bytes, mime }, {
    titulo: tituloPainel(a.titulo, a.segundos), data_ini: dataApi(a.inicio, "inicio"), data_fim: dataApi(a.fim, "fim"),
  });
  return nome;
}

type Saida = string | { texto: string; blocos: any[] };
// numero sem cadastro: procura contatos com os mesmos 8 ultimos digitos (ex: DDD 45 digitado no lugar de 41)
async function cadastrosParecidos(sb: SupabaseClient, tel: string): Promise<string[]> {
  const fim = String(tel).replace(/\D/g, "").slice(-8);
  if (fim.length < 8) return [];
  const { data } = await sb.from("buildings").select("nome,nome_sindico,contato_sindico,contato_sindico_telefone,nome_vice_sindico,contato_vice_sindico,nome_contato_predio,numero_contato_predio").eq("status", "ativo");
  const out: string[] = [];
  for (const b of data || []) {
    for (const [papel, n, t] of [["síndico", b.nome_sindico, b.contato_sindico], ["síndico", b.nome_sindico, b.contato_sindico_telefone], ["vice", b.nome_vice_sindico, b.contato_vice_sindico], ["contato do prédio", b.nome_contato_predio, b.numero_contato_predio]] as [string, string | null, string | null][]) {
      if (t && String(t).replace(/\D/g, "").slice(-8) === fim) out.push(`${String(b.nome).trim()} (${papel}${n ? " " + n : ""}: ${t})`);
    }
  }
  return out.slice(0, 5);
}

export async function executar(c: Contexto, nome: string, e: any): Promise<Saida> {
  const sb = c.sb;
  // aviso pensado para varios predios: guarda os destinos no rascunho (a previa mostra todos; publicar usa a lista)
  if (nome.startsWith("criar_") && Array.isArray(e?.predios) && e.predios.length) {
    const ds = await resolverAlvos(c, e.predios, e.exceto);
    if (ds.length > 1) e.__destinos = ds.map((x) => ({ id: x.id, nome: x.nome }));
  }
  switch (nome) {
    case "escolher_predio": {
      const p = await predioDoCodigo(c, e.codigo);
      c.predioAtual = p;
      await sb.from("nando_estado").upsert({ telefone: telefoneCanonico(c.tel), building_id: p.id, confirmado: true, updated_at: new Date().toISOString() });
      await sincronizarLegado(sb, p);
      c.registros.push(`prédio escolhido: ${p.nome} (${p.codigo})`);
      return `Prédio atual: ${p.nome} (código ${p.codigo}).`;
    }
    case "listar_predios": {
      const lista = c.admin ? await todosPredios(sb) : c.predios;
      if (!lista.length) return "Nenhum prédio ligado a este número.";
      const { data: noAr } = await sb.from("nando_avisos").select("building_id").eq("status", "no_ar").in("building_id", lista.map((x) => x.id));
      const cont = new Map<string, number>();
      for (const a of noAr || []) cont.set(a.building_id, (cont.get(a.building_id) || 0) + 1);
      return `${lista.length} prédio(s):\n` + lista.map((x) => `- ${x.nome} (código ${x.codigo})${cont.get(x.id) ? ` · ${cont.get(x.id)} aviso(s) do Nando no ar` : ""}`).join("\n") +
        "\n(Ao responder no WhatsApp, mande a lista inteira, um prédio por linha, com o código.)";
    }
    case "listar_avisos": {
      const p = c.predioAtual; if (!p) return "Nenhum prédio escolhido ainda.";
      await sincronizarLegado(sb, p);
      // a verdade e o que esta na pasta do painel: aviso do Nando "no ar" sem arquivo la = problema
      const arquivosPainel = await listarArquivosPainel(p.cliente_id).catch(() => null);
      if (arquivosPainel) {
        const { data: ativos } = await sb.from("nando_avisos").select("id,arquivo,conteudo").eq("building_id", p.id).in("status", ["no_ar", "agendado"]);
        for (const x of ativos || []) {
          if (x.conteudo?.legado) continue;
          if (!x.arquivo || !arquivosPainel.includes(nomeBase(x.arquivo))) {
            await sb.from("nando_avisos").update({ status: "erro", erro: "o arquivo não está na pasta do painel" }).eq("id", x.id);
          }
        }
      }
      // rascunhos nunca entram na lista
      await descartarRascunhos(c, p.id);
      const { data } = await sb.from("nando_avisos").select("*").eq("building_id", p.id)
        .in("status", ["no_ar", "agendado", "erro"]).order("created_at");
      if (!data?.length) {
        const { data: antigos } = await sb.from("nando_avisos").select("titulo").eq("building_id", p.id).eq("status", "encerrado").is("conteudo->>modelo_rep", null).order("created_at", { ascending: false }).limit(5);
        return `${p.nome}: nenhum aviso aparecendo no painel agora (a tela mostra "sem avisos no momento").` +
          (antigos?.length ? ` Avisos antigos já encerrados (não aparecem mais; só cite se perguntarem): ${antigos.map((a: any) => a.titulo).join(", ")}.` : "");
      }
      const rot: Record<string, string> = { no_ar: "No ar (confirmado no painel)", agendado: "Agendados", rascunho: "Rascunhos (ainda não publicados)", erro: "Com problema (NÃO estão no painel)" };
      const blocos: string[] = [];
      for (const st of ["no_ar", "agendado", "erro"]) {
        const grupo = data.filter((a: any) => a.status === st);
        if (!grupo.length) continue;
        blocos.push(`*${rot[st]} – ${p.nome}*\n` + grupo.map((a: any, n: number) =>
          `${n + 1}. ${a.titulo} — ${a.segundos}s na tela · ${st === "agendado" ? `começa ${fmtData(a.inicio)} · ` : ""}${a.fim ? `sai ${fmtData(a.fim)}` : "sem data de saída"}${a.lembrar_em ? ` · lembrete ${fmtData(a.lembrar_em)}` : ""}` +
          `   {código interno ${idCurto(a.id)}; criado por ${a.criado_por_nome || "?"}${a.conteudo?.incerto ? "; NÃO CONFIRMADO na lista oficial do painel" : ""}}`,
        ).join("\n"));
      }
      return blocos.join("\n\n") + "\n\n(Mostre ao síndico exatamente nesse formato, um abaixo do outro, SEM o trecho entre chaves {…}. Não fale de rascunhos nem ofereça publicar avisos antigos não publicados.)";
    }
    case "criar_aviso_nando": {
      const p = c.predioAtual; if (!p) return "Escolha o prédio primeiro (escolher_predio).";
      await descartarAnteriores(c, p.id);
      let foto: string | null = null;
      if (e.midia_id) {
        const m = c.midias[e.midia_id] || await midiaSalva(c, e.midia_id);
        if (!m || !m.mime.startsWith("image/")) return "midia_id não é uma foto válida.";
        const r = await fetch(m.url);
        foto = `data:${m.mime};base64,` + bytesParaB64(new Uint8Array(await r.arrayBuffer()));
      }
      const icCache = new Map<string, string | null>();
      const icone = async (t: string) => { const k = ICONES[t] ? t : "megafone"; if (!icCache.has(k)) icCache.set(k, await iconeDataUrl(k)); return icCache.get(k) || undefined; };
      const itensDe = async (lista: any) => Array.isArray(lista) && lista.length
        ? await Promise.all(lista.slice(0, 6).map(async (it: any) => ({ icone: await icone(String(it?.tema || "")), texto: String(it?.texto || "").slice(0, 90) })))
        : undefined;
      // QR code para o documento original (abre no celular)
      let qr: string | undefined, qrAlvo = "";
      if (e.qr_midia_id) {
        const mq = c.midias[e.qr_midia_id] || await midiaSalva(c, e.qr_midia_id);
        if (!mq) return "qr_midia_id não encontrado. Use o midia_id do arquivo que a pessoa mandou.";
        qrAlvo = mq.url;
      } else if (/^https:\/\/\S+$/i.test(String(e.qr_url || ""))) qrAlvo = String(e.qr_url);
      if (qrAlvo) qr = await qrDataUrl(qrAlvo);
      const qrLegenda = qr ? String(e.qr_legenda || "Aponte a câmera e veja o documento completo").slice(0, 60) : undefined;

      // SERIE: varios cartoes com um visual so, publicados juntos
      if (Array.isArray(e.cartoes) && e.cartoes.length > 1) {
        const r = await criarSerie(c, p, e, { icone, foto, qr, qrAlvo, qrLegenda });
        if (typeof r === "string") return r;
        const link = await criarPrevia(c, r.criados[0].id);
        const ativos = await avisosAtivos(c, p.id);
        return `Série de ${r.criados.length} cartões criada (vão ao ar JUNTOS, um depois do outro; para publicar use o código do cartão 1: ${idCurto(r.criados[0].id)}).\n` +
          `Itens incluídos no total: ${r.totalItens} (o sistema distribuiu entre os cartões para caber; o QR fica num cartão com menos itens). Confira com o documento original antes de dizer que está tudo.\n` +
          `Link da prévia com os cartões lado a lado (vale 10 min): ${link}\nAvisos já no ar neste prédio: ${ativos}; com a série ficam ${ativos + r.criados.length} no rodízio.`;
      }

      // lista maior que um cartao (ou que nao cabe junto com o QR): vira serie automaticamente
      const qtdItens = Array.isArray(e.itens) ? e.itens.length : 0;
      if (qtdItens > (qr ? 4 : 6)) {
        const r = await criarSerie(c, p, { ...e, cartoes: undefined }, { icone, foto, qr, qrAlvo, qrLegenda });
        if (typeof r === "string") return r;
        const link = await criarPrevia(c, r.criados[0].id);
        return `Eram ${qtdItens} itens: virou uma série de ${r.criados.length} cartões (vão ao ar juntos; publicar com o código ${idCurto(r.criados[0].id)}). Link da prévia (vale 10 min): ${link}`;
      }
      // sempre 3 variacoes para o sindico escolher (o mesmo texto, visuais diferentes, salvo se a variacao trouxer outro texto)
      const itensUnico = await itensDe(e.itens);
      const vars: any[] = (Array.isArray(e.variacoes) && e.variacoes.length ? e.variacoes : [{}]).slice(0, 3);
      while (vars.length < 3) vars.push({ ...vars[vars.length - 1], _sem_foto: vars.length === 2 });
      const grupo = crypto.randomUUID();
      const ini = parseData(e.inicio), fim = parseData(e.fim);
      const criados: any[] = [];
      for (let n = 0; n < vars.length; n++) {
        const v = vars[n] || {};
        const tema = ICONES[v.tema] ? v.tema : ICONES[e.tema] ? e.tema : "megafone";
        const cor = /^#[0-9a-f]{6}$/i.test(v.cor || e.cor || "") ? (v.cor || e.cor) : ICONES[tema].cor;
        const dados: any = {
          v: 1, titulo: String(v.titulo || e.titulo || "").slice(0, 60), quando: (v.quando || e.quando) ? String(v.quando || e.quando).slice(0, 60) : undefined,
          texto: String(v.texto || e.texto || "").slice(0, 160), assinatura: e.assinatura || `Administração do ${p.nome}`,
          cor, icone: await icone(tema), foto: foto || undefined, itens: itensUnico, qr, qr_legenda: qrLegenda,
        };
        if (!foto && n === 2) {
          // a 3a opcao e sempre um wallpaper abstrato (nitido, sem foto)
          dados.fundo = (await wallpaper(cor)) || (await fundoGradiente(cor)) || undefined;
          dados.fundo_nitido = true;
        } else if (!foto) {
          const busca = v._sem_foto ? null : (v.busca_foto || e.busca_foto);
          const f = busca ? (await fotoPixabay(String(busca))) : null;
          // o credito NAO entra no aviso (tela limpa); fica registrado e aparece so na pagina de previa
          if (f) { dados.fundo = f.url; v._credito = f.credito; }
          else dados.fundo = (await fundoGradiente(cor)) || undefined;
        }
        const { data: a, error } = await sb.from("nando_avisos").insert({
          building_id: p.id, cliente_id: p.cliente_id, tipo: "nando", titulo: dados.titulo, status: "rascunho",
          segundos: clampSeg(e.segundos), inicio: (ini || new Date()).toISOString(), fim: fim ? fim.toISOString() : null,
          lembrar_em: e.lembrar_dias ? new Date(Date.now() + e.lembrar_dias * 86400000).toISOString() : null,
          criado_por_tel: telefoneCanonico(c.tel), criado_por_nome: c.nomePessoa,
          conteudo: { tema, grupo, opcao: n + 1, credito_foto: v._credito || null, qr_alvo: qrAlvo || null, campos: { ...dados, icone: undefined, fundo: undefined, qr: undefined, itens: (e.itens || []).map((x: any) => x?.texto), foto: e.midia_id || undefined } },
        }).select("*").single();
        if (error) throw error;
        const url = await salvarArquivo(c, `avisos/${a.id}.nando.json`, new TextEncoder().encode(JSON.stringify(dados)), "application/json");
        await sb.from("nando_avisos").update({ conteudo: { ...a.conteudo, arquivo_url: url } }).eq("id", a.id);
        await historico(sb, a.id, quem(c), `criou rascunho (opção ${n + 1})`);
        criados.push(a);
      }
      const link = await criarPrevia(c, criados[0].id);
      const ativos = await avisosAtivos(c, p.id);
      c.registros.push(`3 opções criadas: ${criados.map((a, n) => `opção ${n + 1} = [${idCurto(a.id)}]`).join(", ")}`);
      return `3 opções criadas (o síndico escolhe uma e as outras são descartadas):\n` +
        criados.map((a, n) => `Opção ${n + 1} = código ${idCurto(a.id)}`).join("\n") +
        `\nLink único de prévia com as 3 opções lado a lado (vale 10 min): ${link}\nAvisos já no ar neste prédio: ${ativos}${ativos === 0 ? " (este será o único: não fale de segundos de tela)" : ""}.`;
    }
    case "criar_aviso_arquivo": {
      const p = c.predioAtual; if (!p) return "Escolha o prédio primeiro (escolher_predio).";
      await descartarAnteriores(c, p.id);
      const a = await criarArquivoOriginal(c, p, e);
      if (typeof a === "string") return a;
      const link = await criarPrevia(c, a.id);
      const ativos = await avisosAtivos(c, p.id);
      return `Rascunho criado [${idCurto(a.id)}]. Link de prévia (vale 10 min): ${link}\nAvisos já no ar neste prédio: ${ativos}${ativos === 0 ? " (este será o único: não fale de segundos de tela)" : ""}.`;
    }
    case "criar_opcoes_documento": {
      const p = c.predioAtual; if (!p) return "Escolha o prédio primeiro (escolher_predio).";
      await descartarAnteriores(c, p.id);
      const m = c.midias[e.midia_id] || await midiaSalva(c, String(e.midia_id || ""));
      if (!m) return "Não encontrei esse arquivo (midia_id). Peça para a pessoa mandar de novo.";
      const proposta = crypto.randomUUID();
      const opcoes: { n: number; rotulo: string; codigo: string; qtd: number }[] = [];
      let n = 0;
      const itens = Array.isArray(e.itens) ? e.itens.filter((x: any) => String(x?.texto || "").trim()) : [];
      // opcao: cartoes com TODOS os itens (regras/listas)
      if (itens.length) {
        const vis = await prepararVisual(c, e, e.midia_id);
        if (typeof vis === "string") return vis;
        n++;
        const r = await criarSerie(c, p, { ...e, cartoes: undefined, itens, texto: undefined }, vis, { proposta, opcao_proposta: n, rotulo_opcao: "" });
        if (typeof r === "string") return r;
        const rotulo = r.criados.length > 1 ? `Em ${r.criados.length} cartões (${r.totalItens} itens)` : `Em 1 cartão (${r.totalItens} itens)`;
        for (const a of r.criados) await sb.from("nando_avisos").update({ conteudo: { ...a.conteudo, rotulo_opcao: rotulo } }).eq("id", a.id);
        opcoes.push({ n, rotulo, codigo: idCurto(r.criados[0].id), qtd: r.criados.length });
      }
      // opcao: resumo com QR do documento completo
      if (e.resumo?.titulo) {
        const vis = await prepararVisual(c, e, e.midia_id);
        if (typeof vis === "string") return vis;
        n++;
        const rotulo = "Resumo + QR do documento";
        const r = await criarSerie(c, p, { ...e, cartoes: undefined, itens: undefined, titulo: e.resumo.titulo, quando: e.resumo.quando, texto: e.resumo.texto }, vis, { proposta, opcao_proposta: n, rotulo_opcao: rotulo });
        if (typeof r === "string") return r;
        opcoes.push({ n, rotulo, codigo: idCurto(r.criados[0].id), qtd: 1 });
      }
      // opcao: o arquivo original, do jeito que veio
      n++;
      const orig = await criarArquivoOriginal(c, p, { ...e, titulo: e.titulo_original || e.titulo }, { proposta, opcao_proposta: n, rotulo_opcao: m.mime.includes("pdf") ? "PDF original" : "Imagem original" });
      if (typeof orig === "string") return orig;
      opcoes.push({ n, rotulo: m.mime.includes("pdf") ? "PDF original (letras menores)" : "Imagem original (letras menores)", codigo: idCurto(orig.id), qtd: 1 });
      // a previa abre na primeira opcao e mostra todas
      const { data: primeira } = await sb.from("nando_avisos").select("id").eq("conteudo->>proposta", proposta).eq("conteudo->>opcao_proposta", "1").limit(1);
      const link = await criarPrevia(c, primeira?.[0]?.id || orig.id);
      const ativos = await avisosAtivos(c, p.id);
      c.registros.push(`opções do documento: ${opcoes.map((o) => `opção ${o.n} = ${o.rotulo} [${o.codigo}]`).join("; ")}`);
      return `Opções criadas para o síndico escolher (todas na mesma prévia):\n` + opcoes.map((o) => `Opção ${o.n}: ${o.rotulo} → publicar com o código ${o.codigo}${o.qtd > 1 ? ` (publica os ${o.qtd} cartões juntos)` : ""}`).join("\n") +
        `\nLink da prévia (vale 10 min): ${link}\nAvisos já no ar neste prédio: ${ativos}. Pergunte só "qual opção você quer?" (ele pode escolher mais de uma).`;
    }
    case "publicar_aviso": {
      const a = await acharAviso(c, e.aviso);
      if (!["rascunho", "erro"].includes(a.status)) return `Esse aviso já está ${a.status}.`;
      // serie: todos os cartoes vao juntos, na ordem
      let bases: any[] = [a];
      if (a.conteudo?.serie && a.conteudo?.grupo) {
        const { data: irmaos } = await sb.from("nando_avisos").select("*").eq("conteudo->>grupo", a.conteudo.grupo).in("status", ["rascunho", "erro"]);
        bases = (irmaos || []).sort((x: any, y: any) => (x.conteudo?.parte || 0) - (y.conteudo?.parte || 0));
      }
      let alvos: Predio[] = [];
      if (Array.isArray(e.predios) && e.predios.length) alvos = await resolverAlvos(c, e.predios, e.exceto);
      else if (Array.isArray(a.conteudo?.destinos) && a.conteudo.destinos.length) for (const d of a.conteudo.destinos) alvos.push(await predioPorId(c, d.id));
      else alvos.push(await predioPorId(c, a.building_id));
      if (!alvos.length) return "Nenhum prédio sobrou para publicar (confira a lista e o 'exceto').";
      const origem = await predioPorId(c, a.building_id).catch(() => null);
      const lote = alvos.length > 1 ? crypto.randomUUID() : null;
      const res: string[] = [];
      const publicados: { id: string; url: string; predio: string; parte: number }[] = [];
      if (e.repetir) {
        const regra = { ...e.repetir };
        const erroRegra = validarRegra(regra);
        if (erroRegra) return `Não criei a repetição: ${erroRegra}.`;
        const loteRep = alvos.length > 1 ? crypto.randomUUID() : null;
        const ids: string[] = [];
        for (const p of alvos) {
          const recId = crypto.randomUUID();
          for (const base of bases) {
            let m = base;
            if (p.id !== base.building_id) {
              const { data: copia } = await sb.from("nando_avisos").insert({ ...base, id: undefined, building_id: p.id, cliente_id: p.cliente_id, created_at: undefined, updated_at: undefined }).select("*").single();
              m = await ajustarAssinatura(c, copia, origem?.nome || "", p);
            }
            await sb.from("nando_avisos").update({ status: "encerrado", removido_por: "modelo de repetição", conteudo: { ...m.conteudo, modelo_rep: recId } }).eq("id", m.id);
          }
          const { error } = await sb.from("nando_recorrencias").insert({ id: recId, building_id: p.id, modelo_id: bases[0].id, regra, criado_por_tel: telefoneCanonico(c.tel), criado_por_nome: c.nomePessoa, lote: loteRep });
          if (error) { res.push(`${p.nome}: ERRO ao criar a repetição (${error.message})`); continue; }
          ids.push(recId);
          const prox = proximaVez(regra, null);
          res.push(`${p.nome}: repetição [${idCurto(recId)}] criada, ${regraTexto(regra)}; próxima vez ${prox ? fmtData(prox.inicio) : "—"}`);
        }
        const feitos = await gerarOcorrencias(sb, ids);
        c.registros.push(`repetição criada: ${res.join("; ")}${feitos.length ? ` | ${feitos.join("; ")}` : ""}`);
        return res.join("\n") + "\n(O Nando coloca e tira sozinho em cada vez; cada vez é publicada até 24 h antes, com hora para aparecer e sumir.)";
      }
      for (const p of alvos) {
        if (await avisosAtivos(c, p.id) + bases.length > LIMITE_AVISOS) { res.push(`${p.nome}: NÃO publicado (passaria de ${LIMITE_AVISOS} avisos no ar; tire algum antes)`); continue; }
        for (const base of bases) {
        let linha = base;
        if (p.id !== base.building_id) {
          const { data: copia } = await sb.from("nando_avisos").insert({ ...base, id: undefined, building_id: p.id, cliente_id: p.cliente_id, created_at: undefined, updated_at: undefined,
            conteudo: { ...base.conteudo, ...(lote ? { lote } : {}) } }).select("*").single();
          linha = await ajustarAssinatura(c, copia, origem?.nome || "", p);
        } else if (lote) {
          linha = { ...base, conteudo: { ...base.conteudo, lote } };
          await sb.from("nando_avisos").update({ conteudo: linha.conteudo }).eq("id", base.id);
        }
        try {
          const arquivo = await publicarEm(c, linha, p);
          const st = new Date(linha.inicio) > new Date(Date.now() + 60000) ? "agendado" : "no_ar";
          await sb.from("nando_avisos").update({ arquivo, status: st, erro: null }).eq("id", linha.id);
          await historico(sb, linha.id, quem(c), "publicou", { predio: p.nome });
          publicados.push({ id: linha.id, url: linha.conteudo?.arquivo_url, predio: p.nome, parte: linha.conteudo?.parte || 1 });
          res.push(`${p.nome}: "${linha.titulo}" ${st === "agendado" ? `agendado para ${fmtData(linha.inicio)}` : "publicado e confirmado na pasta do painel (aparece na tela em até ~10 min)"} [${idCurto(linha.id)}]`);
        } catch (err) {
          await sb.from("nando_avisos").update({ status: "erro", erro: (err as Error).message }).eq("id", linha.id);
          await registrarOcorrencia(sb, { tipo: "erro_publicacao", telefone: c.tel, nome: c.nomePessoa, building_id: p.id, descricao: `Falha ao publicar "${linha.titulo}" no ${p.nome}: ${(err as Error).message}` });
          res.push(`${p.nome}: "${linha.titulo}" ERRO ao publicar, NÃO está no painel (o Jeferson já foi avisado)`);
        }
        }
      }
      if (a.conteudo?.grupo && !a.conteudo?.serie) {
        await sb.from("nando_avisos").update({ status: "removido", removido_por: "opção não escolhida", removido_em: new Date().toISOString() })
          .eq("status", "rascunho").eq("conteudo->>grupo", a.conteudo.grupo).neq("id", a.id);
      }
      c.registros.push(`publicação: ${res.join("; ")}`);
      const algumOk = res.some((r) => !/ERRO|NÃO publicado/.test(r));
      return res.join("\n") + (algumOk ? `\n(Depois de confirmar a publicação, PERGUNTE em uma frase: "Quer que eu te mande uma versão em imagem para encaminhar nos grupos de WhatsApp do prédio?". Só se a pessoa disser sim, use enviar_imagem_whatsapp com o código [${idCurto(publicados[0]?.id || a.id)}].)` : "") + (lote ? `\n(Publicado junto em ${alvos.length} prédios: dá para alterar ou tirar de todos de uma vez com todos_os_predios=true.)` : "");
    }
    case "alterar_aviso": {
      const a0 = await acharAviso(c, e.aviso);
      const mud0: any = {};
      if (e.segundos) mud0.segundos = clampSeg(e.segundos);
      if (e.inicio) { const d = parseData(e.inicio); if (d) mud0.inicio = d.toISOString(); }
      if (e.sem_fim) mud0.fim = null; else if (e.fim) { const d = parseData(e.fim); if (d) mud0.fim = d.toISOString(); }
      if (e.lembrar_dias) mud0.lembrar_em = new Date(Date.now() + e.lembrar_dias * 86400000).toISOString();
      if (!Object.keys(mud0).length) return "Nada para alterar.";
      const lista = e.todos_os_predios ? await doLote(c, a0) : [a0];
      const res: string[] = [];
      for (const a of lista) {
        const mud: any = { ...mud0 };
        const p = await predioPorId(c, a.building_id);
        try {
          const novo = { ...a, ...mud };
          // tempo/datas publicados: reenvia com as novas informacoes e so depois tira a versao antiga
          if (["no_ar", "agendado"].includes(a.status) && ("segundos" in mud || "inicio" in mud || "fim" in mud)) {
            if (a.conteudo?.legado) { res.push(`${p.nome}: aviso anterior ao Nando, não dá para mudar tempo/datas (posso criar um novo igual e tirar o antigo)`); continue; }
            const arquivo = await publicarEm(c, novo, p);
            if (a.arquivo) await removerDoPainel(p.cliente_id, [a.arquivo]).catch(() => {});
            mud.arquivo = arquivo;
          }
          await sb.from("nando_avisos").update(mud).eq("id", a.id);
          await historico(sb, a.id, quem(c), "alterou", mud);
          res.push(`${p.nome}: [${idCurto(a.id)}] atualizado (${Object.keys(mud).filter((k) => k !== "arquivo").join(", ")})`);
        } catch (err) { res.push(`${p.nome}: [${idCurto(a.id)}] ERRO ao alterar: ${(err as Error).message}`); }
      }
      c.registros.push(`alteração: ${res.join("; ")}`);
      const outros = !e.todos_os_predios && a0.conteudo?.lote ? (await doLote(c, a0)).length - 1 : 0;
      return res.join("\n") + (outros > 0 ? `\n(Esse aviso também está em mais ${outros} prédio(s) do mesmo grupo; se a pessoa quiser mudar em todos, use todos_os_predios=true.)` : "");
    }
    case "remover_aviso": {
      const a0 = await acharAviso(c, e.aviso);
      let lista = [a0];
      if (e.todos_os_predios || (Array.isArray(e.predios) && e.predios.length)) {
        const filtro = Array.isArray(e.predios) && e.predios.length && !e.todos_os_predios ? await resolverAlvos(c, e.predios, []) : undefined;
        lista = await doLote(c, a0, filtro);
      }
      const res: string[] = [];
      for (const a of lista) {
        if (["removido", "encerrado"].includes(a.status)) continue;
        const p = await predioPorId(c, a.building_id).catch(() => null);
        try {
          if (a.arquivo && a.status !== "rascunho") await removerDoPainel(a.cliente_id, [a.arquivo]);
          await sb.from("nando_avisos").update({ status: "removido", removido_por: quem(c), removido_em: new Date().toISOString() }).eq("id", a.id);
          await historico(sb, a.id, quem(c), "removeu");
          res.push(`${p?.nome || "prédio"}: "${a.titulo}" retirado (some do painel em até ~10 min)`);
        } catch (err) { res.push(`${p?.nome || "prédio"}: "${a.titulo}" ERRO ao tirar: ${(err as Error).message}`); }
      }
      if (!res.length) return "Esse aviso já não está no painel.";
      c.registros.push(`remoção: ${res.join("; ")}`);
      const outros = lista.length === 1 && a0.conteudo?.lote ? (await doLote(c, a0)).filter((r: any) => r.id !== a0.id && ["no_ar", "agendado"].includes(r.status)).length : 0;
      return res.join("\n") + (outros > 0 ? `\n(O mesmo aviso continua em mais ${outros} prédio(s) do grupo; se a pessoa quiser tirar de todos, use todos_os_predios=true.)` : "");
    }
    case "editar_aviso": {
      const a0 = await acharAviso(c, e.aviso);
      if (a0.tipo !== "nando") return "Esse aviso é uma imagem/PDF: para mudar o conteúdo, mande o arquivo novo que eu troco.";
      const lista = e.todos_os_predios ? await doLote(c, a0) : [a0];
      const res: string[] = [];
      for (const a of lista) {
        const p = await predioPorId(c, a.building_id);
        try {
          const r = await fetch(a.conteudo?.arquivo_url); if (!r.ok) throw new Error("arquivo do aviso indisponível");
          const dados = await r.json();
          if (e.titulo) dados.titulo = String(e.titulo).slice(0, 60);
          if (e.quando !== undefined) dados.quando = String(e.quando).slice(0, 60) || undefined;
          if (e.texto !== undefined) dados.texto = String(e.texto).slice(0, 160) || undefined;
          if (e.assinatura) dados.assinatura = String(e.assinatura).slice(0, 60);
          if (Array.isArray(e.itens)) {
            const icones = (dados.itens || []).map((x: any) => x?.icone);
            dados.itens = e.itens.map((t: unknown, i: number) => ({ icone: icones[i] || icones[0] || dados.icone, texto: String(t).slice(0, 90) }));
          }
          const url = await salvarArquivo(c, `avisos/${a.id}.${Date.now()}.nando.json`, new TextEncoder().encode(JSON.stringify(dados)), "application/json");
          const titulo = e.titulo ? (a.conteudo?.serie ? `${dados.titulo} (${a.conteudo.parte}/${a.conteudo.total})` : dados.titulo).slice(0, 70) : a.titulo;
          const conteudo = { ...a.conteudo, arquivo_url: url, campos: { ...(a.conteudo?.campos || {}), titulo: dados.titulo, quando: dados.quando, texto: dados.texto, assinatura: dados.assinatura } };
          const mud: any = { conteudo, titulo };
          if (["no_ar", "agendado"].includes(a.status)) {
            const arquivo = await publicarEm(c, { ...a, ...mud }, p);
            if (a.arquivo) await removerDoPainel(p.cliente_id, [a.arquivo]).catch(() => {});
            mud.arquivo = arquivo;
          }
          await sb.from("nando_avisos").update(mud).eq("id", a.id);
          await historico(sb, a.id, quem(c), "editou o texto");
          res.push(`${p.nome}: [${idCurto(a.id)}] "${titulo}" ${["no_ar", "agendado"].includes(a.status) ? "atualizado no painel (a versão nova aparece em até ~10 min)" : "rascunho atualizado"}`);
        } catch (err) { res.push(`${p.nome}: [${idCurto(a.id)}] ERRO ao editar: ${(err as Error).message}`); }
      }
      c.registros.push(`edição: ${res.join("; ")}`);
      const outros = !e.todos_os_predios && a0.conteudo?.lote ? (await doLote(c, a0)).length - 1 : 0;
      const link = a0.status === "rascunho" ? `\nNova prévia (10 min): ${await criarPrevia(c, a0.id)}` : "";
      return res.join("\n") + link + (outros > 0 ? `\n(O mesmo aviso está em mais ${outros} prédio(s) do grupo; para mudar em todos, use todos_os_predios=true.)` : "");
    }
    case "enviar_imagem_whatsapp": {
      const a = await acharAviso(c, e.aviso);
      const p = await predioPorId(c, a.building_id);
      const legenda = `📢 Aviso do ${p.nome} — pode encaminhar nos grupos do condomínio.`;
      if (a.tipo === "imagem" && a.origem_url) { await enviarImagem(sb, c.tel, a.origem_url, legenda); c.registros.push(`imagem do aviso ${idCurto(a.id)} enviada`); return "Imagem enviada agora."; }
      if (a.tipo === "pdf" && a.origem_url) { await enviarDocumento(sb, c.tel, a.origem_url, `${slug(a.titulo) || "aviso"}.pdf`, legenda); c.registros.push(`PDF do aviso ${idCurto(a.id)} enviado`); return "PDF enviado agora."; }
      let lista: any[] = [a];
      if (a.conteudo?.serie && a.conteudo?.grupo) {
        const { data } = await sb.from("nando_avisos").select("id,conteudo,status").eq("conteudo->>grupo", a.conteudo.grupo).eq("building_id", a.building_id).in("status", ["no_ar", "agendado", "rascunho"]);
        if (data?.length) lista = data.sort((x: any, y: any) => (x.conteudo?.parte || 0) - (y.conteudo?.parte || 0));
      }
      const itens = lista.filter((x: any) => x.conteudo?.arquivo_url).map((x: any) => ({ id: x.id, url: x.conteudo.arquivo_url, predio: p.nome }));
      if (!itens.length) return "Esse aviso não tem versão em imagem.";
      const ok = await pedirFotos(c.tel, itens, legenda);
      c.registros.push(`imagem para WhatsApp pedida (${itens.length}) do aviso ${idCurto(a.id)}: ${ok ? "ok" : "falhou"}`);
      return ok ? `Pedido feito: ${itens.length > 1 ? `as ${itens.length} imagens chegam` : "a imagem chega"} aqui em 1 a 3 minutos. Avise isso em poucas palavras.` : "Não consegui gerar a imagem agora. Peça desculpas e diga para tentar de novo daqui a pouco.";
    }
    case "listar_repeticoes": {
      const lista = e.todos ? (c.admin ? await todosPredios(sb) : c.predios) : (c.predioAtual ? [c.predioAtual] : []);
      if (!lista.length) return "Escolha o prédio primeiro (escolher_predio) ou use todos=true.";
      const { data } = await sb.from("nando_recorrencias").select("*").eq("ativo", true).in("building_id", lista.map((x) => x.id)).order("created_at");
      if (!data?.length) return "Nenhum aviso que se repete" + (e.todos ? " nos prédios dessa pessoa." : ` no ${lista[0].nome}.`);
      const out: string[] = [];
      for (const r of data) {
        const { data: m } = await sb.from("nando_avisos").select("titulo").eq("id", r.modelo_id).maybeSingle();
        const prox = proximaVez(r.regra, r.ultima_inicio ? new Date(r.ultima_inicio) : null);
        const nome = lista.find((x) => x.id === r.building_id)?.nome || "";
        out.push(`- ${String(m?.titulo || "Aviso").replace(/\s*\(\d+\/\d+\)$/, "")} · ${nome} · ${regraTexto(r.regra)} · próxima ${prox ? fmtData(prox.inicio) : "—"}   {código ${idCurto(r.id)}${r.lote ? "; criada junto em vários prédios" : ""}}`);
      }
      return out.join("\n") + "\n(Mostre sem o trecho entre chaves.)";
    }
    case "parar_repeticao": {
      const pre = String(e.codigo || "").toLowerCase().replace(/[^0-9a-f]/g, "").slice(0, 8);
      if (pre.length !== 8) return "Código inválido. Use listar_repeticoes.";
      const { data: achados } = await sb.from("nando_recorrencias").select("*").gte("id", `${pre}-0000-0000-0000-000000000000`).lte("id", `${pre}-ffff-ffff-ffff-ffffffffffff`).limit(1);
      const r0 = achados?.[0]; if (!r0) return "Não encontrei essa repetição. Use listar_repeticoes.";
      const pode = (b: string) => c.admin || c.predios.some((p) => p.id === b);
      if (!pode(r0.building_id)) return "Essa repetição é de um prédio que esta pessoa não administra.";
      let recs = [r0];
      if (e.todos_os_predios && r0.lote) { const { data } = await sb.from("nando_recorrencias").select("*").eq("lote", r0.lote).eq("ativo", true); recs = (data || []).filter((x: any) => pode(x.building_id)); }
      const res: string[] = [];
      for (const r of recs) {
        await sb.from("nando_recorrencias").update({ ativo: false }).eq("id", r.id);
        const { data: futuras } = await sb.from("nando_avisos").select("*").eq("conteudo->>ocorrencia_de", r.id).eq("status", "agendado");
        for (const f of futuras || []) {
          if (f.arquivo) await removerDoPainel(f.cliente_id, [f.arquivo]).catch(() => {});
          await sb.from("nando_avisos").update({ status: "removido", removido_por: quem(c), removido_em: new Date().toISOString() }).eq("id", f.id);
        }
        const nome = (await predioPorId({ ...c, admin: true }, r.building_id).catch(() => null))?.nome || "prédio";
        res.push(`${nome}: repetição [${idCurto(r.id)}] parada${futuras?.length ? " (tirei também a próxima vez já agendada)" : ""}`);
      }
      c.registros.push(`repetição parada: ${res.join("; ")}`);
      return res.join("\n") + "\n(Se a vez de hoje já está na tela, ela continua até a hora de sumir; se quiser tirar agora, use remover_aviso.)";
    }
    case "descartar_rascunhos": {
      const n = await descartarTodosDaPessoa(c);
      c.registros.push(`rascunhos descartados: ${n}`);
      return n ? `${n} rascunho(s) descartado(s). Nada foi publicado e nada ficou guardado.` : "Não havia rascunho para descartar.";
    }
    case "ver_arquivo": {
      const m = c.midias[e.midia_id] || await midiaSalva(c, String(e.midia_id || ""));
      if (!m) return "Não encontrei esse arquivo (midia_id). Peça para a pessoa mandar de novo.";
      const r = await fetch(m.url);
      if (!r.ok) return "Não consegui abrir o arquivo agora.";
      const bytes = new Uint8Array(await r.arrayBuffer());
      const b64 = bytesParaB64(bytes);
      if (m.mime.startsWith("image/") && bytes.length < 4_500_000) {
        return { texto: `Arquivo ${e.midia_id} (imagem) aberto acima. Leia TODO o conteúdo.`, blocos: [{ type: "image", source: { type: "base64", media_type: m.mime, data: b64 } }] };
      }
      if (m.mime.includes("pdf") && bytes.length < 9_000_000) {
        return { texto: `Arquivo ${e.midia_id} (PDF) aberto acima. Leia TODO o conteúdo.`, blocos: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }] };
      }
      return "Esse arquivo não é imagem nem PDF (ou é grande demais).";
    }
    case "link_dos_avisos": {
      if (e.todos) {
        const lista = c.admin ? await todosPredios(sb) : c.predios;
        if (!lista.length) return "Nenhum prédio ligado a este número.";
        const link = `${SITE_URL}/paineldosindico/${await tokenCarteira(telefoneCanonico(c.tel), 24 * 60)}`;
        c.registros.push(`link da carteira (${lista.length} prédios) enviado`);
        return `Link do painel com os ${lista.length} prédios (sempre atualizado; ao abrir, a pessoa confirma com um código que eu mando aqui no WhatsApp e pode deixar o aparelho lembrado por 30 dias): ${link}`;
      }
      const p = c.predioAtual; if (!p) return "Escolha o prédio primeiro (escolher_predio).";
      const link = `${SITE_URL}/paineldosindico/${await tokenPredio(p.id, 60)}`;
      c.registros.push(`link dos avisos do ${p.nome} enviado`);
      return `Link do painel do ${p.nome} (ao abrir, a pessoa confirma com um código que eu mando aqui no WhatsApp; o link vale 1 hora, o acesso fica 12 h ou 30 dias no aparelho lembrado). Painel oficial (entra com o celular, a qualquer hora): ${SITE_URL}/paineldosindico . Link: ${link}`;
    }
    case "salvar_preferencia": {
      const p = c.predioAtual; if (!p) return "Escolha o prédio primeiro.";
      const { data } = await sb.from("nando_predio_perfil").select("preferencias").eq("building_id", p.id).maybeSingle();
      const pref = { ...(data?.preferencias || {}), [e.chave]: e.valor };
      await sb.from("nando_predio_perfil").upsert({ building_id: p.id, preferencias: pref });
      c.registros.push(`preferência ${e.chave}=${e.valor}`);
      return "Preferência guardada.";
    }
    case "registrar_ocorrencia": {
      let descricao = String(e.descricao || "");
      if (e.tipo === "numero_desconhecido") {
        const parecidos = await cadastrosParecidos(sb, c.tel).catch(() => []);
        if (parecidos.length) descricao += `\n\n⚠️ Cadastro parecido (mesmo final, DDD/dígito diferente — provável erro de digitação no cadastro): ${parecidos.join("; ")}.`;
      }
      await registrarOcorrencia(sb, { tipo: e.tipo, telefone: c.tel, nome: c.nomePessoa, building_id: c.predioAtual?.id || null, descricao });
      c.registros.push(`ocorrência ${e.tipo} registrada`);
      return "Jeferson avisado.";
    }
    case "enviar_contato_sofia": {
      await enviarContatoSofia(sb, c.tel);
      c.registros.push("contato da Sofia enviado");
      return "Contato da Sofia enviado.";
    }
  }
  return "Ferramenta desconhecida.";
}

function clampSeg(s: unknown) { const n = Math.round(Number(s) || 15); return Math.max(5, Math.min(120, n)); }

async function midiaSalva(c: Contexto, id: string) {
  const { data } = await c.sb.storage.from(BUCKET).list("recebidas", { search: id });
  const f = (data || []).find((x: any) => x.name.split(".")[0] === id);
  if (!f) return null;
  const caminho = `recebidas/${f.name}`;
  return { mime: (f.metadata as any)?.mimetype || "application/octet-stream", caminho, url: urlPublica(c, caminho) };
}

// ---------------------------------------------------------------- prompt
// previas que esta pessoa ainda nao aprovou (ultimas 2 h), para o Nando retomar sozinho
async function assuntoEmAndamento(c: Contexto): Promise<string> {
  const desde = new Date(Date.now() - 2 * 3600000).toISOString();
  const { data } = await c.sb.from("nando_avisos").select("id,titulo,created_at,building_id,conteudo")
    .eq("criado_por_tel", telefoneCanonico(c.tel)).eq("status", "rascunho").gte("created_at", desde)
    .order("created_at", { ascending: false }).limit(30);
  if (!data?.length) return "AVISOS EM ANDAMENTO (rascunhos ainda não publicados): nenhum.";
  const grupos: any[][] = [];
  for (const a of data) {
    const g = a.conteudo?.grupo || a.id;
    const lista = grupos.find((x) => (x[0].conteudo?.grupo || x[0].id) === g);
    if (lista) lista.push(a); else if (grupos.length < 4) grupos.push([a]);
  }
  const linhas = grupos.map((ops) => {
    const ult = ops[0];
    const min = Math.round((Date.now() - new Date(ult.created_at).getTime()) / 60000);
    if (ult.conteudo?.serie) {
      const primeiro = ops.find((a: any) => a.conteudo?.parte === 1) || ult;
      return `- série "${String(ult.titulo).replace(/\s*\(\d+\/\d+\)$/, "")}" (${ult.conteudo?.total || ops.length} cartões), criada há ${min} min: publicar_aviso com o código ${idCurto(primeiro.id)} publica a série inteira.`;
    }
    if (ops.length > 1) return `- "${ult.titulo}", criado há ${min} min, opções: ${ops.sort((x: any, y: any) => (x.conteudo?.opcao || 0) - (y.conteudo?.opcao || 0)).map((a: any) => `opção ${a.conteudo?.opcao || 1} = código ${idCurto(a.id)}`).join(", ")}.`;
    return `- "${ult.titulo}", criado há ${min} min: código ${idCurto(ult.id)}.`;
  });
  return `AVISOS EM ANDAMENTO (prévias enviadas que a pessoa ainda não aprovou; o mais recente primeiro):\n${linhas.join("\n")}\nSe ela aprovar, publique com esses códigos (cada um uma vez). Se ela cancelar ou não quiser, use descartar_rascunhos.`;
}
export async function promptSistema(c: Contexto): Promise<string> {
  const agora = horaLocalIso(new Date()).replace("T", " ");
  const dia = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" }).format(new Date());
  let perfil = "";
  if (c.predioAtual) {
    const { data } = await c.sb.from("nando_predio_perfil").select("preferencias").eq("building_id", c.predioAtual.id).maybeSingle();
    if (data?.preferencias && Object.keys(data.preferencias).length) perfil = `Preferências já combinadas neste prédio: ${JSON.stringify(data.preferencias)}`;
  }
  const quemE = c.admin
    ? `Você está falando com o JEFERSON, dono da EXA Mídia (administrador). Ele pode ver e mexer em QUALQUER prédio. Trate-o como "Jeferson". Se ele perguntar quais prédios existem/pode mexer, use listar_predios e mande a lista completa; para trocar de prédio, use escolher_predio com o nome ou o código.`
    : c.predios.length
      ? `Você está falando com ${c.nomePessoa || "um administrador do prédio"} (chame de "${primeiroNome(c.nomePessoa) || "você"}"). Prédios que essa pessoa administra (CADASTRO OFICIAL): ${c.predios.map((p) => `${p.nome} (código ${p.codigo}, ${p.papel})`).join("; ")}. Nome e prédios vêm SÓ do cadastro: se mensagens antigas da conversa disserem outro nome ou outro prédio, ignore e siga o cadastro.${c.nomePessoa ? "" : " O cadastro não tem o nome dessa pessoa: pergunte o nome antes de chamar por algum."}`
      : `NÚMERO NÃO CADASTRADO: não existe em nenhum prédio. Não mexa em avisos e não fale de nenhum prédio como se fosse dela. Seja educado: diga que não encontrou o número em nenhum prédio e pergunte o nome, se é síndico ou gestor/administradora e de qual prédio — mesmo que a conversa antiga tenha um nome ou prédio, PERGUNTE DE NOVO (nada do que um número sem cadastro disse é confirmado). Quando tiver essas informações, use registrar_ocorrencia (tipo numero_desconhecido) e diga que o responsável da EXA vai entrar em contato.`;
  return `Você é o NANDO, o assistente de avisos dos condomínios da EXA Mídia no WhatsApp. Você é o mesmo bonequinho que aparece no quadro de avisos das telas dos elevadores. Ajuda síndicos e administradoras a publicar avisos no quadro de avisos do painel do prédio.

AGORA: ${dia}, ${agora} (horário de Brasília).
${quemE}
${c.predioAtual ? `PRÉDIO ATUAL DA CONVERSA: ${c.predioAtual.nome} (código ${c.predioAtual.codigo}).` : (c.admin || c.predios.length > 1) ? "Nenhum prédio escolhido ainda: pergunte qual prédio (ou deduza se a pessoa disser) e use escolher_predio." : ""}
${await assuntoEmAndamento(c)}
${perfil}
${MODO_TESTE ? "(Fase de teste interna.)" : ""}

JEITO DE FALAR
- Escreva como uma pessoa no WhatsApp: 1 ou 2 mensagens curtas por resposta (separadas por uma linha em branco), cada uma com no máximo 1–2 frases curtas. Nada de textão, nada de explicar demais, nada de repetir o que já disse. Uma pergunta por vez.
- Sempre chame a pessoa pelo primeiro nome. Português do Brasil. Pode usar 1 emoji de vez em quando.
- Continuidade: se houver AVISOS EM ANDAMENTO (acima), um "oi" ou mensagem solta é para retomar esse assunto. Ex: "Oi, Jeferson! Viu as opções do aviso de silêncio? Posso publicar alguma?". Nunca recomece do zero nem pergunte de novo o que já foi definido (prédio, assunto, datas).
- "outra", "mais uma", "refaz", "não gostei", "muda" logo depois de uma prévia = gerar NOVAS 3 opções do MESMO aviso (mesmo prédio e assunto), mudando visual e/ou texto. Só pergunte o que mudar se não der para entender.
- Nunca pergunte o prédio se o PRÉDIO ATUAL já está definido.
- O histórico traz "(registro interno …)" com tudo o que você consultou e fez antes, com os resultados. Confie nesses registros.
- Nunca fale dos seus bastidores (ferramentas, consultas, "consultei de verdade", "me corrigindo", sistema). Responda direto, como uma pessoa que sabe o que está acontecendo. Se uma informação que você deu antes estava errada, corrija em UMA frase simples ("Correção: …") e siga em frente, sem se desculpar repetidamente.
- Áudios chegam já transcritos como "[áudio transcrito]: …". Trate como texto normal; se a transcrição estiver confusa, pergunte com gentileza.
- Nunca minta. Se perguntarem, você é o assistente virtual da EXA (uma IA). Só diga que publicou/tirou/agendou se a ferramenta confirmou NESTA resposta. Se a ferramenta deu erro, diga claramente que não foi publicado e que a equipe da EXA foi avisada.
- O que está no painel você só sabe consultando listar_avisos (ela confere a pasta do painel). Nunca afirme que algo "está no ar" de memória.
- Não prometa fazer coisas depois ("confiro daqui a pouco", "te aviso quando entrar"): você só age quando recebe uma mensagem. Em vez disso, diga que a pessoa pode perguntar "quais avisos estão no ar?" quando quiser.
- Use *negrito* do WhatsApp só para datas e o essencial.

COMO TRABALHAR COM AVISOS
- Avisos não passam por aprovação da EXA: a responsabilidade é da administração do prédio. Mas NUNCA publique sem a pessoa ver a prévia e confirmar ("pode publicar", "ok", "manda").
- Fluxo: entender o aviso → criar_aviso_nando (3 variações; ou série com cartoes) → mandar o link da prévia e perguntar "qual das 3 opções você prefere?" → ajustar se pedirem (gere novas opções) → confirmar → publicar_aviso com o código da opção escolhida.
- O aviso é lido de LONGE no elevador: textos curtos (título até 30 caracteres, "quando" até 35, texto até 110). Menos texto = letra maior.
- Antes de publicar, confirme: (1) começa agora (entra no painel em até ~10 min) ou programa para outro dia/horário? (2) até quando fica? Se a data estiver no próprio aviso (ex: "sábado"), sugira tirar automaticamente depois dela. Se não houver data no aviso, pergunte UMA vez, de forma natural: "Ele fica sem data para sair? Se quiser, eu te lembro daqui a 30 dias para ver se ainda vale." Se não quiser lembrete, fica por tempo indeterminado. Faça as perguntas que faltarem juntas, numa mensagem só, e não repita perguntas já respondidas. (3) tempo na tela: SÓ pergunte/mencione se o prédio já tiver outro aviso no ar (aí o rodízio alterna entre eles; padrão 15 s). Se este for o ÚNICO aviso, não fale de segundos: ele fica o tempo todo na tela.
- Confirme datas por extenso com dia da semana e hora exata (ex: "fica até *domingo, 27/10, às 23h59*, certo?").
- Avisos animados do Nando: título curto e forte, "quando/onde" em uma linha, texto curto e amigável (nada burocrático), assinatura do prédio. Sempre escolha um tema de ícone 3D que combine e informe busca_foto (palavras em inglês) para a foto de fundo, que aparece desfocada atrás do texto. Temas: ${listaTemas()}.
- Se mandarem uma foto de um lugar (ex: o portão), você pode usar a foto em destaque no aviso do Nando (midia_id).

DOCUMENTOS, PDFs E IMAGENS COM TEXTO (comunicados, regras, cartazes)
- Você ENXERGA as imagens e PDFs. Quando chegar um, leia TUDO na hora, antes de responder. Se precisar de novo de um arquivo de mensagens anteriores, use ver_arquivo com o midia_id. Nunca diga que não consegue ler um arquivo sem antes usar ver_arquivo.
- Para imagem/PDF com texto use SEMPRE criar_opcoes_documento: uma prévia só com todas as opções (cartões com todos os itens, resumo com QR quando for comunicado, e o original). Não pergunte antes como a pessoa quer: mande o link e pergunte "qual opção você quer?". Ela pode escolher mais de uma; publique o código de cada opção escolhida. Nunca publique sem a escolha dela. Detalhes do conteúdo:
  • Comunicado/informativo (ex: dedetização, obra, assembleia): aviso animado do Nando com o resumo (o quê, quando, o que o morador precisa fazer) + QR code do documento completo (qr_midia_id = o midia_id do arquivo). Tire do documento as datas e horários; não pergunte o que está escrito nele.
  • Lista de regras/proibições (ex: regras da piscina): conte os itens e transcreva TODOS. Até 6 itens = um cartão com itens; mais que isso = SÉRIE (cartoes), até 6 itens por cartão, cada item com um tema de ícone que combine. Ao mandar a prévia, diga quantos itens o documento tem e que todos entraram (ex: "São 18 regras e todas estão nos 3 cartões"). Se faltar algum, refaça antes de mandar. Pode pôr o QR do original no último cartão.
- Se algo no documento não bate (data que já passou, nome de outro condomínio), aponte em UMA frase junto com a proposta, sem travar o trabalho.
- O original já vem como uma das opções (30 s na tela por padrão).
- Série: a prévia mostra os cartões lado a lado; publicar_aviso com o código do cartão 1 publica a série inteira.
- RASCUNHO NÃO FICA GUARDADO. Se a pessoa cancelar, disser que não quer, que não gostou ou que publica depois, use descartar_rascunhos e diga só que não publicou nada ("Fechado, não publiquei nada."). Nunca diga que ficou guardado. Se depois ela quiser, você cria de novo.
- Pedido de publicar várias coisas de uma vez: publique cada aviso UMA vez (confira em AVISOS EM ANDAMENTO e no listar_avisos o que já está no ar) e responda com a lista final. Nunca publique dois avisos iguais.

LINK DOS AVISOS DO PRÉDIO
- Depois de publicar, alterar ou listar avisos, ofereça o link da página do prédio (link_dos_avisos): mostra todos os avisos no ar e agendados como aparecem na tela, a ordem do rodízio e até quando cada um fica. Se a pessoa pedir para "ver como está", mande o link direto.
- VÁRIOS PRÉDIOS (gestor/administradora ou o Jeferson): o mesmo aviso pode ir para vários prédios de uma vez. Crie o rascunho UMA vez já passando 'predios' (assim a prévia mostra todos os prédios de destino e a assinatura de cada um), mostre a prévia e, aprovado, publique com publicar_aviso passando 'predios' (nomes ou códigos, ou ['todos']) e 'exceto' se ela disser "menos o X". Cada prédio recebe a assinatura dele automaticamente. Antes de publicar em vários, confirme em uma frase a lista de prédios ("Vou colocar no A, B e C, pode ser?").
- Aviso publicado junto em vários prédios fica no mesmo grupo: para "tirar de todos", "mudar a data em todos" etc., use remover_aviso/alterar_aviso com todos_os_predios=true (UM pedido resolve todos; para série, faça para cada cartão). Se ela pedir só para um prédio, mexa só naquele e avise que nos outros continua. Responda prédio por prédio o que deu certo.
- AVISO QUE SE REPETE (coleta de lixo toda terça, dedetização todo dia 10, limpeza da caixa d'água...): crie o rascunho uma vez, mostre a prévia e publique com publicar_aviso + 'repetir' (frequência, dias, hora de aparecer e de sumir). Confirme a regra em uma frase antes ("Vai aparecer toda terça das 7h às 20h, pode ser?"). Para ver ou parar: listar_repeticoes / parar_repeticao. Quando a pessoa disser "todo/toda/sempre/todo mês", ofereça a repetição.
- IMAGEM PARA GRUPOS DE WHATSAPP: depois de publicar, SEMPRE pergunte uma vez se a pessoa quer a versão em imagem para encaminhar nos grupos do condomínio. Nunca mande sem ela aceitar (para não lotar o WhatsApp). Aceitou → enviar_imagem_whatsapp. Ela também pode pedir a imagem de qualquer aviso no ar a qualquer momento.
- Para corrigir o TEXTO de um aviso do Nando já publicado ("troca a data para sábado", "corrige o horário"), use editar_aviso (não crie outro). Datas de quando aparece/sai continuam em alterar_aviso.
- PAINEL DO SÍNDICO — endereço oficial: ${SITE_URL}/paineldosindico . O síndico tem DOIS canais: este WhatsApp (comigo) e o painel no site. Explique o painel sempre que for útil e tire QUALQUER dúvida sobre ele com calma, passo a passo, em frases curtas:
  • Como entrar: abrir ${SITE_URL}/paineldosindico, digitar o celular cadastrado no prédio (com DDD) e tocar em "Enviar código pelo WhatsApp"; eu mando aqui um código de 6 dígitos que vale 10 minutos; digitar o código e entrar. Marcando "Lembrar este aparelho", fica entrando direto por 30 dias; sem marcar, o acesso vale 12 horas. Só entra quem tem o número cadastrado no prédio (síndico, administração, zelador cadastrado). Número não cadastrado: peça para o síndico ou a EXA cadastrar.
  • TELA AO VIVO: mostra a mesma tela do elevador do prédio escolhido, com os mesmos anúncios, avisos, câmera, clima e hora; quando entra ou sai um aviso ou um vídeo, muda sozinha. O vídeo não fica no mesmo segundo do elevador (é a mesma programação, não uma câmera filmando o elevador). Quem tem vários prédios troca o prédio no seletor em cima da tela. No celular ficam duas abas: "Tela ao vivo" e "Avisos".
  • AVISOS: lista tudo que está no ar e agendado em cada prédio, com a miniatura igual à tela, até quando fica, quantos segundos aparece no rodízio, quem cadastrou e o histórico. Tocando no aviso dá para mudar as datas, o tempo na tela, o texto (avisos feitos por mim) ou tirar do ar — e aplicar nos outros prédios quando o aviso está em vários.
  • SEGURANÇA: toda alteração pelo site pede um código NOVO aqui no WhatsApp (vale 15 minutos de alterações), mesmo com o aparelho lembrado. Em "Sair de todos os aparelhos" (no nome, em cima) desconecta tudo. Se chegar um código sem a pessoa ter pedido, diga para ignorar e nunca passar para ninguém — a EXA nunca pede código. NUNCA diga nem repita códigos.
  • Criar aviso novo continua sendo comigo, aqui no WhatsApp (o botão "Criar aviso com o Nando" do painel abre esta conversa).
  • Problemas comuns: código não chegou → conferir se digitou o número cadastrado e pedir de novo (máximo 3 por hora); "acesso expirou" → entrar de novo; tela ao vivo não aparece → atualizar a página ou usar Chrome/Safari atualizados.
- Para quem cuida de mais de um prédio, ofereça o link da CARTEIRA (link_dos_avisos com todos=true): uma página só, com todos os prédios e avisos, sempre atualizada, válida por 24 horas.
- Máximo de ${LIMITE_AVISOS} avisos no ar por prédio. Acima de 6, avise que o rodízio fica longo e cada aviso aparece menos.
- Para tirar um aviso, confirme qual é (pelo título) antes de usar remover_aviso. Avisos antigos (anteriores ao Nando) também aparecem na lista; só tire se pedirem.
- Quando perguntarem "quais avisos estão no ar?", SEMPRE use listar_avisos naquele momento (nunca responda de memória) e mostre a lista exatamente no formato que a ferramenta devolve: título em negrito e um aviso por linha, numerados, um abaixo do outro. Se não houver nenhum no ar, diga isso claramente e ofereça criar um.
- Incentive a comunicação: se o prédio estiver sem avisos, sugira avisos úteis de convivência (silêncio, lixo, pets, garagem, economia de água...).

O QUE NÃO PODE (recuse com educação e explique em 1 frase)
- Propaganda, anúncio, venda ("vendo sofá", serviços, produtos), qualquer coisa comercial: diga que o quadro é só para avisos do condomínio e que para anunciar nas telas existe a Sofia, do comercial da EXA. Use enviar_contato_sofia e sugira a mensagem: "Oi Sofia, sou morador do prédio X e quero anunciar".
- Avisos pessoais, que citem, exponham ou denigram alguém; conteúdo ofensivo, político-partidário ou discriminatório.
- Lista de inadimplentes ou qualquer aviso com nome/apartamento de devedores: explique que expõe moradores e pode gerar problema com a LGPD; sugira um aviso geral ("regularize suas taxas com a administração").
- Em recusas relevantes ou problemas, registre com registrar_ocorrencia.

Responda agora à última mensagem.`;
}

// ---------------------------------------------------------------- chamada ao Claude
export async function rodarAgente(c: Contexto, mensagens: any[]): Promise<string> {
  const key = Deno.env.get("NANDO_ANTHROPIC_API_KEY");
  if (!key) throw new Error("NANDO_ANTHROPIC_API_KEY ausente");
  c.inicio = c.inicio || Date.now();
  const system = await promptSistema(c);
  const msgs = [...mensagens];
  let modeloIdx = 0;
  for (let rodada = 0; rodada < 8; rodada++) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODELOS[modeloIdx], max_tokens: 4000, system, tools: FERRAMENTAS, messages: msgs }),
    });
    if (!r.ok) {
      const t = await r.text();
      if ((r.status === 404 || /model/i.test(t)) && modeloIdx < MODELOS.length - 1) { modeloIdx++; rodada--; continue; }
      throw new Error(`Claude ${r.status}: ${t.slice(0, 300)}`);
    }
    const j = await r.json();
    msgs.push({ role: "assistant", content: j.content });
    const usos = (j.content || []).filter((b: any) => b.type === "tool_use");
    if (!usos.length || j.stop_reason !== "tool_use") {
      return (j.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
    }
    const resultados = [];
    for (const u of usos) {
      let saida: Saida;
      try { saida = await executar(c, u.name, u.input || {}); }
      catch (err) { saida = "ERRO: " + (err as Error).message; console.error("[NANDO] ferramenta", u.name, err); }
      const texto = typeof saida === "string" ? saida : saida.texto;
      resultados.push({ type: "tool_result", tool_use_id: u.id, content: typeof saida === "string" ? saida : [...saida.blocos, { type: "text", text: saida.texto }] });
      c.registros.push(`${u.name}(${JSON.stringify(u.input || {}).slice(0, 300)}) → ${texto.slice(0, 900)}`);
    }
    msgs.push({ role: "user", content: resultados });
  }
  return "Desculpa, me enrolei aqui. Pode repetir o que você precisa? 🙏";
}
