// Guardião das notícias diárias das telas (Notícias Brasil, Notícias Foz, Curiosidades).
// Roda todo dia às 07:30 (Brasília) via pg_cron. Para cada pedido editorial, confere se o vídeo
// PRINCIPAL (is_active) foi publicado HOJE. Se algum não subiu, a Sofia avisa o CEO no WhatsApp.
// Os vídeos são gerados pela automação no PC do CEO (scripts/noticias-dooh); se o PC estava
// desligado ou a automação falhou, este aviso é a proteção.
//
// GET/POST ?dry=1   → só devolve o diagnóstico, não envia WhatsApp
// POST {"forcar":true} → envia o resumo mesmo se estiver tudo OK (teste)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

const PEDIDOS = [
  { nome: "Notícias Brasil", id: "c08f3154-e0dc-4c39-b8a2-721d8acdde7f" },
  { nome: "Notícias Foz", id: "9cb8da99-ddb3-491c-b58c-63871eadc4cb" },
  { nome: "Curiosidades", id: "7a4dc868-0ecd-4969-a1ec-5589d399b7c4" },
];
const CEO = Deno.env.get("CEO_WHATSAPP") || "5545998090000";
const SOFIA_NUMERO = "45991415920";

// início de "hoje" em Brasília (UTC-3, sem horário de verão)
function inicioDeHojeBrasilia(agora = new Date()) {
  const br = new Date(agora.getTime() - 3 * 3600e3);
  return new Date(Date.UTC(br.getUTCFullYear(), br.getUTCMonth(), br.getUTCDate(), 3, 0, 0));
}
const fmt = (iso: string | null) => iso ? new Date(new Date(iso).getTime() - 3 * 3600e3).toISOString().replace("T", " ").slice(5, 16).replace(/^(\d\d)-(\d\d)/, "$2/$1") : "—";

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
    const dry = u.searchParams.get("dry") === "1" || body.dry === true;
    const forcar = body.forcar === true;
    const hoje = inicioDeHojeBrasilia();

    const resultado = [];
    for (const p of PEDIDOS) {
      const { data, error } = await sb.from("pedido_videos")
        .select("created_at, approval_status, is_active, videos(nome, created_at)")
        .eq("pedido_id", p.id).eq("is_active", true).order("created_at", { ascending: false }).limit(1);
      if (error) throw error;
      const v = (data || [])[0] as any;
      const quando = v?.videos?.created_at || v?.created_at || null;
      const ok = !!quando && new Date(quando) >= hoje && (v.approval_status ?? "approved") !== "rejected";
      resultado.push({ nome: p.nome, ok, titulo: v?.videos?.nome || null, enviado_em: quando, enviado_fmt: fmt(quando), aprovacao: v?.approval_status || null });
    }

    const pendentes = resultado.filter(r => !r.ok);
    let enviado: string | null = null;
    if (!dry && (pendentes.length || forcar)) {
      const linhas = resultado.map(r => `${r.ok ? "✅" : "❌"} *${r.nome}* — ${r.ok ? `atualizado (${r.enviado_fmt})` : `NÃO subiu hoje (último: ${r.enviado_fmt})`}`).join("\n");
      const texto = pendentes.length
        ? `Bom dia, Jeferson! Aqui é a Sofia. ⚠️\n\nAs notícias das telas de hoje não subiram por completo:\n\n${linhas}\n\nProvável causa: o PC das notícias estava desligado ou a automação falhou.\n👉 No PC, abra a pasta scripts\\noticias-dooh e dê dois cliques em *GERAR NOTICIAS AGORA.bat* (leva 15–25 min). Enquanto isso, as telas seguem com os vídeos anteriores.`
        : `Bom dia, Jeferson! Aqui é a Sofia. ✅\n\nNotícias das telas de hoje:\n\n${linhas}`;
      enviado = await enviarWhatsApp(sb, texto);
    }
    return new Response(JSON.stringify({ ok: true, hoje_desde: hoje.toISOString(), pendentes: pendentes.length, resultado, whatsapp_instancia: enviado, dry }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[NOTICIAS-CHECK] erro:", (e as Error).message);
    return new Response(JSON.stringify({ ok: false, erro: (e as Error).message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
