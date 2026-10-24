// NANDO - dados publicos temporarios para o site:
//  ?t=<token>  previa de um aviso (link de 10 minutos), com as 3 opcoes ou os cartoes da serie
//  ?p=<token>  pagina do predio (link assinado de 1 hora): avisos no ar e agendados, como aparecem na tela
// Nao exige login: os tokens sao secretos e expiram.
import { db, lerTokenPredio, lerTokenCarteira, listarArquivosPainel, nomeBase, ehAdmin, prediosDoTelefone, todosPredios } from "../_shared/nando-core.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function dadosNando(url: string | undefined): Promise<unknown> {
  if (!url) return null;
  try { const r = await fetch(url); return r.ok ? await r.json() : null; } catch { return null; }
}

async function avisosDoPredio(sb: ReturnType<typeof db>, buildingId: string) {
  const { data: rows } = await sb.from("nando_avisos")
    .select("id,tipo,titulo,segundos,inicio,fim,status,arquivo,origem_url,criado_por_nome,created_at,conteudo")
    .eq("building_id", buildingId).in("status", ["no_ar", "agendado"]).order("created_at");
  // so mostra como "no ar" o que esta mesmo na pasta do painel
  const pasta = await listarArquivosPainel(String(buildingId).replace(/-/g, "").slice(0, 4)).catch(() => null);
  const avisos = [];
  for (const a of rows || []) {
    const c: any = a.conteudo || {};
    const confirmado = !pasta || !a.arquivo || pasta.includes(nomeBase(a.arquivo));
    if (!confirmado) continue;
    let url: string | null = null;
    if (a.tipo !== "nando") url = a.origem_url || null;
    avisos.push({
      id: String(a.id).slice(0, 8), tipo: a.tipo, titulo: String(a.titulo || "").replace(/\s*\[\d+s\]/, ""), segundos: a.segundos,
      inicio: a.inicio, fim: a.fim, status: a.status, criado_por: c.legado ? "anterior ao Nando" : (a.criado_por_nome || ""),
      dados: a.tipo === "nando" ? await dadosNando(c.arquivo_url) : null, url, antigo: !!c.legado, em_grupo: !!c.lote,
    });
  }
  return avisos;
}

async function paginaPredio(token: string) {
  const sb = db();
  // link da carteira (varios predios)
  const cart = await lerTokenCarteira(token);
  if (cart) {
    const lista = ehAdmin(cart.telefone) ? await todosPredios(sb) : (await prediosDoTelefone(sb, cart.telefone)).predios;
    const predios = await Promise.all(lista.map(async (p) => ({ id: p.id.slice(0, 8), predio: p.nome, codigo: p.codigo, avisos: await avisosDoPredio(sb, p.id) })));
    return json(200, { ok: true, modo: "carteira", predio: `${lista.length} prédios`, predios, avisos: [], expira_em: cart.expira.toISOString() });
  }
  const t = await lerTokenPredio(token);
  if (!t) return json(410, { ok: false, erro: "Esse link expirou. Peça um novo ao Nando no WhatsApp." });
  const { data: b } = await sb.from("buildings").select("nome").eq("id", t.buildingId).single();
  return json(200, { ok: true, modo: "predio", predio: b?.nome || "", avisos: await avisosDoPredio(sb, t.buildingId), expira_em: t.expira.toISOString() });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  let token = url.searchParams.get("t") || "";
  let tokenPredio = url.searchParams.get("p") || "";
  if (!token && !tokenPredio && req.method === "POST") {
    try { const b = await req.json(); token = b.t || ""; tokenPredio = b.p || ""; } catch { /* */ }
  }
  if (tokenPredio) return await paginaPredio(tokenPredio);
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

  // varias opcoes de um documento (cartoes / resumo com QR / original), todas na mesma previa
  if (a.conteudo?.proposta) {
    const { data: rows } = await sb.from("nando_avisos").select("tipo,titulo,origem_url,conteudo")
      .eq("conteudo->>proposta", a.conteudo.proposta).in("status", ["rascunho", "no_ar", "agendado"]);
    const porOpcao = new Map<number, any[]>();
    for (const r of rows || []) { const n = Number(r.conteudo?.opcao_proposta) || 1; porOpcao.set(n, [...(porOpcao.get(n) || []), r]); }
    const secoes = [];
    for (const n of [...porOpcao.keys()].sort((x, y) => x - y)) {
      const lista = porOpcao.get(n)!.sort((x: any, y: any) => (x.conteudo?.parte || 0) - (y.conteudo?.parte || 0));
      const prim = lista[0];
      const cartoes = [];
      if (prim.tipo === "nando") for (const r of lista) { const d = await dadosNando(r.conteudo?.arquivo_url); if (d) cartoes.push(d); }
      secoes.push({ opcao: n, rotulo: prim.conteudo?.rotulo_opcao || `Opção ${n}`, tipo: prim.tipo, cartoes, url: prim.tipo === "nando" ? null : prim.origem_url, credito: prim.conteudo?.credito_foto || null });
    }
    // compatibilidade com a pagina antiga do site: as opcoes tambem vao "achatadas" (cartao por cartao, com rotulo)
    const opcoesPlanas = secoes.flatMap((sc: any) => sc.tipo === "nando"
      ? sc.cartoes.map((d: unknown, i: number) => ({ opcao: sc.opcao * 10 + i, rotulo: `Opção ${sc.opcao} · ${sc.rotulo}${sc.cartoes.length > 1 ? ` (${i + 1}/${sc.cartoes.length})` : ""}`, dados: d, credito: null }))
      : []);
    return json(200, {
      opcoes: opcoesPlanas, dados: opcoesPlanas[0]?.dados || null, serie: false,
      ok: true, tipo: "nando", proposta: true, titulo: String(a.titulo || "").replace(/\s*\(\d+\/\d+\)$/, ""), segundos: a.segundos, inicio: a.inicio, fim: a.fim,
      predio: b?.nome || "", outros: outros || 0, secoes, expira_em: p.expira_em,
    });
  }

  let dados = null;
  const serie = !!a.conteudo?.serie;
  const opcoes: { opcao: number; rotulo: string; dados: unknown; credito: string | null }[] = [];
  if (a.tipo === "nando") {
    // as 3 variacoes (ou os cartoes da serie) criadas juntas aparecem lado a lado
    let lista: any[] = [a];
    if (a.conteudo?.grupo) {
      const { data: irmaos } = await sb.from("nando_avisos").select("conteudo").eq("conteudo->>grupo", a.conteudo.grupo).in("status", ["rascunho", "no_ar", "agendado"]);
      if (irmaos?.length) lista = irmaos.sort((x: any, y: any) => (x.conteudo?.opcao || 0) - (y.conteudo?.opcao || 0));
    }
    for (const it of lista) {
      if (!it.conteudo?.arquivo_url) continue;
      const d = await dadosNando(it.conteudo.arquivo_url);
      if (!d) continue;
      const n = it.conteudo?.opcao || opcoes.length + 1;
      opcoes.push({ opcao: n, rotulo: serie ? `Cartão ${n} de ${it.conteudo?.total || lista.length}` : `Opção ${n}`, dados: d, credito: it.conteudo?.credito_foto || null });
    }
    dados = opcoes[0]?.dados || null;
  }
  return json(200, {
    ok: true, tipo: a.tipo, serie, titulo: String(a.titulo || "").replace(/\s*\(\d+\/\d+\)$/, ""), segundos: a.segundos, inicio: a.inicio, fim: a.fim,
    predio: b?.nome || "", outros: outros || 0, dados, opcoes, url: a.tipo === "nando" ? null : a.origem_url, expira_em: p.expira_em,
  });
});
