// =====================================================================
// LÍVIA — núcleo (06/11/2026). Diretora financeira de IA da EXA, WhatsApp 45 99942-9820
// (instância de notificações da Evolution: evolution_instances.is_notifications = true).
// Livro de cobrança: cobranca_auditoria (contrato auditado). Ela só cobra pedido com pedidos.livia_cobranca = true.
// Nada genérico sai por este número: só a Lívia.
// =====================================================================
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export const LIVIA_VERSAO = "2026-11-06.1-inicio";
export const CEO_NUMERO = (Deno.env.get("LIVIA_CEO") || "5545998090000").replace(/\D/g, "");
export const LIVIA_NUMERO = "5545999429820";
export const SOFIA_NUMERO = "5545991415920";
export const SB_URL = Deno.env.get("SUPABASE_URL") || "";
export const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const EVO_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const ASAAS_API = (Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3").replace(/\/$/, "");
const MAIL_RAW = Deno.env.get("SOFIA_MAIL_FROM") || "EXA Mídia <noreply@examidia.com.br>";
const MAIL_ADDR = (MAIL_RAW.match(/<([^>]+)>/)?.[1] || MAIL_RAW).trim();
export const MAIL_FROM = "Lívia · EXA Mídia <" + MAIL_ADDR + ">";
export const BUCKET = "livia-midia";
export const PAINEL = "https://examidia.com.br/anunciante/pedidos";
const EXA_LOGO = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-logo.png";

export type DB = SupabaseClient;
export function db(): DB { return createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false, autoRefreshToken: false } }); }

// ---------------- datas (Brasília, sem horário de verão) ----------------
export const agoraBR = () => new Date(Date.now() - 3 * 3600e3);
export const hojeBR = () => agoraBR().toISOString().slice(0, 10);
export const horaBR = () => agoraBR().getUTCHours();
export const addDias = (ymd: string, n: number) => { const d = new Date(ymd + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
/** dias de a até b (b - a) */
export const difDias = (a: string, b: string) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400e3);
export const dataBR = (ymd?: string | null) => (ymd ? String(ymd).slice(0, 10).split("-").reverse().join("/") : "");
export const brl = (v: unknown) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
/** WhatsApp para cliente: segunda a sábado, 9h às 19h */
export const horaWhats = () => { const d = agoraBR(); const h = d.getUTCHours(); return d.getUTCDay() !== 0 && h >= 9 && h < 19; };
export const horaEmail = () => { const h = horaBR(); return h >= 7 && h < 21; };
/** "amanhã até as 10h" em ISO (o que a Lívia promete ao cliente quando precisa perguntar ao Jeferson) */
export function amanha10h(): string { const d = addDias(hojeBR(), 1); return new Date(d + "T10:00:00-03:00").toISOString(); }

// ---------------- telefones ----------------
export function chavesTelefone(bruto: unknown): string[] {
  let d = String(bruto || "").replace(/\D/g, "");
  if (!d) return [];
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (!d.startsWith("55")) return [d];
  const ddd = d.slice(2, 4); let num = d.slice(4);
  if (num.length === 8) num = "9" + num;
  if (num.length !== 9) return [d];
  return [`55${ddd}${num}`, `55${ddd}${num.slice(1)}`];
}
export const telefoneCanonico = (b: unknown) => chavesTelefone(b)[0] || String(b || "").replace(/\D/g, "");
export const telefonesIguais = (a: unknown, b: unknown) => { const ka = chavesTelefone(a), kb = chavesTelefone(b); return ka.some((x) => kb.includes(x)); };
export const ehCeo = (tel: string) => telefonesIguais(tel, CEO_NUMERO);
export const primeiroNome = (n: unknown) => String(n || "").trim().split(/\s+/)[0] || "";

// ---------------- configuração ----------------
let cfgCache = { t: 0, v: {} as Record<string, string> };
export async function config(sb: DB, fresco = false): Promise<Record<string, string>> {
  if (!fresco && Date.now() - cfgCache.t < 15000) return cfgCache.v;
  const { data } = await sb.from("livia_config").select("chave,valor");
  cfgCache = { t: Date.now(), v: Object.fromEntries((data || []).map((r: any) => [r.chave, String(r.valor ?? "")])) };
  return cfgCache.v;
}
export async function ehTestador(sb: DB, tel: string) {
  const c = await config(sb);
  return String(c.testadores || "").split(/[,;\s]+/).filter(Boolean).some((n) => telefonesIguais(n, tel));
}
export async function logEv(sb: DB, tipo: string, descricao: unknown) {
  try { await sb.from("log_eventos_sistema").insert({ tipo_evento: tipo, descricao: (typeof descricao === "string" ? descricao : JSON.stringify(descricao)).slice(0, 4000) }); } catch (_) { /* */ }
}

// ---------------- WhatsApp (Evolution, instância da Lívia) ----------------
let instCache = { t: 0, v: "" };
export async function instanciaLivia(sb: DB): Promise<string> {
  const env = Deno.env.get("LIVIA_INSTANCIA"); if (env) return env;
  if (instCache.v && Date.now() - instCache.t < 300000) return instCache.v;
  const { data } = await sb.from("evolution_instances").select("instance_name").eq("is_notifications", true).maybeSingle();
  instCache = { t: Date.now(), v: String(data?.instance_name || "notificacoes-exa-mqqnd5tb") };
  return instCache.v;
}
async function evo(sb: DB, caminho: string, corpo: unknown, ms = 30000) {
  if (!EVO_URL) throw new Error("EVOLUTION_API_URL ausente");
  const inst = await instanciaLivia(sb);
  const r = await fetch(`${EVO_URL}${caminho}/${inst}`, { method: "POST", headers: { "Content-Type": "application/json", apikey: EVO_KEY }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(ms) });
  const t = await r.text(); let j: any = {}; try { j = JSON.parse(t); } catch (_) { /* */ }
  if (!r.ok) throw new Error(`Evolution ${caminho} ${r.status}: ${t.slice(0, 200)}`);
  return j;
}
export async function enviarTexto(sb: DB, tel: string, texto: string) {
  await evo(sb, "/message/sendText", { number: telefoneCanonico(tel), text: texto, linkPreview: false });
}
export async function enviarDigitando(sb: DB, tel: string, ms = 1500) {
  try { await evo(sb, "/chat/sendPresence", { number: telefoneCanonico(tel), presence: "composing", delay: ms }, 8000); } catch (_) { /* opcional */ }
}
export async function enviarDocumento(sb: DB, tel: string, url: string, nome: string, legenda = "") {
  await evo(sb, "/message/sendMedia", { number: telefoneCanonico(tel), mediatype: "document", mimetype: "application/pdf", media: url, fileName: nome, caption: legenda }, 60000);
}
/** Manda várias mensagens curtas (picotadas), com "digitando" entre elas, e registra no histórico. */
export async function falar(sb: DB, tel: string, texto: string, extra: Record<string, unknown> = {}, pedidoId: string | null = null) {
  const partes = String(texto || "").split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const envio = partes.length > 4 ? [partes.slice(0, partes.length - 3).join("\n\n"), ...partes.slice(-3)] : partes;
  for (let i = 0; i < envio.length; i++) {
    if (i) { await enviarDigitando(sb, tel, Math.min(3500, 700 + envio[i].length * 25)); await new Promise((r) => setTimeout(r, 900)); }
    await enviarTexto(sb, tel, envio[i]);
  }
  await sb.from("livia_mensagens").insert({ telefone: telefoneCanonico(tel), papel: "livia", pedido_id: pedidoId, conteudo: { texto, ...extra } });
}
export async function baixarMidia(sb: DB, key: any): Promise<{ base64: string; mime: string } | null> {
  try {
    const j = await evo(sb, "/chat/getBase64FromMediaMessage", { message: { key }, convertToMp4: false }, 45000);
    const b64 = j.base64 || j.data?.base64; if (!b64) return null;
    return { base64: String(b64).replace(/^data:[^,]+,/, ""), mime: String(j.mimetype || j.data?.mimetype || "application/octet-stream") };
  } catch (e) { console.error("[LIVIA] baixarMidia", (e as Error).message); return null; }
}
export function b64ParaBytes(b64: string) { return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); }
export async function transcreverAudio(base64: string, mime: string): Promise<string | null> {
  const key = Deno.env.get("OPENAI_API_KEY"); if (!key) return null;
  const tipo = (mime || "audio/ogg").split(";")[0];
  const ext = tipo.includes("mpeg") ? "mp3" : tipo.includes("mp4") || tipo.includes("m4a") ? "m4a" : tipo.includes("wav") ? "wav" : "ogg";
  const fd = new FormData();
  fd.append("file", new Blob([b64ParaBytes(base64) as unknown as BlobPart], { type: tipo }), `audio.${ext}`);
  fd.append("model", "whisper-1"); fd.append("language", "pt");
  fd.append("prompt", "Conversa de WhatsApp com a Lívia, do financeiro da EXA Mídia: boleto, Pix, mensalidade, comprovante, vencimento.");
  try {
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: fd, signal: AbortSignal.timeout(60000) });
    if (!r.ok) return null;
    return String((await r.json()).text || "").trim() || null;
  } catch (_) { return null; }
}

// ---------------- CEO ----------------
/** Mensagem da Lívia para o Jeferson (fica no histórico dele, para ela entender a resposta curta depois). */
export async function avisarCeo(sb: DB, texto: string) {
  await logEv(sb, "LIVIA_ALERTA", texto);
  try { await falar(sb, CEO_NUMERO, texto, { alerta: true }); }
  catch (e) {
    console.error("[LIVIA] avisarCeo", (e as Error).message);
    await email(Deno.env.get("SOFIA_CEO_EMAIL") || "jefersonstilver@gmail.com", "Lívia — alerta", casca("Alerta da Lívia", `<p style="white-space:pre-wrap;margin:0">${escH(texto)}</p>`));
  }
}

// ---------------- e-mail ----------------
export const escH = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export async function email(to: string, assunto: string, html: string, anexoUrl?: string, anexoNome?: string) {
  const key = Deno.env.get("RESEND_API_KEY"); if (!key || !to) return { ok: false, erro: "sem chave ou destino" };
  try {
    const body: any = { from: MAIL_FROM, to: [to], subject: assunto, html };
    if (anexoUrl) body.attachments = [{ filename: anexoNome || "boleto-exa.pdf", path: anexoUrl }];
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
    if (!r.ok) return { ok: false, erro: r.status + " " + (await r.text()).slice(0, 300) };
    return { ok: true, erro: "" };
  } catch (e) { return { ok: false, erro: String(e) }; }
}
export const pE = (t: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d3538">${t}</p>`;
export const botaoE = (href: string, txt: string) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px"><tr><td style="background:#9C1E1E;border-radius:14px"><a href="${escH(href)}" style="display:inline-block;padding:13px 22px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">${escH(txt)}</a></td></tr></table>`;
export const codigoE = (rotulo: string, valor: string) => valor ? `<div style="margin:0 0 12px;padding:12px 14px;background:#f7f5f6;border-radius:12px"><div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8b8285;margin-bottom:4px">${escH(rotulo)}</div><div style="font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.5;color:#1b1719;word-break:break-all">${escH(valor)}</div></div>` : "";
export function casca(titulo: string, corpo: string, pre = "") {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escH(titulo)}</title></head>
<body style="margin:0;padding:0;background:#f4f1ec"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escH(pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1b1719">
<tr><td style="padding:0 6px 18px"><img src="${EXA_LOGO}" alt="EXA Mídia" height="30" style="display:block;height:30px;width:auto;border:0"></td></tr>
<tr><td style="background:#ffffff;border-radius:22px;padding:30px 28px">
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:800;color:#1b1719">${escH(titulo)}</h1>${corpo}</td></tr>
<tr><td style="padding:18px 8px 0;font-size:12px;line-height:1.6;color:#8b8285">Lívia · Financeiro EXA Mídia · Indexa Mídia LTDA · CNPJ 38.142.638/0001-30 · Foz do Iguaçu/PR.<br>Dúvidas sobre pagamento? Fale comigo no WhatsApp (45) 99942-9820.</td></tr>
</table></td></tr></table></body></html>`;
}

// ---------------- Asaas (leitura do saldo e do extrato) ----------------
export async function asaas(method: string, path: string, body?: unknown) {
  const key = Deno.env.get("ASAAS_API_KEY");
  if (!key) return { ok: false, status: 0, j: { errors: [{ description: "ASAAS_API_KEY ausente" }] } as any };
  try {
    const r = await fetch(ASAAS_API + path, { method, headers: { access_token: key, "Content-Type": "application/json", "User-Agent": "EXA-Livia/1.0" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
    let j: any = null; try { j = await r.json(); } catch (_) { /* */ }
    return { ok: r.ok, status: r.status, j };
  } catch (e) { return { ok: false, status: 0, j: { errors: [{ description: String(e) }] } as any }; }
}

// ---------------- chamadas a outras funções da EXA ----------------
let tokCache = { t: 0, v: "" };
export async function cronToken(sb: DB) {
  if (tokCache.v && Date.now() - tokCache.t < 600000) return tokCache.v;
  const { data } = await sb.from("exa2_config").select("valor").eq("chave", "cron_token").maybeSingle();
  tokCache = { t: Date.now(), v: String(data?.valor || "") };
  return tokCache.v;
}
export async function funcao(sb: DB, nome: string, corpo: unknown, query = "", ms = 60000): Promise<any> {
  try {
    const r = await fetch(`${SB_URL}/functions/v1/${nome}${query}`, {
      method: "POST", signal: AbortSignal.timeout(ms),
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + SB_SERVICE, apikey: SB_SERVICE, "x-exa2-cron": await cronToken(sb) },
      body: JSON.stringify(corpo),
    });
    const j = await r.json().catch(() => ({}));
    return { http: r.status, ...j };
  } catch (e) { return { ok: false, erro: String(e) }; }
}
/** Contrato auditado do pedido. visao 'cliente' = só o que o cliente vê; 'equipe' = tudo. */
export async function auditoria(sb: DB, pedidoId: string, visao: "cliente" | "equipe" = "cliente") {
  return await funcao(sb, "exa2-auditoria-cobranca", { action: visao === "cliente" ? "cliente" : "listar", pedido_id: pedidoId });
}
/** Gera Pix/boleto de uma parcela, ou Pix único das atrasadas (35% de desconto na regra do sistema). */
export async function gerarCobranca(sb: DB, pedidoId: string, o: { forma: "pix" | "boleto"; numero?: number; atrasadas?: boolean }) {
  return await funcao(sb, "exa2-auditoria-cobranca", { action: "cliente_pagar", pedido_id: pedidoId, forma: o.forma, numero: o.numero, atrasadas: !!o.atrasadas });
}
/** Suspender / reativar pedido (mesmo caminho que a régua antiga usa). */
export async function pedidoAdmin(sb: DB, acao: "suspender" | "reativar", pedidoId: string, motivo: string) {
  const j = await funcao(sb, "sofia-agent", { acao, pedido_id: pedidoId, motivo, silencioso: true }, "?action=pedido_admin", 110000);
  return { ok: j?.http === 200 && j?.ok !== false, j };
}

// ---------------- quem é o cliente ----------------
export interface PedidoCliente { id: string; nome: string; status: string; client_id: string; papel: string; empresa: string; livia_cobranca: boolean }
const nomePedido = (p: any) => String(p?.nome_pedido || p?.client_name || "pedido").replace(/^\s*EXA\s*[-–—:]\s*/i, "").trim();
const INATIVOS = ["cancelado", "cancelado_automaticamente", "finalizado"];

/** Pedidos ligados a este telefone (financeiro, dono ou autorizado). */
export async function clienteDoTelefone(sb: DB, tel: string): Promise<{ nome: string; empresa: string; pedidos: PedidoCliente[] }> {
  const { data: peds } = await sb.from("pedidos").select("id,client_id,nome_pedido,client_name,status,whatsapp,livia_cobranca").limit(1000);
  const vivos = (peds || []).filter((p: any) => !INATIVOS.includes(String(p.status)));
  const ids = [...new Set(vivos.map((p: any) => p.client_id).filter(Boolean))];
  const { data: us } = ids.length ? await sb.from("users").select("id,nome,empresa_nome,telefone,financeiro_whatsapp,financeiro_nome").in("id", ids) : { data: [] as any[] };
  const uMap = new Map((us || []).map((u: any) => [u.id, u]));
  const { data: aut } = await sb.from("pedido_whatsapp_autorizados").select("pedido_id,telefone,nome");
  const out: PedidoCliente[] = []; let nome = ""; let empresa = "";
  for (const p of vivos) {
    const u: any = uMap.get(p.client_id) || {};
    let papel = "";
    if (u.financeiro_whatsapp && telefonesIguais(u.financeiro_whatsapp, tel)) { papel = "financeiro"; nome = nome || u.financeiro_nome || ""; }
    else if ((p.whatsapp && telefonesIguais(p.whatsapp, tel)) || (u.telefone && telefonesIguais(u.telefone, tel))) { papel = "dono"; nome = nome || u.nome || ""; }
    else { const a = (aut || []).find((x: any) => x.pedido_id === p.id && telefonesIguais(x.telefone, tel)); if (a) { papel = "autorizado"; nome = nome || a.nome || ""; } }
    if (!papel) continue;
    empresa = empresa || u.empresa_nome || p.client_name || "";
    out.push({ id: p.id, nome: nomePedido(p), status: p.status, client_id: p.client_id, papel, empresa: u.empresa_nome || p.client_name || "", livia_cobranca: !!p.livia_cobranca });
  }
  return { nome, empresa, pedidos: out };
}

/** Para quem a Lívia cobra: o financeiro; sem financeiro, o dono. */
export async function contatosDoPedido(sb: DB, pedidoId: string) {
  const { data: ped } = await sb.from("pedidos").select("id,client_id,whatsapp,email,nome_pedido,client_name,status,blocked_reason,forma_cobranca").eq("id", pedidoId).maybeSingle();
  const { data: u } = ped?.client_id ? await sb.from("users").select("nome,primeiro_nome,email,telefone,financeiro_nome,financeiro_email,financeiro_whatsapp,empresa_nome").eq("id", ped.client_id).maybeSingle() : { data: null } as any;
  const dono = { nome: primeiroNome(u?.primeiro_nome || u?.nome || ped?.client_name), fone: telefoneCanonico(ped?.whatsapp || u?.telefone || ""), email: String(ped?.email || u?.email || "").trim().toLowerCase() };
  const temFin = !!(u?.financeiro_whatsapp || u?.financeiro_email);
  const financeiro = temFin ? { nome: primeiroNome(u?.financeiro_nome) || dono.nome, fone: telefoneCanonico(u?.financeiro_whatsapp || ""), email: String(u?.financeiro_email || "").trim().toLowerCase() } : null;
  return { ped, empresa: u?.empresa_nome || ped?.client_name || "", nomePedido: nomePedido(ped), dono, financeiro, cobrar: financeiro || dono };
}

/** Kammer: o Jeferson trata direto. */
export const ehKammer = (texto: unknown) => /kammer|3k\s*empreend|soho/i.test(String(texto || ""));
