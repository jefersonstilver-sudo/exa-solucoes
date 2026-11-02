// Guarda de autorização para funções com verify_jwt=false.
// A anon key é pública (está no site) e é um JWT válido: "ter Authorization" não prova nada.
//  - exigirEquipe: usuário logado com papel de equipe em public.user_roles (tabela canônica de papéis).
//  - exigirSistema: chamada servidor→servidor (Bearer = service role) ou cron com x-exa2-cron = exa2_config.cron_token.
// Ambas devolvem null quando não autorizado; use naoAutorizado() para responder 401.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export const PAPEIS_EQUIPE = ["super_admin", "admin", "admin_financeiro", "admin_departamental", "comercial"];

function db(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Service unavailable");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function bearer(req: Request): string | null {
  return req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null;
}

function iguais(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function exigirEquipe(req: Request, papeis: string[] = PAPEIS_EQUIPE) {
  const token = bearer(req);
  if (!token) return null;
  const sb = db();
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return null;
  const { data, error: e2 } = await sb.from("user_roles").select("role").eq("user_id", user.id);
  if (e2 || !data?.some((r: { role: string }) => papeis.includes(String(r.role)))) return null;
  return { sb, user, papeis: data.map((r: { role: string }) => String(r.role)) };
}

export async function exigirSistema(req: Request) {
  const sb = db();
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const tok = bearer(req);
  if (tok && iguais(tok, svc)) return { sb };
  const cron = req.headers.get("x-exa2-cron") || "";
  if (cron) {
    const { data } = await sb.from("exa2_config").select("valor").eq("chave", "cron_token").maybeSingle();
    const esperado = String((data as { valor?: unknown } | null)?.valor ?? "");
    if (iguais(cron, esperado)) return { sb };
  }
  return null;
}

/** Equipe logada OU sistema (servidor/cron). */
export async function exigirEquipeOuSistema(req: Request, papeis: string[] = PAPEIS_EQUIPE) {
  return (await exigirSistema(req)) || (await exigirEquipe(req, papeis));
}

/**
 * Webhook da Evolution (WhatsApp): a Evolution chama a URL cadastrada nela, então o segredo vai na URL (?token=).
 * Token em exa2_config 'evo_webhook_token'. Enquanto exa2_config 'evo_webhook_exigir' não for '1', chamada sem token
 * passa com aviso no log (transição); token ERRADO é sempre recusado.
 */
export async function webhookEvolutionOk(req: Request, origem: string, instancia = ""): Promise<boolean> {
  const sb = db();
  const { data } = await sb.from("exa2_config").select("chave, valor").in("chave", ["evo_webhook_token", "evo_webhook_exigir"]);
  const cfg = Object.fromEntries((data || []).map((r: { chave: string; valor: unknown }) => [r.chave, String(r.valor ?? "")]));
  const esperado = cfg.evo_webhook_token || "";
  const recebido = new URL(req.url).searchParams.get("token") || "";
  if (recebido) {
    const ok = iguais(recebido, esperado);
    if (!ok) console.warn(`[WEBHOOK ${origem}] token inválido, recusado (instância ${instancia || "?"})`);
    else console.log(`[WEBHOOK ${origem}] token ok`);
    return ok;
  }
  if (cfg.evo_webhook_exigir === "1" || !esperado) {
    console.warn(`[WEBHOOK ${origem}] sem token, recusado (instância ${instancia || "?"})`);
    return false;
  }
  console.warn(`[WEBHOOK ${origem}] sem token, aceito em modo transição (instância ${instancia || "?"})`);
  return true;
}

/** URL do webhook com o token, para cadastrar na Evolution. */
export async function urlWebhookEvolution(funcao: string): Promise<string> {
  const { data } = await db().from("exa2_config").select("valor").eq("chave", "evo_webhook_token").maybeSingle();
  const tok = String((data as { valor?: unknown } | null)?.valor ?? "");
  if (!tok) throw new Error("evo_webhook_token ausente em exa2_config");
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/${funcao}?token=${encodeURIComponent(tok)}`;
}

export function naoAutorizado(cors: Record<string, string>) {
  return new Response(JSON.stringify({ error: "Não autorizado" }), {
    status: 401,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
