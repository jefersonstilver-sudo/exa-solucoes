// EXA · segurança (02/11/2026): confere o captcha (Cloudflare Turnstile) antes do cadastro e da
// recuperação de senha no site. Corpo: { token, acao }. Resposta: { ok, motivo }.
// O login NÃO usa captcha (os robôs de notícias e do Cine Cataratas entram pelo login).
import { getCorsHeaders } from "../_shared/cors.ts";
import { ipDaRequisicao, verificarTurnstile } from "../_shared/turnstile.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (s: number, b: unknown) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json(405, { ok: false, motivo: "metodo" });
  let corpo: { token?: unknown; acao?: unknown } = {};
  try { corpo = await req.json(); } catch (_) { /* corpo vazio */ }
  const acao = String(corpo.acao || "").slice(0, 40);
  const r = await verificarTurnstile(corpo.token, ipDaRequisicao(req), acao);
  return json(r.ok ? 200 : 403, r);
});
