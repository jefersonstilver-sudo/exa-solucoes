// LÍVIA — conversa: contexto do número, histórico para o Claude (com mídias), resposta e tarefas de rotina.
import {
  DB, BUCKET, ehCeo, ehTestador, config, falar, enviarDigitando, baixarMidia, b64ParaBytes, transcreverAudio, avisarCeo, clienteDoTelefone,
} from "./livia-core.ts";
import { Contexto, rodarAgente } from "./livia-agente.ts";

export async function contexto(sb: DB, tel: string, pushName = ""): Promise<Contexto> {
  const ceo = ehCeo(tel);
  const q = ceo || tel.startsWith("lid:") ? { nome: "", empresa: "", pedidos: [] } : await clienteDoTelefone(sb, tel);
  return { sb, tel, ceo, nome: ceo ? "Jeferson" : (q.nome || pushName), empresa: q.empresa, pedidos: q.pedidos, midias: {}, registros: [] };
}

/** Histórico da conversa no formato do Claude (as mensagens novas vêm com as mídias). */
export async function montarMensagens(sb: DB, c: Contexto) {
  const desde = new Date(Date.now() - 10 * 86400e3).toISOString();
  const { data: hist } = await sb.from("livia_mensagens").select("*").eq("telefone", c.tel).gte("created_at", desde).order("id", { ascending: false }).limit(c.ceo ? 50 : 40);
  const linhas = (hist || []).reverse();
  let ate = 0;
  for (const l of linhas) if ((l.papel === "livia" || l.papel === "humano") && Number(l.conteudo?.ate) > ate) ate = Number(l.conteudo.ate);
  const entrada = c.ceo ? "ceo" : "cliente";
  const novas = linhas.filter((l: any) => l.papel === entrada && (ate ? l.id > ate : true) && !linhas.some((x: any) => x.papel === "livia" && x.id > l.id));
  const msgs: any[] = [];
  const push = (role: string, content: any) => {
    const u = msgs[msgs.length - 1];
    if (u && u.role === role) { const a = Array.isArray(u.content) ? u.content : [{ type: "text", text: u.content }]; const b = Array.isArray(content) ? content : [{ type: "text", text: content }]; u.content = [...a, ...b]; }
    else msgs.push({ role, content });
  };
  for (const l of linhas) {
    const k = l.conteudo || {};
    if (l.papel === "livia") push("assistant", String(k.texto || "(ok)").slice(0, 2500));
    else if (l.papel === "humano") push("assistant", `(mensagem enviada pelo Jeferson pelo meu número, não por mim): ${String(k.texto || "").slice(0, 2000)}`);
    else if (l.papel === "sistema") push("assistant", `(registro interno do que consultei/fiz: ${String(k.texto || "").slice(0, 2500)})`);
    else if (!novas.includes(l)) push("user", [k.midia ? `[${k.midia} enviado${k.midia_id ? ", midia_id=" + k.midia_id : ""}]` : "", k.texto || ""].filter(Boolean).join("\n") || "(mensagem)");
  }
  const blocos: any[] = [];
  for (const l of novas) {
    const k = l.conteudo || {};
    const bruta = k.mensagem || {};
    const tam = Number(bruta.documentMessage?.fileLength || bruta.documentWithCaptionMessage?.message?.documentMessage?.fileLength || bruta.imageMessage?.fileLength || bruta.audioMessage?.fileLength || bruta.videoMessage?.fileLength || 0);
    if (k.midia && k.key && (k.midia === "video" || k.midia === "figurinha" || tam > 12_000_000)) {
      await sb.from("livia_mensagens").update({ conteudo: { ...k, key: undefined, mensagem: undefined } }).eq("id", l.id);
      blocos.push({ type: "text", text: k.midia === "video" ? "[vídeo recebido — você não abre vídeo; se for comprovante, peça print ou PDF]" : `[${k.midia} recebido, grande demais para abrir]` });
    } else if (k.midia && k.key) {
      const m = await baixarMidia(sb, k.key);
      if (!m) blocos.push({ type: "text", text: `[${k.midia} recebido, mas não consegui abrir — peça para mandar de novo]` });
      else {
        const id = "m" + l.id; const mime = m.mime.split(";")[0];
        const ext = mime.includes("pdf") ? "pdf" : mime.includes("png") ? "png" : mime.includes("jp") ? "jpg" : (mime.split("/")[1] || "bin");
        const caminho = `recebidas/${c.tel.replace(/\W/g, "")}/${id}.${ext}`;
        const bytes = b64ParaBytes(m.base64);
        await sb.storage.from(BUCKET).upload(caminho, bytes, { contentType: mime, upsert: true });
        c.midias[id] = { mime, caminho, url: "" };
        let txt = k.texto || "";
        if (mime.startsWith("audio/") || k.midia === "audio") {
          const t = await transcreverAudio(m.base64, mime);
          txt = t ? `[áudio transcrito]: ${t}` : "[áudio recebido, a transcrição falhou — peça para escrever]";
          blocos.push({ type: "text", text: txt });
        } else if (mime.startsWith("image/") && bytes.length < 4_500_000) {
          blocos.push({ type: "image", source: { type: "base64", media_type: mime, data: m.base64 } });
          blocos.push({ type: "text", text: `[imagem recebida: midia_id=${id}]` });
        } else if (mime.includes("pdf") && bytes.length < 9_000_000) {
          blocos.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: m.base64 } });
          blocos.push({ type: "text", text: `[PDF recebido: midia_id=${id}]` });
        } else blocos.push({ type: "text", text: `[arquivo ${mime} recebido: midia_id=${id}]` });
        await sb.from("livia_mensagens").update({ conteudo: { ...k, texto: txt || k.texto, midia_id: id, caminho, key: undefined, mensagem: undefined } }).eq("id", l.id);
        if (k.texto && !txt.startsWith("[áudio")) blocos.push({ type: "text", text: k.texto });
        continue;
      }
    }
    if (k.texto) blocos.push({ type: "text", text: k.texto });
  }
  return { msgs, blocos, push };
}

export async function responder(sb: DB, tel: string, minha: number, pushName: string) {
  // Jeferson assumiu a conversa pelo celular: a Lívia só registra
  const { data: est } = await sb.from("livia_estado").select("humano_ate").eq("telefone", tel).maybeSingle();
  if (est?.humano_ate && new Date(est.humano_ate).getTime() > Date.now()) return;
  const c = await contexto(sb, tel, pushName);
  const { msgs, blocos, push } = await montarMensagens(sb, c);
  if (!blocos.length) return;
  push("user", blocos);
  if (msgs[0]?.role !== "user") msgs.unshift({ role: "user", content: "(início da conversa)" });
  await enviarDigitando(sb, tel, 2500);
  const resposta = await rodarAgente(c, msgs);
  if (c.registros.length) await sb.from("livia_mensagens").insert({ telefone: tel, papel: "sistema", conteudo: { texto: c.registros.join("\n") } });
  const entrada = c.ceo ? "ceo" : "cliente";
  const { data: depois } = await sb.from("livia_mensagens").select("id").eq("telefone", tel).eq("papel", entrada).gt("id", minha).limit(1);
  if (depois?.length) { await sb.from("livia_mensagens").insert({ telefone: tel, papel: "sistema", conteudo: { texto: "(resposta descartada: chegou mensagem nova antes do envio)", ate: minha } }); return; }
  if (!resposta || /^\s*\[sil[eê]ncio\]\s*$/i.test(resposta)) { await sb.from("livia_mensagens").insert({ telefone: tel, papel: "sistema", conteudo: { texto: "(sem resposta: só confirmação/agradecimento)", ate: minha } }); return; }
  await falar(sb, tel, resposta, { ate: minha });
}

/** Rotina/passagem: a Lívia age sem mensagem nova do cliente. Exportado no mesmo formato para a livia-cron. */
export async function rodarTarefa(sb: DB, tel: string, tarefa: string): Promise<boolean> {
  const cfg = await config(sb, true);
  if (!ehCeo(tel) && (cfg.ligada !== "1" || (cfg.modo_teste === "1" && !(await ehTestador(sb, tel))))) {
    await avisarCeo(sb, `↪️ Passagem para a Lívia (+${tel}), mas ela está em ${cfg.ligada !== "1" ? "pausa" : "modo teste"}: ${tarefa.slice(0, 500)}`);
    return false;
  }
  const c = await contexto(sb, tel); c.tarefa = tarefa;
  const { msgs, push } = await montarMensagens(sb, c);
  push("user", "(rotina interna: siga a TAREFA DESTA RODADA)");
  if (msgs[0]?.role !== "user") msgs.unshift({ role: "user", content: "(início)" });
  const resposta = await rodarAgente(c, msgs);
  if (c.registros.length) await sb.from("livia_mensagens").insert({ telefone: tel, papel: "sistema", conteudo: { texto: "[tarefa] " + tarefa.slice(0, 300) + "\n" + c.registros.join("\n") } });
  if (resposta && !/^\s*\[sil[eê]ncio\]\s*$/i.test(resposta)) await falar(sb, tel, resposta, { tarefa: true });
  return true;
}
