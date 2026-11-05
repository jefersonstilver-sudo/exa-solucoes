// EXA (05/11/2026) — PEDIDOS DE CONTRATO DOS PRÉDIOS (o Nando pede e acompanha a assinatura na ClickSign).
// Fluxo:
//  1) Admin, no prédio (Ver › Contrato), confirma os dados do condomínio e de quem assina → pedido "agendado".
//     Dia útil das 9h às 18h (Brasília) sai na hora; fora disso, no próximo dia útil às 9h.
//  2) Síndico, no Painel do Síndico, toca em "Pedir ao Nando" num prédio sem contrato → pedido "aguardando_dados"
//     e o Jeferson é avisado para confirmar os dados.
//  3) Na hora marcada (nando-cron, a cada 5 min): gera o PDF do modelo oficial, cria o envelope na ClickSign
//     (condomínio + EXA), manda o e-mail de assinatura e o Nando avisa a pessoa no WhatsApp.
//  4) Quando a ClickSign fecha o envelope: o PDF assinado entra em predio_contratos (aparece no Painel do Síndico)
//     e o Nando avisa o Jeferson e a pessoa.
// Não mexe nas funções clicksign-* (são mantidas fora do repositório): fala direto com a API v3.
import { jsPDF } from "npm:jspdf@3.0.4";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { enviarTexto, telefoneCanonico, primeiroNome, ALERTA_NUMERO, MODO_TESTE, chavesTelefone, SITE_URL } from "./nando-core.ts";
import { gerarPdfContrato, cnpjValido, formatarCnpj, MODELO_VERSAO, type DadosContrato } from "./predio-contrato-modelo.ts";

export const BUCKET = "contratos-predios";
const CS = "https://app.clicksign.com";
export const ABERTOS = ["aguardando_dados", "agendado", "enviando", "enviado"];

// ---------------------------------------------------------------- horário de envio
// dia útil (seg–sex) das 9h às 18h de Brasília: agora; senão, o próximo dia útil às 9h
export function proximoEnvio(agora = new Date()): Date {
  const br = new Date(agora.getTime() - 3 * 3600_000); // relógio de Brasília lido como UTC
  const dia = br.getUTCDay(), h = br.getUTCHours();
  if (dia >= 1 && dia <= 5 && h >= 9 && h < 18) return agora;
  const alvo = new Date(Date.UTC(br.getUTCFullYear(), br.getUTCMonth(), br.getUTCDate(), 9, 0, 0));
  if (h >= 9 || dia === 0 || dia === 6) alvo.setUTCDate(alvo.getUTCDate() + 1);
  while (alvo.getUTCDay() === 0 || alvo.getUTCDay() === 6) alvo.setUTCDate(alvo.getUTCDate() + 1);
  return new Date(alvo.getTime() + 3 * 3600_000); // volta para UTC
}
export function quandoTexto(d: Date, agora = new Date()): string {
  if (d.getTime() <= agora.getTime() + 60_000) return "agora";
  const br = new Date(d.getTime() - 3 * 3600_000), hj = new Date(agora.getTime() - 3 * 3600_000);
  const dias = Math.round((Date.UTC(br.getUTCFullYear(), br.getUTCMonth(), br.getUTCDate()) - Date.UTC(hj.getUTCFullYear(), hj.getUTCMonth(), hj.getUTCDate())) / 86400000);
  const sem = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][br.getUTCDay()];
  const hora = `${String(br.getUTCHours()).padStart(2, "0")}h${br.getUTCMinutes() ? String(br.getUTCMinutes()).padStart(2, "0") : ""}`;
  return dias === 0 ? `hoje às ${hora}` : dias === 1 ? `amanhã (${sem}) às ${hora}` : `${sem}, ${String(br.getUTCDate()).padStart(2, "0")}/${String(br.getUTCMonth() + 1).padStart(2, "0")}, às ${hora}`;
}

// ---------------------------------------------------------------- dados e validação
export function validarDados(p: any): string | null {
  if (!String(p.condominio_nome || "").trim()) return "Informe o nome do condomínio como está no CNPJ.";
  if (!cnpjValido(p.condominio_cnpj)) return "CNPJ do condomínio inválido.";
  if (String(p.condominio_endereco || "").trim().length < 8) return "Informe o endereço completo do condomínio.";
  if (String(p.signatario_nome || "").trim().split(/\s+/).length < 2) return "Informe o nome completo de quem assina.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(p.signatario_email || "").trim())) return "E-mail de quem assina inválido.";
  return null;
}
export function dadosDoPedido(p: any, data?: Date): DadosContrato {
  return {
    condominio: String(p.condominio_nome).trim(), cnpj: formatarCnpj(p.condominio_cnpj), endereco: String(p.condominio_endereco).trim(),
    signatario: String(p.signatario_nome).trim(), cargo: String(p.signatario_cargo || "Síndico(a)").trim(),
    paineis: Number(p.qtd_paineis) || 1, data,
  };
}

let cabecalhoCache: Uint8Array | null | undefined;
async function cabecalho(): Promise<Uint8Array | null> {
  if (cabecalhoCache !== undefined) return cabecalhoCache;
  try {
    const r = await fetch(`${SITE_URL}/contratos/exa-cabecalho.png`, { signal: AbortSignal.timeout(10000) });
    cabecalhoCache = r.ok && (r.headers.get("content-type") || "").includes("png") ? new Uint8Array(await r.arrayBuffer()) : null;
  } catch { cabecalhoCache = null; }
  return cabecalhoCache;
}
export async function pdfDoPedido(p: any, data?: Date): Promise<Uint8Array> {
  return gerarPdfContrato(jsPDF, dadosDoPedido(p, data), await cabecalho());
}
export function b64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

// ---------------------------------------------------------------- ClickSign v3
function csHeaders() {
  const t = Deno.env.get("CLICKSIGN_ACCESS_TOKEN");
  if (!t) throw new Error("CLICKSIGN_ACCESS_TOKEN não configurado");
  return { "Content-Type": "application/vnd.api+json", Accept: "application/vnd.api+json", Authorization: t };
}
async function cs(metodo: string, caminho: string, corpo?: unknown): Promise<any> {
  for (let t = 0; t < 3; t++) {
    const r = await fetch(`${CS}${caminho}`, { method: metodo, headers: csHeaders(), body: corpo ? JSON.stringify(corpo) : undefined, signal: AbortSignal.timeout(30000) });
    if (r.status === 429) { await new Promise((ok) => setTimeout(ok, 1500 * (t + 1))); continue; }
    const txt = await r.text();
    if (!r.ok) throw new Error(`ClickSign ${metodo} ${caminho.split("?")[0]} ${r.status}: ${txt.slice(0, 300)}`);
    return txt ? JSON.parse(txt) : {};
  }
  throw new Error("ClickSign: limite de requisições");
}
const req = (envelope: string, doc: string, signer: string, attrs: Record<string, string>) => cs("POST", `/api/v3/envelopes/${envelope}/requirements`, {
  data: { type: "requirements", attributes: attrs, relationships: { document: { data: { type: "documents", id: doc } }, signer: { data: { type: "signers", id: signer } } } },
});

async function signatarioExa(sb: SupabaseClient): Promise<{ nome: string; email: string }> {
  const { data } = await sb.from("signatarios_exa").select("nome,email").eq("is_active", true).order("is_default", { ascending: false }).limit(1).maybeSingle();
  if (!data?.email) throw new Error("nenhum signatário EXA ativo em signatarios_exa");
  return { nome: data.nome, email: data.email };
}

// cria e dispara o envelope; devolve ids
async function criarEnvelope(sb: SupabaseClient, p: any, pdf: Uint8Array, nomePredio: string) {
  const exa = await signatarioExa(sb);
  const prazo = new Date(Date.now() + 30 * 86400000).toISOString();
  const env = await cs("POST", "/api/v3/envelopes", { data: { type: "envelopes", attributes: { name: `Contrato ${nomePredio}`, locale: "pt-BR", auto_close: true, remind_interval: 3, block_after_refusal: true, deadline_at: prazo } } });
  const envelopeId = env?.data?.id;
  if (!envelopeId) throw new Error("ClickSign não devolveu o envelope");
  const doc = await cs("POST", `/api/v3/envelopes/${envelopeId}/documents`, { data: { type: "documents", attributes: { filename: `Contrato ${nomePredio}.pdf`.replace(/[\\/:*?"<>|]/g, ""), content_base64: `data:application/pdf;base64,${b64(pdf)}` } } });
  const docId = doc?.data?.id;
  const sCond = await cs("POST", `/api/v3/envelopes/${envelopeId}/signers`, { data: { type: "signers", attributes: { name: String(p.signatario_nome).trim(), email: String(p.signatario_email).trim().toLowerCase() } } });
  const sExa = await cs("POST", `/api/v3/envelopes/${envelopeId}/signers`, { data: { type: "signers", attributes: { name: exa.nome, email: exa.email } } });
  for (const s of [sCond?.data?.id, sExa?.data?.id]) {
    await req(envelopeId, docId, s, { action: "agree", role: "sign" });
    await req(envelopeId, docId, s, { action: "provide_evidence", auth: "email" });
  }
  await cs("PATCH", `/api/v3/envelopes/${envelopeId}`, { data: { id: envelopeId, type: "envelopes", attributes: { status: "running" } } });
  await cs("POST", `/api/v3/envelopes/${envelopeId}/notifications`, { data: { type: "notifications", attributes: { message: `Olá, ${primeiroNome(p.signatario_nome)}! Segue o contrato de comodato do painel EXA do ${nomePredio} para assinatura eletrônica. Qualquer dúvida, fale com o Nando no WhatsApp (45) 9113-2351.` } } }).catch(() => {});
  return { envelopeId, docId };
}

const podeFalar = (tel: string) => !MODO_TESTE || chavesTelefone(tel).some((k) => chavesTelefone(ALERTA_NUMERO).includes(k));
async function avisar(sb: SupabaseClient, tel: string | null | undefined, texto: string, building_id?: string) {
  if (!tel || !podeFalar(tel)) return false;
  try {
    await enviarTexto(sb, tel, texto);
    await sb.from("nando_mensagens").insert({ telefone: telefoneCanonico(tel), building_id: building_id || null, papel: "nando", conteudo: { texto } });
    return true;
  } catch (e) { console.error("[CONTRATOS] whatsapp", (e as Error).message); return false; }
}
export async function avisarJeferson(sb: SupabaseClient, texto: string) {
  try { await enviarTexto(sb, ALERTA_NUMERO, texto); } catch (e) { console.error("[CONTRATOS] alerta", (e as Error).message); }
}

// ---------------------------------------------------------------- enviar um pedido (já com dados confirmados)
export async function enviarPedido(sb: SupabaseClient, pedidoId: string): Promise<{ ok: boolean; erro?: string; envelope?: string }> {
  // trava: só um processo envia (agendado -> enviando)
  const { data: p } = await sb.from("predio_contrato_pedidos").update({ status: "enviando", atualizado_em: new Date().toISOString() })
    .eq("id", pedidoId).eq("status", "agendado").select("*").maybeSingle();
  if (!p) return { ok: false, erro: "pedido não está agendado" };
  const { data: b } = await sb.from("buildings").select("id,nome").eq("id", p.building_id).single();
  const nome = String(b?.nome || p.condominio_nome).trim();
  try {
    const erroDados = validarDados(p);
    if (erroDados) throw new Error(erroDados);
    const pdf = await pdfDoPedido(p);
    const caminho = `pedidos/${p.id}.pdf`;
    await sb.storage.from(BUCKET).upload(caminho, pdf, { contentType: "application/pdf", upsert: true });
    const { envelopeId, docId } = await criarEnvelope(sb, p, pdf, nome);
    await sb.from("predio_contrato_pedidos").update({ status: "enviado", enviado_em: new Date().toISOString(), clicksign_envelope_id: envelopeId, clicksign_documento_id: docId, pdf_path: caminho, erro: null, modelo: MODELO_VERSAO, atualizado_em: new Date().toISOString() }).eq("id", p.id);
    const tel = p.signatario_telefone || p.pedido_por_tel;
    const falou = await avisar(sb, tel,
      `Oi, ${primeiroNome(p.signatario_nome)}! Aqui é o Nando, da EXA. 😊\n\nAcabei de enviar para o seu e-mail *${String(p.signatario_email).toLowerCase()}* o contrato de comodato do painel do *${nome}*, pela ClickSign.\n\nÉ só abrir o e-mail da ClickSign e assinar (leva 1 minutinho). Assim que estiver assinado, ele aparece no seu Painel do Síndico, em Configurações › Contratos.\n\nQualquer dúvida, é só me chamar aqui.`, p.building_id);
    await avisarJeferson(sb, `📄 *Contrato enviado para assinatura*\n*Prédio:* ${nome}\n*Assina:* ${p.signatario_nome} (${String(p.signatario_email).toLowerCase()})\n*WhatsApp avisado:* ${falou ? "sim" : "não"}\n\nQuando assinar, eu guardo o PDF no sistema e te aviso.`);
    return { ok: true, envelope: envelopeId };
  } catch (e) {
    const msg = (e as Error).message;
    await sb.from("predio_contrato_pedidos").update({ status: "erro", erro: msg.slice(0, 500), atualizado_em: new Date().toISOString() }).eq("id", p.id);
    await avisarJeferson(sb, `⚠️ *Contrato não enviado*\n*Prédio:* ${nome}\n*Motivo:* ${msg.slice(0, 300)}\n\nAbra o prédio no admin › Contrato para corrigir e pedir de novo.`);
    return { ok: false, erro: msg };
  }
}

// ---------------------------------------------------------------- guardar o PDF assinado
export async function guardarAssinado(sb: SupabaseClient, o: { building_id: string; envelope: string; quem: string; titulo?: string }) {
  const env = await cs("GET", `/api/v3/envelopes/${o.envelope}`);
  const docs = await cs("GET", `/api/v3/envelopes/${o.envelope}/documents`);
  const d = (docs?.data || [])[0];
  if (!d) throw new Error("envelope sem documento");
  let url = d.links?.files?.signed || d.attributes?.links?.files?.signed;
  if (!url) { const det = (await cs("GET", `/api/v3/envelopes/${o.envelope}/documents/${d.id}`))?.data; url = det?.links?.files?.signed || det?.attributes?.links?.files?.signed; }
  if (!url) throw new Error("ClickSign ainda não liberou o PDF assinado");
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error("download do PDF assinado " + r.status);
  const bytes = new Uint8Array(await r.arrayBuffer());
  const caminho = `${o.building_id}/${o.envelope}-${d.id}.pdf`;
  const { error } = await sb.storage.from(BUCKET).upload(caminho, bytes, { contentType: "application/pdf", upsert: true });
  if (error) throw new Error("guardar PDF: " + error.message);
  const sig = await cs("GET", `/api/v3/envelopes/${o.envelope}/signers`).catch(() => ({ data: [] }));
  const exa = await signatarioExa(sb).catch(() => ({ email: "" }));
  const parte = (sig?.data || []).map((x: any) => x.attributes || {}).find((x: any) => String(x.email || "").toLowerCase() !== String(exa.email).toLowerCase());
  const ea = env?.data?.attributes || {};
  await sb.from("predio_contratos").update({ ativo: false }).eq("building_id", o.building_id).eq("ativo", true);
  const { error: ins } = await sb.from("predio_contratos").insert({
    building_id: o.building_id, titulo: o.titulo || String(ea.name || "Contrato").trim(), arquivo_path: caminho,
    assinado_em: ea.modified || new Date().toISOString(), assinante_nome: parte?.name || null, assinante_email: parte?.email || null,
    clicksign_envelope_id: o.envelope, clicksign_documento_id: d.id, ativo: true, criado_por: o.quem,
  });
  if (ins) throw new Error("registrar contrato: " + ins.message);
}

// ---------------------------------------------------------------- rotina (nando-cron, a cada 5 min)
export async function rotinaContratos(sb: SupabaseClient): Promise<string[]> {
  const log: string[] = [];
  const agora = new Date().toISOString();
  // 1) agendados que chegaram na hora
  const { data: prontos } = await sb.from("predio_contrato_pedidos").select("id").eq("status", "agendado").lte("agendado_para", agora).limit(5);
  for (const p of prontos || []) {
    const r = await enviarPedido(sb, p.id);
    log.push(r.ok ? `contrato enviado (${String(p.id).slice(0, 8)})` : `contrato falhou (${String(p.id).slice(0, 8)}): ${r.erro}`);
  }
  // 2) enviados: conferir a assinatura (no máx. 10 por rodada)
  const { data: enviados } = await sb.from("predio_contrato_pedidos").select("*").eq("status", "enviado").not("clicksign_envelope_id", "is", null).order("atualizado_em").limit(10);
  for (const p of enviados || []) {
    try {
      const env = await cs("GET", `/api/v3/envelopes/${p.clicksign_envelope_id}`);
      const st = env?.data?.attributes?.status;
      await sb.from("predio_contrato_pedidos").update({ atualizado_em: new Date().toISOString() }).eq("id", p.id);
      if (st === "closed") {
        const { data: b } = await sb.from("buildings").select("nome").eq("id", p.building_id).single();
        await guardarAssinado(sb, { building_id: p.building_id, envelope: p.clicksign_envelope_id, quem: "Nando (pedido de contrato)", titulo: `Contrato ${String(b?.nome || "").trim()}` });
        await sb.from("predio_contrato_pedidos").update({ status: "assinado", assinado_em: new Date().toISOString() }).eq("id", p.id);
        await avisar(sb, p.signatario_telefone || p.pedido_por_tel, `Prontinho, ${primeiroNome(p.signatario_nome)}! ✅ O contrato do *${String(b?.nome || "").trim()}* foi assinado por todos e já está no seu Painel do Síndico, em Configurações › Contratos. Obrigado!`, p.building_id);
        await avisarJeferson(sb, `✅ *Contrato assinado*\n*Prédio:* ${String(b?.nome || "").trim()}\n*Assinou:* ${p.signatario_nome}\n\nO PDF assinado já está no prédio (admin › Ver › Contrato) e no Painel do Síndico.`);
        log.push(`contrato assinado: ${b?.nome}`);
      } else if (st === "canceled" || st === "refused" || st === "expired") {
        await sb.from("predio_contrato_pedidos").update({ status: "erro", erro: `envelope ${st} na ClickSign` }).eq("id", p.id);
        const { data: b } = await sb.from("buildings").select("nome").eq("id", p.building_id).single();
        await avisarJeferson(sb, `⚠️ *Contrato não assinado*\n*Prédio:* ${String(b?.nome || "").trim()}\nO envelope ficou *${st}* na ClickSign. Abra o prédio no admin › Contrato para pedir de novo.`);
        log.push(`contrato ${st}: ${b?.nome}`);
      }
    } catch (e) { log.push(`conferir contrato ${String(p.id).slice(0, 8)}: ${(e as Error).message}`); }
  }
  return log;
}
