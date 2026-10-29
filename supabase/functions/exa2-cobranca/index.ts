// EXA 2.0 — Cobrança mensal (boleto com Pix), régua de avisos da Sofia, conciliador e pedido de confiança.
//
// Regras do CEO (29/10/2026):
//  - padrão é Pix Automático; boleto só quando o cliente pede à Sofia (troca só pela Sofia);
//  - boleto gerado mês a mês, 10 dias antes do vencimento (dia 5, 10 ou 15); o 1º vence em até 2 dias;
//  - multa 2% + juros 1% a.m.; NUNCA duas cobranças para a mesma parcela (o Pix é o do próprio boleto);
//  - avisos: 10 dias (boleto, e-mail + WhatsApp com PDF), 5 dias (e-mail), 1 dia (e-mail + WhatsApp),
//    no dia, 1 dia depois, 3 dias depois (aviso ao CEO), 10 dias depois = pedido suspenso (sai das telas);
//  - WhatsApp só das 9h às 19h (seg–sáb); e-mail do financeiro (se houver) + e-mail da conta;
//  - pagou (de qualquer forma) = confirmação no WhatsApp/e-mail; se estava suspenso por falta de pagamento, reativa;
//  - pedido de confiança (admin): ativo por 5 dias; sem pagamento, suspende de novo;
//  - pagamento por fora só pelo admin, com descrição obrigatória (vira "recebido em dinheiro" no Asaas).
//
// Baixa sempre pelo ID da cobrança no Asaas (nunca por nome ou valor — regra do AGENTS.md).
// Ações:
//  cron (x-exa2-cron)                          → concilia, gera boletos do mês, régua, confiança vencida
//  boleto_avulso, boleto_plano, enviar_boleto,
//  trocar_para_boleto, faturas, financeiro      → Sofia (chave de serviço)
//  admin_parcelas, gerar_agora, reenviar, mudar_vencimento, perdoar_multa, marcar_pago, confianca → super admin
//  minhas_faturas                               → o próprio cliente (JWT)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-exa2-cron",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SB_URL = Deno.env.get("SUPABASE_URL") || "";
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const sb = createClient(SB_URL, SB_SERVICE);
const ASAAS_API = (Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3").replace(/\/$/, "");
const EVO_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const MAIL_FROM_RAW = Deno.env.get("SOFIA_MAIL_FROM") || "EXA Mídia <noreply@examidia.com.br>";
const MAIL_ADDR = (MAIL_FROM_RAW.match(/<([^>]+)>/)?.[1] || MAIL_FROM_RAW).trim();
const MAIL_FROM = "Sofia · EXA Mídia <" + MAIL_ADDR + ">";
const CEO_EMAIL = Deno.env.get("SOFIA_CEO_EMAIL") || "jefersonstilver@gmail.com";
const EXA_LOGO = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-logo.png";
const PAINEL = "https://examidia.com.br/anunciante/pedidos";

const MULTA = 2; // %
const JUROS = 1; // % ao mês
const DIAS_GERAR = 10;
const DIAS_SUSPENDER = 10;
const DIAS_CONFIANCA = 5;
const DIAS_VENC = [5, 10, 15];
const ABERTAS = ["pendente", "atrasado"];
const PAGO_ASAAS = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];
const INATIVOS = ["cancelado", "cancelado_automaticamente", "finalizado"];

// ---------- utilidades ----------
const digits = (s?: unknown) => String(s ?? "").replace(/\D/g, "");
const foneKey = (s: unknown) => { const d = digits(s); const n = d.startsWith("55") ? d : "55" + d; return n.length >= 12 ? n.slice(0, 4) + n.slice(-8) : n; };
const foneWa = (s: unknown) => { const d = digits(s); if (d.length < 10) return ""; return d.startsWith("55") && d.length >= 12 ? d : "55" + d; };
const escH = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const brl = (v: unknown) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const agoraBR = () => new Date(Date.now() - 3 * 3600e3); // Brasília (sem horário de verão)
const hojeBR = () => agoraBR().toISOString().slice(0, 10);
const addDias = (ymd: string, n: number) => { const d = new Date(ymd + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const difDias = (a: string, b: string) => Math.round((new Date(a + "T12:00:00Z").getTime() - new Date(b + "T12:00:00Z").getTime()) / 86400e3); // a - b
const dataBR = (ymd?: string | null) => (ymd ? String(ymd).slice(0, 10).split("-").reverse().join("/") : "");
const diaMes = (ymd: string) => String(ymd).slice(8, 10) + "/" + String(ymd).slice(5, 7);
const mesNome = (ymd: string) => new Date(ymd + "T12:00:00Z").toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" });
const horaWa = () => { const d = agoraBR(); const h = d.getUTCHours(); return d.getUTCDay() !== 0 && h >= 9 && h < 19; };
const horaEmail = () => { const h = agoraBR().getUTCHours(); return h >= 7 && h < 21; };
const nomePedido = (p: any) => String(p?.nome_pedido || p?.client_name || "seu pedido").replace(/^\s*EXA\s*[-–—:]\s*/i, "").trim();
const primeiroNome = (p: any, u?: any) => String(p?.client_first_name || u?.primeiro_nome || u?.nome || p?.client_name || "").trim().split(/\s+/)[0] || "";

async function asaas(method: string, path: string, body?: unknown) {
  const key = Deno.env.get("ASAAS_API_KEY");
  if (!key) return { ok: false, status: 0, j: { errors: [{ description: "ASAAS_API_KEY ausente" }] } as any };
  try {
    const r = await fetch(ASAAS_API + path, {
      method,
      headers: { access_token: key, "Content-Type": "application/json", "User-Agent": "EXA-Cobranca/1.0" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    let j: any = null; try { j = await r.json(); } catch (_) { /* vazio */ }
    return { ok: r.ok, status: r.status, j };
  } catch (e) { return { ok: false, status: 0, j: { errors: [{ description: String(e) }] } as any }; }
}
const erroAsaas = (r: any) => (r?.j?.errors || []).map((e: any) => e.description).join("; ") || ("HTTP " + r?.status);

async function logEv(tipo: string, descricao: unknown) {
  try { await sb.from("log_eventos_sistema").insert({ tipo_evento: tipo, descricao: (typeof descricao === "string" ? descricao : JSON.stringify(descricao)).slice(0, 4000) }); } catch (_) { /* ignore */ }
}

// ---------- WhatsApp (instância da Sofia) e e-mail ----------
async function evo(path: string, body: unknown) {
  if (!EVO_URL) return { ok: false, id: null as string | null };
  try {
    const r = await fetch(EVO_URL + path, { method: "POST", headers: { "Content-Type": "application/json", apikey: EVO_KEY }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    const t = await r.text(); let j: any = {}; try { j = JSON.parse(t); } catch (_) { /* */ }
    if (!r.ok) console.error("evo", path, r.status, t.slice(0, 300));
    return { ok: r.ok, id: (j?.key?.id as string) || null };
  } catch (e) { console.error("evo", String(e)); return { ok: false, id: null }; }
}
async function conversaDoFone(fone: string) {
  const k = foneKey(fone);
  const { data: cts } = await sb.from("sofia_contacts").select("id,phone").not("phone", "is", null).neq("role", "ceo").limit(3000);
  const ct = (cts || []).find((c: any) => foneKey(c.phone) === k);
  if (ct) {
    const { data: cv } = await sb.from("sofia_conversations").select("id,instance,jid").eq("contact_id", ct.id).order("last_message_at", { ascending: false }).limit(1).maybeSingle();
    if (cv?.instance && cv?.jid) return cv;
  }
  const { data: inst } = await sb.from("sofia_conversations").select("instance").not("instance", "is", null).order("last_message_at", { ascending: false }).limit(1).maybeSingle();
  if (!inst?.instance) return null;
  return { id: null, instance: inst.instance, jid: foneWa(fone) + "@s.whatsapp.net" };
}
async function waTexto(fone: string, texto: string) {
  const cv = await conversaDoFone(fone); if (!cv) return false;
  const r = await evo("/message/sendText/" + cv.instance, { number: cv.jid, text: texto, delay: Math.min(6000, 1000 + texto.length * 30) });
  if (r.ok && cv.id) await sb.from("sofia_messages").insert({ conversation_id: cv.id, wa_id: r.id, direction: "out_bot", body: "[cobrança EXA] " + texto });
  return r.ok;
}
async function waPdf(fone: string, url: string, nomeArq: string, legenda: string) {
  const cv = await conversaDoFone(fone); if (!cv) return false;
  let media = url;
  try { const r = await fetch(url, { signal: AbortSignal.timeout(20000) }); if (r.ok) { const u = new Uint8Array(await r.arrayBuffer()); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); media = btoa(s); } } catch (_) { /* usa a URL */ }
  const r = await evo("/message/sendMedia/" + cv.instance, { number: cv.jid, mediatype: "document", mimetype: "application/pdf", caption: legenda, media, fileName: nomeArq });
  if (r.ok && cv.id) await sb.from("sofia_messages").insert({ conversation_id: cv.id, wa_id: r.id, direction: "out_bot", body: "[cobrança EXA: PDF do boleto enviado] " + legenda });
  return r.ok;
}
async function email(to: string, assunto: string, html: string, anexoUrl?: string, anexoNome?: string) {
  const key = Deno.env.get("RESEND_API_KEY"); if (!key || !to) return { ok: false, erro: "sem chave ou destino" };
  try {
    const body: any = { from: MAIL_FROM, to: [to], subject: assunto, html, reply_to: "financeiro@examidia.com.br" };
    if (anexoUrl) body.attachments = [{ filename: anexoNome || "boleto-exa.pdf", path: anexoUrl }];
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
    if (!r.ok) { const t = (await r.text()).slice(0, 300); console.error("resend", r.status, t); return { ok: false, erro: r.status + " " + t }; }
    return { ok: true, erro: "" };
  } catch (e) { return { ok: false, erro: String(e) }; }
}
async function avisarCeo(texto: string) {
  await logEv("COBRANCA_ALERTA", texto);
  const { data: ceos } = await sb.from("sofia_contacts").select("id").eq("role", "ceo");
  const ids = (ceos || []).map((c: any) => c.id);
  const { data: cvs } = ids.length ? await sb.from("sofia_conversations").select("instance,jid").in("contact_id", ids).order("last_message_at", { ascending: false }) : { data: [] as any[] };
  const vistos = new Set<string>(); let ok = false;
  for (const c of cvs || []) { if (!c.jid || vistos.has(c.jid)) continue; vistos.add(c.jid); const r = await evo("/message/sendText/" + c.instance, { number: c.jid, text: texto }); ok = ok || r.ok; }
  if (!ok) await email(CEO_EMAIL, "Cobrança EXA — alerta", casca("Alerta de cobrança", `<p style="margin:0;white-space:pre-wrap">${escH(texto)}</p>`));
}

// ---------- e-mail (layout) ----------
function casca(titulo: string, corpo: string, pre = "") {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escH(titulo)}</title></head>
<body style="margin:0;padding:0;background:#f4f1ec;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escH(pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1b1719">
<tr><td style="padding:0 6px 18px"><img src="${EXA_LOGO}" alt="EXA Mídia" height="30" style="display:block;height:30px;width:auto;border:0"></td></tr>
<tr><td style="background:#ffffff;border-radius:22px;padding:30px 28px;box-shadow:0 1px 2px rgba(30,15,18,.05),0 18px 40px -24px rgba(30,15,18,.25)">
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:800;letter-spacing:-.01em;color:#1b1719">${escH(titulo)}</h1>
${corpo}
</td></tr>
<tr><td style="padding:18px 8px 0;font-size:12px;line-height:1.6;color:#8b8285">Mensagem da Sofia, assistente da EXA Mídia · Indexa Mídia LTDA · CNPJ 38.142.638/0001-30 · Foz do Iguaçu/PR.<br>Dúvidas? Responda este e-mail ou fale com a Sofia no WhatsApp (45) 99141-5920.</td></tr>
</table></td></tr></table></body></html>`;
}
const p = (t: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d3538">${t}</p>`;
const botao = (href: string, txt: string) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px"><tr><td style="background:#9C1E1E;border-radius:14px"><a href="${escH(href)}" style="display:inline-block;padding:13px 22px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">${escH(txt)}</a></td></tr></table>`;
const caixaCodigo = (rotulo: string, valor: string) => valor ? `<div style="margin:0 0 12px;padding:12px 14px;background:#f7f5f6;border-radius:12px"><div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8b8285;margin-bottom:4px">${escH(rotulo)}</div><div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:13px;line-height:1.5;color:#1b1719;word-break:break-all">${escH(valor)}</div></div>` : "";
function resumoParcela(pc: any, ped: any) {
  const linha = (k: string, v: string, forte = false) => `<tr><td style="padding:9px 0;font-size:14px;color:#8b8285;border-bottom:1px solid #f1edee">${escH(k)}</td><td align="right" style="padding:9px 0;font-size:14px;color:#1b1719;border-bottom:1px solid #f1edee;font-weight:${forte ? 800 : 600}">${escH(v)}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 18px">${linha("Pedido", nomePedido(ped))}${linha("Parcela", pc.numero_parcela + " de " + (ped.total_parcelas || ped.plano_meses || "—"))}${linha("Vencimento", dataBR(pc.data_vencimento))}${linha("Valor", brl(pc.valor_final), true)}</table>`;
}
function blocoPagamento(pc: any) {
  return (pc.boleto_url ? botao(pc.boleto_url, "Abrir o boleto (PDF)") : "")
    + caixaCodigo("Pix copia e cola — cai na hora", pc.pix_qr_code || "")
    + caixaCodigo("Linha digitável", pc.boleto_barcode || "")
    + p(`<span style="font-size:13px;color:#8b8285">Pagando pelo Pix do boleto a confirmação é imediata. Pelo código de barras leva até 3 dias úteis. Após o vencimento: multa de ${MULTA}% e juros de ${JUROS}% ao mês. Você também encontra os boletos em <a href="${PAINEL}" style="color:#9C1E1E">examidia.com.br</a>, no seu pedido.</span>`);
}

// ---------- contatos do pedido ----------
async function contatos(ped: any) {
  const { data: u } = ped.client_id ? await sb.from("users").select("id,nome,primeiro_nome,email,telefone,financeiro_email,financeiro_whatsapp,financeiro_nome").eq("id", ped.client_id).maybeSingle() : { data: null } as any;
  const emails = [...new Set([u?.financeiro_email, ped.email || u?.email].map((e) => String(e || "").trim().toLowerCase()).filter((e) => /.+@.+\..+/.test(e)))];
  const fones = [...new Set([ped.whatsapp, u?.financeiro_whatsapp].map((f) => foneWa(f)).filter(Boolean))];
  return { u, emails, fones, nome: primeiroNome(ped, u) };
}

// Aviso idempotente: registra antes de enviar; se já existe, não manda de novo.
async function aviso(pc: any, ped: any, tipo: string, canal: "email" | "whatsapp" | "ceo", destino: string, envio: () => Promise<boolean | { ok: boolean; erro?: string }>, forcar = false) {
  if (!forcar) {
    const { error } = await sb.from("exa2_cobranca_avisos").insert({ parcela_id: pc?.id || null, pedido_id: ped?.id || null, tipo, canal, destino });
    if (error) return null; // já enviado
  }
  let ok = false; let det = "";
  try { const r: any = await envio(); ok = typeof r === "boolean" ? r : !!r?.ok; det = typeof r === "object" ? String(r?.erro || "") : ""; } catch (e) { det = String(e); }
  if (forcar) await sb.from("exa2_cobranca_avisos").insert({ parcela_id: pc?.id || null, pedido_id: ped?.id || null, tipo: tipo + "_" + Date.now(), canal, destino, ok, detalhe: det.slice(0, 500) });
  else await sb.from("exa2_cobranca_avisos").update({ ok, detalhe: det.slice(0, 500) }).eq("parcela_id", pc?.id).eq("tipo", tipo).eq("canal", canal).eq("destino", destino);
  if (!ok && canal === "email" && pc) {
    // e-mail não entregue: a Sofia pede o e-mail certo no WhatsApp (uma vez por parcela)
    const ct = await contatos(ped);
    for (const f of ct.fones) await aviso(pc, ped, "email_falhou", "whatsapp", f, () => horaWa() ? waTexto(f, `Oi${ct.nome ? ", " + ct.nome : ""}! Aqui é a Sofia, da EXA. Tentei te mandar o boleto no e-mail ${destino}, mas ele não foi entregue. Pode me passar o e-mail certo para eu cadastrar?`) : Promise.resolve(false));
  }
  return ok;
}

// ---------- Asaas: cobrança da parcela ----------
async function clienteAsaas(ped: any): Promise<string | null> {
  if (ped.asaas_customer_id) return ped.asaas_customer_id;
  const { data: cb } = await sb.from("sofia_cobrancas").select("customer_id").eq("pedido_id", String(ped.id)).not("customer_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  let cid = cb?.customer_id || null;
  if (!cid && ped.client_id) {
    const { data: u } = await sb.from("users").select("empresa_documento,cpf").eq("id", ped.client_id).maybeSingle();
    const doc = digits(u?.empresa_documento || u?.cpf);
    if (doc) { const r = await asaas("GET", "/customers?cpfCnpj=" + doc); cid = r.ok ? r.j?.data?.[0]?.id || null : null; }
  }
  if (cid) await sb.from("pedidos").update({ asaas_customer_id: cid }).eq("id", ped.id);
  return cid;
}
async function completarDados(pc: any, payId: string, pay?: any) {
  const up: any = { asaas_payment_id: payId, forma: "boleto" };
  if (pay) { up.boleto_url = pay.bankSlipUrl || null; up.asaas_invoice_url = pay.invoiceUrl || null; up.asaas_status = pay.status || null; if (pay.dueDate) up.data_vencimento = pay.dueDate; }
  const lin = await asaas("GET", "/payments/" + payId + "/identificationField");
  if (lin.ok) up.boleto_barcode = lin.j?.identificationField || null;
  const pix = await asaas("GET", "/payments/" + payId + "/pixQrCode");
  if (pix.ok) { up.pix_qr_code = pix.j?.payload || null; up.pix_qr_code_base64 = pix.j?.encodedImage || null; }
  const { data } = await sb.from("parcelas").update(up).eq("id", pc.id).select("*").single();
  return data || { ...pc, ...up };
}
async function gerarBoleto(pc: any, ped: any): Promise<{ ok: boolean; parcela?: any; erro?: string }> {
  if (pc.asaas_payment_id) return { ok: true, parcela: pc };
  if (pc.status === "pago") return { ok: false, erro: "parcela já paga" };
  // trava: só um gerador por parcela (evita 2 boletos para o mesmo mês)
  const { data: trava } = await sb.from("parcelas").update({ boleto_gerado_em: new Date().toISOString() }).eq("id", pc.id).is("asaas_payment_id", null)
    .or("boleto_gerado_em.is.null,boleto_gerado_em.lt." + new Date(Date.now() - 10 * 60000).toISOString()).select("id");
  if (!trava?.length) return { ok: false, erro: "outra geração em andamento" };
  const ref = "parcela:" + pc.id;
  // se uma tentativa anterior criou a cobrança e não salvou, reaproveita
  const ja = await asaas("GET", "/payments?externalReference=" + encodeURIComponent(ref));
  const existente = (ja.j?.data || []).find((x: any) => !x.deleted);
  if (existente) return { ok: true, parcela: await completarDados(pc, existente.id, existente) };
  const cid = await clienteAsaas(ped);
  if (!cid) return { ok: false, erro: "cliente sem cadastro no Asaas" };
  const hoje = hojeBR();
  const venc = pc.data_vencimento < hoje ? hoje : pc.data_vencimento;
  const r = await asaas("POST", "/payments", {
    customer: cid, billingType: "BOLETO", value: Number(pc.valor_final), dueDate: venc,
    description: `EXA Mídia · ${nomePedido(ped)} · parcela ${pc.numero_parcela}/${ped.total_parcelas || ped.plano_meses || ""}`.slice(0, 480),
    externalReference: ref, fine: { value: MULTA, type: "PERCENTAGE" }, interest: { value: JUROS },
  });
  if (!r.ok || !r.j?.id) { await sb.from("parcelas").update({ boleto_gerado_em: null }).eq("id", pc.id); return { ok: false, erro: erroAsaas(r) }; }
  await logEv("COBRANCA_BOLETO_GERADO", { pedido: ped.id, parcela: pc.id, asaas: r.j.id, valor: pc.valor_final, venc });
  return { ok: true, parcela: await completarDados(pc, r.j.id, r.j) };
}

// ---------- envios ----------
async function enviarBoleto(pc: any, ped: any, opt: { forcar?: boolean; semWhats?: boolean } = {}) {
  const ct = await contatos(ped);
  const ola = ct.nome ? `Olá, ${escH(ct.nome)}!` : "Olá!";
  const html = casca(`Seu boleto de ${mesNome(pc.data_vencimento)} chegou`, p(ola) + p(`O boleto da sua campanha na EXA vence em <b>${dataBR(pc.data_vencimento)}</b>. O PDF vai anexo e também no botão abaixo.`) + resumoParcela(pc, ped) + blocoPagamento(pc), `Vence em ${dataBR(pc.data_vencimento)} · ${brl(pc.valor_final)}`);
  for (const e of ct.emails) await aviso(pc, ped, "boleto_novo", "email", e, () => email(e, `Boleto EXA Mídia · vence ${dataBR(pc.data_vencimento)} · ${brl(pc.valor_final)}`, html, pc.boleto_url, `boleto-exa-${pc.numero_parcela}.pdf`), !!opt.forcar);
  // 1ª parcela de venda da Sofia: o PDF já foi no WhatsApp pela própria Sofia, na conversa
  if (ped.status === "pendente" && pc.numero_parcela === 1) return;
  if (opt.semWhats || !horaWa()) return; // WhatsApp sai no próximo horário comercial (o cron tenta de novo)
  for (const f of ct.fones) {
    await aviso(pc, ped, "boleto_novo", "whatsapp", f, async () => {
      const okPdf = pc.boleto_url ? await waPdf(f, pc.boleto_url, `boleto-exa-${diaMes(pc.data_vencimento).replace("/", "-")}.pdf`, `Boleto EXA Mídia · ${brl(pc.valor_final)} · vence ${dataBR(pc.data_vencimento)}`) : false;
      const okT = await waTexto(f, `Oi${ct.nome ? ", " + ct.nome : ""}! Aqui é a Sofia, da EXA. Esse é o boleto de ${mesNome(pc.data_vencimento)} da sua campanha (${brl(pc.valor_final)}), vence dia ${diaMes(pc.data_vencimento)}. Também te enviei por e-mail.\n\nPelo Pix que vem no próprio boleto o pagamento cai na hora. Quer a linha digitável ou o Pix copia e cola aqui para copiar?`);
      return okPdf || okT;
    }, !!opt.forcar);
  }
}
async function lembrete(pc: any, ped: any, tipo: string, ct: any, viaWhats: boolean) {
  const v = dataBR(pc.data_vencimento); const val = brl(pc.valor_final); const ola = ct.nome ? `Olá, ${escH(ct.nome)}!` : "Olá!";
  const T: Record<string, { assunto: string; titulo: string; corpo: string; wa: string }> = {
    lembrete_5d: { assunto: `Lembrete: boleto EXA vence em ${v}`, titulo: "Seu boleto vence em 5 dias", corpo: p(ola + " Aqui é a Sofia. Seu boleto ainda não consta como pago, então passei só para lembrar: ele vence em <b>" + v + "</b>. Se já pagou, pode desconsiderar."), wa: "" },
    vence_amanha: { assunto: `Seu boleto EXA vence amanhã (${v})`, titulo: "Seu boleto vence amanhã", corpo: p(ola + " Passando para lembrar que o boleto da sua campanha vence <b>amanhã, " + v + "</b>. Se já pagou, pode desconsiderar."), wa: `Oi${ct.nome ? ", " + ct.nome : ""}! Só lembrando que o boleto da EXA (${val}) vence amanhã, ${diaMes(pc.data_vencimento)}. Se já pagou, pode desconsiderar. Quer a linha digitável ou o Pix copia e cola?` },
    vence_hoje: { assunto: `Seu boleto EXA vence hoje`, titulo: "Seu boleto vence hoje", corpo: p(ola + " O boleto da sua campanha vence <b>hoje</b>. Pelo Pix do próprio boleto o pagamento cai na hora."), wa: `Oi${ct.nome ? ", " + ct.nome : ""}! O boleto da EXA (${val}) vence hoje. Pelo Pix do próprio boleto cai na hora. Se quiser, te mando o código aqui.` },
    venceu: { assunto: `Boleto EXA em aberto (venceu em ${v})`, titulo: "Seu boleto venceu", corpo: p(ola + " O boleto de " + v + " ainda não consta como pago. Ele continua valendo, agora com multa de " + MULTA + "% e juros de " + JUROS + "% ao mês, calculados automaticamente.") + p("Para manter sua campanha no ar, o pagamento precisa entrar em até " + DIAS_SUSPENDER + " dias do vencimento. Depois disso o pedido é suspenso até a regularização."), wa: `Oi${ct.nome ? ", " + ct.nome : ""}. O boleto de ${val} venceu dia ${diaMes(pc.data_vencimento)} e ainda não consta pagamento. Ele continua valendo, com multa de ${MULTA}% e juros. Pelo Pix do boleto cai na hora: quer que eu te mande o código?` },
  };
  const t = T[tipo]; if (!t) return;
  const html = casca(t.titulo, t.corpo + resumoParcela(pc, ped) + blocoPagamento(pc), t.assunto);
  if (horaEmail()) for (const e of ct.emails) await aviso(pc, ped, tipo, "email", e, () => email(e, t.assunto, html));
  if (viaWhats && t.wa && horaWa()) for (const f of ct.fones) await aviso(pc, ped, tipo, "whatsapp", f, () => waTexto(f, t.wa));
}
async function avisoGeral(ped: any, tipo: string, assunto: string, titulo: string, corpoHtml: string, wa: string, pc: any = null) {
  const ct = await contatos(ped);
  const ref = pc || { id: null };
  const html = casca(titulo, p(ct.nome ? `Olá, ${escH(ct.nome)}!` : "Olá!") + corpoHtml, assunto);
  const out = { email: 0, whatsapp: 0 };
  for (const e of ct.emails) { const r = await email(e, assunto, html); if (r.ok) out.email++; await sb.from("exa2_cobranca_avisos").insert({ parcela_id: ref.id, pedido_id: ped.id, tipo: tipo + "_" + Date.now(), canal: "email", destino: e, ok: r.ok, detalhe: r.erro?.slice(0, 300) || null }); }
  for (const f of ct.fones) { const ok = await waTexto(f, (ct.nome ? `Oi, ${ct.nome}! ` : "Oi! ") + wa); if (ok) out.whatsapp++; await sb.from("exa2_cobranca_avisos").insert({ parcela_id: ref.id, pedido_id: ped.id, tipo: tipo + "_" + Date.now(), canal: "whatsapp", destino: f, ok }); }
  return out;
}

// ---------- suspensão / reativação (pela ação já existente da Sofia) ----------
async function cronToken() { const { data } = await sb.from("exa2_config").select("valor").eq("chave", "cron_token").maybeSingle(); return String(data?.valor || ""); }
async function pedidoAdmin(acao: string, pedidoId: string, motivo: string, extra: Record<string, unknown> = {}) {
  try {
    const r = await fetch(SB_URL + "/functions/v1/sofia-agent?action=pedido_admin", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + SB_SERVICE, apikey: SB_SERVICE, "x-exa2-cron": await cronToken() },
      body: JSON.stringify({ acao, pedido_id: pedidoId, motivo, silencioso: true, ...extra }), signal: AbortSignal.timeout(110000),
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok && j?.ok !== false, j };
  } catch (e) { return { ok: false, j: { erro: String(e) } }; }
}
const suspensoPorPagamento = (ped: any) => ped.status === "bloqueado" && /falta de pagamento|pagamento não identificado/i.test(String(ped.blocked_reason || ""));

async function suspender(ped: any, pc: any, motivo: string) {
  const r = await pedidoAdmin("suspender", ped.id, motivo);
  if (!r.ok) { await avisarCeo(`ALERTA cobrança: não consegui suspender o pedido ${nomePedido(ped)} (${String(ped.id).slice(0, 8)}) por falta de pagamento: ${JSON.stringify(r.j).slice(0, 200)}`); return false; }
  await sb.from("pedidos").update({ status_adimplencia: "suspenso", data_suspensao: new Date().toISOString(), confianca_ate: null }).eq("id", ped.id);
  await avisoGeral(ped, "suspenso", "Pedido EXA suspenso por falta de pagamento", "Seu pedido foi suspenso",
    p(`O pedido <b>${escH(nomePedido(ped))}</b> foi suspenso porque o boleto de ${dataBR(pc?.data_vencimento)} (${brl(pc?.valor_final)}) não foi pago. Enquanto estiver suspenso, os vídeos saem das telas e não é possível enviar ou criar vídeos novos.`)
      + p("Assim que o pagamento entrar, o pedido volta ao ar automaticamente, em poucos minutos.") + (pc ? blocoPagamento(pc) : ""),
    `Aqui é a Sofia, da EXA. O pedido ${nomePedido(ped)} foi suspenso porque o boleto de ${diaMes(pc?.data_vencimento || hojeBR())} não foi pago, e os vídeos saíram das telas. Assim que o pagamento entrar ele volta sozinho. Quer que eu te mande o Pix do boleto para pagar agora? Cai na hora.`, pc);
  await avisarCeo(`Cobrança: pedido ${nomePedido(ped)} (${String(ped.id).slice(0, 8)}) SUSPENSO — ${motivo}`);
  return true;
}
async function reativarSePago(ped: any) {
  const { data: atr } = await sb.from("parcelas").select("id").eq("pedido_id", ped.id).in("status", ABERTAS).lt("data_vencimento", hojeBR());
  if ((atr || []).length) return false;
  await sb.from("pedidos").update({ status_adimplencia: "em_dia", dias_atraso: 0 }).eq("id", ped.id);
  if (!suspensoPorPagamento(ped)) return false;
  const r = await pedidoAdmin("reativar", ped.id, "Pagamento identificado");
  if (!r.ok) { await avisarCeo(`ALERTA cobrança: pagamento entrou mas não consegui reativar ${nomePedido(ped)} (${String(ped.id).slice(0, 8)}): ${JSON.stringify(r.j).slice(0, 200)}. Use Reativar no pedido.`); return false; }
  await avisoGeral(ped, "reativado", "Pedido EXA reativado", "Seu pedido voltou ao ar", p("Pagamento identificado. Seu pedido foi reativado e os vídeos voltam às telas em poucos minutos."), `pagamento identificado e o pedido ${nomePedido(ped)} já foi reativado. Os vídeos voltam às telas em poucos minutos.`);
  return true;
}

// ---------- baixa ----------
async function marcarPaga(pc: any, ped: any, origem: "asaas" | "fora", info: { valor?: number; data?: string; descricao?: string; por?: string } = {}) {
  const up: any = { status: "pago", data_pagamento: info.data ? new Date(info.data + "T12:00:00-03:00").toISOString() : new Date().toISOString(), asaas_status: origem === "fora" ? "RECEIVED_IN_CASH" : "RECEIVED" };
  if (origem === "fora") { up.forma = pc.forma || "fora"; up.pago_fora_descricao = info.descricao || null; up.pago_fora_por = info.por || null; }
  if (info.valor) { const dif = Number(info.valor) - Number(pc.valor_final); if (dif > 0.009) up.valor_multa = Math.round(dif * 100) / 100; }
  const { data: upd } = await sb.from("parcelas").update(up).eq("id", pc.id).neq("status", "pago").select("id");
  if (!upd?.length) return false; // já baixada
  await logEv("COBRANCA_PARCELA_PAGA", { pedido: ped.id, parcela: pc.id, numero: pc.numero_parcela, origem, valor: info.valor ?? pc.valor_final, descricao: info.descricao });
  // 1ª parcela de venda da Sofia ainda pendente: a própria Sofia confirma e segue o fluxo (contrato etc.)
  if (ped.status === "pendente") return true;
  const ct = await contatos(ped);
  const val = brl(info.valor ?? pc.valor_final);
  const html = casca("Pagamento recebido", p(ct.nome ? `Olá, ${escH(ct.nome)}!` : "Olá!") + p(`Recebemos o pagamento da parcela ${pc.numero_parcela} do pedido <b>${escH(nomePedido(ped))}</b>. Obrigado!`) + resumoParcela({ ...pc, valor_final: info.valor ?? pc.valor_final }, ped) + (pc.asaas_invoice_url ? botao(pc.asaas_invoice_url, "Ver comprovante") : ""), `Pagamento de ${val} confirmado`);
  for (const e of ct.emails) await aviso(pc, ped, "pago", "email", e, () => email(e, `Pagamento confirmado · EXA Mídia · ${val}`, html));
  for (const f of ct.fones) await aviso(pc, ped, "pago", "whatsapp", f, () => waTexto(f, `Oi${ct.nome ? ", " + ct.nome : ""}! Aqui é a Sofia, da EXA. Recebemos o pagamento de ${val} (parcela ${pc.numero_parcela}) do pedido ${nomePedido(ped)}. Obrigada! 🙌`));
  await aviso(pc, ped, "pago", "ceo", "", async () => { await avisarCeo(`Pagamento recebido${origem === "fora" ? " (registrado por fora: " + (info.descricao || "") + ")" : ""}: ${val} · ${nomePedido(ped)} · parcela ${pc.numero_parcela}.`); return true; });
  await reativarSePago({ ...ped });
  return true;
}

// ---------- cron ----------
async function conciliar(out: any) {
  const { data: pcs } = await sb.from("parcelas").select("*").not("asaas_payment_id", "is", null).in("status", ABERTAS).limit(80);
  for (const pc of pcs || []) {
    const r = await asaas("GET", "/payments/" + pc.asaas_payment_id);
    if (!r.ok) continue;
    const st = String(r.j?.status || "");
    if (st !== pc.asaas_status) await sb.from("parcelas").update({ asaas_status: st }).eq("id", pc.id);
    if (PAGO_ASAAS.includes(st)) {
      const { data: ped } = await sb.from("pedidos").select("*").eq("id", pc.pedido_id).maybeSingle();
      if (ped && await marcarPaga(pc, ped, "asaas", { valor: Number(r.j?.value || pc.valor_final), data: r.j?.paymentDate || r.j?.clientPaymentDate })) out.pagas++;
    } else if (r.j?.deleted || st === "REFUNDED") {
      await avisarCeo(`ALERTA cobrança: o boleto ${pc.asaas_payment_id} (parcela ${pc.numero_parcela}) aparece como ${r.j?.deleted ? "removido" : st} no Asaas. Confira o pedido ${String(pc.pedido_id).slice(0, 8)}.`);
    }
  }
}
async function gerarDoMes(out: any) {
  const limite = addDias(hojeBR(), DIAS_GERAR);
  const { data: pcs } = await sb.from("parcelas").select("*").eq("forma", "boleto").eq("status", "pendente").is("asaas_payment_id", null).lte("data_vencimento", limite).order("data_vencimento").limit(30);
  for (const pc of pcs || []) {
    const { data: ped } = await sb.from("pedidos").select("*").eq("id", pc.pedido_id).maybeSingle();
    if (!ped || INATIVOS.includes(ped.status) || ped.status === "pendente") continue;
    const g = await gerarBoleto(pc, ped);
    if (!g.ok) { if (g.erro !== "outra geração em andamento") await avisarCeo(`ALERTA cobrança: não consegui gerar o boleto da parcela ${pc.numero_parcela} de ${nomePedido(ped)}: ${g.erro}`); continue; }
    out.gerados++;
    await enviarBoleto(g.parcela, ped);
  }
}
async function regua(out: any) {
  const hoje = hojeBR();
  const { data: pcs } = await sb.from("parcelas").select("*").eq("forma", "boleto").in("status", ABERTAS).not("asaas_payment_id", "is", null).limit(200);
  for (const pc of pcs || []) {
    const { data: ped } = await sb.from("pedidos").select("*").eq("id", pc.pedido_id).maybeSingle();
    if (!ped || INATIVOS.includes(ped.status)) continue;
    const primeiraVenda = ped.status === "pendente" && pc.numero_parcela === 1; // ainda não virou pedido ativo: não há o que suspender
    const d = difDias(pc.data_vencimento, hoje); // dias até o vencimento (negativo = atraso)
    const ct = await contatos(ped);
    await enviarBoleto(pc, ped); // garante que o boleto (e o WhatsApp atrasado pelo horário) saiu
    const geradoHa = pc.boleto_gerado_em ? (Date.now() - new Date(pc.boleto_gerado_em).getTime()) / 86400e3 : 99;
    if (d >= 2 && d <= 5 && geradoHa >= 2) await lembrete(pc, ped, "lembrete_5d", ct, false);
    else if (d === 1) await lembrete(pc, ped, "vence_amanha", ct, true);
    else if (d === 0) await lembrete(pc, ped, "vence_hoje", ct, true);
    else if (d < 0) {
      if (pc.status !== "atrasado") await sb.from("parcelas").update({ status: "atrasado" }).eq("id", pc.id);
      if (primeiraVenda) {
        if (d >= -2) await lembrete(pc, ped, "venceu", ct, true);
        if (d <= -3) await aviso(pc, ped, "atraso_3d", "ceo", "", async () => { await avisarCeo(`Cobrança: ${nomePedido(ped)} ainda não pagou o 1º boleto (venceu ${dataBR(pc.data_vencimento)}, ${brl(pc.valor_final)}). O pedido segue pendente, sem ir ao ar.`); return true; });
        continue;
      }
      await sb.from("pedidos").update({ status_adimplencia: "inadimplente", dias_atraso: -d }).eq("id", ped.id);
      if (d >= -2) await lembrete(pc, ped, "venceu", ct, true);
      if (d <= -3) await aviso(pc, ped, "atraso_3d", "ceo", "", async () => { await avisarCeo(`Cobrança: ${nomePedido(ped)} está com o boleto de ${dataBR(pc.data_vencimento)} (${brl(pc.valor_final)}) ${-d} dias em atraso. Suspensão automática no ${DIAS_SUSPENDER}º dia.`); return true; });
      const confianca = ped.confianca_ate && new Date(ped.confianca_ate).getTime() > Date.now();
      if (d <= -DIAS_SUSPENDER && ped.status !== "bloqueado" && !confianca) {
        const okS = await aviso(pc, ped, "suspensao", "ceo", "", () => suspender(ped, pc, `Falta de pagamento: parcela ${pc.numero_parcela} vencida em ${dataBR(pc.data_vencimento)}`));
        if (okS) out.suspensos++;
      }
    }
  }
}
async function confiancaVencida(out: any) {
  const { data: peds } = await sb.from("pedidos").select("*").not("confianca_ate", "is", null).lt("confianca_ate", new Date().toISOString()).limit(30);
  for (const ped of peds || []) {
    const { data: abertas } = await sb.from("parcelas").select("*").eq("pedido_id", ped.id).in("status", ABERTAS).lte("data_vencimento", hojeBR()).order("data_vencimento").limit(1);
    const pc = abertas?.[0];
    await sb.from("pedidos").update({ confianca_ate: null }).eq("id", ped.id);
    if (!pc) continue; // pagou dentro do prazo
    if (!INATIVOS.includes(ped.status) && ped.status !== "bloqueado") { await suspender(ped, pc, "Pagamento não identificado após a ativação de confiança"); out.suspensos++; }
  }
}

// ---------- plano de parcelas do boleto ----------
function datasPlano(inicioYmd: string, primeiroVenc: string, dia: number, total: number) {
  const out = [primeiroVenc];
  // 2ª parcela: primeiro dia escolhido depois de completar 1 mês do início
  const ini = new Date(inicioYmd + "T12:00:00Z"); const umMes = new Date(ini); umMes.setUTCMonth(umMes.getUTCMonth() + 1);
  let y = umMes.getUTCFullYear(), m = umMes.getUTCMonth();
  if (umMes.getUTCDate() > dia) m += 1;
  for (let k = 1; k < total; k++) { const d = new Date(Date.UTC(y, m + (k - 1), dia, 12)); out.push(d.toISOString().slice(0, 10)); }
  return out;
}

// ---------- ações ----------
async function autenticar(req: Request) {
  const bearer = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const cronH = req.headers.get("x-exa2-cron") || "";
  if (cronH && cronH === await cronToken()) return { tipo: "sistema" as const, uid: null as string | null };
  if (bearer && bearer === SB_SERVICE) return { tipo: "sistema" as const, uid: null };
  if (!bearer) return { tipo: "anon" as const, uid: null };
  const { data } = await sb.auth.getUser(bearer); const uid = data?.user?.id || null;
  if (!uid) return { tipo: "anon" as const, uid: null };
  const { data: rl } = await sb.from("user_roles").select("role").eq("user_id", uid);
  const papeis = (rl || []).map((r: any) => String(r.role));
  if (papeis.includes("super_admin")) return { tipo: "master" as const, uid };
  if (papeis.some((r) => ["admin", "admin_financeiro"].includes(r))) return { tipo: "admin" as const, uid };
  return { tipo: "cliente" as const, uid };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  let b: any = {}; try { b = await req.json(); } catch (_) { /* */ }
  const action = String(b.action || new URL(req.url).searchParams.get("action") || "");
  const quem = await autenticar(req);
  const sistema = quem.tipo === "sistema";
  const master = quem.tipo === "master";
  const admin = master || quem.tipo === "admin";
  try {
    // ===== cron =====
    if (action === "cron") {
      if (!sistema) return json({ ok: false, erro: "não autorizado" }, 401);
      const out = { pagas: 0, gerados: 0, suspensos: 0 };
      await conciliar(out); await gerarDoMes(out); await regua(out); await confiancaVencida(out);
      return json({ ok: true, ...out });
    }

    // ===== Sofia: 1º boleto (antes de existir o pedido) =====
    if (action === "boleto_avulso") {
      if (!sistema) return json({ ok: false, erro: "não autorizado" }, 401);
      const cid = String(b.customer_id || ""); const valor = Number(b.value || 0);
      if (!cid || !(valor > 0)) return json({ ok: false, erro: "customer_id e value obrigatórios" }, 400);
      const ref = String(b.externalReference || "").slice(0, 100) || null;
      if (ref) { const ja = await asaas("GET", "/payments?externalReference=" + encodeURIComponent(ref) + "&status=PENDING"); const ex = (ja.j?.data || []).find((x: any) => !x.deleted && x.billingType === "BOLETO"); if (ex) await asaas("DELETE", "/payments/" + ex.id); }
      const venc = addDias(hojeBR(), Math.min(2, Math.max(1, Number(b.dias || 2))));
      const r = await asaas("POST", "/payments", { customer: cid, billingType: "BOLETO", value: valor, dueDate: venc, description: String(b.description || "EXA Mídia · 1ª mensalidade").slice(0, 480), externalReference: ref, fine: { value: MULTA, type: "PERCENTAGE" }, interest: { value: JUROS } });
      if (!r.ok || !r.j?.id) return json({ ok: false, erro: erroAsaas(r) }, 502);
      const lin = await asaas("GET", "/payments/" + r.j.id + "/identificationField");
      const pix = await asaas("GET", "/payments/" + r.j.id + "/pixQrCode");
      await sb.from("sofia_cobrancas").insert({ kind: "boleto", asaas_id: r.j.id, customer_id: cid, value: valor, status: "PENDING", external_reference: ref, contact_id: b.contact_id || null, due_date: venc, meses: b.meses || null });
      await logEv("COBRANCA_BOLETO_1", { asaas: r.j.id, valor, venc, ref });
      return json({ ok: true, payment_id: r.j.id, due_date: venc, bank_slip_url: r.j.bankSlipUrl, invoice_url: r.j.invoiceUrl, linha_digitavel: lin.j?.identificationField || null, pix_copia_e_cola: pix.j?.payload || null, pix_qr_base64: pix.j?.encodedImage || null });
    }

    // ===== Sofia: liga o pedido ao plano de boletos =====
    if (action === "boleto_plano") {
      if (!sistema) return json({ ok: false, erro: "não autorizado" }, 401);
      const pid = String(b.pedido_id || ""); const payId = String(b.payment_id || ""); const dia = Number(b.dia_vencimento || 10);
      if (!DIAS_VENC.includes(dia)) return json({ ok: false, erro: "dia de vencimento deve ser 5, 10 ou 15" }, 400);
      const { data: ped } = await sb.from("pedidos").select("*").eq("id", pid).maybeSingle();
      if (!ped) return json({ ok: false, erro: "pedido não encontrado" }, 404);
      const { data: pcs } = await sb.from("parcelas").select("*").eq("pedido_id", pid).order("numero_parcela");
      if (!pcs?.length) return json({ ok: false, erro: "pedido sem parcelas" }, 409);
      const pay = payId ? await asaas("GET", "/payments/" + payId) : null;
      const venc1 = pay?.j?.dueDate || addDias(hojeBR(), 2);
      const datas = datasPlano(String(ped.data_inicio || hojeBR()).slice(0, 10), venc1, dia, pcs.length);
      for (let i = 0; i < pcs.length; i++) await sb.from("parcelas").update({ forma: "boleto", data_vencimento: datas[i], metodo_pagamento: "boleto" }).eq("id", pcs[i].id).neq("status", "pago");
      if (payId) await completarDados(pcs[0], payId, pay?.j);
      await sb.from("pedidos").update({ forma_cobranca: "boleto", tipo_pagamento: "boleto", metodo_pagamento: "boleto", dia_vencimento: dia, asaas_customer_id: b.customer_id || pay?.j?.customer || ped.asaas_customer_id, proxima_cobranca: datas[1] || datas[0] }).eq("id", pid);
      await sb.from("sofia_cobrancas").update({ pedido_id: pid }).eq("asaas_id", payId);
      return json({ ok: true, vencimentos: datas });
    }

    // ===== Sofia/admin: (re)envia o boleto de uma parcela por e-mail (e WhatsApp) =====
    if (action === "enviar_boleto") {
      if (!sistema && !admin) return json({ ok: false, erro: "não autorizado" }, 401);
      const { data: pc } = await sb.from("parcelas").select("*").eq("id", String(b.parcela_id || "")).maybeSingle();
      if (!pc) return json({ ok: false, erro: "parcela não encontrada" }, 404);
      const { data: ped } = await sb.from("pedidos").select("*").eq("id", pc.pedido_id).maybeSingle();
      await enviarBoleto(pc, ped, { forcar: !!b.forcar, semWhats: !!b.sem_whatsapp });
      return json({ ok: true });
    }

    // ===== Sofia: troca de Pix Automático para boleto (depois do aceite por código) =====
    if (action === "trocar_para_boleto") {
      if (!sistema) return json({ ok: false, erro: "não autorizado" }, 401);
      const pid = String(b.pedido_id || ""); const dia = Number(b.dia_vencimento || 10);
      if (!DIAS_VENC.includes(dia)) return json({ ok: false, erro: "dia de vencimento deve ser 5, 10 ou 15" }, 400);
      const { data: ped } = await sb.from("pedidos").select("*").eq("id", pid).maybeSingle();
      if (!ped) return json({ ok: false, erro: "pedido não encontrado" }, 404);
      if (ped.forma_cobranca === "boleto") return json({ ok: true, ja_era_boleto: true });
      // cancela a autorização do Pix Automático (sem ela nenhum débito futuro acontece)
      let autCancel: any = null;
      const autId = ped.asaas_authorization_id || (await sb.from("sofia_cobrancas").select("asaas_id").eq("pedido_id", pid).eq("kind", "pix_automatico").order("created_at", { ascending: false }).limit(1).maybeSingle()).data?.asaas_id;
      if (autId) { const d = await asaas("DELETE", "/pix/automatic/authorizations/" + autId); autCancel = { id: autId, ok: d.ok || d.status === 404, status: d.status }; if (!autCancel.ok) return json({ ok: false, erro: "O Asaas não confirmou o cancelamento do Pix Automático (" + erroAsaas(d) + "). Nada foi alterado." }, 502); }
      // só as parcelas FUTURAS viram boleto (as passadas eram do Pix Automático e não podem ser cobradas de novo)
      const hoje = hojeBR();
      const { data: pcs } = await sb.from("parcelas").select("*").eq("pedido_id", pid).neq("status", "pago").gte("data_vencimento", hoje).order("numero_parcela");
      const novas: string[] = [];
      for (const pc of pcs || []) {
        const o = String(pc.data_vencimento);
        let d = new Date(Date.UTC(Number(o.slice(0, 4)), Number(o.slice(5, 7)) - 1, dia, 12)).toISOString().slice(0, 10);
        while (d <= addDias(hoje, 2) || novas.includes(d)) { const x = new Date(d + "T12:00:00Z"); x.setUTCMonth(x.getUTCMonth() + 1); d = x.toISOString().slice(0, 10); }
        novas.push(d);
        await sb.from("parcelas").update({ forma: "boleto", metodo_pagamento: "boleto", data_vencimento: d }).eq("id", pc.id);
      }
      await sb.from("pedidos").update({ forma_cobranca: "boleto", tipo_pagamento: "boleto", metodo_pagamento: "boleto", dia_vencimento: dia, asaas_authorization_id: null }).eq("id", pid);
      await logEv("COBRANCA_TROCA_BOLETO", { pedido: pid, dia, autCancel });
      await avisarCeo(`Cobrança: ${nomePedido(ped)} trocou Pix Automático por boleto (vencimento dia ${dia}). Pix Automático cancelado no Asaas.`);
      const out = { pagas: 0, gerados: 0, suspensos: 0 }; await gerarDoMes(out);
      return json({ ok: true, proximo_vencimento: novas[0] || null, vencimentos: novas, boletos_gerados: out.gerados });
    }

    // ===== Sofia: resumo de faturas para responder o cliente =====
    if (action === "faturas" || action === "minhas_faturas") {
      const pid = String(b.pedido_id || "");
      if (!sistema && !admin) {
        if (quem.tipo !== "cliente") return json({ ok: false, erro: "não autorizado" }, 401);
        const { data: dono } = await sb.from("pedidos").select("id").eq("id", pid).eq("client_id", quem.uid!).maybeSingle();
        if (!dono) return json({ ok: false, erro: "pedido não encontrado" }, 404);
      }
      const { data: ped } = await sb.from("pedidos").select("id,nome_pedido,client_name,status,forma_cobranca,dia_vencimento,blocked_reason,confianca_ate").eq("id", pid).maybeSingle();
      const { data: pcs } = await sb.from("parcelas").select("id,numero_parcela,data_vencimento,valor_final,valor_multa,status,forma,boleto_url,asaas_invoice_url,boleto_barcode,pix_qr_code,data_pagamento").eq("pedido_id", pid).order("numero_parcela");
      return json({ ok: true, pedido: ped, parcelas: pcs || [] });
    }

    // ===== Sofia/cliente/admin: e-mail e WhatsApp do financeiro =====
    if (action === "financeiro") {
      if (!sistema && !admin) return json({ ok: false, erro: "não autorizado" }, 401);
      let uid = String(b.user_id || "");
      if (!uid && b.pedido_id) uid = String((await sb.from("pedidos").select("client_id").eq("id", String(b.pedido_id)).maybeSingle()).data?.client_id || "");
      if (!uid) return json({ ok: false, erro: "cliente não encontrado" }, 404);
      const em = String(b.email ?? "").trim().toLowerCase(); const wa = digits(b.whatsapp);
      if (em && !/.+@.+\..+/.test(em)) return json({ ok: false, erro: "e-mail inválido" }, 400);
      const up: any = {}; if (b.email !== undefined) up.financeiro_email = em || null; if (b.whatsapp !== undefined) up.financeiro_whatsapp = wa || null; if (b.nome !== undefined) up.financeiro_nome = String(b.nome || "").trim() || null;
      const { error } = await sb.from("users").update(up).eq("id", uid);
      return json({ ok: !error, erro: error?.message });
    }

    // ===== admin: lista de parcelas do pedido =====
    if (action === "admin_parcelas") {
      if (!admin) return json({ ok: false, erro: "não autorizado" }, 401);
      const pid = String(b.pedido_id || "");
      const { data: pcs } = await sb.from("parcelas").select("*").eq("pedido_id", pid).order("numero_parcela");
      const { data: av } = await sb.from("exa2_cobranca_avisos").select("tipo,canal,destino,ok,created_at,parcela_id").eq("pedido_id", pid).order("created_at", { ascending: false }).limit(60);
      const { data: ped } = await sb.from("pedidos").select("id,forma_cobranca,dia_vencimento,confianca_ate,confianca_motivo,status,blocked_reason,status_adimplencia").eq("id", pid).maybeSingle();
      return json({ ok: true, pedido: ped, parcelas: pcs || [], avisos: av || [] });
    }

    // ===== admin (master): ações na parcela =====
    if (["gerar_agora", "reenviar", "mudar_vencimento", "perdoar_multa", "marcar_pago"].includes(action)) {
      if (!master) return json({ ok: false, erro: "Só o admin master pode fazer isso." }, 403);
      const { data: pc } = await sb.from("parcelas").select("*").eq("id", String(b.parcela_id || "")).maybeSingle();
      if (!pc) return json({ ok: false, erro: "parcela não encontrada" }, 404);
      const { data: ped } = await sb.from("pedidos").select("*").eq("id", pc.pedido_id).maybeSingle();
      if (!ped) return json({ ok: false, erro: "pedido não encontrado" }, 404);
      const registro = (o: unknown) => logEv("COBRANCA_ADMIN_" + action.toUpperCase(), { por: quem.uid, pedido: ped.id, parcela: pc.id, ...(o as any) });

      if (action === "gerar_agora") {
        if (pc.status === "pago") return json({ ok: false, erro: "parcela já paga" }, 409);
        if (!pc.forma) await sb.from("parcelas").update({ forma: "boleto" }).eq("id", pc.id);
        const g = await gerarBoleto({ ...pc, forma: "boleto" }, ped);
        if (!g.ok) return json({ ok: false, erro: g.erro }, 502);
        await enviarBoleto(g.parcela, ped, { forcar: true });
        await registro({ asaas: g.parcela.asaas_payment_id });
        return json({ ok: true, parcela: g.parcela });
      }
      if (action === "reenviar") {
        if (!pc.asaas_payment_id) return json({ ok: false, erro: "boleto ainda não gerado" }, 409);
        await enviarBoleto(pc, ped, { forcar: true }); await registro({});
        return json({ ok: true });
      }
      if (pc.status === "pago") return json({ ok: false, erro: "parcela já paga" }, 409);
      if (action === "mudar_vencimento") {
        const nova = String(b.data || "").slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(nova) || nova < hojeBR()) return json({ ok: false, erro: "data inválida (precisa ser hoje ou depois)" }, 400);
        if (pc.asaas_payment_id) {
          const r = await asaas("PUT", "/payments/" + pc.asaas_payment_id, { dueDate: nova });
          if (!r.ok) return json({ ok: false, erro: "Asaas: " + erroAsaas(r) }, 502);
          await sb.from("parcelas").update({ data_vencimento: nova, status: "pendente" }).eq("id", pc.id);
          await completarDados({ ...pc, data_vencimento: nova }, pc.asaas_payment_id, r.j);
          await sb.from("exa2_cobranca_avisos").delete().eq("parcela_id", pc.id).in("tipo", ["lembrete_5d", "vence_amanha", "vence_hoje", "venceu", "atraso_3d", "suspensao"]);
        } else await sb.from("parcelas").update({ data_vencimento: nova }).eq("id", pc.id);
        await registro({ de: pc.data_vencimento, para: nova });
        if (b.avisar && pc.asaas_payment_id) { const { data: atual } = await sb.from("parcelas").select("*").eq("id", pc.id).single(); await enviarBoleto(atual, ped, { forcar: true }); }
        return json({ ok: true });
      }
      if (action === "perdoar_multa") {
        if (!pc.asaas_payment_id) { await sb.from("parcelas").update({ multa_perdoada: true }).eq("id", pc.id); return json({ ok: true }); }
        const r = await asaas("PUT", "/payments/" + pc.asaas_payment_id, { fine: { value: 0 }, interest: { value: 0 } });
        if (!r.ok) return json({ ok: false, erro: "Asaas: " + erroAsaas(r) + ". Se o boleto já venceu, mude o vencimento para hoje (o valor volta ao original)." }, 502);
        await sb.from("parcelas").update({ multa_perdoada: true, valor_multa: 0, valor_juros: 0 }).eq("id", pc.id);
        await completarDados(pc, pc.asaas_payment_id, r.j);
        await registro({});
        return json({ ok: true });
      }
      if (action === "marcar_pago") {
        const desc = String(b.descricao || "").trim();
        if (desc.length < 5) return json({ ok: false, erro: "Descreva como foi pago (ex.: dinheiro em mãos para Jeferson em 29/10)." }, 400);
        const data = String(b.data || hojeBR()).slice(0, 10); const valor = Number(b.valor || pc.valor_final);
        if (pc.asaas_payment_id) {
          // baixa no Asaas como recebido por fora: o boleto deixa de poder ser pago (nunca paga 2 vezes)
          const r = await asaas("POST", "/payments/" + pc.asaas_payment_id + "/receiveInCash", { paymentDate: data, value: valor, notifyCustomer: false });
          if (!r.ok) return json({ ok: false, erro: "Asaas: " + erroAsaas(r) + ". Nada foi baixado." }, 502);
        }
        await marcarPaga(pc, ped, "fora", { valor, data, descricao: desc, por: quem.uid || undefined });
        await registro({ valor, data, descricao: desc });
        return json({ ok: true });
      }
    }

    // ===== admin (master): pedido de confiança (5 dias) =====
    if (action === "confianca") {
      if (!master) return json({ ok: false, erro: "Só o admin master pode ativar pedido de confiança." }, 403);
      const pid = String(b.pedido_id || ""); const motivo = String(b.motivo || "").trim();
      if (motivo.length < 3) return json({ ok: false, erro: "Informe o motivo." }, 400);
      const { data: ped } = await sb.from("pedidos").select("*").eq("id", pid).maybeSingle();
      if (!ped) return json({ ok: false, erro: "pedido não encontrado" }, 404);
      const ate = new Date(Date.now() + DIAS_CONFIANCA * 86400e3).toISOString();
      let r: any = { ok: true };
      if (ped.status === "bloqueado") r = await pedidoAdmin("reativar", pid, "Pedido de confiança: " + motivo);
      else if (ped.status === "pendente") r = await pedidoAdmin("confianca", pid, motivo);
      if (!r.ok) return json({ ok: false, erro: r.j?.erro || "não consegui ativar o pedido" }, 502);
      await sb.from("pedidos").update({ confianca_ate: ate, confianca_motivo: motivo, confianca_por: quem.uid }).eq("id", pid);
      await logEv("COBRANCA_CONFIANCA", { pedido: pid, por: quem.uid, motivo, ate });
      const { data: ped2 } = await sb.from("pedidos").select("*").eq("id", pid).maybeSingle();
      await avisoGeral(ped2 || ped, "confianca", "Seu pedido EXA foi ativado (confiança)", "Pedido ativado por confiança",
        p(`O pedido <b>${escH(nomePedido(ped))}</b> recebeu uma ativação de confiança: ele fica ativo por ${DIAS_CONFIANCA} dias enquanto aguardamos a compensação do pagamento.`) + p(`Se o pagamento não for identificado até ${new Date(ate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}, o pedido volta a ficar suspenso.`),
        `seu pedido ${nomePedido(ped)} recebeu a ativação de confiança e está ativo por ${DIAS_CONFIANCA} dias enquanto o pagamento compensa. Se até ${new Date(ate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} o pagamento não for identificado, ele volta a ficar suspenso.`);
      return json({ ok: true, ate });
    }

    return json({ ok: false, erro: "ação desconhecida" }, 400);
  } catch (e) {
    console.error("exa2-cobranca", action, String(e));
    await logEv("COBRANCA_ERRO", { action, erro: String(e).slice(0, 500) });
    return json({ ok: false, erro: String(e).slice(0, 300) }, 500);
  }
});
