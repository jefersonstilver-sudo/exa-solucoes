// =====================================================================
// EXA 2.0 · Chat do CRM (Nando, Sofia e Lívia) — complementa nando-crm e sofia-panel (que continuam
// cuidando de lista, mensagens de texto, assumir/devolver do Nando e da Sofia). Aqui ficam:
//   - livia_list / livia_messages / livia_set_mode → lista, mensagens e modo humano da Lívia (financeiro), 07/11/2026
//   - midia            → abre a foto/vídeo/áudio/documento de uma mensagem (baixa do WhatsApp na 1ª vez e guarda)
//   - upload_url       → link para o painel subir um arquivo/áudio no bucket privado crm-midia
//   - enviar           → envia texto e/ou arquivo/áudio agora, como a equipe EXA
//   - agendar / agendadas / cancelar_agendada → mensagens programadas
//   - notas / nota     → notas internas por conversa
//   - disparar         → (cron a cada minuto, x-exa2-cron) envia as programadas que venceram
// Só admin / super_admin (ou o cron). Não mexe na sofia-agent, nem apaga mensagens.
// =====================================================================
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { instanciaNando, telefoneCanonico } from "../_shared/nando-core.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-exa2-cron",
};
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const BUCKET = "crm-midia";
const HORAS_HUMANO = 12;

const EVO = () => {
  const url = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
  const key = Deno.env.get("EVOLUTION_API_KEY") || "";
  if (!url || !key) throw new Error("EVOLUTION_API_URL/KEY ausentes");
  return { url, key };
};

type Tipo = "imagem" | "video" | "documento" | "audio";
type Arquivo = { caminho: string; mime: string; nome?: string; tipo: Tipo };
type Destino = { instancia: string; numero: string; jid?: string };

const extDe = (mime: string) => {
  const m = (mime || "").split(";")[0];
  if (m.includes("pdf")) return "pdf";
  if (m.includes("png")) return "png";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.includes("webp")) return "webp";
  if (m.includes("mp4")) return m.startsWith("audio") ? "m4a" : "mp4";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("webm")) return "webm";
  if (m.includes("mpeg")) return "mp3";
  return (m.split("/")[1] || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 6) || "bin";
};
const tipoDoMime = (mime: string): Tipo =>
  mime.startsWith("image/") ? "imagem" : mime.startsWith("video/") ? "video" : mime.startsWith("audio/") ? "audio" : "documento";
const ROTULO: Record<Tipo, string> = { imagem: "foto", video: "vídeo", documento: "documento", audio: "áudio" };

async function linkAssinado(sb: SupabaseClient, caminho: string, segundos = 3600) {
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(caminho, segundos);
  if (error) throw error;
  return data.signedUrl;
}

// ---------------------------------------------------------------- destino de cada agente
async function destino(sb: SupabaseClient, agente: string, alvo: string): Promise<Destino> {
  if (agente === "nando") {
    return { instancia: await instanciaNando(sb), numero: telefoneCanonico(alvo) };
  }
  if (agente === "livia") {
    if (alvo.startsWith("lid:")) return { instancia: await instanciaLivia(sb), numero: alvo.slice(4), jid: alvo.slice(4) + "@lid" };
    return { instancia: await instanciaLivia(sb), numero: canonLivia(alvo) };
  }
  const { data: conv } = await sb.from("sofia_conversations").select("id, instance, jid").eq("id", alvo).maybeSingle();
  if (!conv) throw new Error("conversa da Sofia não encontrada");
  return { instancia: conv.instance, numero: String(conv.jid).replace(/@.*/, ""), jid: conv.jid };
}

// Lívia (financeiro) fala pela instância de notificações da Evolution (evolution_instances.is_notifications)
async function instanciaLivia(sb: SupabaseClient): Promise<string> {
  const env = Deno.env.get("LIVIA_INSTANCIA");
  if (env) return env;
  const { data } = await sb.from("evolution_instances").select("instance_name").eq("is_notifications", true).maybeSingle();
  if (!data?.instance_name) throw new Error("instância da Lívia não encontrada (evolution_instances.is_notifications)");
  return data.instance_name;
}
const LIVIA_HUMANO_H = 12;
const ultimos8 = (t: string) => String(t || "").replace(/\D/g, "").slice(-8);
/** Mesma regra da Lívia (livia-core.chavesTelefone): BR com 8 dígitos ganha o 9; devolve as variantes [com 9, sem 9]. */
function chavesLivia(bruto: string): string[] {
  let d = String(bruto || "").replace(/\D/g, "");
  if (!d) return [];
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (!d.startsWith("55")) return [d];
  const ddd = d.slice(2, 4); let num = d.slice(4);
  if (num.length === 8) num = "9" + num;
  if (num.length !== 9) return [d];
  return [`55${ddd}${num}`, `55${ddd}${num.slice(1)}`];
}
const canonLivia = (t: string) => (t.startsWith("lid:") ? t : chavesLivia(t)[0] || String(t || "").replace(/\D/g, ""));

/** Texto/mídia de uma mensagem crua da Evolution (histórico do WhatsApp da Lívia). */
function lerEvo(raw: any): { texto: string; midia: string | null } {
  let m = raw?.message || {};
  for (const w of ["ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2", "documentWithCaptionMessage", "editedMessage"]) if (m?.[w]?.message) m = m[w].message;
  if (m.conversation) return { texto: m.conversation, midia: null };
  if (m.extendedTextMessage?.text) return { texto: m.extendedTextMessage.text, midia: null };
  if (m.imageMessage) return { texto: m.imageMessage.caption || "", midia: "imagem" };
  if (m.videoMessage || m.ptvMessage) return { texto: (m.videoMessage || m.ptvMessage).caption || "", midia: "video" };
  if (m.audioMessage || m.pttMessage) return { texto: "", midia: "audio" };
  if (m.documentMessage) return { texto: m.documentMessage.caption || m.documentMessage.fileName || "", midia: "documento" };
  if (m.stickerMessage) return { texto: "[figurinha]", midia: null };
  if (m.templateMessage || m.buttonsMessage || m.listMessage || m.interactiveMessage) {
    const t = m.templateMessage?.hydratedTemplate?.hydratedContentText || m.buttonsMessage?.contentText || m.listMessage?.description || m.interactiveMessage?.body?.text || "";
    return { texto: t || "[mensagem com botões]", midia: null };
  }
  if (m.reactionMessage) return { texto: "", midia: null };
  if (m.locationMessage) return { texto: "[localização]", midia: null };
  if (m.contactMessage || m.contactsArrayMessage) return { texto: "[contato]", midia: null };
  if (m.protocolMessage || m.senderKeyDistributionMessage || m.messageContextInfo) return { texto: "", midia: null };
  return { texto: "", midia: null };
}
async function evoMensagens(instancia: string, jid: string, limite = 300): Promise<any[]> {
  try {
    const j = await evoPost(`/chat/findMessages/${encodeURIComponent(instancia)}`, { where: { key: { remoteJid: jid } }, limit: limite, page: 1 });
    const recs = j?.messages?.records || j?.records || (Array.isArray(j) ? j : []);
    return Array.isArray(recs) ? recs : [];
  } catch { return []; }
}

/** Quem é cada telefone para a Lívia: financeiro, dono ou autorizado de pedidos vivos (uma passada só). */
async function clientesLivia(sb: SupabaseClient) {
  const INATIVOS = ["cancelado", "cancelado_automaticamente", "finalizado", "bloqueado"];
  const { data: peds } = await sb.from("pedidos").select("id,client_id,nome_pedido,client_name,status,whatsapp").limit(1500);
  const vivos = (peds || []).filter((p: any) => !INATIVOS.includes(String(p.status)));
  const ids = [...new Set(vivos.map((p: any) => p.client_id).filter(Boolean))];
  const { data: us } = ids.length ? await sb.from("users").select("id,nome,empresa_nome,telefone,financeiro_whatsapp,financeiro_nome").in("id", ids) : { data: [] as any[] };
  const uMap = new Map((us || []).map((u: any) => [u.id, u]));
  const { data: aut } = await sb.from("pedido_whatsapp_autorizados").select("pedido_id,telefone,nome");
  const mapa = new Map<string, { nome: string; empresa: string; papel: string; pedidos: number; client_id: string | null }>();
  const marcar = (tel: unknown, nome: string, empresa: string, papel: string, client_id: string | null) => {
    const k = ultimos8(String(tel || "")); if (!k) return;
    const cur = mapa.get(k);
    if (cur) { cur.pedidos += 1; if (!cur.nome && nome) cur.nome = nome; return; }
    mapa.set(k, { nome, empresa, papel, pedidos: 1, client_id });
  };
  for (const p of vivos) {
    const u: any = uMap.get(p.client_id) || {};
    const empresa = u.empresa_nome || p.client_name || "";
    if (u.financeiro_whatsapp) marcar(u.financeiro_whatsapp, u.financeiro_nome || "", empresa, "financeiro", p.client_id);
    if (p.whatsapp) marcar(p.whatsapp, u.nome || "", empresa, "dono", p.client_id);
    if (u.telefone) marcar(u.telefone, u.nome || "", empresa, "dono", p.client_id);
    for (const a of (aut || []).filter((x: any) => x.pedido_id === p.id)) marcar(a.telefone, a.nome || "", empresa, "autorizado", p.client_id);
  }
  return mapa;
}

async function liviaLista(sb: SupabaseClient) {
  const [{ data: rows }, { data: estados }, clientes, instancia] = await Promise.all([
    sb.from("livia_mensagens").select("id, telefone, papel, conteudo, created_at").order("id", { ascending: false }).limit(4000),
    sb.from("livia_estado").select("telefone, humano_ate"),
    clientesLivia(sb),
    instanciaLivia(sb).catch(() => ""),
  ]);
  // 07/11/2026 (Jeferson: "tudo tem que aparecer ali"): a lista também traz as conversas do WhatsApp da Lívia que não passaram pelo banco
  let chatsEvo: any[] = [];
  if (instancia) { try { const j = await evoPost(`/chat/findChats/${encodeURIComponent(instancia)}`, {}); chatsEvo = Array.isArray(j) ? j : (j?.data || []); } catch { chatsEvo = []; } }
  const estado = new Map((estados || []).map((e: any) => [e.telefone, e.humano_ate]));
  const ceo8 = ultimos8(Deno.env.get("LIVIA_CEO") || "5545998090000");
  const porTel = new Map<string, any>();
  for (const m of rows || []) {
    const k: any = m.conteudo || {};
    const telKey = canonLivia(String(m.telefone || ""));
    let c = porTel.get(telKey);
    if (!c) {
      c = { telefone: telKey, nome_whatsapp: null as string | null, ultima_em: m.created_at, ultima_papel: m.papel, preview: "", aguardando: 0, total: 0, respondida: false };
      porTel.set(m.telefone, c);
    }
    c.total += 1;
    if (!c.preview) c.preview = String(k.texto || (k.midia ? `[${k.midia}]` : "")).slice(0, 120);
    if (!c.nome_whatsapp && k.nome_whatsapp) c.nome_whatsapp = k.nome_whatsapp;
    // "aguardando": mensagens do cliente depois da última resposta (Lívia ou equipe)
    if (m.papel === "livia" || m.papel === "humano") c.respondida = true;
    else if ((m.papel === "cliente" || m.papel === "ceo") && !c.respondida) c.aguardando += 1;
  }
  for (const ch of chatsEvo) {
    const jid = String(ch.remoteJid || ch.id || "");
    if (!jid || jid.endsWith("@g.us") || jid.includes("broadcast") || jid.includes("status@")) continue;
    const alt = String(ch.remoteJidAlt || ch.senderPn || "");
    const tel = jid.endsWith("@lid") ? (alt ? canonLivia(alt.replace(/@.*/, "")) : "lid:" + jid.replace(/@.*/, "")) : canonLivia(jid.replace(/@.*/, ""));
    const ja = [...porTel.keys()].find((k) => (k.startsWith("lid:") || tel.startsWith("lid:")) ? k === tel : ultimos8(k) === ultimos8(tel));
    const quando = ch.updatedAt || ch.lastMessage?.messageTimestamp && new Date(Number(ch.lastMessage.messageTimestamp) * 1000).toISOString() || null;
    const preview = ch.lastMessage ? lerEvo(ch.lastMessage).texto || (lerEvo(ch.lastMessage).midia ? `[${lerEvo(ch.lastMessage).midia}]` : "") : "";
    if (ja) {
      const c = porTel.get(ja)!;
      if (!c.nome_whatsapp && (ch.pushName || ch.name)) c.nome_whatsapp = ch.pushName || ch.name;
      if (quando && quando > c.ultima_em) { c.ultima_em = quando; c.ultima_papel = ch.lastMessage?.key?.fromMe ? "humano" : "cliente"; if (preview) c.preview = preview.slice(0, 120); if (!ch.lastMessage?.key?.fromMe) c.aguardando = Math.max(c.aguardando, 1); }
      continue;
    }
    porTel.set(tel, { telefone: tel, nome_whatsapp: ch.pushName || ch.name || null, ultima_em: quando || new Date(0).toISOString(), ultima_papel: ch.lastMessage?.key?.fromMe ? "humano" : "cliente", preview: preview.slice(0, 120), aguardando: ch.unreadCount || 0, total: 0, respondida: false, so_whatsapp: true });
  }
  const conversas = [...porTel.values()].map((c) => {
    const cli = clientes.get(ultimos8(c.telefone));
    const ceo = ultimos8(c.telefone) === ceo8 || c.ultima_papel === "ceo" || (rows || []).some((r: any) => r.telefone === c.telefone && r.papel === "ceo");
    const humanoAte = estado.get(c.telefone) || chavesLivia(c.telefone).map((x) => estado.get(x)).find(Boolean) || null;
    const humano = !!humanoAte && new Date(humanoAte).getTime() > Date.now();
    return {
      telefone: c.telefone,
      nome: ceo ? "Jeferson (CEO)" : (cli?.nome || c.nome_whatsapp || c.telefone),
      nome_whatsapp: c.nome_whatsapp,
      empresa: cli?.empresa || null, papel: ceo ? "ceo" : (cli?.papel || null), client_id: cli?.client_id || null, pedidos: cli?.pedidos || 0,
      tipo: ceo ? "ceo" : cli ? "cliente" : "sem_cadastro",
      modo: humano ? "humano" : "auto", humano_ate: humano ? humanoAte : null,
      ultima_em: c.ultima_em, ultima_papel: c.ultima_papel, preview: c.preview, aguardando: c.aguardando, total: c.total, so_whatsapp: !!c.so_whatsapp,
    };
  }).sort((a, b) => new Date(b.ultima_em).getTime() - new Date(a.ultima_em).getTime());
  return conversas;
}

async function liviaMensagens(sb: SupabaseClient, tel: string) {
  const chaves = tel.startsWith("lid:") ? [tel] : [...new Set([tel, ...chavesLivia(tel)])];
  const { data } = await sb.from("livia_mensagens").select("id, papel, conteudo, created_at").in("telefone", chaves).order("id", { ascending: false }).limit(400);
  const doBanco = (data || []).reverse().map((m: any) => {
    const k = m.conteudo || {};
    return { id: m.id, papel: m.papel, texto: String(k.texto || ""), autor: k.autor || null, created_at: m.created_at, midia: k.midia || k.crm_arquivo?.tipo || null, msg_id: k.msg_id || null };
  });
  // histórico do WhatsApp (Evolution): tudo o que entrou e saiu pelo número da Lívia, mesmo sem passar pelo banco
  let instancia = ""; try { instancia = await instanciaLivia(sb); } catch { /* sem instância: só o banco */ }
  const jids = tel.startsWith("lid:") ? [tel.slice(4) + "@lid"] : chavesLivia(tel).map((c) => `${c}@s.whatsapp.net`);
  const vistos = new Set(doBanco.map((m: any) => m.msg_id).filter(Boolean));
  const extras: any[] = [];
  if (instancia) {
    for (const jid of jids) {
      for (const raw of await evoMensagens(instancia, jid)) {
        const wid = raw?.key?.id; if (!wid || vistos.has(wid)) continue;
        vistos.add(wid);
        const { texto, midia } = lerEvo(raw);
        if (!texto && !midia) continue;
        const fromMe = !!raw?.key?.fromMe;
        const ts = Number(raw?.messageTimestamp || 0);
        extras.push({
          id: `w:${wid}:${raw.key.remoteJid}:${fromMe ? 1 : 0}`, papel: fromMe ? "humano" : "cliente", texto, autor: fromMe ? "WhatsApp da Lívia" : null,
          created_at: ts ? new Date(ts * 1000).toISOString() : new Date().toISOString(), midia, msg_id: wid,
        });
      }
    }
  }
  // sem msg_id no banco (mensagens antigas da Lívia): tira do WhatsApp as que batem por texto e minuto
  const semId = doBanco.filter((m: any) => !m.msg_id);
  const dup = (e: any) => semId.some((m: any) => m.texto && m.texto.trim() === e.texto.trim() && Math.abs(new Date(m.created_at).getTime() - new Date(e.created_at).getTime()) < 120e3);
  return [...doBanco, ...extras.filter((e) => !dup(e))].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

// ---------------------------------------------------------------- perfil do WhatsApp de cada agente (07/11/2026, Jeferson:
// "réplica perfeita do WhatsApp e configurações": foto, nome, recado e privacidade lidos da Evolution e editáveis aqui)
async function evoReq(metodo: string, caminho: string, corpo?: Record<string, unknown>) {
  const { url, key } = EVO();
  const r = await fetch(`${url}${caminho}`, { method: metodo, headers: { "Content-Type": "application/json", apikey: key }, body: corpo ? JSON.stringify(corpo) : undefined, signal: AbortSignal.timeout(60000) });
  const t = await r.text();
  if (!r.ok) throw new Error(`Evolution ${r.status}: ${t.slice(0, 240)}`);
  try { return JSON.parse(t); } catch { return {}; }
}
async function instanciaDoAgente(sb: SupabaseClient, agente: string): Promise<{ instancia: string; id: string | null; numero: string }> {
  if (agente === "nando") {
    const inst = await instanciaNando(sb);
    const { data } = await sb.from("evolution_instances").select("id, collaborator_phone, owner_jid").eq("instance_name", inst).maybeSingle();
    return { instancia: inst, id: data?.id || null, numero: String(data?.owner_jid || data?.collaborator_phone || "").replace(/@.*/, "").replace(/\D/g, "") };
  }
  if (agente === "livia") {
    const { data } = await sb.from("evolution_instances").select("id, instance_name, collaborator_phone, owner_jid").eq("is_notifications", true).maybeSingle();
    if (!data) throw new Error("instância da Lívia não encontrada");
    return { instancia: data.instance_name, id: data.id, numero: String(data.owner_jid || data.collaborator_phone || "").replace(/@.*/, "").replace(/\D/g, "") };
  }
  const { data } = await sb.from("evolution_instances").select("id, instance_name, collaborator_phone, owner_jid").or("collaborator_name.ilike.%sofia%,instance_name.ilike.%sofia%").limit(1).maybeSingle();
  if (!data) throw new Error("instância da Sofia não encontrada");
  return { instancia: data.instance_name, id: data.id, numero: String(data.owner_jid || data.collaborator_phone || "").replace(/@.*/, "").replace(/\D/g, "") };
}
async function perfilAgente(sb: SupabaseClient, agente: string) {
  const a = await instanciaDoAgente(sb, agente);
  const inst = encodeURIComponent(a.instancia);
  let perfil: any = null, privacidade: any = null, conexao: any = null;
  try { perfil = await evoReq("POST", `/chat/fetchProfile/${inst}`, { number: a.numero }); } catch (e) { perfil = { erro: (e as Error).message }; }
  try { privacidade = await evoReq("GET", `/chat/fetchPrivacySettings/${inst}`); } catch { privacidade = null; }
  try { conexao = await evoReq("GET", `/instance/connectionState/${inst}`); } catch { conexao = null; }
  const foto = perfil?.picture || perfil?.profilePictureUrl || null;
  // o nome vem da instância (fetchProfile não traz o nome do próprio número)
  let nome: string | null = perfil?.name || perfil?.wuid?.name || null;
  if (!nome) {
    try {
      const lista = await evoReq("GET", `/instance/fetchInstances?instanceName=${inst}`);
      const it = Array.isArray(lista) ? lista[0] : lista;
      nome = it?.profileName || it?.instance?.profileName || null;
    } catch { /* fica sem nome */ }
  }
  const recado = perfil?.status?.status ?? perfil?.status ?? null;
  // espelha no cadastro da instância (o card da Equipe e o chat usam isso)
  if (a.id && (foto || nome)) {
    await sb.from("evolution_instances").update({ ...(foto ? { profile_picture_url: foto } : {}), ...(nome ? { profile_name: nome } : {}), updated_at: new Date().toISOString() }).eq("id", a.id).then(() => {}, () => {});
  }
  return {
    instancia: a.instancia, numero: a.numero, foto, nome, recado: typeof recado === "string" ? recado : null,
    privacidade: privacidade?.privacy || privacidade || null, conexao: conexao?.instance?.state || conexao?.state || null,
    business: !!perfil?.isBusiness, descricao: perfil?.description || null, site: perfil?.website || null, bruto: perfil,
  };
}
async function perfilAtualizar(sb: SupabaseClient, agente: string, b: any) {
  const a = await instanciaDoAgente(sb, agente);
  const inst = encodeURIComponent(a.instancia);
  const feito: string[] = [];
  if (typeof b.nome === "string" && b.nome.trim()) { await evoReq("POST", `/chat/updateProfileName/${inst}`, { name: b.nome.trim().slice(0, 25) }); feito.push("nome"); }
  if (typeof b.recado === "string") { await evoReq("POST", `/chat/updateProfileStatus/${inst}`, { status: b.recado.trim().slice(0, 139) }); feito.push("recado"); }
  if (b.foto_caminho) {
    if (!/^envios\/[a-z0-9-]+\.[a-z0-9]{1,6}$/i.test(String(b.foto_caminho))) throw new Error("foto inválida");
    const link = await linkAssinado(sb, String(b.foto_caminho), 1800);
    await evoReq("POST", `/chat/updateProfilePicture/${inst}`, { picture: link });
    feito.push("foto");
  }
  if (b.remover_foto) { await evoReq("DELETE", `/chat/removeProfilePicture/${inst}`); feito.push("foto removida"); }
  if (b.privacidade && typeof b.privacidade === "object") {
    const p = b.privacidade;
    const ok = (v: unknown, lista: string[]) => (typeof v === "string" && lista.includes(v) ? v : undefined);
    const corpo = {
      readreceipts: ok(p.readreceipts, ["all", "none"]), profile: ok(p.profile, ["all", "contacts", "contact_blacklist", "none"]),
      status: ok(p.status, ["all", "contacts", "contact_blacklist", "none"]), online: ok(p.online, ["all", "match_last_seen"]),
      last: ok(p.last, ["all", "contacts", "contact_blacklist", "none"]), groupadd: ok(p.groupadd, ["all", "contacts", "contact_blacklist"]),
    };
    await evoReq("POST", `/chat/updatePrivacySettings/${inst}`, Object.fromEntries(Object.entries(corpo).filter(([, v]) => v !== undefined)));
    feito.push("privacidade");
  }
  return { feito, perfil: await perfilAgente(sb, agente) };
}

// ---------------------------------------------------------------- envio pela Evolution
async function evoPost(caminho: string, corpo: Record<string, unknown>) {
  const { url, key } = EVO();
  const r = await fetch(`${url}${caminho}`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: key }, body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(90000),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`Evolution ${r.status}: ${t.slice(0, 240)}`);
  try { return JSON.parse(t); } catch { return {}; }
}
async function enviarAgora(sb: SupabaseClient, d: Destino, texto: string, arq: Arquivo | null) {
  const inst = encodeURIComponent(d.instancia);
  // a Sofia às vezes conversa por @lid: tenta o jid inteiro e depois só o número (igual ao sofia-panel)
  const numeros = d.jid ? [d.jid, d.numero] : [d.numero];
  let ultimo: unknown = null;
  for (const number of numeros) {
    try {
      if (!arq) return await evoPost(`/message/sendText/${inst}`, { number, text: texto });
      const link = await linkAssinado(sb, arq.caminho, 3600);
      if (arq.tipo === "audio") {
        const r = await evoPost(`/message/sendWhatsAppAudio/${inst}`, { number, audio: link, encoding: true });
        if (texto) await evoPost(`/message/sendText/${inst}`, { number, text: texto });
        return r;
      }
      return await evoPost(`/message/sendMedia/${inst}`, {
        number,
        mediatype: arq.tipo === "imagem" ? "image" : arq.tipo === "video" ? "video" : "document",
        mimetype: arq.mime, media: link, caption: texto || "", fileName: arq.nome || `arquivo.${extDe(arq.mime)}`,
      });
    } catch (e) { ultimo = e; }
  }
  throw ultimo instanceof Error ? ultimo : new Error("falha ao enviar");
}

// ---------------------------------------------------------------- registro da mensagem enviada
async function registrar(sb: SupabaseClient, agente: string, alvo: string, texto: string, arq: Arquivo | null, autor: string, autorId: string | null, waId: string | null, opts: { pausar: boolean; programada?: boolean }) {
  const agora = new Date().toISOString();
  if (agente === "nando") {
    const tel = telefoneCanonico(alvo);
    const { data: ult } = await sb.from("nando_mensagens").select("id").eq("telefone", tel).eq("papel", "sindico").order("id", { ascending: false }).limit(1);
    await sb.from("nando_mensagens").insert({
      telefone: tel, papel: "humano",
      conteudo: {
        texto: arq?.tipo === "audio" && !texto ? "[áudio enviado pela equipe]" : texto,
        autor: autor + (opts.programada ? " · programada" : ""), ate: ult?.[0]?.id || null, msg_id: waId,
        ...(arq ? { midia: arq.tipo, crm_arquivo: arq } : {}),
      },
    });
    if (opts.pausar) {
      const { data: at } = await sb.from("nando_atendimento").select("modo, humano_ate").eq("telefone", tel).maybeSingle();
      const ativo = at?.modo === "humano" && (!at.humano_ate || new Date(at.humano_ate).getTime() > Date.now());
      if (!ativo) {
        await sb.from("nando_atendimento").upsert({
          telefone: tel, modo: "humano", humano_ate: new Date(Date.now() + HORAS_HUMANO * 3600e3).toISOString(),
          assumido_por: autorId, assumido_por_nome: autor, atualizado_em: agora,
        }, { onConflict: "telefone" });
      }
    }
    return;
  }
  if (agente === "livia") {
    const { data: ult } = await sb.from("livia_mensagens").select("id").eq("telefone", alvo).in("papel", ["cliente", "ceo"]).order("id", { ascending: false }).limit(1);
    await sb.from("livia_mensagens").insert({
      telefone: alvo, papel: "humano",
      conteudo: {
        texto: arq?.tipo === "audio" && !texto ? "[áudio enviado pela equipe]" : texto,
        autor: autor + (opts.programada ? " · programada" : ""), ate: ult?.[0]?.id || null, msg_id: waId,
        ...(arq ? { midia: arq.tipo, crm_arquivo: arq } : {}),
      },
    });
    if (opts.pausar) {
      const { data: est } = await sb.from("livia_estado").select("humano_ate").eq("telefone", alvo).maybeSingle();
      const ativo = est?.humano_ate && new Date(est.humano_ate).getTime() > Date.now();
      if (!ativo) await sb.from("livia_estado").upsert({ telefone: alvo, humano_ate: new Date(Date.now() + LIVIA_HUMANO_H * 3600e3).toISOString(), updated_at: agora }, { onConflict: "telefone" });
    }
    return;
  }
  // Sofia: o corpo carrega uma marca curta (a Sofia lê o histórico) e o arquivo fica achável pelo wa_id
  const marca = arq ? `[${ROTULO[arq.tipo]} enviado pela equipe${arq.nome && arq.tipo === "documento" ? `: ${arq.nome}` : ""}]` : "";
  const body = [marca, texto].filter(Boolean).join(" ") || "[mensagem da equipe]";
  const { data: ins } = await sb.from("sofia_messages").insert({ conversation_id: alvo, wa_id: waId, direction: "out_human", body }).select("id").maybeSingle();
  if (arq && waId) await guardarCopia(sb, `sofia/${waId}`, arq.caminho, arq.mime);
  const patch: Record<string, unknown> = { last_message_at: agora };
  if (opts.pausar) { patch.mode = "humano"; patch.human_until = new Date(Date.now() + HORAS_HUMANO * 3600e3).toISOString(); }
  await sb.from("sofia_conversations").update(patch).eq("id", alvo);
  return ins?.id;
}
// copia o arquivo enviado para o caminho de cache (sofia/<wa_id>.ext) para abrir sem ir ao WhatsApp
async function guardarCopia(sb: SupabaseClient, base: string, origem: string, mime: string) {
  try { await sb.storage.from(BUCKET).copy(origem, `${base}.${extDe(mime)}`); } catch { /* cache é opcional */ }
}

// ---------------------------------------------------------------- abrir mídia de uma mensagem
async function achaCache(sb: SupabaseClient, pasta: string, nomeBase: string) {
  const { data } = await sb.storage.from(BUCKET).list(pasta, { search: nomeBase, limit: 5 });
  const f = (data || []).find((x: any) => x.name.split(".")[0] === nomeBase);
  return f ? { caminho: `${pasta}/${f.name}`, mime: (f.metadata as any)?.mimetype || "application/octet-stream" } : null;
}
async function baixarDoWhatsApp(instancia: string, key: Record<string, unknown>) {
  const j = await evoPost(`/chat/getBase64FromMediaMessage/${encodeURIComponent(instancia)}`, { message: { key }, convertToMp4: false });
  const b64 = j?.base64 || j?.data?.base64;
  if (!b64) return null;
  const limpo = String(b64).replace(/^data:[^,]+,/, "");
  const mime = String(j?.mimetype || j?.data?.mimetype || "application/octet-stream").split(";")[0];
  return { bytes: Uint8Array.from(atob(limpo), (c) => c.charCodeAt(0)), mime, nome: j?.fileName || j?.data?.fileName || null };
}

async function abrirMidia(sb: SupabaseClient, agente: string, id: string) {
  if (agente === "nando") {
    const { data: m } = await sb.from("nando_mensagens").select("id, telefone, papel, conteudo").eq("id", Number(id)).maybeSingle();
    if (!m) throw new Error("mensagem não encontrada");
    const c: any = m.conteudo || {};
    if (c.crm_arquivo?.caminho) {
      return { url: await linkAssinado(sb, c.crm_arquivo.caminho), mime: c.crm_arquivo.mime, nome: c.crm_arquivo.nome || null, tipo: c.crm_arquivo.tipo };
    }
    if (c.midia_id) {
      const { data } = await sb.storage.from("nando-midia").list("recebidas", { search: c.midia_id, limit: 5 });
      const f = (data || []).find((x: any) => x.name.split(".")[0] === c.midia_id);
      if (f) {
        const mime = (f.metadata as any)?.mimetype || "application/octet-stream";
        const url = sb.storage.from("nando-midia").getPublicUrl(`recebidas/${f.name}`).data.publicUrl;
        return { url, mime, nome: null, tipo: tipoDoMime(mime) };
      }
    }
    const cache = await achaCache(sb, "nando", `n${m.id}`);
    if (cache) return { url: await linkAssinado(sb, cache.caminho), mime: cache.mime, nome: null, tipo: tipoDoMime(cache.mime) };
    const key = c.key || (c.msg_id ? { id: c.msg_id, remoteJid: `${telefoneCanonico(m.telefone)}@s.whatsapp.net`, fromMe: m.papel !== "sindico" } : null);
    if (!key) throw new Error("esta mensagem não tem arquivo");
    const arq = await baixarDoWhatsApp(await instanciaNando(sb), key);
    if (!arq) throw new Error("o WhatsApp não devolveu o arquivo (pode ter expirado)");
    const caminho = `nando/n${m.id}.${extDe(arq.mime)}`;
    await sb.storage.from(BUCKET).upload(caminho, arq.bytes, { contentType: arq.mime, upsert: true });
    return { url: await linkAssinado(sb, caminho), mime: arq.mime, nome: arq.nome, tipo: tipoDoMime(arq.mime) };
  }
  if (agente === "livia" && id.startsWith("w:")) {
    const [, wid, jid, fm] = id.split(":");
    const cache = await achaCache(sb, "livia", `w${wid}`);
    if (cache) return { url: await linkAssinado(sb, cache.caminho), mime: cache.mime, nome: null, tipo: tipoDoMime(cache.mime) };
    const arq = await baixarDoWhatsApp(await instanciaLivia(sb), { id: wid, remoteJid: jid, fromMe: fm === "1" });
    if (!arq) throw new Error("o WhatsApp não devolveu o arquivo (pode ter expirado)");
    const caminho = `livia/w${wid}.${extDe(arq.mime)}`;
    await sb.storage.from(BUCKET).upload(caminho, arq.bytes, { contentType: arq.mime, upsert: true });
    return { url: await linkAssinado(sb, caminho), mime: arq.mime, nome: arq.nome, tipo: tipoDoMime(arq.mime) };
  }
  if (agente === "livia") {
    const { data: m } = await sb.from("livia_mensagens").select("id, telefone, papel, conteudo").eq("id", Number(id)).maybeSingle();
    if (!m) throw new Error("mensagem não encontrada");
    const c: any = m.conteudo || {};
    if (c.crm_arquivo?.caminho) return { url: await linkAssinado(sb, c.crm_arquivo.caminho), mime: c.crm_arquivo.mime, nome: c.crm_arquivo.nome || null, tipo: c.crm_arquivo.tipo };
    if (c.caminho) {
      const { data, error } = await sb.storage.from("livia-midia").createSignedUrl(c.caminho, 3600);
      if (!error && data?.signedUrl) {
        const ext = String(c.caminho).split(".").pop() || "";
        const mime = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : ext === "jpg" ? "image/jpeg" : ext === "ogg" ? "audio/ogg" : "application/octet-stream";
        return { url: data.signedUrl, mime, nome: null, tipo: c.midia === "audio" ? "audio" : tipoDoMime(mime) };
      }
    }
    const cache = await achaCache(sb, "livia", `l${m.id}`);
    if (cache) return { url: await linkAssinado(sb, cache.caminho), mime: cache.mime, nome: null, tipo: tipoDoMime(cache.mime) };
    const key = c.key || (c.msg_id ? { id: c.msg_id, remoteJid: `${telefoneCanonico(m.telefone)}@s.whatsapp.net`, fromMe: m.papel !== "cliente" && m.papel !== "ceo" } : null);
    if (!key) throw new Error("esta mensagem não tem arquivo");
    const arq = await baixarDoWhatsApp(await instanciaLivia(sb), key);
    if (!arq) throw new Error("o WhatsApp não devolveu o arquivo (pode ter expirado)");
    const caminho = `livia/l${m.id}.${extDe(arq.mime)}`;
    await sb.storage.from(BUCKET).upload(caminho, arq.bytes, { contentType: arq.mime, upsert: true });
    return { url: await linkAssinado(sb, caminho), mime: arq.mime, nome: arq.nome, tipo: tipoDoMime(arq.mime) };
  }
  // Sofia
  const { data: m } = await sb.from("sofia_messages").select("id, conversation_id, direction, wa_id").eq("id", Number(id)).maybeSingle();
  if (!m?.wa_id) throw new Error("esta mensagem não tem arquivo");
  const cache = await achaCache(sb, "sofia", m.wa_id);
  if (cache) return { url: await linkAssinado(sb, cache.caminho), mime: cache.mime, nome: null, tipo: tipoDoMime(cache.mime) };
  const { data: conv } = await sb.from("sofia_conversations").select("instance, jid").eq("id", m.conversation_id).maybeSingle();
  if (!conv) throw new Error("conversa não encontrada");
  const arq = await baixarDoWhatsApp(conv.instance, { id: m.wa_id, remoteJid: conv.jid, fromMe: m.direction !== "in" });
  if (!arq) throw new Error("o WhatsApp não devolveu o arquivo (pode ter expirado)");
  const caminho = `sofia/${m.wa_id}.${extDe(arq.mime)}`;
  await sb.storage.from(BUCKET).upload(caminho, arq.bytes, { contentType: arq.mime, upsert: true });
  return { url: await linkAssinado(sb, caminho), mime: arq.mime, nome: arq.nome, tipo: tipoDoMime(arq.mime) };
}

// ---------------------------------------------------------------- validação de entrada
function lerArquivo(a: any): Arquivo | null {
  if (!a || !a.caminho) return null;
  const caminho = String(a.caminho);
  if (!/^envios\/[a-z0-9-]+\.[a-z0-9]{1,6}$/i.test(caminho)) throw new Error("arquivo inválido");
  const mime = String(a.mime || "application/octet-stream").split(";")[0];
  const tipo = (["imagem", "video", "documento", "audio"].includes(a.tipo) ? a.tipo : tipoDoMime(mime)) as Tipo;
  return { caminho, mime, nome: a.nome ? String(a.nome).slice(0, 120) : undefined, tipo };
}

// ---------------------------------------------------------------- disparo das programadas (cron)
async function disparar(sb: SupabaseClient) {
  const { data: fila } = await sb.from("crm_agendadas").select("*").eq("status", "pendente").lte("enviar_em", new Date().toISOString()).order("enviar_em").limit(20);
  const res: any[] = [];
  for (const a of fila || []) {
    // trava: só segue se conseguir passar de pendente para enviando (evita envio duplo)
    const { data: trava } = await sb.from("crm_agendadas").update({ status: "enviando" }).eq("id", a.id).eq("status", "pendente").select("id");
    if (!trava?.length) continue;
    try {
      const d = await destino(sb, a.agente, a.alvo);
      const arq = a.arquivo ? lerArquivo(a.arquivo) : null;
      const r = await enviarAgora(sb, d, String(a.texto || ""), arq);
      await registrar(sb, a.agente, a.alvo, String(a.texto || ""), arq, a.criado_por_nome || "Equipe EXA", a.criado_por, r?.key?.id || null, { pausar: false, programada: true });
      await sb.from("crm_agendadas").update({ status: "enviada", enviada_em: new Date().toISOString(), erro: null }).eq("id", a.id);
      res.push({ id: a.id, ok: true });
    } catch (e) {
      await sb.from("crm_agendadas").update({ status: "erro", erro: (e as Error).message.slice(0, 400) }).eq("id", a.id);
      res.push({ id: a.id, ok: false, erro: (e as Error).message });
    }
  }
  return res;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    // ---- cron
    const cronTok = req.headers.get("x-exa2-cron");
    if (cronTok) {
      const { data: cfg } = await sb.from("exa2_config").select("valor").eq("chave", "cron_token").maybeSingle();
      if (!cfg?.valor || cfg.valor !== cronTok) return json(401, { error: "unauthorized" });
      if (action !== "disparar") return json(400, { error: "ação inválida para o cron" });
      return json(200, { ok: true, enviadas: await disparar(sb) });
    }

    // ---- usuário: só admin
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(jwt);
    if (!u?.user) return json(401, { error: "não autenticado" });
    const { data: papeis } = await sb.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!(papeis || []).some((r: any) => ["admin", "super_admin"].includes(String(r.role)))) return json(403, { error: "sem permissão" });
    const { data: perfil } = await sb.from("users").select("nome, email").eq("id", u.user.id).maybeSingle().then((r) => r, () => ({ data: null }));
    const autor = (perfil as any)?.nome || (perfil as any)?.email || u.user.email || "Equipe EXA";

    const agente = String(body.agente || "");
    if (!["nando", "sofia", "livia"].includes(agente)) return json(400, { error: "agente inválido" });
    // a Lívia guarda o telefone na forma canônica (com o 9): o painel pode mandar sem o 9
    const alvo = agente === "livia" ? canonLivia(String(body.alvo || "")) : String(body.alvo || "");

    // ---- Lívia: lista, mensagens e modo (o envio de texto usa "enviar" como os outros)
    if (agente === "livia" && action === "livia_list") return json(200, { conversas: await liviaLista(sb) });
    if (agente === "livia" && action === "livia_messages") {
      if (!alvo) return json(400, { error: "conversa obrigatória" });
      return json(200, { mensagens: await liviaMensagens(sb, alvo) });
    }
    if (agente === "livia" && action === "livia_set_mode") {
      if (!alvo) return json(400, { error: "conversa obrigatória" });
      const modo = body.modo === "humano" ? "humano" : "auto";
      const humano_ate = modo === "humano" ? new Date(Date.now() + LIVIA_HUMANO_H * 3600e3).toISOString() : null;
      const { error } = await sb.from("livia_estado").upsert({ telefone: alvo, humano_ate, updated_at: new Date().toISOString() }, { onConflict: "telefone" });
      if (error) throw error;
      await sb.from("livia_mensagens").insert({ telefone: alvo, papel: "sistema", conteudo: { texto: modo === "humano" ? `${autor} assumiu a conversa (Lívia pausada por ${LIVIA_HUMANO_H}h)` : `${autor} devolveu a conversa para a Lívia` } });
      return json(200, { ok: true, modo, humano_ate });
    }

    if (action === "midia") return json(200, await abrirMidia(sb, agente, String(body.id || "")));
    if (action === "perfil") return json(200, await perfilAgente(sb, agente));
    if (action === "perfil_atualizar") return json(200, await perfilAtualizar(sb, agente, body));

    // fotos de perfil do WhatsApp das conversas (lista): { alvos: string[] } → { fotos: { [alvo]: url | null } }
    if (action === "fotos") {
      const alvos = (Array.isArray(body.alvos) ? body.alvos : []).map(String).filter(Boolean).slice(0, 60);
      const fotos: Record<string, string | null> = {};
      const fila = [...alvos];
      const trabalhar = async () => {
        while (fila.length) {
          const a = fila.shift()!;
          try {
            const d = await destino(sb, agente, a);
            const j = await evoPost(`/chat/fetchProfilePictureUrl/${encodeURIComponent(d.instancia)}`, { number: d.numero });
            fotos[a] = (j?.profilePictureUrl as string) || null;
          } catch { fotos[a] = null; }
        }
      };
      await Promise.all(Array.from({ length: Math.min(6, alvos.length) }, trabalhar));
      return json(200, { fotos });
    }

    if (action === "upload_url") {
      const mime = String(body.mime || "application/octet-stream").split(";")[0];
      const caminho = `envios/${crypto.randomUUID()}.${extDe(mime)}`;
      const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(caminho);
      if (error) throw error;
      return json(200, { caminho, token: data.token, url: data.signedUrl });
    }

    if (!alvo) return json(400, { error: "conversa obrigatória" });

    if (action === "enviar") {
      const texto = String(body.texto || "").trim();
      const arq = lerArquivo(body.arquivo);
      if (!texto && !arq) return json(400, { error: "mensagem vazia" });
      const d = await destino(sb, agente, alvo);
      const r = await enviarAgora(sb, d, texto, arq);
      await registrar(sb, agente, alvo, texto, arq, autor, u.user.id, r?.key?.id || null, { pausar: true });
      return json(200, { ok: true });
    }

    if (action === "agendar") {
      const texto = String(body.texto || "").trim();
      const arq = lerArquivo(body.arquivo);
      const quando = new Date(String(body.enviar_em || ""));
      if (!texto && !arq) return json(400, { error: "mensagem vazia" });
      if (isNaN(quando.getTime()) || quando.getTime() < Date.now() - 60e3) return json(400, { error: "data/hora inválida ou no passado" });
      if (quando.getTime() > Date.now() + 60 * 86400e3) return json(400, { error: "no máximo 60 dias à frente" });
      const { data, error } = await sb.from("crm_agendadas").insert({
        agente, alvo, texto: texto || null, arquivo: arq, enviar_em: quando.toISOString(), criado_por: u.user.id, criado_por_nome: autor,
      }).select("id, texto, arquivo, enviar_em, status").single();
      if (error) throw error;
      return json(200, { ok: true, agendada: data });
    }

    if (action === "agendadas") {
      const { data } = await sb.from("crm_agendadas").select("id, texto, arquivo, enviar_em, status, erro, criado_por_nome")
        .eq("agente", agente).eq("alvo", alvo).in("status", ["pendente", "enviando", "erro"]).order("enviar_em");
      return json(200, { agendadas: data || [] });
    }

    if (action === "cancelar_agendada") {
      const { error } = await sb.from("crm_agendadas").update({ status: "cancelada" }).eq("id", String(body.id || "")).eq("agente", agente).in("status", ["pendente", "erro"]);
      if (error) throw error;
      return json(200, { ok: true });
    }

    if (action === "notas") {
      const { data } = await sb.from("crm_notas").select("id, texto, autor, created_at").eq("agente", agente).eq("alvo", alvo).order("created_at", { ascending: false }).limit(100);
      return json(200, { notas: data || [] });
    }
    if (action === "nota") {
      const texto = String(body.texto || "").trim().slice(0, 4000);
      if (!texto) return json(400, { error: "nota vazia" });
      const { data, error } = await sb.from("crm_notas").insert({ agente, alvo, texto, autor, autor_id: u.user.id }).select("id, texto, autor, created_at").single();
      if (error) throw error;
      return json(200, { ok: true, nota: data });
    }

    return json(400, { error: "ação desconhecida" });
  } catch (e) {
    console.error("[exa2-crm-chat]", (e as Error).message);
    return json(500, { error: (e as Error).message });
  }
});
