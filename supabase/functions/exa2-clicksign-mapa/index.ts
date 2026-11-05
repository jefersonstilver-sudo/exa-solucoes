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

// IMPORTAR o PDF assinado de um envelope para o Painel do Síndico (área Contratos): baixa o arquivo da ClickSign,
// guarda no bucket privado contratos-predios e registra em predio_contratos (o anterior do prédio fica inativo).
// Continua somente leitura na ClickSign. body: { acao: "importar", envelope_id, building_id }
async function importar(sb: any, token: string, b: any, quem: string) {
  const env = String(b.envelope_id || "").replace(/[^0-9a-f-]/gi, "");
  const bid = String(b.building_id || "").replace(/[^0-9a-f-]/gi, "");
  if (!env || !bid) return json(400, { error: "envelope_id e building_id obrigatórios" });
  const { data: predio } = await sb.from("buildings").select("id,nome").eq("id", bid).maybeSingle();
  if (!predio) return json(404, { error: "prédio não encontrado" });
  const h = { Accept: "application/vnd.api+json", Authorization: token };
  const e = await getJson(`${BASE}/api/v3/envelopes/${env}`, h);
  const docs = await getJson(`${BASE}/api/v3/envelopes/${env}/documents`, h);
  const sig = await getJson(`${BASE}/api/v3/envelopes/${env}/signers`, h).catch(() => ({ data: [] }));
  // envelope com vários contratos (ex.: pacote da administradora): escolhe o documento pelo nome
  const lista = docs?.data || [];
  const filtro = String(b.documento || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const nomeDoc = (x: any) => String(x?.attributes?.filename || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const d = filtro ? lista.find((x: any) => nomeDoc(x).includes(filtro)) : lista[0];
  const nomes = lista.map((x: any) => x?.attributes?.filename);
  if (!d) return json(404, { error: filtro ? `nenhum documento com "${b.documento}" no envelope` : "envelope sem documento", documentos: nomes });
  if (!filtro && lista.length > 1) return json(400, { error: "envelope com vários documentos: informe 'documento'", documentos: nomes });
  // o link do arquivo assinado pode vir na lista ou no detalhe do documento
  let det = d;
  let url = d.links?.files?.signed || d.attributes?.links?.files?.signed;
  if (!url) { det = (await getJson(`${BASE}/api/v3/envelopes/${env}/documents/${d.id}`, h))?.data || d; url = det.links?.files?.signed || det.attributes?.links?.files?.signed; }
  const assinado = !!url;
  if (!url) url = det.links?.files?.original || det.attributes?.links?.files?.original;
  if (!url) return json(422, { error: "a ClickSign não devolveu o link do arquivo", chaves_doc: Object.keys(det || {}), links: det?.links || null });
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) return json(502, { error: "não consegui baixar o PDF da ClickSign: " + r.status });
  const bytes = new Uint8Array(await r.arrayBuffer());
  const caminho = `${bid}/${env}-${d.id}.pdf`;
  const { error: up } = await sb.storage.from("contratos-predios").upload(caminho, bytes, { contentType: "application/pdf", upsert: true });
  if (up) return json(500, { error: "falha ao guardar: " + up.message });
  const parte = (sig?.data || []).map((x: any) => x.attributes || {}).find((x: any) => !/jeferson|exa ?m[ií]dia|eduardo/i.test(String(x.name || "")) && !/examidia\.com\.br|eduardogabriel/i.test(String(x.email || "")));
  const ea = e?.data?.attributes || {};
  await sb.from("predio_contratos").update({ ativo: false }).eq("building_id", bid).eq("ativo", true);
  const { data: linha, error: ins } = await sb.from("predio_contratos").insert({
    building_id: bid, titulo: String((lista.length > 1 ? det.attributes?.filename || d.attributes?.filename : ea.name) || det.attributes?.filename || "Contrato").replace(/\.pdf$/i, "").replace(/\s*\(\d+\)\s*$/g, "").trim(), arquivo_path: caminho,
    assinado_em: ea.status === "closed" ? (ea.modified || ea.created || null) : null,
    assinante_nome: parte?.name || null, assinante_email: parte?.email || null,
    clicksign_envelope_id: env, clicksign_documento_id: d.id, ativo: true, criado_por: quem,
  }).select("id,titulo,assinado_em,assinante_nome").single();
  if (ins) return json(500, { error: "falha ao registrar: " + ins.message });
  return json(200, { ok: true, predio: predio.nome, arquivo_assinado: assinado, bytes: bytes.length, envelope_status: ea.status, contrato: linha });
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
    if (b.acao === "importar") return await importar(sb, token, b, u.user.email || "admin");
    const fonte = ["v3", "v1"].includes(b.fonte) ? b.fonte : "v3";
    const ini = Math.max(1, Number(b.pagina_ini) || 1);
    const paginas = Math.min(10, Math.max(1, Number(b.paginas) || 4));
    const r = fonte === "v1" ? await documentosV1(token, ini, paginas) : await envelopesV3(token, ini, paginas);
    return json(200, { ok: true, fonte, pagina_ini: ini, ...r, total: r.itens.length });
  } catch (e) {
    return json(500, { error: (e as Error).message });
  }
});
