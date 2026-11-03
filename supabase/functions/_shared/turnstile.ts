// EXA · segurança (02/11/2026): confere o captcha Cloudflare Turnstile no servidor.
// O segredo fica em Edge Functions → Secrets como TURNSTILE_SECRET_KEY (nunca no código nem no site).
// Regras:
//  - sem token ou token recusado pela Cloudflare → bloqueia;
//  - sem segredo configurado ou Cloudflare fora do ar → deixa passar e registra no log
//    (o captcha não pode derrubar o cadastro por falha de terceiro).

export type ResultadoTurnstile = { ok: boolean; motivo: string };

export function ipDaRequisicao(req: Request): string {
  return req.headers.get("cf-connecting-ip")
    || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim()
    || "";
}

export async function verificarTurnstile(token: unknown, ip = "", acao = ""): Promise<ResultadoTurnstile> {
  const segredo = Deno.env.get("TURNSTILE_SECRET_KEY") || "";
  if (!segredo) {
    console.warn(`[turnstile] TURNSTILE_SECRET_KEY ausente; liberado (${acao})`);
    return { ok: true, motivo: "sem_segredo" };
  }
  if (typeof token !== "string" || token.length < 10 || token.length > 4096) {
    return { ok: false, motivo: "sem_token" };
  }
  try {
    const corpo = new URLSearchParams({ secret: segredo, response: token });
    if (ip) corpo.set("remoteip", ip);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: corpo,
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    if (!r.ok) {
      console.warn(`[turnstile] siteverify HTTP ${r.status}; liberado (${acao})`);
      return { ok: true, motivo: "cloudflare_indisponivel" };
    }
    const j = await r.json() as { success?: boolean; "error-codes"?: string[]; hostname?: string };
    if (j.success) return { ok: true, motivo: "ok" };
    const codigos = (j["error-codes"] || []).join(",");
    // segredo errado é problema nosso, não do visitante: libera e avisa no log
    if (/invalid-input-secret|missing-input-secret/.test(codigos)) {
      console.error(`[turnstile] segredo inválido (${codigos}); liberado (${acao})`);
      return { ok: true, motivo: "segredo_invalido" };
    }
    console.warn(`[turnstile] recusado ${codigos} (${acao})`);
    return { ok: false, motivo: codigos || "recusado" };
  } catch (e) {
    console.warn(`[turnstile] erro ao consultar Cloudflare; liberado (${acao}):`, String(e));
    return { ok: true, motivo: "cloudflare_indisponivel" };
  }
}
