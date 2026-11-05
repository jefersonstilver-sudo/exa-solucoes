// EXA (05/11/2026) — MAPA DOS CONTRATOS NA CLICKSIGN (somente leitura).
// Lista todos os envelopes (API v3) e documentos antigos (API v1) da conta, com signatários e arquivos,
// para o CEO achar os contratos dos síndicos. Não cria, não altera, não cancela nada na ClickSign.
// Só admin/super_admin (JWT do site). O token da ClickSign fica no servidor (CLICKSIGN_ACCESS_TOKEN).
// POST { fonte?: "v3" | "v1" | "ambas", pagina_ini?: number, paginas?: number }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const BASE = "https://app.clicksign.com";

async function getJson(url: string, headers: Record<string, string>): Promise<any> {
  for (let t = 0; t < 3; t++) {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    if (r.status === 429) { await new Promise((ok) => setTimeout(ok, 1500 * (t + 1))); continue; }
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
    return await r.json();
  }
  throw new Error("limite de requisições da ClickSign");
}

async function emLotes<T, R>(itens: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < itens.length; i += n) out.push(...await Promise.all(itens.slice(i, i + n).map(fn)));
  return out;
}

async function envelopesV3(token: string, ini: number, paginas: number) {
  const h = { Accept: "application/vnd.api+json", Authorization: token };
  const lista: any[] = [];
  let fim = false, ultima = ini - 1;
  for (let p = ini; p < ini + paginas; p++) {
    const j = await getJson(`${BASE}/api/v3/envelopes?page[number]=${p}&page[size]=50&sort=-created`, h);
    const d = Array.isArray(j?.data) ? j.data : [];
    ultima = p;
    if (!d.length) { fim = true; break; }
    lista.push(...d);
    if (d.length < 50) { fim = true; break; }
  }
  const itens = await emLotes(lista, 4, async (e: any) => {
    const a = e.attributes || {};
    let signatarios: any[] = [], documentos: any[] = [], erro: string | null = null;
    try {
      const s = await getJson(`${BASE}/api/v3/envelopes/${e.id}/signers`, h);
      signatarios = (s?.data || []).map((x: any) => ({ nome: x.attributes?.name, email: x.attributes?.email, telefone: x.attributes?.phone_number, assinou_em: x.attributes?.signed_at || null }));
    } catch (err) { erro = "signatários: " + (err as Error).message; }
    try {
      const d = await getJson(`${BASE}/api/v3/envelopes/${e.id}/documents`, h);
      documentos = (d?.data || []).map((x: any) => ({ arquivo: x.attributes?.filename, status: x.attributes?.status }));
    } catch (err) { erro = (erro ? erro + "; " : "") + "documentos: " + (err as Error).message; }
    return { fonte: "v3", id: e.id, nome: a.name, status: a.status, criado: a.created, atualizado: a.modified, prazo: a.deadline_at, signatarios, documentos, erro };
  });
  return { itens, fim, ultima_pagina: ultima };
}

async function documentosV1(token: string, ini: number, paginas: number) {
  const itens: any[] = [];
  let fim = false, ultima = ini - 1;
  for (let p = ini; p < ini + paginas; p++) {
    const j = await getJson(`${BASE}/api/v1/documents?access_token=${encodeURIComponent(token)}&page=${p}`, { Accept: "application/json" });
    const d = Array.isArray(j?.documents) ? j.documents : [];
    ultima = p;
    if (!d.length) { fim = true; break; }
    for (const x of d) {
      itens.push({
        fonte: "v1", id: x.key, nome: x.filename || x.path, status: x.status, criado: x.uploaded_at || x.created_at, atualizado: x.updated_at, prazo: x.deadline_at,
        pasta: x.path, signatarios: (x.signers || []).map((s: any) => ({ nome: s.name, email: s.email, telefone: s.phone_number, assinou_em: s.signature?.signed_at || null })),
        documentos: [{ arquivo: x.filename, status: x.status }], erro: null,
      });
    }
    const total = Number(j?.page_infos?.total_pages || 0);
    if (total && p >= total) { fim = true; break; }
  }
  return { itens, fim, ultima_pagina: ultima };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(jwt);
    if (!u?.user) return json(401, { error: "não autenticado" });
    const { data: papeis } = await sb.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!(papeis || []).some((r: any) => ["admin", "super_admin"].includes(String(r.role)))) return json(403, { error: "sem permissão" });
    const token = Deno.env.get("CLICKSIGN_ACCESS_TOKEN");
    if (!token) return json(500, { error: "CLICKSIGN_ACCESS_TOKEN não configurado" });

    const b = await req.json().catch(() => ({}));
    const fonte = ["v3", "v1"].includes(b.fonte) ? b.fonte : "v3";
    const ini = Math.max(1, Number(b.pagina_ini) || 1);
    const paginas = Math.min(10, Math.max(1, Number(b.paginas) || 4));
    const r = fonte === "v1" ? await documentosV1(token, ini, paginas) : await envelopesV3(token, ini, paginas);
    return json(200, { ok: true, fonte, pagina_ini: ini, ...r, total: r.itens.length });
  } catch (e) {
    return json(500, { error: (e as Error).message });
  }
});
