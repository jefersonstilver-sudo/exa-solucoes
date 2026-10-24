// =====================================================================
// NANDO - cerebro (Claude + ferramentas). Conversa curta e natural com o sindico.
// =====================================================================
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  Predio, nomeBase, ehAdmin, prediosDoTelefone, todosPredios, sincronizarLegado, listarArquivosPainel, enviarAoPainel, removerDoPainel,
  tituloPainel, dataApi, registrarOcorrencia, enviarContatoSofia, historico, fmtData, slug, carimbo,
  b64ParaBytes, bytesParaB64, telefoneCanonico, pngComAviso, primeiroNome, SITE_URL, MODO_TESTE, horaLocalIso, qrDataUrl, tokenPredio,
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
  const p = lista.find((x) => x.codigo === cod || x.id === cod || x.nome.toLowerCase() === cod.toLowerCase());
  if (!p) throw new Error("Prédio não encontrado entre os que esta pessoa administra.");
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
      conteudo: { ...extra, tema, grupo, serie: total > 1, parte: k + 1, total, opcao: k + 1, credito_foto: credito, qr_alvo: v.qrAlvo || null,
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
    origem_url: m.url, criado_por_tel: telefoneCanonico(c.tel), criado_por_nome: c.nomePessoa, conteudo: { ...extra, midia_id: e.midia_id, grupo: crypto.randomUUID() },
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
    name: "listar_avisos",
    description: "Lista os avisos do prédio atual (no ar, agendados e com problema; rascunhos NUNCA aparecem), com código, tempo de tela, início, saída, lembrete e quem criou.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "criar_aviso_nando",
    description: "Cria um RASCUNHO de aviso animado do Nando (modelo fixo: ícone 3D, título, quando/onde, texto curto, assinatura) e devolve o link de prévia de 10 minutos. Não publica.",
    input_schema: {
      type: "object",
      properties: {
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
      properties: {
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
    description: "Gera o link (vale 1 hora) da página do prédio atual com todos os avisos no ar e agendados, desenhados como na tela, com o rodízio, o tempo de cada um, quando sai e quem criou. Ofereça depois de publicar, alterar ou listar avisos.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "criar_aviso_arquivo",
    description: "Cria um RASCUNHO a partir de uma imagem ou PDF que o síndico enviou (publicado como está, sem distorcer) e devolve o link de prévia. Não publica.",
    input_schema: {
      type: "object",
      properties: {
        midia_id: { type: "string" }, titulo: { type: "string" },
        segundos: { type: "number" }, inicio: { type: "string" }, fim: { type: "string" }, lembrar_dias: { type: "number" },
      },
      required: ["midia_id", "titulo"],
    },
  },
  {
    name: "publicar_aviso",
    description: "Publica um rascunho já aprovado pelo síndico. Opcional: lista de códigos de prédios para publicar o MESMO aviso em vários prédios que a pessoa administra. O painel atualiza em até ~10 minutos.",
    input_schema: { type: "object", properties: { aviso: { type: "string" }, predios: { type: "array", items: { type: "string" } } }, required: ["aviso"] },
  },
  {
    name: "alterar_aviso",
    description: "Altera tempo de tela, início, saída ou lembrete de um aviso (rascunho ou publicado). Para mudar texto/visual, crie um rascunho novo.",
    input_schema: {
      type: "object",
      properties: { aviso: { type: "string" }, segundos: { type: "number" }, inicio: { type: "string" }, fim: { type: "string" }, sem_fim: { type: "boolean" }, lembrar_dias: { type: "number" } },
      required: ["aviso"],
    },
  },
  {
    name: "remover_aviso",
    description: "Tira um aviso do painel AGORA. Só use quando a pessoa pedir claramente para tirar aquele aviso.",
    input_schema: { type: "object", properties: { aviso: { type: "string" } }, required: ["aviso"] },
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
export async function executar(c: Contexto, nome: string, e: any): Promise<Saida> {
  const sb = c.sb;
  switch (nome) {
    case "escolher_predio": {
      const p = await predioDoCodigo(c, e.codigo);
      c.predioAtual = p;
      await sb.from("nando_estado").upsert({ telefone: telefoneCanonico(c.tel), building_id: p.id, confirmado: true, updated_at: new Date().toISOString() });
      await sincronizarLegado(sb, p);
      c.registros.push(`prédio escolhido: ${p.nome} (${p.codigo})`);
      return `Prédio atual: ${p.nome} (código ${p.codigo}).`;
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
        const { data: antigos } = await sb.from("nando_avisos").select("titulo").eq("building_id", p.id).eq("status", "encerrado").order("created_at", { ascending: false }).limit(5);
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
      const alvos: Predio[] = [];
      if (Array.isArray(e.predios) && e.predios.length) for (const cod of e.predios) alvos.push(await predioDoCodigo(c, cod));
      else alvos.push(await predioPorId(c, a.building_id));
      const res: string[] = [];
      for (const p of alvos) {
        if (await avisosAtivos(c, p.id) + bases.length > LIMITE_AVISOS) { res.push(`${p.nome}: NÃO publicado (passaria de ${LIMITE_AVISOS} avisos no ar; tire algum antes)`); continue; }
        for (const base of bases) {
        let linha = base;
        if (p.id !== base.building_id) {
          const { data: copia } = await sb.from("nando_avisos").insert({ ...base, id: undefined, building_id: p.id, cliente_id: p.cliente_id, created_at: undefined, updated_at: undefined }).select("*").single();
          linha = copia;
        }
        try {
          const arquivo = await publicarEm(c, linha, p);
          const st = new Date(linha.inicio) > new Date(Date.now() + 60000) ? "agendado" : "no_ar";
          await sb.from("nando_avisos").update({ arquivo, status: st, erro: null }).eq("id", linha.id);
          await historico(sb, linha.id, quem(c), "publicou", { predio: p.nome });
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
      return res.join("\n");
    }
    case "alterar_aviso": {
      const a = await acharAviso(c, e.aviso);
      const mud: any = {};
      if (e.segundos) mud.segundos = clampSeg(e.segundos);
      if (e.inicio) { const d = parseData(e.inicio); if (d) mud.inicio = d.toISOString(); }
      if (e.sem_fim) mud.fim = null; else if (e.fim) { const d = parseData(e.fim); if (d) mud.fim = d.toISOString(); }
      if (e.lembrar_dias) mud.lembrar_em = new Date(Date.now() + e.lembrar_dias * 86400000).toISOString();
      if (!Object.keys(mud).length) return "Nada para alterar.";
      const novo = { ...a, ...mud };
      // tempo/datas publicados: reenvia com as novas informacoes e so depois tira a versao antiga
      if (["no_ar", "agendado"].includes(a.status) && ("segundos" in mud || "inicio" in mud || "fim" in mud)) {
        if (a.conteudo?.legado) return "Esse aviso é anterior ao Nando: para mudar tempo ou datas, peça para eu criar um novo igual e tirar o antigo.";
        const p = await predioPorId(c, a.building_id);
        const arquivo = await publicarEm(c, novo, p);
        if (a.arquivo) await removerDoPainel(p.cliente_id, [a.arquivo]).catch(() => {});
        mud.arquivo = arquivo;
      }
      await sb.from("nando_avisos").update(mud).eq("id", a.id);
      await historico(sb, a.id, quem(c), "alterou", mud);
      c.registros.push(`aviso ${idCurto(a.id)} alterado: ${JSON.stringify(mud)}`);
      return `Aviso [${idCurto(a.id)}] atualizado: ${Object.keys(mud).filter((k) => k !== "arquivo").join(", ")}.`;
    }
    case "remover_aviso": {
      const a = await acharAviso(c, e.aviso);
      if (["removido", "encerrado"].includes(a.status)) return "Esse aviso já não está no painel.";
      if (a.arquivo && a.status !== "rascunho") await removerDoPainel(a.cliente_id, [a.arquivo]);
      await sb.from("nando_avisos").update({ status: "removido", removido_por: quem(c), removido_em: new Date().toISOString() }).eq("id", a.id);
      await historico(sb, a.id, quem(c), "removeu");
      c.registros.push(`aviso ${idCurto(a.id)} removido: ${a.titulo}`);
      return `Aviso "${a.titulo}" retirado (some do painel em até ~10 min).`;
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
      const p = c.predioAtual; if (!p) return "Escolha o prédio primeiro (escolher_predio).";
      const link = `${SITE_URL}/nando/predio/${await tokenPredio(p.id, 60)}`;
      c.registros.push(`link dos avisos do ${p.nome} enviado`);
      return `Link da página de avisos do ${p.nome} (vale 1 hora): ${link}`;
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
      await registrarOcorrencia(sb, { tipo: e.tipo, telefone: c.tel, nome: c.nomePessoa, building_id: c.predioAtual?.id || null, descricao: e.descricao });
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
    ? `Você está falando com o JEFERSON, dono da EXA Mídia (administrador). Ele pode ver e mexer em QUALQUER prédio. Trate-o como "Jeferson".`
    : c.predios.length
      ? `Você está falando com ${c.nomePessoa || "um administrador do prédio"} (chame de "${primeiroNome(c.nomePessoa) || "você"}"). Prédios que essa pessoa administra: ${c.predios.map((p) => `${p.nome} (código ${p.codigo}, ${p.papel})`).join("; ")}.`
      : `NÚMERO NÃO CADASTRADO: não existe em nenhum prédio. Não mexa em avisos. Seja educado: diga que não encontrou o número em nenhum prédio, pergunte o nome, se é síndico ou gestor/administradora e de qual prédio. Quando tiver essas informações, use registrar_ocorrencia (tipo numero_desconhecido) e diga que o responsável da EXA vai entrar em contato.`;
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
- Uma administradora com vários prédios pode pedir o mesmo aviso em vários prédios: publique com publicar_aviso passando a lista de códigos.
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
