// verify_jwt=false (supabase/config.toml): a Evolution não manda JWT; autorização por ?token= e x-exa2-cron.
// =====================================================================
// LÍVIA — webhook do WhatsApp (instância de notificações: 45 99942-9820).
// POST (Evolution, ?token=)      → mensagem recebida: junta as que chegam em sequência e responde com a Lívia.
// ?action=setup  (sistema/admin) → cadastra este endpoint como webhook da instância da Lívia.
// ?action=versao                 → versão.
// ?action=passagem (sistema)     → a Sofia ou o Nando passam um assunto de dinheiro: {de, telefone, pedido_id?, contexto}.
// Regras: falha nunca vira mensagem para o cliente (vai ao Jeferson). Modo teste: só o Jeferson e os testadores.
// =====================================================================
import { db, DB, LIVIA_VERSAO, telefoneCanonico, ehCeo, ehTestador, config, avisarCeo, clienteDoTelefone, instanciaLivia, logEv, asaas, contatosDoPedido, addDias, hojeBR, brl, dataBR, horaWhats, SB_URL } from "../_shared/livia-core.ts";
import { responder, rodarTarefa } from "../_shared/livia-conversa.ts";
import { exigirSistema, exigirEquipe, urlWebhookEvolution, webhookEvolutionOk } from "../_shared/guarda.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-exa2-cron" };
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const ESPERA_MS = 8000;

function textoDa(m: any): string {
  if (!m) return "";
  return String(m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.documentMessage?.caption ||
    m.documentWithCaptionMessage?.message?.documentMessage?.caption || m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText || m.listResponseMessage?.title || m.reactionMessage?.text || "").trim();
}
function tipoMidia(m: any): string | null {
  if (!m) return null;
  if (m.imageMessage) return "imagem";
  if (m.documentMessage || m.documentWithCaptionMessage) return "documento";
  if (m.audioMessage) return "audio";
  if (m.videoMessage) return "video";
  if (m.stickerMessage) return "figurinha";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  if (action === "versao") return json(200, { versao: LIVIA_VERSAO });

  if (action === "setup") {
    if (!(await exigirSistema(req)) && !(await exigirEquipe(req, ["super_admin", "admin"]))) return json(401, { erro: "não autorizado" });
    const sb = db();
    const inst = await instanciaLivia(sb);
    const alvo = await urlWebhookEvolution("livia-webhook");
    const r = await fetch(`${(Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "")}/webhook/set/${inst}`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: Deno.env.get("EVOLUTION_API_KEY") || "" },
      body: JSON.stringify({ webhook: { enabled: true, url: alvo, webhookByEvents: false, webhookBase64: false, events: ["MESSAGES_UPSERT"] } }),
    });
    await logEv(sb, "LIVIA_WEBHOOK_SETUP", { instancia: inst, status: r.status });
    return json(r.ok ? 200 : 502, { instancia: inst, status: r.status, resposta: (await r.text()).slice(0, 300) });
  }

  // ---- Asaas: webhook PRÓPRIO da Lívia (não mexe na asaas-webhook protegida) ----
  if (action === "asaas_setup") {
    if (!(await exigirSistema(req)) && !(await exigirEquipe(req, ["super_admin"]))) return json(401, { erro: "não autorizado" });
    const sb = db();
    const tok = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
    await sb.from("livia_config").upsert({ chave: "asaas_token", valor: tok, updated_at: new Date().toISOString() });
    const atual = await asaas("GET", "/webhooks?limit=50");
    const meu = (atual.j?.data || []).find((w: any) => String(w.url || "").includes("/livia-webhook"));
    const corpo = {
      name: "Lívia (financeiro EXA)", url: `${SB_URL}/functions/v1/livia-webhook?action=asaas`, email: Deno.env.get("SOFIA_CEO_EMAIL") || "jefersonstilver@gmail.com",
      enabled: true, interrupted: false, apiVersion: 3, authToken: tok, sendType: "SEQUENTIALLY",
      events: ["PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_REFUSED", "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CANCELLED", "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_EXPIRED"],
    };
    const r = meu ? await asaas("PUT", "/webhooks/" + meu.id, corpo) : await asaas("POST", "/webhooks", corpo);
    await logEv(sb, "LIVIA_ASAAS_WEBHOOK", { ok: r.ok, status: r.status, id: r.j?.id || meu?.id, erro: r.ok ? null : r.j });
    return json(r.ok ? 200 : 502, { ok: r.ok, status: r.status, id: r.j?.id || meu?.id || null, erro: r.ok ? null : r.j });
  }
  if (action === "asaas") {
    const sb = db();
    const cfg = await config(sb, true);
    const tok = req.headers.get("asaas-access-token") || "";
    if (!cfg.asaas_token || tok !== cfg.asaas_token) return json(401, { erro: "não autorizado" });
    const ev = await req.json().catch(() => ({}));
    const tarefa = trabalhar(() => eventoAsaas(sb, ev));
    // @ts-ignore EdgeRuntime existe no Supabase
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(tarefa); else await tarefa;
    return json(200, { ok: true });
  }

  if (action === "passagem") {
    if (!(await exigirSistema(req))) return json(401, { erro: "não autorizado" });
    const b = await req.json().catch(() => ({}));
    const sb = db();
    const tel = telefoneCanonico(b.telefone || "");
    const contexto = String(b.contexto || "").trim();
    if (tel.length < 12 || contexto.length < 5) return json(400, { erro: "telefone e contexto obrigatórios" });
    const de = ["sofia", "nando", "ceo"].includes(b.de) ? b.de : "sofia";
    const { data: pas } = await sb.from("livia_passagens").insert({ de, para: "livia", telefone: tel, pedido_id: b.pedido_id || null, contexto: contexto.slice(0, 3000) }).select("id").single();
    const tarefa = trabalhar(async () => {
      const ok = await rodarTarefa(sb, tel, `A ${de === "nando" ? "equipe do Nando" : de === "ceo" ? "diretoria" : "Sofia"} passou este assunto de dinheiro para você: "${contexto}". Olhe a situação do cliente. Se tiver a resposta exata, chame o cliente agora (apresente-se como Lívia, do financeiro da EXA, dizendo que a ${de === "sofia" ? "Sofia" : "equipe"} comentou com você) e resolva. Se não tiver certeza, use perguntar_ao_jeferson e NÃO chame o cliente ainda (responda só [silêncio]).`);
      await sb.from("livia_passagens").update({ status: ok ? "feita" : "falhou", feita_em: new Date().toISOString() }).eq("id", pas?.id);
    });
    // @ts-ignore EdgeRuntime existe no Supabase
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(tarefa); else await tarefa;
    return json(200, { ok: true, passagem: pas?.id });
  }

  if (req.method !== "POST") return json(405, { erro: "método" });
  let payload: any; try { payload = await req.json(); } catch { return json(400, { erro: "json" }); }
  if (!(await webhookEvolutionOk(req, "livia", String(payload?.instance || "")))) return json(401, { erro: "não autorizado" });
  const ev = String(payload.event || "").toLowerCase();
  if (ev && !ev.includes("messages.upsert") && !ev.includes("messages_upsert")) return json(200, { ignorado: "evento" });
  const sb = db();
  if (payload.instance && payload.instance !== (await instanciaLivia(sb))) return json(200, { ignorado: "instância" });

  const d = payload.data || {}; const key = d.key || {};
  if (key.fromMe) return json(200, { ignorado: "fromMe" });
  const jid = String(key.remoteJid || "");
  if (jid.endsWith("@g.us") || jid.includes("broadcast")) return json(200, { ignorado: "grupo" });
  // @lid sem número real: guarda pelo lid, sem adivinhar quem é (no financeiro, adivinhar é atribuir pagamento à empresa errada)
  const bruto = key.remoteJidAlt || key.senderPn || (!jid.includes("@lid") ? jid : "") || "";
  const tel = bruto ? telefoneCanonico(String(bruto).replace(/@.*/, "")) : "lid:" + jid.replace(/@.*/, "");
  const msgId = String(key.id || crypto.randomUUID());
  const texto = textoDa(d.message); const midia = tipoMidia(d.message);
  if (!texto && !midia) return json(200, { ignorado: "vazio" });
  if (d.message?.reactionMessage) return json(200, { ignorado: "reação" });

  const { data: rep } = await sb.from("livia_mensagens").select("id").eq("conteudo->>msg_id", msgId).limit(1);
  if (rep?.length) return json(200, { ignorado: "repetida" });
  const papel = ehCeo(tel) ? "ceo" : "cliente";
  const { data: salva } = await sb.from("livia_mensagens").insert({
    telefone: tel, papel,
    conteudo: { msg_id: msgId, texto, midia, nome_whatsapp: d.pushName || null, key: midia ? key : undefined, mensagem: midia ? d.message : undefined },
  }).select("id").single();

  const tarefa = trabalhar(() => processar(sb, tel, salva?.id || 0, String(d.pushName || ""), texto, midia));
  // @ts-ignore EdgeRuntime existe no Supabase
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(tarefa); else await tarefa;
  return json(200, { ok: true });
});

/** Roda em segundo plano; erro nunca vai para o cliente, vai para o Jeferson. */
async function trabalhar(fn: () => Promise<unknown>) {
  try { await fn(); } catch (e) {
    console.error("[LIVIA] falha", e);
    try { await avisarCeo(db(), `⚠️ Lívia: falhei agora (${String((e as Error).message).slice(0, 300)}). O cliente não recebeu mensagem de erro.`); } catch (_) { /* */ }
  }
}

async function processar(sb: DB, tel: string, minha: number, pushName: string, texto: string, midia: string | null) {
  await new Promise((r) => setTimeout(r, ESPERA_MS));
  const papelEntrada = ehCeo(tel) ? "ceo" : "cliente";
  const { data: ult } = await sb.from("livia_mensagens").select("id").eq("telefone", tel).eq("papel", papelEntrada).order("id", { ascending: false }).limit(1).single();
  if (ult && ult.id !== minha) return; // a última mensagem responde por todas

  const cfg = await config(sb, true);
  const ceo = ehCeo(tel);
  const liberado = ceo || (cfg.ligada === "1" && (cfg.modo_teste !== "1" || await ehTestador(sb, tel)));
  if (!liberado) {
    // guarda e avisa o Jeferson (no máximo 1 aviso a cada 3 h por número)
    const { data: avisou } = await sb.from("livia_avisos").select("id").eq("tipo", "entrada_" + tel).gte("created_at", new Date(Date.now() - 3 * 3600e3).toISOString()).limit(1);
    if (!avisou?.length) {
      await sb.from("livia_avisos").insert({ tipo: "entrada_" + tel, canal: "ceo", destino: tel + ":" + Date.now() });
      const quem = await clienteDoTelefone(sb, tel).catch(() => ({ nome: "", empresa: "", pedidos: [] as any[] }));
      await avisarCeo(sb, `📩 Chegou mensagem no número da Lívia (ela está em ${cfg.ligada !== "1" ? "pausa" : "modo teste"} e não respondeu):\n${[quem.nome || pushName, quem.empresa].filter(Boolean).join(" — ") || "número sem cadastro"} (+${tel})\n"${(texto || (midia ? "[" + midia + "]" : "")).slice(0, 400)}"`);
    }
    return;
  }

  for (let i = 0; i < 50; i++) {
    const { data: livre, error } = await sb.rpc("livia_pegar_trava", { p_tel: tel, p_segundos: 170 });
    if (error || livre) break;
    await new Promise((r) => setTimeout(r, 3000));
    const { data: nova } = await sb.from("livia_mensagens").select("id").eq("telefone", tel).eq("papel", papelEntrada).order("id", { ascending: false }).limit(1).single();
    if (nova && nova.id !== minha) return;
  }
  try { await responder(sb, tel, minha, pushName); }
  finally { await sb.rpc("livia_soltar_trava", { p_tel: tel }).then(() => {}, () => {}); }
}


/** Pix Automático: débito recusado / autorização cancelada → a Lívia avisa (cliente liberado) ou só o Jeferson. */
async function eventoAsaas(sb: DB, ev: any) {
  const nome = String(ev?.event || "");
  const chave = String(ev?.id || ev?.paymentInstruction?.id || ev?.authorization?.id || "") + ":" + nome;
  const { error: dup } = await sb.from("livia_avisos").insert({ tipo: "asaas:" + chave, canal: "sistema", destino: "" });
  if (dup) return; // o Asaas manda "pelo menos uma vez": já tratado
  await logEv(sb, "LIVIA_ASAAS_EVENTO", { nome, chave, pi: ev?.paymentInstruction || null, aut: ev?.authorization ? { id: ev.authorization.id, status: ev.authorization.status, customerId: ev.authorization.customerId } : null });

  // acha o pedido: cobrança → cliente do Asaas → pedido
  let customer = String(ev?.authorization?.customerId || "");
  let pay: any = null;
  if (ev?.paymentInstruction?.paymentId) { const r = await asaas("GET", "/payments/" + ev.paymentInstruction.paymentId); if (r.ok) { pay = r.j; customer = customer || String(r.j?.customer || ""); } }
  let pedidoId = "";
  if (customer) {
    const { data: p1 } = await sb.from("pedidos").select("id").eq("asaas_customer_id", customer).not("status", "in", "(cancelado,cancelado_automaticamente,finalizado)").limit(1);
    pedidoId = p1?.[0]?.id || "";
    if (!pedidoId) { const { data: c1 } = await sb.from("sofia_cobrancas").select("pedido_id").eq("customer_id", customer).not("pedido_id", "is", null).order("created_at", { ascending: false }).limit(1); pedidoId = String(c1?.[0]?.pedido_id || ""); }
  }
  if (!pedidoId) { await avisarCeo(sb, `⚠️ Asaas: ${nome} (cliente Asaas ${customer || "?"}), mas não achei o pedido. Confere?`); return; }
  const ct = await contatosDoPedido(sb, pedidoId);
  const { data: ped } = await sb.from("pedidos").select("livia_cobranca").eq("id", pedidoId).maybeSingle();
  const valor = pay?.value ? brl(pay.value) : "";
  const tentativa = Number(ev?.paymentInstruction?.retryAttempt || 0);

  if (nome.endsWith("PAYMENT_INSTRUCTION_REFUSED")) {
    // pede nova tentativa para amanhã (só funciona se a autorização foi criada permitindo; se não, segue sem)
    let reagendou = false;
    if (ev?.paymentInstruction?.id && tentativa < 3) {
      const rr = await asaas("POST", `/pix/automatic/paymentInstructions/${ev.paymentInstruction.id}/retries`, { dueDate: addDias(hojeBR(), 1) });
      reagendou = rr.ok;
    }
    await avisarCeo(sb, `💳 Pix Automático de ${ct.nomePedido} ${valor} não passou${tentativa ? ` (tentativa ${tentativa + 1})` : ""}. ${reagendou ? "Pedi nova tentativa para amanhã." : "Não deu para reagendar (autorização sem retentativa)."}${ped?.livia_cobranca ? " Já estou falando com o cliente." : " Cobrança deste pedido ainda não liberada para mim: não falei com o cliente."}`);
    if (ped?.livia_cobranca && ct.cobrar.fone) {
      const msg = tentativa === 0
        ? `O débito do Pix Automático de ${ct.nomePedido} (${valor}) não passou hoje. Avise o cliente de forma leve e natural (nada de cobrança dura): o banco dele costuma tentar de novo ainda hoje${reagendou ? " e, se não der, o sistema tenta amanhã" : ""}. Ofereça mandar um Pix agora para resolver de uma vez (gerar_pagamento). Não fale de multa.`
        : `O Pix Automático de ${ct.nomePedido} (${valor}) falhou de novo. Fale no estilo "ops, ontem não deu certo o débito…" e ofereça o Pix agora (gerar_pagamento), sem multa nem juros se pagar hoje.`;
      if (horaWhats()) await rodarTarefa(sb, ct.cobrar.fone, msg);
      else await sb.from("livia_passagens").insert({ de: "livia", para: "livia", telefone: ct.cobrar.fone, pedido_id: pedidoId, contexto: msg });
    }
    return;
  }
  // autorização cancelada/expirada: o cliente desligou o Pix Automático — decisão do Jeferson
  await avisarCeo(sb, `🔕 ${ct.nomePedido}: a autorização do Pix Automático foi ${nome.endsWith("EXPIRED") ? "encerrada (fim da vigência)" : "cancelada"}. As próximas mensalidades não vão debitar sozinhas. Quer que eu ofereça o boleto ao cliente?`);
}
