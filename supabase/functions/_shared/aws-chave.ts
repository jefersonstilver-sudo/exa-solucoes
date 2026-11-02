// EXA · segurança (02/11/2026): chave de escrita da API das telas (AWS, 18.228.252.149:8000).
// Importe este módulo ("import '../_shared/aws-chave.ts';") em toda função que ESCREVE na API
// (POST/PUT/PATCH/DELETE). Ele acrescenta o header x-exa-key às chamadas de escrita para a API,
// lendo a chave de exa2_config.aws_api_key (cache de 5 min). Leitura (GET) não muda.
// A API confere a chave (config/exa_api_key no servidor); config/exa_api_modo = observar | exigir.
// Nunca quebra a chamada: se não conseguir ler a chave, segue sem ela (a API decide).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const AWS_BASE = "http://18.228.252.149:8000";
let cache: { v: string; t: number } | null = null;

async function chaveAws(): Promise<string> {
  if (cache && Date.now() - cache.t < 300_000) return cache.v;
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return cache?.v ?? "";
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data } = await sb.from("exa2_config").select("valor").eq("chave", "aws_api_key").maybeSingle();
    cache = { v: String((data as { valor?: unknown } | null)?.valor ?? ""), t: Date.now() };
  } catch (_) {
    cache = { v: cache?.v ?? "", t: Date.now() };
  }
  return cache.v;
}

// deno-lint-ignore no-explicit-any
const g = globalThis as any;
if (!g.__exaAwsChave) {
  g.__exaAwsChave = true;
  const original = globalThis.fetch;
  // deno-lint-ignore no-explicit-any
  globalThis.fetch = (async (input: any, init?: any) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input?.url;
      const metodo = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      if (typeof url === "string" && url.startsWith(AWS_BASE) && metodo !== "GET" && metodo !== "HEAD") {
        const k = await chaveAws();
        if (k) {
          const h = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
          h.set("x-exa-key", k);
          init = { ...(init ?? {}), headers: h };
        }
      }
    } catch (_) { /* nunca quebra a chamada */ }
    return original(input, init);
  }) as typeof fetch;
}

export {};
