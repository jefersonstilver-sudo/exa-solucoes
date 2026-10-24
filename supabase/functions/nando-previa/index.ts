// NANDO - dados da previa temporaria de um aviso (link de 10 minutos).
// Usado pela pagina publica /nando/previa/:token do site. Nao exige login: o token e secreto e expira.
import { db } from "../_shared/nando-core.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  let token = url.searchParams.get("t") || "";
  if (!token && req.method === "POST") { try { token = (await req.json()).t || ""; } catch { /* */ } }
  token = token.replace(/[^a-f0-9]/gi, "").slice(0, 64);
  if (!token) return json(400, { ok: false, erro: "link inválido" });

  const sb = db();
  const { data: p } = await sb.from("nando_previas").select("aviso_id,expira_em").eq("token", token).maybeSingle();
  if (!p) return json(404, { ok: false, erro: "Prévia não encontrada." });
  if (new Date(p.expira_em) < new Date()) {
    await sb.from("nando_previas").delete().eq("token", token);
    return json(410, { ok: false, erro: "Essa prévia expirou. Peça um novo link ao Nando." });
  }
  const { data: a } = await sb.from("nando_avisos").select("tipo,titulo,segundos,inicio,fim,conteudo,origem_url,building_id").eq("id", p.aviso_id).single();
  if (!a) return json(404, { ok: false, erro: "Aviso não encontrado." });
  const { data: b } = await sb.from("buildings").select("nome").eq("id", a.building_id).single();
  const { count: outros } = await sb.from("nando_avisos").select("id", { count: "exact", head: true })
    .eq("building_id", a.building_id).in("status", ["no_ar", "agendado"]);

  let dados = null;
  const opcoes: { opcao: number; dados: unknown; credito: string | null }[] = [];
  if (a.tipo === "nando") {
    // as 3 variacoes criadas juntas aparecem lado a lado
    let lista: any[] = [a];
    if (a.conteudo?.grupo) {
      const { data: irmaos } = await sb.from("nando_avisos").select("conteudo").eq("conteudo->>grupo", a.conteudo.grupo).eq("status", "rascunho");
      if (irmaos?.length) lista = irmaos.sort((x: any, y: any) => (x.conteudo?.opcao || 0) - (y.conteudo?.opcao || 0));
    }
    for (const it of lista) {
      if (!it.conteudo?.arquivo_url) continue;
      const r = await fetch(it.conteudo.arquivo_url);
      if (r.ok) opcoes.push({ opcao: it.conteudo?.opcao || opcoes.length + 1, dados: await r.json(), credito: it.conteudo?.credito_foto || null });
    }
    dados = opcoes[0]?.dados || null;
  }
  return json(200, {
    ok: true, tipo: a.tipo, titulo: a.titulo, segundos: a.segundos, inicio: a.inicio, fim: a.fim,
    predio: b?.nome || "", outros: outros || 0, dados, opcoes, url: a.tipo === "nando" ? null : a.origem_url, expira_em: p.expira_em,
  });
});
