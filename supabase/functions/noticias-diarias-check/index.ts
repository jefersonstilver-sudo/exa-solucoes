// Guardião + resumo das notícias diárias das telas (Notícias Brasil, Notícias Foz, Curiosidades).
//
// 1) REGISTRAR (chamado pela automação do PC depois de cada publicação):
//    POST {acao:"registrar", token, tipo:"brasil"|"foz"|"curiosidades", titulo, itens:[{titulo,url?,cat?}]}
//    → grava em public.noticias_diarias (só service role lê/escreve; token conferido por hash).
// 2) RESUMO (pg_cron 07:30 e 16:30 de Brasília):
//    POST {turno:"manha"|"tarde"} → confere o vídeo PRINCIPAL de cada pedido editorial e manda para o CEO,
//    pelo WhatsApp da Sofia, o status (✅/❌) + todas as manchetes que foram ao ar.
//    Manhã: os 3 precisam ter subido hoje. Tarde: Brasil e Foz precisam ter subido depois das 16:00
//    (rodada da tarde); Curiosidades só roda de manhã.
//    ?dry=1 ou {dry:true} → só devolve o diagnóstico e o texto, não envia.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PEDIDOS = [
  { tipo: "brasil", nome: "Notícias Brasil", id: "c08f3154-e0dc-4c39-b8a2-721d8acdde7f", tarde: true },
  { tipo: "foz", nome: "Notícias Foz", id: "9cb8da99-ddb3-491c-b58c-63871eadc4cb", tarde: true },
  { tipo: "curiosidades", nome: "Curiosidades", id: "7a4dc868-0ecd-4969-a1ec-5589d399b7c4", tarde: false },
];
const CEO = Deno.env.get("CEO_WHATSAPP") || "5545998090000";
const SOFIA_NUMERO = "45991415920";
// sha256 da chave que fica no .env do PC (NOTICIAS_TOKEN). A chave em si não fica no código.
const TOKEN_HASH = "88ad2874bd889f53afd9658d7501cef648cf70b831d6f0ad280da2da8975fb47";

const BR = 3 * 3600e3; // Brasília = UTC-3
function hojeBR(hora = 0) {
  const b = new Date(Date.now() - BR);
  return new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate(), hora + 3, 0, 0));
}
const hhmm = (iso: string | null) => iso ? new Date(new Date(iso).getTime() - BR).toISOString().slice(11, 16).replace(":", "h") : "—";
const ddmm = (iso: string | null) => iso ? new Date(new Date(iso).getTime() - BR).toISOString().slice(5, 10).split("-").reverse().join("/") : "—";
async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function instanciaSofia(sb: any): Promise<string | null> {
  const env = Deno.env.get("SOFIA_INSTANCIA"); if (env) return env;
  const { data } = await sb.from("evolution_instances").select("instance_name, owner_jid, collaborator_phone, status");
  const lista = (data || []) as any[];
  const porNumero = lista.find(i => `${i.owner_jid || ""} ${i.collaborator_phone || ""}`.replace(/\D/g, "").includes(SOFIA_NUMERO));
  const porNome = lista.find(i => /sofia/i.test(i.instance_name || ""));
  return (porNumero || porNome)?.instance_name || null;
}
async function enviarWhatsApp(sb: any, texto: string) {
  const url = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
  const key = Deno.env.get("EVOLUTION_API_KEY") || "";
  if (!url || !key) throw new Error("EVOLUTION_API_URL/KEY ausentes");
  const inst = await instanciaSofia(sb);
  if (!inst) throw new Error("instância da Sofia não encontrada (defina SOFIA_INSTANCIA)");
  const r = await fetch(`${url}/message/sendText/${inst}`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ number: CEO, text: texto, linkPreview: false }),
  });
  if (!r.ok) throw new Error(`Evolution sendText ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return inst;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const u = new URL(req.url);
    let body: any = {}; try { body = await req.json(); } catch { /* sem corpo */ }

    // ---------- 1) registrar o conteúdo publicado ----------
    if (body.acao === "registrar") {
      if (!body.token || (await sha256(String(body.token))) !== TOKEN_HASH) return json({ ok: false, erro: "token inválido" }, 401);
      const tipo = String(body.tipo || "");
      if (!PEDIDOS.some(p => p.tipo === tipo)) return json({ ok: false, erro: "tipo inválido" }, 400);
      const itens = (Array.isArray(body.itens) ? body.itens : []).slice(0, 10).map((i: any) => ({
        titulo: String(i.titulo || "").slice(0, 220), url: i.url ? String(i.url).slice(0, 400) : null, cat: i.cat ? String(i.cat).slice(0, 40) : null }));
      const { error } = await sb.from("noticias_diarias").insert({ tipo, titulo: String(body.titulo || "").slice(0, 120), itens });
      if (error) throw error;
      return json({ ok: true, registrado: itens.length });
    }

    // ---------- 2) resumo + proteção ----------
    const turno = (body.turno || u.searchParams.get("turno") || (new Date(Date.now() - BR).getUTCHours() >= 12 ? "tarde" : "manha")) === "tarde" ? "tarde" : "manha";
    const dry = u.searchParams.get("dry") === "1" || body.dry === true;
    const inicioDia = hojeBR(0), inicioTarde = hojeBR(16);

    const blocos: string[] = [], status = [];
    for (const p of PEDIDOS) {
      const { data, error } = await sb.from("pedido_videos")
        .select("created_at, approval_status, videos(nome, created_at)")
        .eq("pedido_id", p.id).eq("is_active", true).order("created_at", { ascending: false }).limit(1);
      if (error) throw error;
      const v = (data || [])[0] as any;
      const quando: string | null = v?.videos?.created_at || v?.created_at || null;
      const limite = turno === "tarde" && p.tarde ? inicioTarde : inicioDia;
      const ok = !!quando && new Date(quando) >= limite && v?.approval_status !== "rejected";

      const { data: reg } = await sb.from("noticias_diarias").select("titulo, itens, criado_em")
        .eq("tipo", p.tipo).gte("criado_em", inicioDia.toISOString()).order("criado_em", { ascending: false }).limit(1);
      const r = (reg || [])[0] as any;
      status.push({ tipo: p.tipo, ok, ultimo_video: quando, titulo_video: v?.videos?.nome || null, resumo_registrado: !!r });

      const cab = ok ? `✅ *${p.nome}* — no ar desde ${hhmm(quando)}`
        : `❌ *${p.nome}* — NÃO subiu ${turno === "tarde" && p.tarde ? "na rodada das 16h" : "hoje"} (no ar: vídeo de ${ddmm(quando)} ${hhmm(quando)})`;
      const lista = r && Array.isArray(r.itens) && r.itens.length
        ? r.itens.map((i: any, k: number) => `   ${k + 1}. ${i.cat ? `[${i.cat}] ` : ""}${i.titulo}`).join("\n")
        : (ok ? "   (conteúdo não registrado pela automação)" : "");
      blocos.push(lista ? `${cab}\n${lista}` : cab);
    }

    const pendentes = status.filter(s => !s.ok).length;
    const titulo = turno === "manha" ? "☀️ *Notícias das telas — manhã*" : "🌆 *Notícias das telas — tarde*";
    const rodape = pendentes
      ? `\n⚠️ ${pendentes} vídeo(s) não subiram. Provável causa: PC das notícias desligado ou falha na automação.\n👉 No PC, pasta scripts\\noticias-dooh → dois cliques em *GERAR NOTICIAS AGORA.bat* (15–25 min). Até lá as telas seguem com os vídeos anteriores.`
      : "\nTudo no ar. Se algo estiver errado em alguma manchete, me avise.";
    const texto = `Jeferson, aqui é a Sofia.\n${titulo} · ${ddmm(new Date().toISOString())}\n\n${blocos.join("\n\n")}\n${rodape}`;

    let instancia: string | null = null;
    if (!dry) instancia = await enviarWhatsApp(sb, texto);
    return json({ ok: true, turno, pendentes, status, enviado: !dry, instancia, texto });
  } catch (e) {
    console.error("[NOTICIAS-CHECK] erro:", (e as Error).message);
    return json({ ok: false, erro: (e as Error).message }, 500);
  }
});
