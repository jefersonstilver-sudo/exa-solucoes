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

export function naoAutorizado(cors: Record<string, string>) {
  return new Response(JSON.stringify({ error: "Não autorizado" }), {
    status: 401,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
