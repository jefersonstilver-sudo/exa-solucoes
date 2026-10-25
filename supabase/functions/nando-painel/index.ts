// =====================================================================
// NANDO - painel do sindico no site (examidia.com.br/nando/painel e os links /nando/predio/...)
// Acesso so com codigo de 6 digitos enviado pelo Nando no WhatsApp do numero cadastrado no predio.
//  - entrar: codigo -> acesso de 12 h (ou 30 dias com "lembrar este aparelho")
//  - alterar qualquer aviso pelo site: pede um codigo NOVO na hora (vale 15 min), mesmo com o aparelho lembrado
// Regras: codigo vale 10 min, 5 tentativas, 3 codigos por hora por numero; guardamos so o hash.
// =====================================================================
import {
  db, ehAdmin, prediosDoTelefone, todosPredios, telefoneCanonico, enviarTexto, lerTokenCarteira, lerTokenPredio,
  primeiroNome, registrarOcorrencia, type Predio, EXASISTEMA_URL,
} from "../_shared/nando-core.ts";
import { avisosDoPredio } from "../_shared/nando-site.ts";
import { executar, type Contexto } from "../_shared/nando-agente.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

const NANDO_WHATS = "554591132351";
const MIN_CODIGO = 10, MAX_TENTATIVAS = 5, MAX_POR_HORA = 3;
const HORAS_ACESSO = 12, DIAS_LEMBRAR = 30, MIN_ALTERAR = 15;

async function sha(t: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("nando-painel:" + t));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
function aleatorio(bytes = 32) { return Array.from(crypto.getRandomValues(new Uint8Array(bytes))).map((x) => x.toString(16).padStart(2, "0")).join(""); }
function codigo6() { const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000; return String(n).padStart(6, "0"); }
function mascarar(tel: string) {
  const d = telefoneCanonico(tel).replace(/^55/, "");
  return d.length >= 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 3)}••••-${d.slice(-4)}` : "••••" + d.slice(-4);
}

async function predios(sb: ReturnType<typeof db>, tel: string): Promise<{ lista: Predio[]; nome: string; admin: boolean }> {
  const admin = ehAdmin(tel);
  const { predios: meus, nome } = await prediosDoTelefone(sb, tel);
  return { lista: admin ? await todosPredios(sb) : meus, nome: admin ? "Jeferson" : nome, admin };
}

// numero de quem vai receber o codigo: digitado ou (link da carteira) o dono do link
async function resolverTelefone(sb: ReturnType<typeof db>, b: any): Promise<{ tel: string; erro?: string }> {
  if (b.link) {
    const cart = await lerTokenCarteira(String(b.link));
    if (cart) return { tel: telefoneCanonico(cart.telefone) };
  }
  const tel = telefoneCanonico(String(b.telefone || ""));
  if (tel.replace(/\D/g, "").length < 12) return { tel: "", erro: "Digite o celular com DDD." };
  if (b.link) {
    // link de um predio: o numero precisa ser de quem cuida desse predio
    const t = await lerTokenPredio(String(b.link));
    if (t) { const { lista } = await predios(sb, tel); if (!lista.some((p) => p.id === t.buildingId)) return { tel: "", erro: "Esse número não está cadastrado neste prédio. Use o celular do síndico ou da administração." }; }
  }
  return { tel };
}

async function sessaoValida(sb: ReturnType<typeof db>, token: string) {
  if (!token) return null;
  const { data } = await sb.from("nando_painel_acessos").select("*").eq("token_hash", await sha(token)).maybeSingle();
  if (!data || data.revogada || new Date(data.expira_em) < new Date()) return null;
  await sb.from("nando_painel_acessos").update({ ultimo_uso: new Date().toISOString() }).eq("id", data.id);
  return data;
}

async function pedirCodigo(sb: ReturnType<typeof db>, b: any) {
  let tel = "", finalidade = b.finalidade === "alterar" ? "alterar" : "acesso", sessaoId: string | null = null;
  if (finalidade === "alterar") {
    const s = await sessaoValida(sb, String(b.sessao || ""));
    if (!s) return json(401, { ok: false, erro: "Seu acesso expirou. Entre de novo." });
    tel = s.telefone; sessaoId = s.id;
  } else {
    const r = await resolverTelefone(sb, b);
    if (r.erro) return json(400, { ok: false, erro: r.erro });
    tel = r.tel;
  }
  const { lista } = await predios(sb, tel);
  if (!lista.length) return json(400, { ok: false, erro: "Esse número não está cadastrado em nenhum prédio da EXA. Fale com o Nando no WhatsApp." });
  const umaHora = new Date(Date.now() - 3600000).toISOString();
  const { count } = await sb.from("nando_painel_codigos").select("id", { count: "exact", head: true }).eq("telefone", tel).gte("created_at", umaHora);
  if ((count || 0) >= MAX_POR_HORA) return json(429, { ok: false, erro: "Muitos códigos pedidos. Espere um pouco e tente de novo." });
  const cod = codigo6();
  await sb.from("nando_painel_codigos").update({ usado: true }).eq("telefone", tel).eq("finalidade", finalidade).eq("usado", false);
  const { error: errIns } = await sb.from("nando_painel_codigos").insert({ telefone: tel, finalidade, codigo_hash: await sha(tel + ":" + cod), sessao_id: sessaoId, expira_em: new Date(Date.now() + MIN_CODIGO * 60000).toISOString() });
  // so manda o codigo se ele ficou guardado (senao a pessoa receberia um codigo que nunca funciona)
  if (errIns) { console.error("[PAINEL] gravar codigo", errIns.message); return json(500, { ok: false, erro: "Não consegui gerar o código agora. Tente de novo em instantes." }); }
  const fmt = `${cod.slice(0, 3)} ${cod.slice(3)}`;
  const texto = finalidade === "alterar"
    ? `🔐 Código para confirmar a alteração no painel do síndico: *${fmt}*\n\nVale ${MIN_CODIGO} minutos. Se não foi você, ignore e me avise.`
    : `🔐 Seu código de acesso ao painel de avisos da EXA: *${fmt}*\n\nVale ${MIN_CODIGO} minutos. Não passe para ninguém: a EXA nunca pede esse código.`;
  try { await enviarTexto(sb, tel, texto); } catch (e) {
    await registrarOcorrencia(sb, { tipo: "erro", telefone: tel, nome: "", building_id: null, descricao: `Código do painel não enviado: ${(e as Error).message}` }).catch(() => {});
    return json(502, { ok: false, erro: "Não consegui enviar o código pelo WhatsApp agora. Tente de novo em instantes." });
  }
  return json(200, { ok: true, destino: mascarar(tel), validade_min: MIN_CODIGO, telefone: finalidade === "acesso" ? tel : undefined });
}

async function verificar(sb: ReturnType<typeof db>, b: any) {
  const finalidade = b.finalidade === "alterar" ? "alterar" : "acesso";
  let tel = "", sess: any = null;
  if (finalidade === "alterar") {
    sess = await sessaoValida(sb, String(b.sessao || ""));
    if (!sess) return json(401, { ok: false, erro: "Seu acesso expirou. Entre de novo." });
    tel = sess.telefone;
  } else {
    const r = await resolverTelefone(sb, b);
    if (r.erro) return json(400, { ok: false, erro: r.erro });
    tel = r.tel;
  }
  const cod = String(b.codigo || "").replace(/\D/g, "");
  const { data: c } = await sb.from("nando_painel_codigos").select("*").eq("telefone", tel).eq("finalidade", finalidade).eq("usado", false)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!c || new Date(c.expira_em) < new Date()) return json(400, { ok: false, erro: "Esse código expirou. Peça um novo." });
  if (c.tentativas >= MAX_TENTATIVAS) return json(429, { ok: false, erro: "Muitas tentativas erradas. Peça um código novo." });
  if (cod.length !== 6 || (await sha(tel + ":" + cod)) !== c.codigo_hash) {
    await sb.from("nando_painel_codigos").update({ tentativas: c.tentativas + 1 }).eq("id", c.id);
    const resta = MAX_TENTATIVAS - c.tentativas - 1;
    return json(400, { ok: false, erro: resta > 0 ? `Código errado. Você ainda tem ${resta} tentativa${resta > 1 ? "s" : ""}.` : "Código errado. Peça um código novo." });
  }
  await sb.from("nando_painel_codigos").update({ usado: true }).eq("id", c.id);
  if (finalidade === "alterar") {
    const ate = new Date(Date.now() + MIN_ALTERAR * 60000).toISOString();
    await sb.from("nando_painel_acessos").update({ alterar_ate: ate }).eq("id", sess.id);
    return json(200, { ok: true, alterar_ate: ate });
  }
  const token = aleatorio();
  const lembrar = !!b.lembrar;
  const expira = new Date(Date.now() + (lembrar ? DIAS_LEMBRAR * 86400000 : HORAS_ACESSO * 3600000)).toISOString();
  const { error: errSes } = await sb.from("nando_painel_acessos").insert({ token_hash: await sha(token), telefone: tel, aparelho: String(b.aparelho || "").slice(0, 160), lembrar, expira_em: expira });
  if (errSes) { console.error("[PAINEL] gravar acesso", errSes.message); return json(500, { ok: false, erro: "Não consegui liberar o acesso agora. Tente de novo." }); }
  return json(200, { ok: true, sessao: token, expira_em: expira });
}

async function dados(sb: ReturnType<typeof db>, b: any) {
  const s = await sessaoValida(sb, String(b.sessao || ""));
  if (!s) return json(401, { ok: false, erro: "Seu acesso expirou. Entre de novo com o código do WhatsApp.", precisa_login: true });
  const { lista, nome, admin } = await predios(sb, s.telefone);
  // o link aberto pode focar um predio
  let foco: string | null = null;
  if (b.link) { const t = await lerTokenPredio(String(b.link)); if (t) foco = t.buildingId.slice(0, 8); }
  const grupos = await Promise.all(lista.map(async (p) => ({ id: p.id.slice(0, 8), predio: p.nome, codigo: p.codigo, avisos: await avisosDoPredio(sb, p).catch(() => []) })));
  const { count: aparelhos } = await sb.from("nando_painel_acessos").select("id", { count: "exact", head: true }).eq("telefone", s.telefone).eq("revogada", false).gt("expira_em", new Date().toISOString());
  return json(200, {
    ok: true, pessoa: nome || "", primeiro_nome: primeiroNome(nome || "") || "", admin, telefone: mascarar(s.telefone),
    expira_em: s.expira_em, lembrar: s.lembrar, alterar_ate: s.alterar_ate, aparelhos: aparelhos || 1,
    foco, predios: grupos, whatsapp_nando: NANDO_WHATS,
  });
}

// alteracoes pelo site usam as MESMAS regras e ferramentas do Nando (confere o painel, historico, grupo de predios)
async function alterar(sb: ReturnType<typeof db>, b: any) {
  const s = await sessaoValida(sb, String(b.sessao || ""));
  if (!s) return json(401, { ok: false, erro: "Seu acesso expirou. Entre de novo.", precisa_login: true });
  if (!s.alterar_ate || new Date(s.alterar_ate) < new Date()) return json(403, { ok: false, precisa_codigo: true, erro: "Para alterar pelo site, confirme com o código que o Nando vai mandar no WhatsApp." });
  const { lista, nome, admin } = await predios(sb, s.telefone);
  const c: Contexto = { sb, tel: s.telefone, nomePessoa: `${nome || "Síndico"} (pelo site)`, admin, predios: admin ? [] : lista, predioAtual: null, midias: {}, registros: [] };
  const aviso = String(b.aviso || "").replace(/[^0-9a-f]/gi, "").slice(0, 8);
  if (aviso.length !== 8) return json(400, { ok: false, erro: "Aviso inválido." });
  const todos = !!b.todos_os_predios;
  let r: unknown;
  try {
    switch (b.operacao) {
      case "remover": r = await executar(c, "remover_aviso", { aviso, todos_os_predios: todos }); break;
      case "datas": r = await executar(c, "alterar_aviso", { aviso, todos_os_predios: todos, ...(b.sem_fim ? { sem_fim: true } : b.fim ? { fim: String(b.fim) } : {}), ...(b.inicio ? { inicio: String(b.inicio) } : {}) }); break;
      case "tempo": r = await executar(c, "alterar_aviso", { aviso, todos_os_predios: todos, segundos: Number(b.segundos) }); break;
      case "texto": r = await executar(c, "editar_aviso", { aviso, todos_os_predios: todos, titulo: b.titulo || undefined, quando: b.quando, texto: b.texto, itens: Array.isArray(b.itens) && b.itens.some((x: unknown) => String(x).trim()) ? b.itens.filter((x: unknown) => String(x).trim()) : undefined }); break;
      default: return json(400, { ok: false, erro: "Operação inválida." });
    }
  } catch (e) { return json(400, { ok: false, erro: (e as Error).message }); }
  const texto = typeof r === "string" ? r : (r as any)?.texto || "";
  // conta para o sindico no WhatsApp o que mudou pelo site (fica registrado na conversa)
  try { await sb.from("nando_mensagens").insert({ telefone: telefoneCanonico(s.telefone), papel: "nando", conteudo: { texto: `(pelo painel do site) ${texto.split("\n(")[0].slice(0, 600)}` } }); } catch { /* so registro */ }
  return json(200, { ok: !/ERRO|NÃO/.test(texto), resultado: texto.split("\n(")[0] });
}

// ---------- replica web do painel: o MESMO updates.json que o NUC do predio le (ExaSistema), ao vivo ----------
async function exaSistema(caminho: string): Promise<any> {
  const key = Deno.env.get("EXASISTEMA_ANON_KEY");
  if (!key) throw new Error("sem chave do ExaSistema");
  const r = await fetch(`${EXASISTEMA_URL}/rest/v1/${caminho}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`ExaSistema ${r.status}`);
  return await r.json();
}
const ehServico = (req: Request) => (req.headers.get("Authorization") || "").replace("Bearer ", "") === (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "-");
async function replica(sb: ReturnType<typeof db>, b: any, servico: boolean) {
  let lista: Predio[];
  if (servico) lista = await todosPredios(sb);
  else {
    const s = await sessaoValida(sb, String(b.sessao || ""));
    if (!s) return json(401, { ok: false, erro: "Entre no painel do síndico para ver a tela ao vivo.", precisa_login: true });
    lista = (await predios(sb, s.telefone)).lista;
  }
  const arq = String(b.arq || "updates");
  if (arq === "predios") return json(200, { ok: true, predios: lista.map((p) => ({ id: p.id.slice(0, 8), predio: p.nome })) });
  if (arq === "noticias") {
    const rows = await exaSistema("noticias?select=*&order=created_at.desc&limit=60").catch(() => []);
    if (b.diag && servico) return json(200, { ok: true, colunas: Object.keys(rows?.[0] || {}), exemplo: (rows || []).slice(0, 2) });
    return json(200, { ok: true, linhas: rows || [] });
  }
  const id = String(b.predio || "").toLowerCase();
  const p = lista.find((x) => x.id.startsWith(id) && id.length >= 4);
  if (!p) return json(403, { ok: false, erro: "Esse prédio não está no seu acesso." });
  const rows = await exaSistema(`updates_clientes?cliente_id=eq.${encodeURIComponent(p.cliente_id)}&select=json_data`);
  const j = rows?.[0]?.json_data;
  if (!j) return json(404, { ok: false, erro: "A tela desse prédio ainda não tem programação." });
  if (b.diag && servico) return json(200, { ok: true, chaves: Object.keys(j), pasta_s3: j.pasta_s3, ex_playlist: (j.PlaylistPronta || []).slice(0, 2), ex_aviso: (j.CondominiumNotices || []).slice(0, 2) });
  return json(200, { ok: true, predio: p.nome, updates: j });
}

async function sair(sb: ReturnType<typeof db>, b: any) {
  const s = await sessaoValida(sb, String(b.sessao || ""));
  if (!s) return json(200, { ok: true });
  if (b.todos) await sb.from("nando_painel_acessos").update({ revogada: true }).eq("telefone", s.telefone);
  else await sb.from("nando_painel_acessos").update({ revogada: true }).eq("id", s.id);
  return json(200, { ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false });
  const b = await req.json().catch(() => ({}));
  const sb = db();
  try {
    switch (b.acao) {
      case "pedir_codigo": return await pedirCodigo(sb, b);
      case "verificar": return await verificar(sb, b);
      case "dados": return await dados(sb, b);
      case "alterar": return await alterar(sb, b);
      case "sair": return await sair(sb, b);
      case "replica": return await replica(sb, b, ehServico(req));
      default: return json(400, { ok: false, erro: "ação inválida" });
    }
  } catch (e) {
    console.error("[PAINEL]", (e as Error).message);
    return json(500, { ok: false, erro: "Algo deu errado. Tente de novo." });
  }
});
