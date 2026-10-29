// =====================================================================
// EXA 2.0 · Chat do CRM (Nando e Sofia) — complementa nando-crm e sofia-panel (que continuam
// cuidando de lista, mensagens de texto, assumir/devolver). Aqui ficam:
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
  const { data: conv } = await sb.from("sofia_conversations").select("id, instance, jid").eq("id", alvo).maybeSingle();
  if (!conv) throw new Error("conversa da Sofia não encontrada");
  return { instancia: conv.instance, numero: String(conv.jid).replace(/@.*/, ""), jid: conv.jid };
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
    if (!["nando", "sofia"].includes(agente)) return json(400, { error: "agente inválido" });
    const alvo = String(body.alvo || "");

    if (action === "midia") return json(200, await abrirMidia(sb, agente, String(body.id || "")));

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
