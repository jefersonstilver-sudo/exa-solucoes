// =====================================================================
// NANDO - qualidade (v49, 05/11/2026, depois do caso Omoiru)
//  1) ler_referencia: a IA de visao le as imagens/PDF de referencia do sindico e devolve um JSON estruturado
//     (textos exatos, destaques, cores, estilo, numeracao). Fica gravado na conversa (nando_mensagens/sistema).
//  2) travas em CODIGO (nao so no prompt):
//     - criar com referencia exige que a pessoa tenha respondido DEPOIS da leitura (o Nando confirmou o entendimento)
//     - revisor de designer antes de qualquer previa: texto deterministico + nota da IA (minimo 99)
//     - publicar exige aprovacao literal da pessoa DEPOIS do link da previa (pergunta nao vale)
//  3) QR do Nando sempre rastreado (exa_qr_links + exa-qr)
// As funcoes puras (normalizar, conferirTextos, aprovacaoValida) sao testadas em scratchpad/nando49/teste.mjs.
// =====================================================================
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { telefoneCanonico, enviarTexto, ALERTA_NUMERO } from "./nando-core.ts";

const MODELOS = [Deno.env.get("NANDO_MODEL") || "claude-sonnet-5-5", "claude-sonnet-4-5"];
export const NOTA_MINIMA = 99;
const VALIDADE_REF_H = 6;

// ---------------------------------------------------------------- funcoes puras (testaveis)
export function normalizar(s: unknown): string {
  return String(s || "")
    .replace(/\*/g, "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9%/:,.\-; ]+/g, " ")
    .replace(/\s*([,.;:\-/])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export interface RefCartao { titulo?: string; subtitulo?: string; numeracao?: string; itens?: { texto: string; destaques?: string[] }[]; texto?: string; qr?: { tem?: boolean; legenda?: string }; rodape?: string }
export interface Referencia { arte_pronta?: boolean; cartoes: RefCartao[]; estilo?: { tipo?: string; cor_fundo?: string; cor_destaque?: string; descricao?: string }; observacoes?: string }

// Confere se os cartoes criados trazem EXATAMENTE os textos da referencia (nem a mais, nem a menos).
// criados: [{titulo, quando, texto, itens: string[]}] na ordem.
export function conferirTextos(ref: Referencia, criados: { titulo?: string; quando?: string; texto?: string; itens?: string[] }[]): string[] {
  const prob: string[] = [];
  const refItens = ref.cartoes.flatMap((c) => (c.itens || []).map((i) => i.texto)).filter(Boolean);
  const meusItens = criados.flatMap((c) => c.itens || []).filter(Boolean);
  const nRef = new Map<string, number>();
  for (const t of refItens) nRef.set(normalizar(t), (nRef.get(normalizar(t)) || 0) + 1);
  const nMeu = new Map<string, number>();
  for (const t of meusItens) nMeu.set(normalizar(t), (nMeu.get(normalizar(t)) || 0) + 1);
  for (const t of refItens) if (!nMeu.has(normalizar(t))) prob.push(`item da referência faltando ou com texto mudado: "${t}"`);
  for (const t of meusItens) if (!nRef.has(normalizar(t))) prob.push(`item que NÃO existe na referência (inventado ou reescrito): "${t}"`);
  // ordem: os itens em comum precisam estar na mesma sequencia
  const comuns = meusItens.map(normalizar).filter((t) => nRef.has(t));
  const ordemRef = refItens.map(normalizar).filter((t) => nMeu.has(t));
  if (!prob.length && comuns.join("|") !== ordemRef.join("|")) prob.push("os itens estão fora da ordem da referência");
  // titulo: as palavras do titulo da referencia precisam estar no titulo criado
  const refTit = normalizar(ref.cartoes[0]?.titulo);
  if (refTit) {
    const meuTit = normalizar(criados.map((c) => c.titulo).find(Boolean));
    const faltam = refTit.split(" ").filter((w) => w.length > 2 && !meuTit.includes(w));
    if (faltam.length) prob.push(`título diferente da referência ("${ref.cartoes[0].titulo}"): faltam ${faltam.join(", ")}`);
  }
  // quantidade de cartoes quando a referencia e uma serie numerada
  const total = ref.cartoes.length;
  if (total > 1 && ref.cartoes.some((c) => c.numeracao) && criados.length !== total) prob.push(`a referência tem ${total} cartões e foram criados ${criados.length}`);
  return prob;
}

// Aprovacao literal: a frase citada existe numa mensagem da pessoa, nao e pergunta e tem cara de aprovacao.
const APROVA = /\b(pode publicar|publica|publique|pode por|pode colocar|coloca|coloque|pode subir|sobe|manda|pode mandar|aprovad[oa]|aprovo|pode ir|ok|okay|beleza|perfeito|gostei|ficou (otimo|bom|lindo|perfeito|show)|isso mesmo|sim|pode ser|fechado|bora|vai|show)\b/;
const NEGA = /\b(nao (pode|publica|publique|coloca|coloque|quero|gostei|ta|esta|ficou)|ainda nao|nunca|espera|aguarda|calma|pera|retira|tira|tirar|refaz|muda|mudar|troca|trocar|corrige|corrigir)\b/;
export function aprovacaoValida(citacao: string, mensagensDepois: string[]): string | null {
  const q = normalizar(citacao);
  if (q.length < 2) return "cite a frase exata em que a pessoa aprovou (confirmacao).";
  const achou = mensagensDepois.find((m) => normalizar(m).includes(q));
  if (!achou) return "essa frase não está em nenhuma mensagem que a pessoa mandou DEPOIS do link da prévia. Pergunte \"Posso publicar?\" e espere a resposta.";
  if (/\?\s*$/.test(String(achou).trim())) return "a mensagem citada é uma PERGUNTA, não uma aprovação. Responda a pergunta e pergunte \"Posso publicar?\".";
  const n = normalizar(achou);
  if (NEGA.test(n)) return "a mensagem citada tem negação ou pedido para esperar/retirar. Não publique; confirme o que a pessoa quer.";
  if (!APROVA.test(n)) return "a mensagem citada não é uma aprovação clara. Pergunte \"Posso publicar?\".";
  return null;
}

// ---------------------------------------------------------------- Claude (visao / revisor)
async function claudeJson(system: string, content: any[], maxTokens = 3000): Promise<any> {
  const key = Deno.env.get("NANDO_ANTHROPIC_API_KEY");
  if (!key) throw new Error("NANDO_ANTHROPIC_API_KEY ausente");
  let ultimoErro = "";
  for (const model of MODELOS) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content }] }),
    });
    if (!r.ok) { ultimoErro = `${r.status} ${(await r.text()).slice(0, 200)}`; if (r.status === 404 || /model/i.test(ultimoErro)) continue; throw new Error("Claude " + ultimoErro); }
    const j = await r.json();
    const txt = (j.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("resposta sem JSON");
    return JSON.parse(m[0]);
  }
  throw new Error("Claude " + ultimoErro);
}

const SISTEMA_LEITURA = `Você é um designer gráfico sênior que LÊ peças de referência com precisão absoluta.
Recebe imagens (ou PDF) que um síndico mandou como referência de aviso para a tela do elevador.
Devolva SÓ um JSON, sem comentários:
{"arte_pronta": true|false,  // true = já é um cartaz/arte finalizada (layout, ícones, numeração, logo); false = foto de papel, print de texto, rascunho
 "cartoes": [ {"numeracao":"1/3"|null, "titulo":"texto EXATO do título", "subtitulo":"faixa/linha abaixo do título, EXATA"|null,
   "itens":[{"texto":"texto EXATO do item, com a pontuação","destaques":["trechos que aparecem em outra cor/negrito"],"icone":"o que o ícone mostra, 1-3 palavras"}],
   "texto":"texto corrido, se não houver itens"|null, "qr":{"tem":true|false,"legenda":"texto EXATO ao lado do QR"|null}, "rodape":"assinatura EXATA"|null } ],
 "estilo": {"tipo":"suave"|"claro"|"escuro"|"foto", "cor_fundo":"#RRGGBB (cor dominante do fundo)", "cor_destaque":"#RRGGBB (cor do título/destaques)", "descricao":"1 frase: fundo, cores, ícones 3D?, cantos"},
 "observacoes":"o que for importante e não coube acima (ex: falta um cartão da série, texto cortado, data passada)"}
Regras: copie os textos LETRA POR LETRA (não resuma, não corrija, não traduza). Um objeto em "cartoes" por imagem/página, na ordem da numeração.
"suave" = fundo claro colorido/pastel (rosa, azul-bebê...) com destaques numa cor forte; "claro" = fundo branco/cinza; "escuro" = fundo escuro; "foto" = foto de fundo.`;

export async function lerReferencia(sb: SupabaseClient, tel: string, midias: { id: string; mime: string; url: string }[], pedido: string): Promise<Referencia> {
  const content: any[] = [];
  for (const m of midias.slice(0, 6)) {
    if (m.mime.includes("pdf")) content.push({ type: "document", source: { type: "url", url: m.url } });
    else content.push({ type: "image", source: { type: "url", url: m.url } });
    content.push({ type: "text", text: `(arquivo ${m.id})` });
  }
  content.push({ type: "text", text: `Pedido da pessoa (palavras dela): ${pedido || "(sem texto)"}` });
  const ref = await claudeJson(SISTEMA_LEITURA, content) as Referencia;
  if (!Array.isArray(ref?.cartoes)) throw new Error("leitura sem cartões");
  await sb.from("nando_mensagens").insert({
    telefone: telefoneCanonico(tel), papel: "sistema",
    conteudo: { referencia: ref, midias: midias.map((m) => m.id), texto: `referência lida (${midias.map((m) => m.id).join(", ")}): ${resumoReferencia(ref)}` },
  });
  return ref;
}

export function resumoReferencia(ref: Referencia): string {
  const itens = ref.cartoes.reduce((s, c) => s + (c.itens?.length || 0), 0);
  const cards = ref.cartoes.map((c, i) => `cartão ${c.numeracao || i + 1}: título "${c.titulo || "-"}"${c.subtitulo ? ` / "${c.subtitulo}"` : ""}; itens: ${(c.itens || []).map((x) => `"${x.texto}"${x.destaques?.length ? ` (destaque: ${x.destaques.join(" | ")})` : ""}`).join("; ") || "-"}${c.texto ? `; texto: "${c.texto}"` : ""}${c.qr?.tem ? `; QR: "${c.qr.legenda || ""}"` : ""}`).join("\n");
  return `${ref.arte_pronta ? "ARTE PRONTA" : "rascunho/documento"} · ${ref.cartoes.length} cartão(ões), ${itens} itens · estilo ${ref.estilo?.tipo || "?"} (fundo ${ref.estilo?.cor_fundo || "?"}, destaque ${ref.estilo?.cor_destaque || "?"}; ${ref.estilo?.descricao || ""})\n${cards}${ref.observacoes ? `\nObservações: ${ref.observacoes}` : ""}`;
}

// referencia lida nas ultimas horas nesta conversa + se a pessoa ja respondeu depois dela
export async function referenciaAtiva(sb: SupabaseClient, tel: string): Promise<{ ref: Referencia; id: number; respondeu: boolean; midias: string[] } | null> {
  const desde = new Date(Date.now() - VALIDADE_REF_H * 3600000).toISOString();
  const { data } = await sb.from("nando_mensagens").select("id,conteudo").eq("telefone", telefoneCanonico(tel)).eq("papel", "sistema")
    .not("conteudo->referencia", "is", null).gte("created_at", desde).order("id", { ascending: false }).limit(1);
  const r = data?.[0];
  if (!r?.conteudo?.referencia) return null;
  if (r.conteudo.descartada) return null;
  const { data: depois } = await sb.from("nando_mensagens").select("id").eq("telefone", telefoneCanonico(tel)).eq("papel", "sindico").gt("id", r.id).limit(1);
  return { ref: r.conteudo.referencia, id: r.id, respondeu: !!depois?.length, midias: Array.isArray(r.conteudo.midias) ? r.conteudo.midias : [] };
}

export async function descartarReferencia(sb: SupabaseClient, tel: string) {
  const ativa = await referenciaAtiva(sb, tel);
  if (!ativa) return;
  const { data } = await sb.from("nando_mensagens").select("conteudo").eq("id", ativa.id).single();
  await sb.from("nando_mensagens").update({ conteudo: { ...(data?.conteudo || {}), descartada: true } }).eq("id", ativa.id);
}

// ---------------------------------------------------------------- revisor de designer
const SISTEMA_REVISOR = `Você é o DIRETOR DE ARTE da EXA Mídia revisando um aviso de condomínio ANTES de o síndico ver a prévia.
O aviso aparece numa tela vertical de elevador, lida de longe, por poucos segundos. Você recebe: o pedido do síndico (palavras dele),
a referência lida das imagens dele (se houver) e o JSON dos cartões criados (estilo, cores, título, linha "quando", texto, itens, QR).
Dê uma nota de 0 a 100 de quanto o aviso cumpre EXATAMENTE o pedido. Desconte:
- -40 texto mudado, resumido, inventado ou faltando em relação à referência/pedido (regras, datas, nomes, título);
- -30 estilo/cores diferentes do que foi pedido ou da referência (ex: pediu fundo rosa claro e veio escuro/branco; destaque em outra cor);
- -20 ordem ou divisão de cartões diferente da referência;
- -10 cada problema de leitura: título longo demais (>32 caracteres por linha), item > 90 caracteres, erro de português, informação confusa;
- -10 QR faltando quando a referência/documento tem QR; assinatura errada.
Não desconte por ícones diferentes (a biblioteca é fixa) nem por enfeites (corações, folhas).
Se a referência é DOCUMENTO (arte_pronta=false: regimento, comunicado, foto de papel), os itens podem ser encurtados para caber na tela, mas sem perder nenhuma regra, data, horário ou nome, e sem mudar o sentido.
Se a referência é ARTE PRONTA, o texto tem que ser idêntico.
Só desconte por problema CONCRETO desta lista; sem problema concreto a nota é 100. Gosto pessoal não desconta.
Devolva SÓ JSON: {"nota": 0-100, "problemas": ["frase curta e concreta, com o que corrigir"], "ok": ["o que está certo"]}`;

export interface RevisaoResultado { nota: number; problemas: string[]; aprovado: boolean }
export async function revisarAviso(opts: { pedido: string; ref: Referencia | null; cartoes: any[]; refCartoes?: number[] }): Promise<RevisaoResultado> {
  // so os cartoes da referencia que a pessoa pediu agora (ex: refazer so o 2/3)
  const ref: Referencia | null = opts.ref && opts.refCartoes?.length ? { ...opts.ref, cartoes: opts.ref.cartoes.filter((_, k) => opts.refCartoes!.includes(k + 1)) } : opts.ref;
  const limpos = opts.cartoes.map((d) => ({
    estilo: d.estilo || "escuro", cor: d.cor, cor_fundo: d.cor_fundo, titulo: d.titulo, quando: d.quando, texto: d.texto,
    itens: (d.itens || []).map((i: any) => typeof i === "string" ? i : i?.texto), parte: d.parte, qr: !!d.qr, qr_legenda: d.qr_legenda, assinatura: d.assinatura,
    tem_foto_fundo: !!d.fundo && !d.fundo_nitido,
  }));
  const problemas: string[] = [];
  const exato = !!ref?.arte_pronta; // arte pronta: texto identico; documento: o revisor (IA) confere o sentido
  if (ref && exato) problemas.push(...conferirTextos(ref, limpos.map((c) => ({ ...c, titulo: String(c.titulo || "").replace(/\n/g, " ") }))));
  let nota = 100;
  try {
    const r = await claudeJson(SISTEMA_REVISOR, [{ type: "text", text:
      `PEDIDO DO SÍNDICO:\n${opts.pedido || "(sem texto)"}\n\nREFERÊNCIA LIDA:\n${ref ? JSON.stringify(ref) : "(nenhuma)"}\n\nCARTÕES CRIADOS:\n${JSON.stringify(limpos)}` }], 1500);
    nota = Math.max(0, Math.min(100, Number(r?.nota) || 0));
    for (const p of (Array.isArray(r?.problemas) ? r.problemas : [])) if (String(p).trim()) problemas.push(String(p).trim());
  } catch (e) {
    // revisor fora do ar: so a checagem deterministica decide (nunca trava o sindico por falha nossa)
    console.error("[NANDO] revisor", (e as Error).message);
    nota = problemas.length ? 0 : 100;
  }
  const det = ref && exato ? conferirTextos(ref, limpos.map((c) => ({ ...c, titulo: String(c.titulo || "").replace(/\n/g, " ") }))) : [];
  if (det.length) nota = Math.min(nota, 60);
  return { nota, problemas: [...new Set(problemas)], aprovado: nota >= NOTA_MINIMA && !det.length };
}

// ---------------------------------------------------------------- confirmacao antes de publicar
export async function mensagensDepoisDaPrevia(sb: SupabaseClient, tel: string): Promise<{ temPrevia: boolean; textos: string[] }> {
  const t = telefoneCanonico(tel);
  const { data: prev } = await sb.from("nando_mensagens").select("id").eq("telefone", t).in("papel", ["nando", "humano"])
    .ilike("conteudo->>texto", "%/nando/previa/%").order("id", { ascending: false }).limit(1);
  if (!prev?.length) return { temPrevia: false, textos: [] };
  const { data: depois } = await sb.from("nando_mensagens").select("conteudo").eq("telefone", t).eq("papel", "sindico").gt("id", prev[0].id).order("id");
  return { temPrevia: true, textos: (depois || []).map((d: any) => String(d.conteudo?.texto || "").replace(/^\[áudio transcrito\]:\s*/, "")) };
}

// ---------------------------------------------------------------- QR rastreado
export async function qrRastreado(sb: SupabaseClient, destino: string, predio: string, titulo: string): Promise<string> {
  const base = "https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa-qr?c=";
  const { data: ja } = await sb.from("exa_qr_links").select("codigo").eq("destino_url", destino).eq("ativo", true).limit(1);
  if (ja?.length) return base + ja[0].codigo;
  for (let i = 0; i < 4; i++) {
    const codigo = "N" + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
    const { error } = await sb.from("exa_qr_links").insert({ codigo, cliente: predio.slice(0, 80), campanha: "Aviso Nando", titulo: titulo.slice(0, 120), formato: "aviso painel", destino_url: destino });
    if (!error) return base + codigo;
  }
  return destino; // nunca deixa o aviso sem QR por falha do rastreio
}

// ---------------------------------------------------------------- copia ao CEO (supervisao inicial)
export async function copiaCeo(sb: SupabaseClient, texto: string) {
  const ate = Date.parse(Deno.env.get("NANDO_COPIA_CEO_ATE") || "2026-11-20T00:00:00-03:00");
  if (Date.now() > ate) return;
  try { await enviarTexto(sb, ALERTA_NUMERO, texto); } catch (e) { console.error("[NANDO] copia ceo", (e as Error).message); }
}
