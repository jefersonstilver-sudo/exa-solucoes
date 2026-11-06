// EXA (06/11/2026) — AUDITORIA DE COBRANÇA DO PEDIDO (aba Cobrança do pedido no admin).
// Pedido do Jeferson: levantar, pedido a pedido, o que foi pago (com comprovante e ID do Pix), o que está atrasado
// e há quanto tempo, e as parcelas futuras até o fim do contrato — SEM avisar o cliente.
// Regras:
//  - tabelas próprias (cobranca_auditoria / cobranca_auditoria_pix), separadas de `parcelas`: a régua da exa2-cobranca,
//    a Sofia e a área do cliente não enxergam nada daqui;
//  - o Pix das atrasadas é gerado só quando o admin master pede, sem multa nem juros, com as notificações do Asaas
//    desligadas para o cliente (quem manda o Pix é o Jeferson);
//  - baixa sempre pelo ID da cobrança no Asaas (nunca por nome ou valor — AGENTS.md); pago o Pix, as parcelas
//    dele viram "pago" e o contrato volta a ficar em dia automaticamente.
// Ações: listar (admin), gerar_pix / cancelar_pix / perdoar / reabrir (admin master), conciliar (cron ou service role).
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
const PAGO = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];

const hojeBR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const addDias = (ymd: string, n: number) => { const d = new Date(ymd + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const difDias = (a: string, b: string) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400e3);
const brl = (v: unknown) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const digits = (s?: unknown) => String(s ?? "").replace(/\D/g, "");

async function asaas(method: string, path: string, body?: unknown) {
  const key = Deno.env.get("ASAAS_API_KEY");
  if (!key) return { ok: false, status: 0, j: { errors: [{ description: "ASAAS_API_KEY ausente" }] } as any };
  try {
    const r = await fetch(ASAAS_API + path, {
      method, headers: { access_token: key, "Content-Type": "application/json", "User-Agent": "EXA-Auditoria/1.0" },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000),
    });
    let j: any = null; try { j = await r.json(); } catch (_) { /* vazio */ }
    return { ok: r.ok, status: r.status, j };
  } catch (e) { return { ok: false, status: 0, j: { errors: [{ description: String(e) }] } as any }; }
}
const erroAsaas = (r: any) => (r?.j?.errors || []).map((e: any) => e.description).join("; ") || ("HTTP " + r?.status);
async function logEv(tipo: string, descricao: unknown) {
  try { await sb.from("log_eventos_sistema").insert({ tipo_evento: tipo, descricao: (typeof descricao === "string" ? descricao : JSON.stringify(descricao)).slice(0, 4000) }); } catch (_) { /* */ }
}

async function autenticar(req: Request) {
  const bearer = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (bearer && bearer === SB_SERVICE) return { tipo: "sistema" as const, uid: null as string | null };
  const cronH = req.headers.get("x-exa2-cron") || "";
  if (cronH) {
    const { data } = await sb.from("exa2_config").select("valor").eq("chave", "cron_token").maybeSingle();
    if (data?.valor && cronH === String(data.valor)) return { tipo: "sistema" as const, uid: null };
  }
  if (!bearer) return { tipo: "anon" as const, uid: null };
  const { data } = await sb.auth.getUser(bearer); const uid = data?.user?.id || null;
  if (!uid) return { tipo: "anon" as const, uid: null };
  const { data: rl } = await sb.from("user_roles").select("role").eq("user_id", uid);
  const papeis = (rl || []).map((r: any) => String(r.role));
  if (papeis.includes("super_admin")) return { tipo: "master" as const, uid };
  if (papeis.some((r) => ["admin", "admin_financeiro"].includes(r))) return { tipo: "admin" as const, uid };
  return { tipo: "cliente" as const, uid };
}

// ---------- conciliação: Pix gerado pago no Asaas → parcelas pagas ----------
async function conciliarLote(l: any) {
  if (!l.asaas_payment_id || l.status !== "aberto") return false;
  const r = await asaas("GET", "/payments/" + l.asaas_payment_id);
  if (!r.ok) return false;
  const st = String(r.j?.status || "");
  if (r.j?.deleted) { await sb.from("cobranca_auditoria_pix").update({ status: "cancelado" }).eq("id", l.id); await sb.from("cobranca_auditoria").update({ pix_lote_id: null }).eq("pix_lote_id", l.id).eq("status", "aberto"); return true; }
  if (!PAGO.includes(st)) return false;
  const pagoEm = r.j?.clientPaymentDate || r.j?.paymentDate || hojeBR();
  const comp = r.j?.transactionReceiptUrl || null;
  const { data: up } = await sb.from("cobranca_auditoria_pix").update({ status: "pago", pago_em: new Date(pagoEm + "T12:00:00-03:00").toISOString(), comprovante_url: comp }).eq("id", l.id).eq("status", "aberto").select("id");
  if (!up?.length) return false;
  let pix: string | null = null;
  const pt = await asaas("GET", "/payments/" + l.asaas_payment_id + "/billingInfo");
  if (pt.ok) pix = pt.j?.pix?.endToEndIdentifier || null;
  const { data: pcs } = await sb.from("cobranca_auditoria").select("id,valor").eq("pix_lote_id", l.id).eq("status", "aberto");
  const cheio = (pcs || []).reduce((a: number, p: any) => a + Number(p.valor), 0) || 1;
  const fator = Math.min(1, Number(l.valor) / cheio); // desconto do pagamento único das atrasadas
  const obs = l.forma === "boleto" ? "Pago pelo boleto" : fator < 0.999 ? `Pago no Pix único das atrasadas com ${Math.round((1 - fator) * 100)}% de desconto` : (pcs || []).length > 1 ? "Pago no Pix das atrasadas" : "Pago pelo Pix";
  for (const p of pcs || []) {
    await sb.from("cobranca_auditoria").update({ status: "pago", pago_em: new Date(pagoEm + "T12:00:00-03:00").toISOString(), valor_pago: Math.round(Number(p.valor) * fator * 100) / 100, asaas_payment_id: l.asaas_payment_id, pix_transacao_id: pix, comprovante_url: comp, observacao: obs, updated_at: new Date().toISOString() }).eq("id", p.id);
  }
  await logEv("AUDITORIA_COBRANCA_PIX_PAGO", { pedido: l.pedido_id, lote: l.id, asaas: l.asaas_payment_id, valor: l.valor, parcelas: (pcs || []).length });
  return true;
}

const publico = (l: any) => ({ id: l.id, forma: l.forma || "pix", valor: l.valor, vencimento: l.vencimento, parcelas: l.parcelas, desconto_pct: l.desconto_pct || 0, pix_copia_cola: l.pix_copia_cola, pix_qr_base64: l.pix_qr_base64, boleto_url: l.boleto_url, linha_digitavel: l.linha_digitavel, invoice_url: l.invoice_url, status: l.status });

// ---------- leitura com a situação de cada parcela ----------
async function montar(pid: string) {
  const { data: ped } = await sb.from("pedidos").select("id,nome_pedido,client_name,status,data_inicio,data_inicio_cobranca,data_fim,plano_meses").eq("id", pid).maybeSingle();
  const { data: lotes } = await sb.from("cobranca_auditoria_pix").select("*").eq("pedido_id", pid).order("created_at", { ascending: false });
  for (const l of (lotes || []).filter((x: any) => x.status === "aberto")) await conciliarLote(l);
  const [{ data: rows }, { data: lotes2 }] = await Promise.all([
    sb.from("cobranca_auditoria").select("*").eq("pedido_id", pid).order("numero"),
    sb.from("cobranca_auditoria_pix").select("*").eq("pedido_id", pid).order("created_at", { ascending: false }),
  ]);
  const hoje = hojeBR();
  const parcelas = (rows || []).map((p: any) => {
    const venc = String(p.data_vencimento).slice(0, 10);
    const situacao = ["pago", "perdoado", "cancelado", "cortesia"].includes(p.status) ? p.status : venc < hoje ? "atrasado" : "a_vencer";
    return { ...p, situacao, dias_atraso: situacao === "atrasado" ? difDias(venc, hoje) : 0 };
  });
  const atrasadas = parcelas.filter((p: any) => p.situacao === "atrasado");
  const pagas = parcelas.filter((p: any) => p.situacao === "pago");
  const aVencer = parcelas.filter((p: any) => p.situacao === "a_vencer");
  const soma = (l: any[], k = "valor") => Math.round(l.reduce((a, p) => a + Number(p[k] || 0), 0) * 100) / 100;
  const maisAntiga = atrasadas[0];
  return {
    pedido: ped,
    parcelas,
    lotes: lotes2 || [],
    resumo: {
      total_contrato: soma(parcelas.filter((p: any) => !["cancelado", "cortesia", "perdoado"].includes(p.situacao))),
      cortesia: soma(parcelas.filter((p: any) => p.situacao === "cortesia")), qtd_cortesia: parcelas.filter((p: any) => p.situacao === "cortesia").length,
      pago: soma(pagas, "valor_pago"), qtd_pagas: pagas.length,
      atrasado: soma(atrasadas), qtd_atrasadas: atrasadas.length,
      atrasado_desde: maisAntiga ? String(maisAntiga.data_vencimento).slice(0, 10) : null,
      dias_atraso: maisAntiga ? maisAntiga.dias_atraso : 0,
      a_vencer: soma(aVencer), qtd_a_vencer: aVencer.length,
      proximo_vencimento: aVencer[0] ? String(aVencer[0].data_vencimento).slice(0, 10) : null,
      em_dia: atrasadas.length === 0,
    },
  };
}

// cliente no Asaas: o mesmo das cobranças já pagas deste pedido
// Cliente do Asaas para cobrar este pedido. Nunca usa cliente REMOVIDO (o Asaas recusa cobrança para ele):
// 1) ativo ligado ao pedido/às parcelas pagas; 2) ativo com o mesmo CPF/CNPJ; 3) restaura o removido (mantém o histórico).
// Não grava nada no pedido (a régua da exa2-cobranca não pode passar a enxergar este cliente).
async function clienteDoPedido(pid: string, rows: any[]) {
  const { data: ped } = await sb.from("pedidos").select("asaas_customer_id,client_id").eq("id", pid).maybeSingle();
  const candidatos: string[] = [];
  if (ped?.asaas_customer_id) candidatos.push(String(ped.asaas_customer_id));
  for (const p of rows.filter((x) => x.asaas_payment_id)) {
    const r = await asaas("GET", "/payments/" + p.asaas_payment_id);
    if (r.ok && r.j?.customer && !candidatos.includes(String(r.j.customer))) candidatos.push(String(r.j.customer));
  }
  const docs: string[] = [];
  const removidos: string[] = [];
  for (const id of candidatos) {
    const c = await asaas("GET", "/customers/" + id);
    if (!c.ok) continue;
    if (!c.j?.deleted) return id;
    removidos.push(id);
    const d = digits(c.j?.cpfCnpj); if (d && !docs.includes(d)) docs.push(d);
  }
  if (ped?.client_id) {
    const { data: u } = await sb.from("users").select("empresa_documento,cpf").eq("id", ped.client_id).maybeSingle();
    for (const x of [u?.empresa_documento, u?.cpf]) { const d = digits(x); if (d && !docs.includes(d)) docs.push(d); }
  }
  for (const d of docs) {
    const r = await asaas("GET", "/customers?cpfCnpj=" + d);
    const ativo = (r.j?.data || []).find((c: any) => !c.deleted);
    if (r.ok && ativo?.id) return String(ativo.id);
  }
  for (const id of removidos) {
    const r = await asaas("POST", "/customers/" + id + "/restore");
    if (r.ok) { await logEv("AUDITORIA_COBRANCA_CLIENTE_RESTAURADO", { pedido: pid, cliente_asaas: id }); return id; }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  let b: any = {}; try { b = await req.json(); } catch (_) { /* */ }
  const action = String(b.action || "");
  const quem = await autenticar(req);
  const sistema = quem.tipo === "sistema";
  const master = quem.tipo === "master" || sistema;
  const admin = master || quem.tipo === "admin";
  try {
    if (action === "conciliar") {
      if (!sistema && !master) return json({ ok: false, erro: "não autorizado" }, 401);
      const { data: lotes } = await sb.from("cobranca_auditoria_pix").select("*").eq("status", "aberto").limit(50);
      let pagos = 0; for (const l of lotes || []) if (await conciliarLote(l)) pagos++;
      return json({ ok: true, verificados: (lotes || []).length, pagos });
    }
    const pid = String(b.pedido_id || "");

    // ===== área do cliente (aba Contrato): só as parcelas já liberadas para o cliente; nada é enviado a ninguém =====
    if (action === "cliente") {
      if (!pid || quem.tipo === "anon") return json({ ok: false, erro: "Entre na sua conta." }, 401);
      if (!admin) {
        const { data: dono } = await sb.from("pedidos").select("id").eq("id", pid).eq("client_id", quem.uid!).maybeSingle();
        if (!dono) return json({ ok: false, erro: "pedido não encontrado" }, 404);
      }
      const { data: liberou } = await sb.from("cobranca_auditoria").select("id").eq("pedido_id", pid).eq("visivel_cliente", true).limit(1);
      if (!liberou?.length) return json({ ok: true, parcelas: [], resumo: null });
      const m = await montar(pid);
      // só as pagas/cortesia/atrasadas e a PRÓXIMA a vencer; as outras futuras aparecem quando a anterior vencer
      const lib = m.parcelas.filter((p: any) => p.visivel_cliente);
      const prox = lib.find((p: any) => p.situacao === "a_vencer");
      const parcelas = lib.filter((p: any) => p.situacao !== "a_vencer" || p.id === prox?.id).map((p: any) => ({
        numero: p.numero, competencia: p.competencia, data_vencimento: p.data_vencimento, valor: p.valor, situacao: p.situacao, dias_atraso: p.dias_atraso,
        pago_em: p.pago_em, valor_pago: p.valor_pago, comprovante_url: p.comprovante_url, pix_transacao_id: p.pix_transacao_id,
        em_cobranca: !!p.pix_lote_id,
      }));
      const abertas = (m.lotes || []).filter((l: any) => l.status === "aberto").map(publico);
      // criação de vídeos inclusa no plano: vídeos feitos pela Sofia para este pedido
      const { count: sofiaVideos } = await sb.from("sofia_video_jobs").select("id", { count: "exact", head: true }).eq("pedido_id", pid).in("status", ["sent", "ready"]);
      const vals = parcelas.filter((p: any) => p.situacao !== "cortesia").map((p: any) => Number(p.valor));
      const mensal = vals.length ? vals.sort((a: number, b: number) => vals.filter((v: number) => v === a).length - vals.filter((v: number) => v === b).length).pop() : null;
      return json({ ok: true, parcelas, cobrancas_abertas: abertas, sofia_videos: sofiaVideos || 0, desconto_atrasadas: 35, total_lib: lib.length, resumo: { ...m.resumo, valor_mensal: mensal }, plano: { inicio: m.pedido?.data_inicio_cobranca || m.pedido?.data_inicio, fim: m.pedido?.data_fim } });
    }

    // ===== cliente: pagar uma parcela (Pix ou boleto, valor cheio) ou todas as atrasadas num Pix único com 35% de desconto =====
    if (action === "cliente_pagar") {
      if (!pid || quem.tipo === "anon") return json({ ok: false, erro: "Entre na sua conta." }, 401);
      if (!admin) {
        const { data: dono } = await sb.from("pedidos").select("id").eq("id", pid).eq("client_id", quem.uid!).maybeSingle();
        if (!dono) return json({ ok: false, erro: "pedido não encontrado" }, 404);
      }
      const forma = b.forma === "boleto" ? "boleto" : "pix";
      const atual = await montar(pid);
      const liberadas = atual.parcelas.filter((p: any) => p.visivel_cliente && p.status === "aberto");
      const todasAtrasadas = b.atrasadas === true;
      let alvo: any[];
      if (todasAtrasadas) alvo = liberadas.filter((p: any) => p.situacao === "atrasado");
      else {
        const proxima = liberadas.find((p: any) => p.situacao === "a_vencer");
        alvo = liberadas.filter((p: any) => p.numero === Number(b.numero) && (p.situacao === "atrasado" || p.id === proxima?.id));
      }
      if (!alvo.length) return json({ ok: false, erro: "Não há parcela para pagar." }, 409);
      const DESC = todasAtrasadas && forma === "pix" && alvo.length > 1 ? 0.35 : 0;
      const cheio = alvo.reduce((a: number, p: any) => a + Number(p.valor), 0);
      const valor = Math.round(cheio * (1 - DESC) * 100) / 100;
      const nums = alvo.map((p: any) => p.numero).sort((a: number, b: number) => a - b);
      // reaproveita a cobrança aberta igual (mesmas parcelas, mesma forma)
      const { data: abertos } = await sb.from("cobranca_auditoria_pix").select("*").eq("pedido_id", pid).eq("status", "aberto");
      for (const l of abertos || []) if (await conciliarLote(l)) return json({ ok: true, ja_pago: true });
      const igual = (abertos || []).find((l: any) => (l.forma || "pix") === forma && JSON.stringify([...(l.parcelas || [])].sort((a: number, b: number) => a - b)) === JSON.stringify(nums) && Math.abs(Number(l.valor) - valor) < 0.01);
      if (igual) return json({ ok: true, cobranca: publico(igual) });
      // outra cobrança aberta com alguma dessas parcelas: cancela antes (nunca duas cobranças para a mesma parcela)
      for (const l of (abertos || []).filter((l: any) => (l.parcelas || []).some((n: number) => nums.includes(n)))) {
        if (l.asaas_payment_id) await asaas("DELETE", "/payments/" + l.asaas_payment_id);
        await sb.from("cobranca_auditoria_pix").update({ status: "cancelado" }).eq("id", l.id);
        await sb.from("cobranca_auditoria").update({ pix_lote_id: null }).eq("pix_lote_id", l.id).eq("status", "aberto");
      }
      const cid = await clienteDoPedido(pid, atual.parcelas);
      if (!cid) { await logEv("AUDITORIA_COBRANCA_CLIENTE_FALHOU", { pedido: pid, motivo: "sem cliente no Asaas" }); return json({ ok: false, erro: admin ? "Cliente sem cadastro no Asaas." : "Não consegui gerar agora. Tente de novo em instantes." }, 409); }
      let nd = await asaas("PUT", "/customers/" + cid, { notificationDisabled: true });
      if (!nd.ok && [404, 405].includes(nd.status)) nd = await asaas("POST", "/customers/" + cid, { notificationDisabled: true });
      // fase de auditoria: o Asaas não pode mandar e-mail/SMS/WhatsApp para o cliente — sem isso, não gera
      if (!nd.ok) { await logEv("AUDITORIA_COBRANCA_CLIENTE_FALHOU", { pedido: pid, motivo: "avisos do Asaas não desligados: " + erroAsaas(nd), cliente_asaas: cid }); return json({ ok: false, erro: admin ? "Asaas (avisos): " + erroAsaas(nd) : "Não consegui gerar agora. Tente de novo em instantes." }, 502); }
      const venc = addDias(hojeBR(), forma === "boleto" ? 3 : 1);
      const { data: lote, error: eL } = await sb.from("cobranca_auditoria_pix").insert({ pedido_id: pid, valor, vencimento: venc, parcelas: nums, criado_por: quem.uid, forma, desconto_pct: DESC * 100 }).select("*").single();
      if (eL || !lote) return json({ ok: false, erro: "Não consegui gerar agora." }, 500);
      const desc = alvo.map((p: any) => p.competencia || p.numero).join(", ");
      const r = await asaas("POST", "/payments", {
        customer: cid, billingType: forma === "boleto" ? "BOLETO" : "PIX", value: valor, dueDate: venc,
        description: `EXA Mídia · ${String(atual.pedido?.nome_pedido || "campanha").slice(0, 60)} · mensalidade${alvo.length > 1 ? "s" : ""} ${desc}${DESC ? " · 35% de desconto" : ""}`.slice(0, 480),
        externalReference: "auditoria:" + lote.id,
      });
      if (!r.ok || !r.j?.id) {
        await sb.from("cobranca_auditoria_pix").delete().eq("id", lote.id);
        const motivo = erroAsaas(r); console.error("[AUDITORIA] asaas", motivo);
        await logEv("AUDITORIA_COBRANCA_CLIENTE_FALHOU", { pedido: pid, forma, valor, parcelas: nums, status: r.status, motivo, cliente_asaas: cid });
        // equipe vê o motivo real; cliente vê a mensagem amigável
        return json({ ok: false, erro: admin ? "Asaas: " + motivo : "Não consegui gerar agora. Tente de novo em instantes." }, 502);
      }
      const up: any = { asaas_payment_id: r.j.id, invoice_url: r.j.invoiceUrl || null, boleto_url: r.j.bankSlipUrl || null };
      const qr = await asaas("GET", "/payments/" + r.j.id + "/pixQrCode");
      if (qr.ok) { up.pix_copia_cola = qr.j?.payload || null; up.pix_qr_base64 = qr.j?.encodedImage || null; }
      if (forma === "boleto") { const lin = await asaas("GET", "/payments/" + r.j.id + "/identificationField"); if (lin.ok) up.linha_digitavel = lin.j?.identificationField || null; }
      await sb.from("cobranca_auditoria_pix").update(up).eq("id", lote.id);
      await sb.from("cobranca_auditoria").update({ pix_lote_id: lote.id, updated_at: new Date().toISOString() }).in("id", alvo.map((p: any) => p.id));
      await logEv("AUDITORIA_COBRANCA_CLIENTE_GEROU", { pedido: pid, lote: lote.id, asaas: r.j.id, forma, valor, parcelas: nums, desconto: DESC, por: quem.uid });
      return json({ ok: true, cobranca: publico({ ...lote, ...up }) });
    }

    if (!admin) return json({ ok: false, erro: "Só a equipe EXA pode ver a auditoria." }, 401);

    if (action === "listar") {
      if (!pid) return json({ ok: false, erro: "pedido_id" }, 400);
      return json({ ok: true, ...(await montar(pid)) });
    }

    if (!master) return json({ ok: false, erro: "Só o admin master pode fazer isso." }, 403);

    if (action === "gerar_pix") {
      if (!pid) return json({ ok: false, erro: "pedido_id" }, 400);
      const atual = await montar(pid);
      const ids: string[] = Array.isArray(b.parcela_ids) && b.parcela_ids.length ? b.parcela_ids.map(String) : atual.parcelas.filter((p: any) => p.situacao === "atrasado").map((p: any) => p.id);
      const alvo = atual.parcelas.filter((p: any) => ids.includes(p.id) && p.status === "aberto" && !p.pix_lote_id);
      if (!alvo.length) return json({ ok: false, erro: "Nenhuma parcela em aberto sem Pix para gerar." }, 409);
      const cid = await clienteDoPedido(pid, atual.parcelas);
      if (!cid) return json({ ok: false, erro: "Cliente sem cadastro no Asaas." }, 409);
      // o cliente não recebe nada do Asaas (o Jeferson é quem manda o Pix quando decidir)
      let nd = await asaas("PUT", "/customers/" + cid, { notificationDisabled: true });
      if (!nd.ok && [404, 405].includes(nd.status)) nd = await asaas("POST", "/customers/" + cid, { notificationDisabled: true });
      if (!nd.ok) return json({ ok: false, erro: "Não consegui desligar os avisos do Asaas para o cliente: " + erroAsaas(nd) }, 502);
      const valor = Math.round(alvo.reduce((a: number, p: any) => a + Number(p.valor), 0) * 100) / 100;
      const venc = String(b.vencimento || addDias(hojeBR(), 3)).slice(0, 10);
      const lista = alvo.map((p: any) => p.competencia || p.numero).join(", ");
      const { data: lote, error: eL } = await sb.from("cobranca_auditoria_pix").insert({ pedido_id: pid, valor, vencimento: venc, parcelas: alvo.map((p: any) => p.numero), criado_por: quem.uid }).select("*").single();
      if (eL || !lote) return json({ ok: false, erro: eL?.message || "falha ao registrar" }, 500);
      const r = await asaas("POST", "/payments", {
        customer: cid, billingType: "PIX", value: valor, dueDate: venc,
        description: `EXA Mídia · ${String(atual.pedido?.nome_pedido || "campanha").slice(0, 60)} · regularização das parcelas ${lista}`.slice(0, 480),
        externalReference: "auditoria:" + lote.id,
      });
      if (!r.ok || !r.j?.id) { await sb.from("cobranca_auditoria_pix").delete().eq("id", lote.id); return json({ ok: false, erro: "Asaas: " + erroAsaas(r) }, 502); }
      const qr = await asaas("GET", "/payments/" + r.j.id + "/pixQrCode");
      const up = { asaas_payment_id: r.j.id, invoice_url: r.j.invoiceUrl || null, pix_copia_cola: qr.ok ? qr.j?.payload || null : null, pix_qr_base64: qr.ok ? qr.j?.encodedImage || null : null };
      await sb.from("cobranca_auditoria_pix").update(up).eq("id", lote.id);
      await sb.from("cobranca_auditoria").update({ pix_lote_id: lote.id, updated_at: new Date().toISOString() }).in("id", alvo.map((p: any) => p.id));
      await logEv("AUDITORIA_COBRANCA_PIX_GERADO", { pedido: pid, lote: lote.id, asaas: r.j.id, valor, parcelas: alvo.map((p: any) => p.numero), por: quem.uid });
      return json({ ok: true, lote: { ...lote, ...up }, valor: brl(valor) });
    }

    if (action === "cancelar_pix") {
      const { data: l } = await sb.from("cobranca_auditoria_pix").select("*").eq("id", String(b.lote_id || "")).maybeSingle();
      if (!l || l.status !== "aberto") return json({ ok: false, erro: "Pix não está em aberto." }, 409);
      if (await conciliarLote(l)) return json({ ok: false, erro: "Esse Pix já foi pago." }, 409);
      if (l.asaas_payment_id) { const d = await asaas("DELETE", "/payments/" + l.asaas_payment_id); if (!d.ok && d.status !== 404) return json({ ok: false, erro: "Asaas: " + erroAsaas(d) }, 502); }
      await sb.from("cobranca_auditoria_pix").update({ status: "cancelado" }).eq("id", l.id);
      await sb.from("cobranca_auditoria").update({ pix_lote_id: null }).eq("pix_lote_id", l.id).eq("status", "aberto");
      await logEv("AUDITORIA_COBRANCA_PIX_CANCELADO", { pedido: l.pedido_id, lote: l.id, por: quem.uid });
      return json({ ok: true });
    }

    if (action === "perdoar" || action === "reabrir") {
      const { data: p } = await sb.from("cobranca_auditoria").select("*").eq("id", String(b.parcela_id || "")).maybeSingle();
      if (!p) return json({ ok: false, erro: "parcela não encontrada" }, 404);
      if (p.status === "pago") return json({ ok: false, erro: "parcela já paga" }, 409);
      if (p.pix_lote_id) return json({ ok: false, erro: "Cancele antes o Pix gerado para ela." }, 409);
      const novo = action === "perdoar" ? "perdoado" : "aberto";
      await sb.from("cobranca_auditoria").update({ status: novo, observacao: action === "perdoar" ? String(b.motivo || "Perdoada pelo admin").slice(0, 300) : p.observacao, updated_at: new Date().toISOString() }).eq("id", p.id);
      await logEv("AUDITORIA_COBRANCA_" + action.toUpperCase(), { pedido: p.pedido_id, parcela: p.numero, por: quem.uid });
      return json({ ok: true });
    }

    return json({ ok: false, erro: "ação desconhecida" }, 400);
  } catch (e) {
    console.error("[AUDITORIA-COBRANCA]", e);
    return json({ ok: false, erro: "Erro interno" }, 500);
  }
});
