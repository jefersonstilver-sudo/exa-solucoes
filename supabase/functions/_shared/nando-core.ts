// =====================================================================
// NANDO - nucleo compartilhado (assistente de avisos dos sindicos no WhatsApp)
// Usado por: nando-webhook, nando-cron, nando-previa.
// Regras: so mexe nos avisos do quadro de avisos (pasta CondominiumNotices);
// nunca apaga aviso que o sindico/administrador nao pediu para tirar.
// =====================================================================
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import QRCode from "npm:qrcode@1.5.4";

export const API_EXTERNA = "http://18.228.252.149:8000";
export const EXASISTEMA_URL = "https://iwlscwsenzgyylopnwpu.supabase.co";
export const SITE_URL = "https://examidia.com.br";
export const SOFIA_NUMERO = "5545991415920";
export const ADMIN_NUMEROS = (Deno.env.get("NANDO_ADMINS") || "5545998090000")
  .split(",").map((s) => s.replace(/\D/g, "")).filter(Boolean);
export const ALERTA_NUMERO = (Deno.env.get("NANDO_ALERTA_NUMERO") || "5545998090000").replace(/\D/g, "");
// Enquanto true, o Nando so conversa com os administradores (fase de teste).
export const MODO_TESTE = (Deno.env.get("NANDO_MODO_TESTE") || "true").toLowerCase() !== "false";
export const INSTANCIA_PADRAO = "exa-nando-sindicos-mvmjft5q";
// muda a cada versao publicada: GET /nando-webhook?action=versao mostra qual esta no ar
export const NANDO_VERSAO = "2026-10-24.26";

export function db(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

// ---------------- telefones ----------------
// Compara so os digitos e aceita o numero com ou sem o 9 extra do celular.
export function chavesTelefone(bruto: string | null | undefined): string[] {
  let d = String(bruto || "").replace(/\D/g, "");
  if (!d) return [];
  if (d.length === 10 || d.length === 11) d = "55" + d; // sem DDI
  if (!d.startsWith("55")) return [d];
  const ddd = d.slice(2, 4);
  let num = d.slice(4);
  if (num.length === 8) num = "9" + num;
  if (num.length !== 9) return [d];
  return [`55${ddd}${num}`, `55${ddd}${num.slice(1)}`];
}
export function telefonesIguais(a: string, b: string): boolean {
  const ka = chavesTelefone(a), kb = chavesTelefone(b);
  return ka.some((x) => kb.includes(x));
}
export function telefoneCanonico(bruto: string): string {
  return chavesTelefone(bruto)[0] || String(bruto || "").replace(/\D/g, "");
}
export function ehAdmin(tel: string): boolean {
  return ADMIN_NUMEROS.some((a) => telefonesIguais(a, tel));
}

// ---------------- predios e acesso ----------------
export interface Predio {
  id: string; nome: string; codigo: string; cliente_id: string;
  papel?: string; nome_pessoa?: string;
}
export function clienteIdDoPredio(buildingId: string): string {
  return buildingId.replace(/-/g, "").substring(0, 4);
}
function limpaNome(n: string | null | undefined): string {
  return String(n || "").replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim();
}
export function primeiroNome(n: string | null | undefined): string {
  const l = limpaNome(n);
  return l ? l.split(" ")[0] : "";
}

// Predios que o numero pode gerenciar (sindico, vice ou contato do predio).
export async function prediosDoTelefone(sb: SupabaseClient, tel: string): Promise<{ predios: Predio[]; nome: string }> {
  const { data, error } = await sb.from("buildings")
    .select("id,nome,codigo_predio,status,nome_sindico,contato_sindico,contato_sindico_telefone,nome_vice_sindico,contato_vice_sindico,nome_contato_predio,numero_contato_predio")
    .eq("status", "ativo");
  if (error) throw error;
  const predios: Predio[] = [];
  let nome = "";
  for (const b of data || []) {
    const pares: [string, string | null, string | null][] = [
      ["síndico", b.nome_sindico, b.contato_sindico],
      ["síndico", b.nome_sindico, b.contato_sindico_telefone],
      ["vice-síndico", b.nome_vice_sindico, b.contato_vice_sindico],
      ["contato do prédio", b.nome_contato_predio, b.numero_contato_predio],
    ];
    for (const [papel, n, t] of pares) {
      if (t && telefonesIguais(t, tel)) {
        predios.push({ id: b.id, nome: String(b.nome).trim(), codigo: b.codigo_predio, cliente_id: clienteIdDoPredio(b.id), papel, nome_pessoa: limpaNome(n) });
        if (!nome && n) nome = limpaNome(n);
        break;
      }
    }
  }
  return { predios, nome };
}

export async function todosPredios(sb: SupabaseClient): Promise<Predio[]> {
  const { data, error } = await sb.from("buildings").select("id,nome,codigo_predio").eq("status", "ativo").order("nome");
  if (error) throw error;
  return (data || []).map((b: any) => ({ id: b.id, nome: String(b.nome).trim(), codigo: b.codigo_predio, cliente_id: clienteIdDoPredio(b.id) }));
}

// ---------------- WhatsApp (Evolution) ----------------
function evo() {
  const url = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
  const key = Deno.env.get("EVOLUTION_API_KEY") || "";
  if (!url || !key) throw new Error("EVOLUTION_API_URL/KEY ausentes");
  return { url, key };
}
export async function instanciaNando(sb: SupabaseClient): Promise<string> {
  const env = Deno.env.get("NANDO_INSTANCIA");
  if (env) return env;
  const { data } = await sb.from("evolution_instances").select("instance_name").ilike("instance_name", "%nando%")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data?.instance_name || INSTANCIA_PADRAO;
}
export async function enviarTexto(sb: SupabaseClient, tel: string, texto: string) {
  const { url, key } = evo();
  const inst = await instanciaNando(sb);
  const r = await fetch(`${url}/message/sendText/${inst}`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ number: telefoneCanonico(tel), text: texto, linkPreview: false }),
  });
  if (!r.ok) throw new Error(`Evolution sendText ${r.status}: ${(await r.text()).slice(0, 200)}`);
}
export async function enviarImagem(sb: SupabaseClient, tel: string, urlImagem: string, legenda = "") {
  const { url, key } = evo();
  const inst = await instanciaNando(sb);
  const r = await fetch(`${url}/message/sendMedia/${inst}`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ number: telefoneCanonico(tel), mediatype: "image", mimetype: "image/png", media: urlImagem, caption: legenda, fileName: "aviso.png" }),
  });
  if (!r.ok) throw new Error(`Evolution sendMedia ${r.status}: ${(await r.text()).slice(0, 200)}`);
}
// pede ao robo do GitHub (render-nando.yml) a foto dos avisos do Nando, que chega no WhatsApp em 1-3 min
export async function pedirFotos(tel: string, avisos: { id: string; url: string }[], legenda: string): Promise<boolean> {
  const tok = Deno.env.get("GH_DISPATCH_TOKEN"), repo = Deno.env.get("GH_REPO");
  if (!tok || !repo || !avisos.length) return false;
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/render-nando.yml/dispatches`, {
      method: "POST", headers: { Authorization: `Bearer ${tok}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "nando" },
      body: JSON.stringify({ ref: "main", inputs: { avisos: JSON.stringify(avisos.slice(0, 5)), telefone: telefoneCanonico(tel), legenda: legenda.slice(0, 500) } }),
    });
    if (!r.ok) console.error("[NANDO] fotos dispatch", r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) { console.error("[NANDO] fotos", (e as Error).message); return false; }
}
export async function enviarDigitando(sb: SupabaseClient, tel: string, ms = 1500) {
  try {
    const { url, key } = evo();
    const inst = await instanciaNando(sb);
    await fetch(`${url}/chat/sendPresence/${inst}`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({ number: telefoneCanonico(tel), presence: "composing", delay: ms }),
    });
  } catch (_) { /* opcional */ }
}
export async function enviarContatoSofia(sb: SupabaseClient, tel: string) {
  const { url, key } = evo();
  const inst = await instanciaNando(sb);
  const r = await fetch(`${url}/message/sendContact/${inst}`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({
      number: telefoneCanonico(tel),
      contact: [{ fullName: "Sofia - EXA Mídia", wuid: SOFIA_NUMERO, phoneNumber: "+55 45 99141-5920", organization: "EXA Mídia" }],
    }),
  });
  if (!r.ok) {
    await enviarTexto(sb, tel, "Contato da Sofia (EXA Mídia): +55 45 99141-5920");
  }
}
// Baixa a midia (foto/PDF/audio) de uma mensagem recebida.
export async function baixarMidia(sb: SupabaseClient, mensagemBruta: any): Promise<{ base64: string; mime: string } | null> {
  const { url, key } = evo();
  const inst = await instanciaNando(sb);
  const r = await fetch(`${url}/chat/getBase64FromMediaMessage/${inst}`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ message: { key: mensagemBruta.key }, convertToMp4: false }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  const b64 = j.base64 || j.data?.base64;
  if (!b64) return null;
  return { base64: String(b64).replace(/^data:[^,]+,/, ""), mime: j.mimetype || j.data?.mimetype || "application/octet-stream" };
}

// Transcreve audio do WhatsApp (OpenAI Whisper, mesma chave ja usada pelo transcribe-audio do site).
export async function transcreverAudio(base64: string, mime: string, dica = ""): Promise<string | null> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) { console.error("[NANDO] OPENAI_API_KEY ausente"); return null; }
  const tipo = (mime || "audio/ogg").split(";")[0];
  const ext = tipo.includes("mpeg") ? "mp3" : tipo.includes("mp4") || tipo.includes("m4a") ? "m4a" : tipo.includes("wav") ? "wav" : tipo.includes("webm") ? "webm" : "ogg";
  const fd = new FormData();
  fd.append("file", new Blob([b64ParaBytes(base64) as unknown as BlobPart], { type: tipo }), `audio.${ext}`);
  fd.append("model", "whisper-1");
  fd.append("language", "pt");
  fd.append("prompt", ("Conversa de WhatsApp entre um síndico e o Nando, assistente de avisos de condomínio da EXA Mídia. " + dica).slice(0, 800));
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: fd, signal: AbortSignal.timeout(60000) });
  if (!r.ok) { console.error("[NANDO] whisper", r.status, (await r.text()).slice(0, 200)); return null; }
  const j = await r.json();
  return String(j.text || "").trim() || null;
}

// ---------------- alerta para o Jeferson ----------------
export async function registrarOcorrencia(sb: SupabaseClient, o: { tipo: string; telefone?: string; nome?: string; building_id?: string | null; descricao: string }) {
  const { data } = await sb.from("nando_ocorrencias").insert({ ...o }).select("id").single();
  const texto = `🛎️ *Nando – ocorrência*\n*Tipo:* ${o.tipo}\n${o.nome ? `*Pessoa:* ${o.nome}\n` : ""}${o.telefone ? `*Número:* +${telefoneCanonico(o.telefone)}\n` : ""}\n${o.descricao}`;
  try {
    await enviarTexto(sb, ALERTA_NUMERO, texto);
    if (data?.id) await sb.from("nando_ocorrencias").update({ alertado_em: new Date().toISOString() }).eq("id", data.id);
  } catch (e) { console.error("[NANDO] alerta falhou", (e as Error).message); }
}

// ---------------- API dos paineis (AWS) ----------------
// a lista oficial guarda "CondominiumNotices/arquivo.png"; a pasta lista so "arquivo.png": compara pelo nome
export function nomeBase(n: unknown): string { return String(n || "").split("/").pop() || ""; }
export async function listarArquivosPainel(clienteId: string): Promise<string[]> {
  const r = await fetch(`${API_EXTERNA}/geral/listar-arquivos/${encodeURIComponent(clienteId)}/CondominiumNotices`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`listar-arquivos ${r.status}`);
  const j = await r.json();
  return Array.isArray(j.arquivos) ? j.arquivos.map(nomeBase) : [];
}
// Lista oficial que os paineis leem (ExaSistema / updates_clientes)
export async function avisosOficiais(clienteId: string): Promise<any[] | null> {
  // null = nao foi possivel confirmar (sem chave, sem permissao ou predio nao encontrado)
  const key = Deno.env.get("EXASISTEMA_ANON_KEY");
  if (!key) return null;
  try {
    const r = await fetch(`${EXASISTEMA_URL}/rest/v1/updates_clientes?cliente_id=eq.${encodeURIComponent(clienteId)}&select=json_data`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) { console.error("[NANDO] exasistema", r.status); return null; }
    const rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) return null;
    const lista = rows[0]?.json_data?.CondominiumNotices;
    return Array.isArray(lista) ? lista : [];
  } catch (e) { console.error("[NANDO] exasistema", (e as Error).message); return null; }
}
// pasta da tela no S3 publico "telas-clientes" (ex: 5af2_RoyalLegacy): de la sai a miniatura dos avisos antigos
export async function pastaS3(clienteId: string): Promise<string | null> {
  const key = Deno.env.get("EXASISTEMA_ANON_KEY");
  if (!key) return null;
  try {
    const r = await fetch(`${EXASISTEMA_URL}/rest/v1/updates_clientes?cliente_id=eq.${encodeURIComponent(clienteId)}&select=pasta:json_data->>pasta_s3`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    const rows = await r.json();
    const v = String(rows?.[0]?.pasta || "").replace(/^\/+|\/+$/g, "");
    return v || null;
  } catch { return null; }
}
export function urlArquivoPainel(pasta: string, arquivo: string): string {
  return `https://telas-clientes.s3.sa-east-1.amazonaws.com/${pasta}/CondominiumNotices/${encodeURIComponent(nomeBase(arquivo))}`;
}
// mesma regra do painel (avisos.js): apagado, sem arquivo, antes do inicio ou depois do fim = fora do ar
function dataLocal(s: unknown): Date | null {
  if (!s) return null;
  const t = String(s).trim().replace(" ", "T");
  const d = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(t) ? t : t + "-03:00");
  return isNaN(+d) ? null : d;
}
export function situacaoNoPainel(meta: any | undefined): "no_ar" | "agendado" | "encerrado" {
  if (!meta || meta.status === "deleted" || !meta.mensagem) return "encerrado";
  const agora = new Date();
  const ini = dataLocal(meta.data_ini), fim = dataLocal(meta.data_fim);
  if (fim && agora > fim) return "encerrado";
  if (ini && agora < ini) return "agendado";
  return "no_ar";
}
export function dataApi(d: Date | string | null | undefined, padrao: "inicio" | "fim"): string {
  if (!d) return padrao === "inicio" ? horaLocalIso(new Date()) : "2099-12-31T23:59:00";
  return horaLocalIso(new Date(d));
}
// "YYYY-MM-DDTHH:MM:SS" no horario de Sao Paulo (o painel interpreta como hora local)
export function horaLocalIso(d: Date): string {
  const p = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(d);
  return p.replace(" ", "T");
}
export function tituloPainel(titulo: string, segundos: number): string {
  const t = String(titulo || "Aviso").replace(/\[\d+s\]/g, "").trim().slice(0, 80);
  return `${t} [${Math.max(5, Math.min(120, Math.round(segundos || 15)))}s]`;
}
export async function enviarAoPainel(clienteId: string, arquivo: { nome: string; bytes: Uint8Array; mime: string }, meta: { titulo: string; data_ini: string; data_fim: string }) {
  const fd = new FormData();
  fd.append("files", new Blob([arquivo.bytes as unknown as BlobPart], { type: arquivo.mime }), arquivo.nome);
  fd.append("metadados", JSON.stringify({ [arquivo.nome]: { ...meta, status: "new" } }));
  const r = await fetch(`${API_EXTERNA}/noticias/upload/${encodeURIComponent(clienteId)}`, { method: "POST", body: fd, signal: AbortSignal.timeout(60000) });
  const txt = await r.text();
  if (!r.ok) throw new Error(`upload ${r.status}: ${txt.slice(0, 300)}`);
  // a API responde "ok" no geral mesmo quando recusa o arquivo: confere o resultado de cada arquivo
  try {
    const j = JSON.parse(txt);
    const res = (j.results || []).find((x: any) => x.filename === arquivo.nome) || (j.results || [])[0];
    if (res && /error|erro|inv/i.test(String(res.status || ""))) throw new Error(`painel recusou o arquivo: ${res.status}`);
  } catch (e) { if ((e as Error).message.startsWith("painel recusou")) throw e; }
  // e confere se o arquivo realmente esta na pasta do predio
  const lista = await listarArquivosPainel(clienteId).catch(() => null);
  if (lista && !lista.includes(arquivo.nome)) throw new Error("o arquivo não apareceu na pasta do painel depois do envio");
  return txt;
}

// O painel so aceita .pdf/.png/.jpg: o aviso do Nando vai dentro de um PNG (bloco de texto "nando"),
// e o painel v28 le esses dados e desenha o aviso animado.
const TABELA_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b: Uint8Array): number { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = TABELA_CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function bloco(tipo: string, dados: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + dados.length); const v = new DataView(out.buffer);
  v.setUint32(0, dados.length); out.set(new TextEncoder().encode(tipo), 4); out.set(dados, 8);
  v.setUint32(8 + dados.length, crc32(out.subarray(4, 8 + dados.length))); return out;
}
export async function pngComAviso(dados: unknown): Promise<Uint8Array> {
  const w = 9, h = 16;
  const ihdr = new Uint8Array(13); const iv = new DataView(ihdr.buffer);
  iv.setUint32(0, w); iv.setUint32(4, h); ihdr[8] = 8; ihdr[9] = 2; // 8 bits, RGB
  const cru = new Uint8Array(h * (1 + w * 3));
  for (let y = 0; y < h; y++) { const o = y * (1 + w * 3); for (let x = 0; x < w; x++) { cru[o + 1 + x * 3] = 20; cru[o + 2 + x * 3] = 10; cru[o + 3 + x * 3] = 28; } }
  const comp = new Uint8Array(await new Response(new Blob([cru]).stream().pipeThrough(new CompressionStream("deflate"))).arrayBuffer());
  const json = new TextEncoder().encode(JSON.stringify(dados));
  const texto = new TextEncoder().encode("nando\0" + bytesParaB64(json));
  const partes = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), bloco("IHDR", ihdr), bloco("tEXt", texto), bloco("IDAT", comp), bloco("IEND", new Uint8Array())];
  const tot = partes.reduce((s, p) => s + p.length, 0); const png = new Uint8Array(tot); let o = 0;
  for (const p of partes) { png.set(p, o); o += p.length; }
  return png;
}

export async function removerDoPainel(clienteId: string, nomes: string[]) {
  const r = await fetch(`${API_EXTERNA}/noticias/deletar/${encodeURIComponent(clienteId)}`, {
    method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nomes), signal: AbortSignal.timeout(30000),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`deletar ${r.status}: ${txt.slice(0, 300)}`);
  return txt;
}

// Importa para a lista do Nando os avisos que ja estavam no painel (nada e apagado).
// A situacao (no ar / encerrado) segue a lista oficial que o painel le, nao so os arquivos guardados.
export async function sincronizarLegado(sb: SupabaseClient, p: Predio) {
  let arquivos: string[] = [];
  try { arquivos = await listarArquivosPainel(p.cliente_id); } catch (e) { console.error("[NANDO] listar", (e as Error).message); }
  const oficiais = await avisosOficiais(p.cliente_id);
  const nomes = new Set<string>([...arquivos, ...(oficiais || []).map((o: any) => nomeBase(o.mensagem)).filter(Boolean)]);
  const { data: conhecidos } = await sb.from("nando_avisos").select("id,arquivo,status,conteudo").eq("building_id", p.id);
  // corrige copias criadas antes (o mesmo arquivo do Nando importado de novo como "anterior ao Nando")
  const doNando = new Set((conhecidos || []).filter((c: any) => c.arquivo && !c.conteudo?.legado).map((c: any) => nomeBase(c.arquivo)));
  const copias = (conhecidos || []).filter((c: any) => c.conteudo?.legado && doNando.has(nomeBase(c.arquivo)));
  if (copias.length) await sb.from("nando_avisos").delete().in("id", copias.map((c: any) => c.id));
  const porArquivo = new Map((conhecidos || []).filter((c: any) => c.arquivo && !copias.includes(c)).map((c: any) => [nomeBase(c.arquivo), c]));
  const novos: any[] = [];
  for (const a of nomes) {
    const meta = (oficiais || []).find((o: any) => nomeBase(o.mensagem) === a);
    const incerto = oficiais === null;
    const status = incerto ? "no_ar" : situacaoNoPainel(meta);
    const atual: any = porArquivo.get(a);
    if (atual) {
      // so reavalia avisos antigos (os do Nando sao controlados pelo proprio Nando)
      if (atual.conteudo?.legado && (atual.status !== status || !!atual.conteudo?.incerto !== incerto) && !["removido"].includes(atual.status)) {
        await sb.from("nando_avisos").update({ status, conteudo: { ...atual.conteudo, incerto, metadados: meta || null } }).eq("id", atual.id);
      }
      continue;
    }
    const fim = dataLocal(meta?.data_fim), ini = dataLocal(meta?.data_ini);
    const tit = String(meta?.titulo || a.replace(/^noticia_/, "").replace(/_\d{14}\.\w+$/, "").replace(/[-_]/g, " ")).replace(/\[\d+s\]/g, "").trim();
    const seg = Number((String(meta?.titulo || "").match(/\[(\d+)s\]/) || [])[1] || 15);
    novos.push({
      building_id: p.id, cliente_id: p.cliente_id, arquivo: a,
      tipo: a.toLowerCase().endsWith(".pdf") ? "pdf" : a.toLowerCase().endsWith(".nando.json") ? "nando" : "imagem",
      titulo: tit || a, segundos: Math.max(5, Math.min(120, seg)),
      inicio: (ini || new Date()).toISOString(),
      fim: fim && fim.getFullYear() < 2090 ? fim.toISOString() : null,
      status, criado_por_nome: "anterior ao Nando",
      conteudo: { legado: true, incerto, metadados: meta || null, arquivo_guardado: arquivos.includes(a) },
    });
  }
  if (novos.length) await sb.from("nando_avisos").insert(novos);
}

export async function historico(sb: SupabaseClient, avisoId: string, quem: string, acao: string, detalhe: Record<string, unknown> = {}) {
  const { data } = await sb.from("nando_avisos").select("conteudo").eq("id", avisoId).single();
  const c = (data?.conteudo || {}) as any;
  const h = Array.isArray(c.historico) ? c.historico : [];
  h.push({ em: new Date().toISOString(), quem, acao, ...detalhe });
  await sb.from("nando_avisos").update({ conteudo: { ...c, historico: h } }).eq("id", avisoId);
}

export function fmtData(d: string | Date | null | undefined): string {
  if (!d) return "sem data de saída";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

export function b64ParaBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export function bytesParaB64(bytes: Uint8Array): string {
  let s = "";
  const passo = 0x8000;
  for (let i = 0; i < bytes.length; i += passo) s += String.fromCharCode(...bytes.subarray(i, i + passo));
  return btoa(s);
}
export function slug(t: string): string {
  return String(t || "aviso").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "aviso";
}
export function carimbo(): string {
  return horaLocalIso(new Date()).replace(/\D/g, "");
}

// ---------------- QR code (leva ao documento original no celular) ----------------
export async function qrDataUrl(texto: string): Promise<string> {
  const svg: string = await QRCode.toString(texto, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#111111", light: "#ffffff" } });
  return "data:image/svg+xml;base64," + bytesParaB64(new TextEncoder().encode(svg));
}

// ---------------- link do predio (avisos no ar), assinado e temporario ----------------
async function chaveLink(): Promise<CryptoKey> {
  const seg = Deno.env.get("NANDO_LINK_SEGREDO") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return await crypto.subtle.importKey("raw", new TextEncoder().encode("nando-predio:" + seg), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
function hex(b: ArrayBuffer): string { return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join(""); }
export async function tokenPredio(buildingId: string, minutos = 60): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + minutos * 60;
  const base = `${buildingId.replace(/-/g, "")}${exp.toString(16)}`;
  const sig = hex(await crypto.subtle.sign("HMAC", await chaveLink(), new TextEncoder().encode(base))).slice(0, 24);
  return base + sig;
}
// link da CARTEIRA (todos os predios de um sindico/gestor): o token leva o telefone, e a lista de predios
// e calculada na hora (sempre atualizada). 16 digitos do telefone + validade + assinatura = 48 caracteres.
export async function tokenCarteira(telefone: string, minutos = 1440): Promise<string> {
  const tel = String(telefone).replace(/\D/g, "").padStart(16, "0").slice(-16);
  const exp = Math.floor(Date.now() / 1000) + minutos * 60;
  const base = `${tel}${exp.toString(16)}`;
  const sig = hex(await crypto.subtle.sign("HMAC", await chaveLink(), new TextEncoder().encode("carteira:" + base))).slice(0, 24);
  return base + sig;
}
export async function lerTokenCarteira(token: string): Promise<{ telefone: string; expira: Date } | null> {
  const t = String(token || "").toLowerCase().replace(/[^0-9a-f]/g, "");
  if (t.length !== 16 + 8 + 24) return null;
  const sig = t.slice(-24), base = t.slice(0, -24);
  const certo = hex(await crypto.subtle.sign("HMAC", await chaveLink(), new TextEncoder().encode("carteira:" + base))).slice(0, 24);
  if (certo !== sig) return null;
  const exp = parseInt(base.slice(16), 16);
  if (!exp || exp * 1000 < Date.now()) return null;
  return { telefone: base.slice(0, 16).replace(/^0+/, ""), expira: new Date(exp * 1000) };
}
export async function lerTokenPredio(token: string): Promise<{ buildingId: string; expira: Date } | null> {
  const t = String(token || "").toLowerCase().replace(/[^0-9a-f]/g, "");
  if (t.length < 32 + 8 + 24) return null;
  const sig = t.slice(-24), base = t.slice(0, -24);
  const certo = hex(await crypto.subtle.sign("HMAC", await chaveLink(), new TextEncoder().encode(base))).slice(0, 24);
  if (certo !== sig) return null;
  const exp = parseInt(base.slice(32), 16);
  if (!exp || exp * 1000 < Date.now()) return null;
  const h = base.slice(0, 32);
  return { buildingId: `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`, expira: new Date(exp * 1000) };
}
