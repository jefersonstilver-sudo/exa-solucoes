// =====================================================================
// EXA 2.0 · Notificações no iPhone/Android (Web Push do app da tela de início)
//   chave    (público)            → chave pública VAPID (gera e guarda em exa2_config na 1ª vez;
//                                    a chave privada nunca sai do banco)
//   assinar  (usuário logado)     → guarda a assinatura do aparelho  { assinatura, aparelho }
//   sair     (usuário logado)     → apaga a assinatura deste aparelho { endpoint }
//   teste    (usuário logado)     → manda um aviso de teste para os aparelhos do próprio usuário
//   enviar   (x-exa2-cron ou admin) → { para: 'ceo' | 'admins' | user_id[], titulo, corpo, url?, tag?, badge? }
// Assinatura que o provedor diz que morreu (404/410) é apagada. Tudo fica em push_envios.
// =====================================================================
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-exa2-cron",
};
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const CONTATO = "mailto:contato@examidia.com.br";

async function chaves(sb: SupabaseClient) {
  const { data } = await sb.from("exa2_config").select("chave, valor").in("chave", ["vapid_publica", "vapid_privada"]);
  const m: Record<string, string> = {};
  for (const r of data || []) m[(r as any).chave] = (r as any).valor;
  if (m.vapid_publica && m.vapid_privada) return { publica: m.vapid_publica, privada: m.vapid_privada };
  const k = webpush.generateVAPIDKeys();
  // só grava se ainda não existir (duas chamadas ao mesmo tempo não trocam a chave)
  await sb.from("exa2_config").upsert([{ chave: "vapid_publica", valor: k.publicKey }, { chave: "vapid_privada", valor: k.privateKey }], { onConflict: "chave", ignoreDuplicates: true });
  return chaves(sb);
}

async function destinatarios(sb: SupabaseClient, para: unknown): Promise<string[]> {
  if (Array.isArray(para)) return para.map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
  const papeis = para === "admins" ? ["super_admin", "admin"] : ["super_admin"];
  const { data } = await sb.from("user_roles").select("user_id").in("role", papeis);
  return [...new Set((data || []).map((r: any) => String(r.user_id)))];
}

async function enviar(sb: SupabaseClient, ids: string[], msg: { titulo: string; corpo: string; url?: string; tag?: string; badge?: number; tipo?: string }) {
  if (!ids.length) return { aparelhos: 0, ok: 0 };
  const k = await chaves(sb);
  webpush.setVapidDetails(CONTATO, k.publica, k.privada);
  const { data: subs } = await sb.from("push_assinaturas").select("id, user_id, endpoint, p256dh, auth").in("user_id", ids).eq("ativo", true);
  const payload = JSON.stringify({ titulo: msg.titulo.slice(0, 120), corpo: msg.corpo.slice(0, 400), url: msg.url || "/", tag: msg.tag || undefined, badge: msg.badge ?? undefined });
  let ok = 0;
  await Promise.all((subs || []).map(async (s: any) => {
    let erro: string | null = null;
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24, urgency: "high" });
      ok++;
      await sb.from("push_assinaturas").update({ ultimo_ok: new Date().toISOString(), falhas: 0 }).eq("id", s.id);
    } catch (e: any) {
      const st = Number(e?.statusCode || 0);
      erro = (st ? st + " " : "") + String(e?.body || e?.message || e).slice(0, 300);
      if (st === 404 || st === 410) await sb.from("push_assinaturas").delete().eq("id", s.id);
      else await sb.from("push_assinaturas").update({ falhas: (s.falhas || 0) + 1 }).eq("id", s.id);
    }
    await sb.from("push_envios").insert({ user_id: s.user_id, assinatura_id: s.id, tipo: msg.tipo || null, titulo: msg.titulo.slice(0, 200), corpo: msg.corpo.slice(0, 600), url: msg.url || null, ok: !erro, erro });
  }));
  return { aparelhos: (subs || []).length, ok };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "chave") return json(200, { publica: (await chaves(sb)).publica });

    // ---- sistema (Sofia, cobrança, vigia dos painéis): token interno
    const cronTok = req.headers.get("x-exa2-cron");
    if (cronTok) {
      const { data: cfg } = await sb.from("exa2_config").select("valor").eq("chave", "cron_token").maybeSingle();
      if (!cfg?.valor || cfg.valor !== cronTok) return json(401, { error: "unauthorized" });
      if (action !== "enviar") return json(400, { error: "ação inválida para o sistema" });
      if (!body.titulo) return json(400, { error: "titulo obrigatório" });
      return json(200, await enviar(sb, await destinatarios(sb, body.para ?? "ceo"), { titulo: String(body.titulo), corpo: String(body.corpo || ""), url: body.url, tag: body.tag, badge: body.badge, tipo: body.tipo }));
    }

    // ---- usuário logado
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(jwt);
    if (!u?.user) return json(401, { error: "não autenticado" });
    const uid = u.user.id;

    if (action === "assinar") {
      const a = body.assinatura || {};
      const endpoint = String(a.endpoint || "");
      if (!/^https:\/\//.test(endpoint) || !a.keys?.p256dh || !a.keys?.auth) return json(400, { error: "assinatura inválida" });
      const { error } = await sb.from("push_assinaturas").upsert({ user_id: uid, endpoint, p256dh: String(a.keys.p256dh), auth: String(a.keys.auth), aparelho: String(body.aparelho || "").slice(0, 200), ativo: true, falhas: 0, atualizado_em: new Date().toISOString() }, { onConflict: "endpoint" });
      if (error) return json(500, { error: error.message });
      return json(200, { ok: true });
    }
    if (action === "sair") {
      await sb.from("push_assinaturas").delete().eq("user_id", uid).eq("endpoint", String(body.endpoint || ""));
      return json(200, { ok: true });
    }
    if (action === "teste") {
      return json(200, await enviar(sb, [uid], { titulo: "EXA", corpo: "Avisos ativados neste aparelho. É assim que eles vão chegar.", url: String(body.url || "/"), tag: "teste", tipo: "teste" }));
    }
    if (action === "enviar") {
      const { data: papeis } = await sb.from("user_roles").select("role").eq("user_id", uid);
      if (!(papeis || []).some((r: any) => ["admin", "super_admin"].includes(String(r.role)))) return json(403, { error: "sem permissão" });
      if (!body.titulo) return json(400, { error: "titulo obrigatório" });
      return json(200, await enviar(sb, await destinatarios(sb, body.para ?? "ceo"), { titulo: String(body.titulo), corpo: String(body.corpo || ""), url: body.url, tag: body.tag, badge: body.badge, tipo: body.tipo || "manual" }));
    }
    return json(400, { error: "ação inválida" });
  } catch (e) {
    console.error("exa2-push", String(e));
    return json(500, { error: String((e as any)?.message || e).slice(0, 300) });
  }
});
