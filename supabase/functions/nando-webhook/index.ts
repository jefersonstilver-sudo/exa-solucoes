// =====================================================================
// NANDO - webhook do WhatsApp (instancia do Nando no CRM Evolution).
// Recebe MESSAGES_UPSERT, junta as mensagens que chegam em sequencia,
// identifica quem e (sindico / administradora / Jeferson) e responde com o Claude.
// GET ?action=setup  -> registra este endpoint como webhook da instancia do Nando (so admin do site).
// =====================================================================
import {
  db, ehAdmin, prediosDoTelefone, telefoneCanonico, enviarTexto, enviarDigitando, baixarMidia, instanciaNando, transcreverAudio,
  MODO_TESTE, registrarOcorrencia, primeiroNome, todosPredios, NANDO_VERSAO, enviarImagem, chavesTelefone, CADASTRO_ABERTO,
} from "../_shared/nando-core.ts";
import { Contexto, rodarAgente } from "../_shared/nando-agente.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const ESPERA_MS = 6000;          // junta mensagens enviadas em sequencia
const BUCKET = "nando-midia";

function textoDa(m: any): string {
  if (!m) return "";
  return String(
    m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.documentMessage?.caption ||
    m.documentWithCaptionMessage?.message?.documentMessage?.caption || m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText || m.listResponseMessage?.title || "",
  ).trim();
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

async function setup(req: Request) {
  // so administradores do site podem registrar o webhook
  const auth = req.headers.get("Authorization") || "";
  const sb = db();
  const { data: u } = await sb.auth.getUser(auth.replace("Bearer ", ""));
  if (!u?.user) return json(401, { error: "login necessario" });
  const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", u.user.id);
  if (!(roles || []).some((r: any) => ["super_admin", "admin"].includes(r.role))) return json(403, { error: "sem permissao" });
  const evoUrl = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
  const evoKey = Deno.env.get("EVOLUTION_API_KEY") || "";
  const inst = await instanciaNando(sb);
  const alvo = `${Deno.env.get("SUPABASE_URL")}/functions/v1/nando-webhook`;
  const r = await fetch(`${evoUrl}/webhook/set/${inst}`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: evoKey },
    body: JSON.stringify({ webhook: { enabled: true, url: alvo, webhookByEvents: false, webhookBase64: false, events: ["MESSAGES_UPSERT"] } }),
  });
  return json(r.ok ? 200 : 502, { instancia: inst, url: alvo, status: r.status, resposta: (await r.text()).slice(0, 300) });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "setup") return await setup(req);
  // fotos dos avisos prontas (robo do GitHub): so com a chave de servico
  if (url.searchParams.get("action") === "fotos") {
    if ((req.headers.get("Authorization") || "") !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) return json(401, { erro: "nao autorizado" });
    const b = await req.json().catch(() => ({}));
    const imagens: string[] = Array.isArray(b.imagens) ? b.imagens.slice(0, 5) : [];
    const sbF = db();
    const telF = telefoneCanonico(String(b.telefone || ""));
    // robo falhou: fica registrado (e o sindico fica sabendo, em vez de esperar para sempre)
    if (b.erro) {
      console.error("[NANDO] robo da imagem falhou:", b.erro);
      await sbF.from("nando_mensagens").insert({ telefone: telF, papel: "sistema", conteudo: { texto: `robô da imagem para WhatsApp FALHOU: ${String(b.erro).slice(0, 500)}` } });
      if (!b.teste) await enviarTexto(sbF, telF, "Não consegui gerar a imagem do aviso agora. 😕 Já avisei a equipe da EXA; se quiser, tente pedir de novo daqui a pouco.").catch(() => {});
      return json(200, { ok: true, registrado: true });
    }
    if (b.teste) {
      await sbF.from("nando_mensagens").insert({ telefone: telF, papel: "sistema", conteudo: { texto: `teste do robô da imagem OK (nada enviado): ${imagens.join(" ")}` } });
      return json(200, { ok: true, teste: true, imagens });
    }
    for (let i = 0; i < imagens.length; i++) await enviarImagem(sbF, telF, imagens[i], i === 0 ? String(b.legenda || "") : "");
    if (imagens.length) await sbF.from("nando_mensagens").insert({ telefone: telF, papel: "nando", conteudo: { texto: `(enviei ${imagens.length} imagem(ns) do aviso no formato de celular, para encaminhar nos grupos)` } });
    return json(200, { ok: true, enviadas: imagens.length });
  }
  if (url.searchParams.get("action") === "versao") return json(200, { versao: NANDO_VERSAO, modo_teste: MODO_TESTE, cobranca: (Deno.env.get("NANDO_COBRANCA") || "false").toLowerCase() === "true" });
  if (req.method !== "POST") return json(405, { error: "metodo" });

  let payload: any;
  try { payload = await req.json(); } catch { return json(400, { error: "json" }); }
  const evento = String(payload.event || "").toLowerCase();
  if (evento && !evento.includes("messages.upsert") && !evento.includes("messages_upsert")) return json(200, { ignorado: "evento" });

  const sb = db();
  // so aceita eventos da instancia do Nando
  const inst = await instanciaNando(sb);
  if (payload.instance && payload.instance !== inst) return json(200, { ignorado: "instancia" });

  const d = payload.data || {};
  const key = d.key || {};
  if (key.fromMe) return json(200, { ignorado: "fromMe" });
  const jid = String(key.remoteJid || "");
  if (jid.endsWith("@g.us") || jid.includes("status@broadcast")) return json(200, { ignorado: "grupo" });
  const bruto = key.remoteJidAlt || key.senderPn || (!jid.includes("@lid") ? jid : "") || d.sender || "";
  const tel = telefoneCanonico(String(bruto).replace(/@.*/, ""));
  if (!tel || tel.length < 12) return json(200, { ignorado: "telefone", jid });

  const msgId = String(key.id || crypto.randomUUID());
  const texto = textoDa(d.message);
  const midia = tipoMidia(d.message);
  if (!texto && !midia) return json(200, { ignorado: "vazio" });

  // evita processar a mesma mensagem duas vezes
  const { data: repetida } = await sb.from("nando_mensagens").select("id").eq("telefone", tel).eq("conteudo->>msg_id", msgId).limit(1);
  if (repetida?.length) return json(200, { ignorado: "repetida" });
  const { data: salva } = await sb.from("nando_mensagens").insert({
    telefone: tel, papel: "sindico",
    conteudo: { msg_id: msgId, texto, midia, nome_whatsapp: d.pushName || null, key: midia ? key : undefined, mensagem: midia ? d.message : undefined },
  }).select("id").single();

  // responde rapido para a Evolution e trabalha em segundo plano
  const tarefa = processar(tel, salva?.id || 0, d.pushName || "").catch(async (e) => {
    console.error("[NANDO] falha", e);
    try {
      await enviarTexto(sb, tel, "Opa, tive um probleminha aqui agora 😅 Já avisei o pessoal da EXA. Pode me mandar de novo daqui a pouco?");
      await registrarOcorrencia(sb, { tipo: "erro", telefone: tel, descricao: `Erro interno do Nando: ${(e as Error).message}` });
    } catch (_) { /* nada */ }
  });
  // @ts-ignore EdgeRuntime existe no Supabase
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(tarefa); else await tarefa;
  return json(200, { ok: true });
});

async function processar(tel: string, minhaMsg: number, pushName: string) {
  const sb = db();
  await new Promise((r) => setTimeout(r, ESPERA_MS));
  // se chegou outra mensagem depois desta, a ultima e quem responde (junta tudo)
  const { data: ultima } = await sb.from("nando_mensagens").select("id").eq("telefone", tel).eq("papel", "sindico")
    .order("id", { ascending: false }).limit(1).single();
  if (ultima && ultima.id !== minhaMsg) return;

  // uma resposta por vez para cada pessoa: se o Nando ainda esta respondendo a mensagem anterior,
  // espera ele terminar (senao as duas respostas fazem o mesmo trabalho em dobro)
  for (let i = 0; i < 50; i++) {
    const { data: livre, error } = await sb.rpc("nando_pegar_trava", { p_tel: tel, p_segundos: 170 });
    if (error || livre) break;   // sem a funcao no banco: segue como antes
    await new Promise((r) => setTimeout(r, 3000));
    const { data: nova } = await sb.from("nando_mensagens").select("id").eq("telefone", tel).eq("papel", "sindico")
      .order("id", { ascending: false }).limit(1).single();
    if (nova && nova.id !== minhaMsg) return;   // chegou outra mensagem: ela responde por esta tambem
  }
  try {
    await responder(sb, tel, minhaMsg, pushName);
  } finally {
    await sb.rpc("nando_soltar_trava", { p_tel: tel }).then(() => {}, () => {});
  }
}

// modo teste: alem do Jeferson, so os numeros da lista "testadores" (nando_config) sao atendidos, como sindicos normais
async function ehTestador(sb: ReturnType<typeof db>, tel: string): Promise<boolean> {
  const { data } = await sb.from("nando_config").select("valor").eq("chave", "testadores").maybeSingle();
  const lista = String(data?.valor || "").split(/[,;\s]+/).filter(Boolean);
  return lista.some((n) => chavesTelefone(n).some((k) => chavesTelefone(tel).includes(k)));
}

async function responder(sb: ReturnType<typeof db>, tel: string, minhaMsg: number, pushName: string) {
  const admin = ehAdmin(tel);
  const { predios, nome } = await prediosDoTelefone(sb, tel);
  // modo teste: so admin e testadores; com NANDO_CADASTRO_ABERTO=true, numeros sem cadastro tambem (cadastro de predio interessado)
  const semCadastroLiberado = CADASTRO_ABERTO && !predios.length;
  if (MODO_TESTE && !admin && !semCadastroLiberado && !(await ehTestador(sb, tel))) { console.log("[NANDO] modo teste: ignorando", tel); return; }

  // atendimento assumido por alguem da EXA pelo CRM: o Nando so registra, nao responde
  const { data: atend } = await sb.from("nando_atendimento").select("modo, humano_ate").eq("telefone", tel).maybeSingle()
    .then((r) => r, () => ({ data: null }));
  if (atend?.modo === "humano" && (!atend.humano_ate || new Date(atend.humano_ate).getTime() > Date.now())) {
    console.log("[NANDO] atendimento humano: sem resposta automatica", tel);
    return;
  }

  // estado da conversa (predio escolhido)
  const { data: est } = await sb.from("nando_estado").select("*").eq("telefone", tel).maybeSingle();
  let predioAtual = null;
  const lista = admin ? await todosPredios(sb) : predios;
  if (est?.building_id) predioAtual = lista.find((p) => p.id === est.building_id) || null;
  if (!predioAtual && !admin && predios.length === 1) predioAtual = predios[0];

  // predio pausado pela equipe EXA
  if (predioAtual && !admin) {
    const { data: perf } = await sb.from("nando_predio_perfil").select("pausado").eq("building_id", predioAtual.id).maybeSingle();
    if (perf?.pausado) {
      await enviarTexto(sb, tel, `Oi${nome ? ", " + primeiroNome(nome) : ""}! No momento os avisos do ${predioAtual.nome} estão sendo ajustados pela equipe da EXA. Já já eu volto, tá? 🙏`);
      return;
    }
  }

  const ctx: Contexto = {
    sb, tel, nomePessoa: admin ? "Jeferson" : (nome || pushName || ""), admin, predios, predioAtual, midias: {}, registros: [],
  };

  // historico recente (7 dias) -> mensagens para o Claude
  // numero sem cadastro: so a conversa recente (2 h), para nao tomar como verdade o que alguem disse antes
  const desde = new Date(Date.now() - (admin || predios.length ? 7 * 86400000 : 2 * 3600000)).toISOString();
  const { data: hist } = await sb.from("nando_mensagens").select("*").eq("telefone", tel).gte("created_at", desde)
    .order("id", { ascending: false }).limit(40);
  const linhas = (hist || []).reverse();
  // as mensagens novas (ainda nao respondidas): as do sindico depois da ultima que o Nando respondeu
  let ate = 0;
  // resposta do Nando OU de um humano da EXA (CRM) encerra as mensagens anteriores do sindico
  for (const l of linhas) if ((l.papel === "nando" || l.papel === "humano") && Number(l.conteudo?.ate) > ate) ate = Number(l.conteudo.ate);
  let novas: any[];
  if (ate) novas = linhas.filter((l: any) => l.papel === "sindico" && l.id > ate);
  else {
    let iUlt = -1;
    linhas.forEach((l: any, i: number) => { if (l.papel === "nando" || l.papel === "humano") iUlt = i; });
    novas = linhas.slice(iUlt + 1).filter((l: any) => l.papel === "sindico");
  }

  const msgs: any[] = [];
  const push = (role: string, content: any) => {
    const ult = msgs[msgs.length - 1];
    if (ult && ult.role === role) {
      const a = Array.isArray(ult.content) ? ult.content : [{ type: "text", text: ult.content }];
      const b = Array.isArray(content) ? content : [{ type: "text", text: content }];
      ult.content = [...a, ...b];
    } else msgs.push({ role, content });
  };
  for (const l of linhas) {
    const c = l.conteudo || {};
    if (l.papel === "nando") push("assistant", String(c.texto || "").slice(0, 2000) || "(ok)");
    else if (l.papel === "humano") push("assistant", `(resposta enviada por ${c.autor || "uma pessoa da equipe EXA"}, não por mim): ${String(c.texto || "").slice(0, 2000)}`);
    else if (l.papel === "sistema") push("assistant", `(registro interno do que consultei/fiz: ${String(c.texto || "").slice(0, 2500)})`);
    else if (!novas.includes(l)) {
      const anexo = c.midia && c.midia !== "audio" ? `[${c.midia} enviada${c.midia_id ? `, midia_id=${c.midia_id} (use ver_arquivo para ler de novo)` : ""}]` : "";
      push("user", [anexo, c.texto || ""].filter(Boolean).join("\n") || "(mensagem)");
    }
  }
  // mensagens novas, com as midias anexadas para o Claude ver
  const blocos: any[] = [];
  for (const l of novas) {
    const c = l.conteudo || {};
    if (c.midia && c.key) {
      const m = await baixarMidia(sb, { key: c.key });
      if (m) {
        const id = `m${l.id}`;
        const ext = m.mime.includes("pdf") ? "pdf" : m.mime.includes("png") ? "png" : m.mime.includes("jpeg") || m.mime.includes("jpg") ? "jpg" : (m.mime.split("/")[1] || "bin").split(";")[0];
        const caminho = `recebidas/${id}.${ext}`;
        const bytes = Uint8Array.from(atob(m.base64), (ch) => ch.charCodeAt(0));
        await sb.storage.from(BUCKET).upload(caminho, bytes, { contentType: m.mime.split(";")[0], upsert: true });
        const urlPub = sb.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
        ctx.midias[id] = { mime: m.mime.split(";")[0], caminho, url: urlPub };
        await sb.from("nando_mensagens").update({ conteudo: { ...c, midia_id: id, key: undefined, mensagem: undefined } }).eq("id", l.id);
        if (m.mime.startsWith("image/") && bytes.length < 4_500_000) {
          blocos.push({ type: "image", source: { type: "base64", media_type: m.mime.split(";")[0], data: m.base64 } });
          blocos.push({ type: "text", text: `[foto recebida: midia_id=${id}]` });
        } else if (m.mime.includes("pdf") && bytes.length < 9_000_000) {
          blocos.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: m.base64 } });
          blocos.push({ type: "text", text: `[PDF recebido: midia_id=${id}]` });
        } else if (c.midia === "audio" || m.mime.startsWith("audio/")) {
          const dica = [...(ctx.predios || []).map((p) => p.nome), ctx.predioAtual?.nome || ""].join(", ");
          const txt = await transcreverAudio(m.base64, m.mime, dica ? `Prédios citados: ${dica}.` : "");
          if (txt) {
            await sb.from("nando_mensagens").update({ conteudo: { ...c, texto: `[áudio transcrito]: ${txt}`, midia_id: id, key: undefined, mensagem: undefined } }).eq("id", l.id);
            blocos.push({ type: "text", text: `[áudio transcrito]: ${txt}` });
          } else {
            blocos.push({ type: "text", text: "[áudio recebido, mas a transcrição falhou – peça com gentileza para repetir ou escrever]" });
          }
        } else {
          blocos.push({ type: "text", text: `[${c.midia} recebido (${m.mime}) – só imagens e PDF viram aviso]` });
        }
      } else blocos.push({ type: "text", text: `[${c.midia} recebido, mas não consegui baixar]` });
    }
    if (c.texto) blocos.push({ type: "text", text: c.texto });
  }
  if (!blocos.length) return;
  push("user", blocos);
  if (msgs[0]?.role !== "user") msgs.unshift({ role: "user", content: "(início da conversa)" });

  await enviarDigitando(sb, tel, 2500);
  const resposta = await rodarAgente(ctx, msgs);

  if (ctx.registros.length) await sb.from("nando_mensagens").insert({ telefone: tel, building_id: ctx.predioAtual?.id || null, papel: "sistema", conteudo: { texto: ctx.registros.join("\n") } });
  if (!resposta) return;
  // ate 3 mensagens curtas, com "digitando" entre elas
  const partes = resposta.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const envio = partes.length > 3 ? [partes.slice(0, partes.length - 2).join("\n\n"), ...partes.slice(-2)] : partes;
  for (let i = 0; i < envio.length; i++) {
    if (i) { await enviarDigitando(sb, tel, 1200); await new Promise((r) => setTimeout(r, 900)); }
    await enviarTexto(sb, tel, envio[i]);
  }
  await sb.from("nando_mensagens").insert({ telefone: tel, building_id: ctx.predioAtual?.id || null, papel: "nando", conteudo: { texto: resposta, ate: minhaMsg } });
}
