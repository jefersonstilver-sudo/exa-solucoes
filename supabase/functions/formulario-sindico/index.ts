// EXA · segurança (02/11/2026): envio do formulário "interesse do síndico" com captcha conferido no servidor.
// Corpo: { payload, cf_token }. Confere o Turnstile e só então chama a RPC submit_sindico_interesse
// com a chave de serviço. Resposta igual à da RPC: [{ id, protocolo }].
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { ipDaRequisicao, verificarTurnstile } from "../_shared/turnstile.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (s: number, b: unknown) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json(405, { error: "método não permitido" });

  let corpo: { payload?: unknown; cf_token?: unknown } = {};
  try { corpo = await req.json(); } catch (_) { return json(400, { error: "corpo inválido" }); }
  const payload = corpo.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return json(400, { error: "dados ausentes" });
  if (JSON.stringify(payload).length > 50_000) return json(413, { error: "dados grandes demais" });

  const cap = await verificarTurnstile(corpo.cf_token, ipDaRequisicao(req), "formulario-sindico");
  if (!cap.ok) return json(403, { error: "Confirme que você não é um robô e envie de novo." });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.rpc("submit_sindico_interesse", { payload });
  if (error) {
    console.error("[formulario-sindico] rpc:", error.message);
    return json(400, { error: error.message });
  }
  return json(200, data);
});
