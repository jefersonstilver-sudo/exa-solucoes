// =====================================================================
// NANDO - cadastro de PREDIO INTERESSADO (sindico/administradora de um predio que ainda nao e da EXA
// e quer a tela). O Nando conversa, junta os mesmos dados do formulario publico (/interessesindico/formulario),
// mostra um resumo, e so com a confirmacao grava em sindicos_interessados (lista do admin) e avisa o Jeferson.
// O rascunho da conversa fica em nando_estado.dados.cadastro_interessado (sobrevive a janela de 2 h do historico).
// O aceite do termo NAO e feito no chat: o termo/contrato formal e enviado pela equipe da EXA depois da analise.
// =====================================================================
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { telefoneCanonico, chavesTelefone, enviarTexto, ALERTA_NUMERO, SITE_URL } from "./nando-core.ts";

const BUCKET_NANDO = "nando-midia";
const BUCKET_FOTOS = "fotos-sindicos";      // mesmo bucket das fotos do formulario (o admin assina as URLs dele)
const MAX_FOTOS = 5;

// o que o cadastro precisa do contexto do Nando (subconjunto do Contexto do nando-agente)
export interface CtxCadastro {
  sb: SupabaseClient;
  tel: string;
  nomePessoa: string;
  midias: Record<string, { mime: string; caminho: string; url: string }>;
  registros: string[];
}

// ---------------------------------------------------------------- normalizacao
const sem = (t: unknown) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
function txt(v: unknown, max = 200): string | undefined {
  const s = String(v ?? "").replace(/[<>"']/g, "").replace(/\s+/g, " ").trim();
  return s ? s.slice(0, max) : undefined;
}
function inteiro(v: unknown): number | undefined {
  const n = parseInt(String(v ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
function normOperadoras(v: unknown): string[] | undefined {
  const lista = (Array.isArray(v) ? v : String(v ?? "").split(/[,;/]| e /)).map((x) => String(x).trim()).filter(Boolean);
  if (!lista.length) return undefined;
  const out: string[] = [];
  for (const o of lista) {
    const s = sem(o);
    const nome = /vivo/.test(s) ? "Vivo" : /ligga|copel/.test(s) ? "Ligga" : /telecom\s*foz|telecomfoz/.test(s) ? "Telecom Foz"
      : /nao sei|não sei|nenhuma|desconhec/.test(s) ? "" : txt(o, 40) || "";
    if (nome && !out.includes(nome)) out.push(nome);
  }
  return out;
}
// a tabela so aceita Atlas/TKE/Otis/Oriente (trigger validar_sindico_interessado); outra empresa vai para as observacoes
function normElevador(v: unknown): { empresa: string | null; outra?: string } | undefined {
  const s = sem(v);
  if (!s) return undefined;
  if (/atlas|schindler/.test(s)) return { empresa: "Atlas" };
  if (/tke|thyssen/.test(s)) return { empresa: "TKE" };
  if (/otis/.test(s)) return { empresa: "Otis" };
  if (/oriente/.test(s)) return { empresa: "Oriente" };
  if (/nao sei|desconhec/.test(s)) return { empresa: null, outra: "não sabe" };
  return { empresa: null, outra: txt(v, 60) };
}
function normCasaMaquinas(v: unknown): "sim" | "nao" | "nao_sei" | undefined {
  const s = sem(v).replace(/_/g, " ");
  if (!s) return undefined;
  if (/nao sei|talvez|nao tenho certeza|desconhec/.test(s)) return "nao_sei";
  if (/^(sim|s|tem|possui|yes)\b/.test(s)) return "sim";
  if (/^(nao|n|no)\b|nao tem|sem casa/.test(s)) return "nao";
  return undefined;
}
function normCep(v: unknown): string | undefined {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : undefined;
}
function normEmail(v: unknown): string | undefined {
  const e = String(v ?? "").trim().toLowerCase();
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e) ? e : undefined;
}
function nomePredioChave(n: unknown): string {
  return sem(n).replace(/\b(edificio|edif|ed|condominio|cond|residencial|resid|torre|predio)\b\.?/g, " ").replace(/[^a-z0-9]+/g, "");
}

// ---------------------------------------------------------------- rascunho (nando_estado.dados.cadastro_interessado)
type Rascunho = Record<string, any>;

async function lerEstado(c: CtxCadastro): Promise<Record<string, any>> {
  const { data } = await c.sb.from("nando_estado").select("dados").eq("telefone", telefoneCanonico(c.tel)).maybeSingle();
  return (data?.dados && typeof data.dados === "object") ? data.dados as Record<string, any> : {};
}
async function gravarRascunho(c: CtxCadastro, r: Rascunho | null, extra: Record<string, unknown> = {}) {
  const dados = await lerEstado(c);
  const novo = { ...dados, ...extra, cadastro_interessado: r };
  // upsert so com telefone/dados: nao mexe no predio escolhido (building_id) de quem ja e sindico
  await c.sb.from("nando_estado").upsert({ telefone: telefoneCanonico(c.tel), dados: novo, updated_at: new Date().toISOString() });
}
export async function rascunhoAtual(c: CtxCadastro): Promise<Rascunho | null> {
  const r = (await lerEstado(c)).cadastro_interessado;
  if (!r || typeof r !== "object") return null;
  // rascunho parado ha mais de 30 dias nao vale mais
  if (r.atualizado_em && Date.now() - new Date(r.atualizado_em).getTime() > 30 * 86400000) return null;
  return r;
}

function aplicar(r: Rascunho, e: any): string[] {
  const avisos: string[] = [];
  const set = (k: string, v: unknown) => { if (v !== undefined && v !== null && v !== "") r[k] = v; };
  set("nome_predio", txt(e.nome_predio, 120));
  set("logradouro", txt(e.logradouro, 200));
  set("numero", txt(e.numero, 20));
  set("complemento", txt(e.complemento, 100));
  set("bairro", txt(e.bairro, 100));
  set("cidade", txt(e.cidade, 100));
  if (e.uf) { const uf = String(e.uf).replace(/[^a-z]/gi, "").toUpperCase(); if (uf.length === 2) r.uf = uf; else avisos.push("UF deve ter 2 letras (ex: PR)"); }
  if (e.cep) { const cep = normCep(e.cep); if (cep) r.cep = cep; else avisos.push("CEP inválido (precisa de 8 dígitos) — não guardei"); }
  set("andares", inteiro(e.andares));
  set("blocos", inteiro(e.blocos));
  set("unidades", inteiro(e.unidades));
  set("elevadores_sociais", inteiro(e.elevadores_sociais));
  if (e.tipo_predio) { const s = sem(e.tipo_predio); r.tipo_predio = /comerc/.test(s) ? "comercial" : /resid/.test(s) ? "residencial" : r.tipo_predio; }
  if (e.permite_airbnb !== undefined && e.permite_airbnb !== null && e.permite_airbnb !== "") {
    const s = sem(e.permite_airbnb); r.permite_airbnb = /^(sim|s|permite|true)/.test(s) || e.permite_airbnb === true ? "sim" : /^(nao|n|false)/.test(s) || e.permite_airbnb === false ? "nao" : r.permite_airbnb;
  }
  if (e.internet_operadoras !== undefined) {
    const ops = normOperadoras(e.internet_operadoras);
    if (ops) { r.internet_operadoras = ops; r.internet_nao_sabe = ops.length === 0; }
  }
  if (e.empresa_elevador) {
    const el = normElevador(e.empresa_elevador);
    if (el) { r.empresa_elevador = el.empresa; r.empresa_elevador_outra = el.outra || null; }
  }
  if (e.casa_maquinas) { const cm = normCasaMaquinas(e.casa_maquinas); if (cm) r.casa_maquinas = cm; else avisos.push("casa de máquinas: use sim, nao ou nao_sei"); }
  if (e.sindico_nome) {
    const n = txt(e.sindico_nome, 100);
    if (n && n.length >= 3 && !/\d/.test(n)) r.sindico_nome = n; else avisos.push("nome do síndico inválido (mínimo 3 letras, sem números)");
  }
  set("papel", txt(e.papel, 60));
  if (e.sindico_whatsapp) {
    const k = chavesTelefone(String(e.sindico_whatsapp))[0];
    if (k && k.length >= 12) r.sindico_whatsapp = k; else avisos.push("WhatsApp do síndico inválido (informe com DDD)");
  }
  if (e.sindico_email !== undefined && e.sindico_email !== "") {
    if (/^(nao|não|sem|nenhum)/i.test(String(e.sindico_email).trim())) r.sindico_email = null;
    else { const em = normEmail(e.sindico_email); if (em) r.sindico_email = em; else avisos.push("e-mail inválido — não guardei"); }
  }
  set("aprovacao", txt(e.aprovacao, 200));
  if (typeof e.autoriza_contato_tecnico === "boolean") r.autoriza_contato_tecnico = e.autoriza_contato_tecnico;
  set("observacoes", txt(e.observacoes, 500));
  if (Array.isArray(e.fotos_midia_ids)) {
    const atual: string[] = Array.isArray(r.fotos_midia_ids) ? r.fotos_midia_ids : [];
    for (const id of e.fotos_midia_ids.map((x: unknown) => String(x).trim()).filter(Boolean)) if (!atual.includes(id)) atual.push(id);
    r.fotos_midia_ids = atual.slice(0, MAX_FOTOS);
  }
  return avisos;
}

const OBRIGATORIOS: [string, string][] = [
  ["nome_predio", "nome do prédio"], ["logradouro", "rua/avenida"], ["numero", "número do endereço"], ["bairro", "bairro"],
  ["cidade", "cidade"], ["uf", "estado (UF)"], ["andares", "quantidade de andares"], ["unidades", "total de unidades (apartamentos)"],
  ["elevadores_sociais", "quantidade de elevadores sociais"], ["tipo_predio", "tipo (residencial ou comercial)"],
  ["sindico_nome", "nome completo do síndico/responsável"], ["casa_maquinas", "se tem casa de máquinas (sim/não/não sei)"],
];
function faltando(r: Rascunho): string[] {
  const f = OBRIGATORIOS.filter(([k]) => r[k] === undefined || r[k] === null || r[k] === "").map(([, n]) => n);
  if (!Array.isArray(r.internet_operadoras) && !r.internet_nao_sabe) f.push("operadoras de internet disponíveis no prédio (Vivo, Ligga, Telecom Foz, outra ou não sei)");
  if (r.empresa_elevador === undefined) f.push("empresa de manutenção do elevador (Atlas, TKE, Otis, Oriente, outra ou não sei)");
  return f;
}
function opcionaisPendentes(r: Rascunho): string[] {
  const o: string[] = [];
  if (r.blocos === undefined) o.push("quantos blocos/torres (padrão 1)");
  if (!r.cep) o.push("CEP (se souber)");
  if (r.sindico_email === undefined) o.push("e-mail (opcional)");
  if (r.tipo_predio === "residencial" && !r.permite_airbnb) o.push("se o prédio permite Airbnb");
  if (!r.papel) o.push("papel de quem conversa (síndico, subsíndico, administradora, conselheiro)");
  if (r.autoriza_contato_tecnico === undefined) o.push("autorização para a EXA consultar a operadora de internet e a empresa do elevador na análise");
  if (!(r.fotos_midia_ids || []).length) o.push("fotos do elevador / casa de máquinas (opcional, ajudam na análise)");
  return o;
}
// requisitos da EXA (nao bloqueiam o cadastro: vao como alerta para a equipe decidir)
function requisitos(r: Rascunho): string[] {
  const out: string[] = [];
  if (r.tipo_predio === "comercial") out.push("prédio comercial (a rede é de prédios residenciais)");
  if (r.cidade && !/foz/.test(sem(r.cidade))) out.push(`fora de Foz do Iguaçu (${r.cidade})`);
  const blocos = r.blocos || 1;
  if (r.unidades && (r.unidades < 24 || (blocos > 1 && r.unidades / blocos < 24))) out.push(`menos de 24 unidades num mesmo bloco (${r.unidades} unidades em ${blocos} bloco(s))`);
  return out;
}

function enderecoCompleto(r: Rascunho): string {
  return [r.logradouro, r.numero, r.complemento ? `(${r.complemento})` : "", r.bairro, r.cidade && r.uf ? `${r.cidade}/${r.uf}` : (r.cidade || r.uf || ""), r.cep]
    .filter(Boolean).join(", ");
}
const CM: Record<string, string> = { sim: "sim", nao: "não (equipamento no poço)", nao_sei: "não sabe" };
function elevadorTexto(r: Rascunho): string {
  return r.empresa_elevador || (r.empresa_elevador_outra ? `${r.empresa_elevador_outra}` : "—");
}
function telVisivel(k: string): string {
  const d = String(k || "").replace(/\D/g, "");
  return d.length === 13 ? `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}` : d.length === 12 ? `(${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}` : `+${d}`;
}
export function resumoCadastro(r: Rascunho, tel: string): string {
  const linhas = [
    `*Prédio:* ${r.nome_predio || "—"}${r.tipo_predio ? ` (${r.tipo_predio})` : ""}`,
    `*Endereço:* ${enderecoCompleto(r) || "—"}`,
    `*Estrutura:* ${r.unidades ?? "—"} unidades · ${r.andares ?? "—"} andares · ${r.blocos ?? 1} bloco(s) · ${r.elevadores_sociais ?? "—"} elevador(es) social(is)`,
    `*Internet:* ${r.internet_nao_sabe ? "não sabe" : (r.internet_operadoras || []).join(", ") || "—"}`,
    `*Elevador:* ${elevadorTexto(r)} · casa de máquinas: ${r.casa_maquinas ? CM[r.casa_maquinas] : "—"}`,
    `*Responsável:* ${r.sindico_nome || "—"}${r.papel ? ` (${r.papel})` : ""} · ${telVisivel(r.sindico_whatsapp || telefoneCanonico(tel))}${r.sindico_email ? ` · ${r.sindico_email}` : ""}`,
  ];
  if (r.tipo_predio === "residencial" && r.permite_airbnb) linhas.push(`*Airbnb:* ${r.permite_airbnb === "sim" ? "permite" : "não permite"}`);
  if ((r.fotos_midia_ids || []).length) linhas.push(`*Fotos:* ${(r.fotos_midia_ids || []).length}`);
  return linhas.join("\n");
}

// ---------------------------------------------------------------- cadastros ja existentes deste numero
function variantesTelefone(tel: string): string[] {
  const out = new Set<string>();
  for (const k of chavesTelefone(tel)) { out.add(k); out.add("+" + k); out.add(k.slice(2)); }
  return [...out];
}
async function cadastrosDoNumero(c: CtxCadastro): Promise<any[]> {
  const v = variantesTelefone(c.tel).map((x) => `"${x}"`).join(",");
  const { data, error } = await c.sb.from("sindicos_interessados")
    .select("id,protocolo,nome_predio,status,created_at,observacoes_internas,fotos_elevador_urls,sindico_whatsapp,celular")
    .or(`sindico_whatsapp.in.(${v}),celular.in.(${v})`).order("created_at", { ascending: false }).limit(10);
  if (error) { console.error("[NANDO] cadastros do numero", error.message); return []; }
  return data || [];
}
const STATUS: Record<string, string> = {
  novo: "recebido, aguardando a análise da equipe", contatado: "a equipe já entrou em contato", em_contato: "em conversa com a equipe",
  interessado: "em andamento com a equipe", visita_agendada: "visita técnica agendada", aprovado: "aprovado, aguardando instalação",
  instalado: "instalado", recusado: "não aprovado na análise", nao_interessado: "encerrado", arquivado: "arquivado",
};

// texto para o prompt do sistema: o que ja existe para este numero (rascunho e cadastros)
export async function contextoCadastroParaPrompt(c: CtxCadastro): Promise<string> {
  try {
    const [r, feitos] = [await rascunhoAtual(c), await cadastrosDoNumero(c)];
    const partes: string[] = [];
    if (feitos.length) partes.push(`CADASTROS DE INTERESSE JÁ FEITOS POR ESTE NÚMERO: ${feitos.map((f) => `${f.nome_predio} (protocolo ${f.protocolo || "—"}, situação: ${STATUS[f.status] || f.status}, em ${new Date(f.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })})`).join("; ")}.`);
    if (r && Object.keys(r).some((k) => !["atualizado_em", "iniciado_em"].includes(k))) {
      const f = faltando(r);
      partes.push(`CADASTRO DE PRÉDIO EM ANDAMENTO (rascunho desta conversa, ainda NÃO salvo):\n${resumoCadastro(r, c.tel)}\nFalta: ${f.length ? f.join("; ") : "nada obrigatório — mostre o resumo e peça a confirmação"}.\nRetome daqui (não peça de novo o que já está acima).`);
    }
    return partes.join("\n");
  } catch (e) { console.error("[NANDO] contexto cadastro", (e as Error).message); return ""; }
}

// ---------------------------------------------------------------- fotos: nando-midia -> fotos-sindicos/<id>/
async function acharMidia(c: CtxCadastro, id: string): Promise<{ mime: string; url: string; caminho: string } | null> {
  if (c.midias[id]) return c.midias[id];
  const { data } = await c.sb.storage.from(BUCKET_NANDO).list("recebidas", { search: id });
  const f = (data || []).find((x: any) => x.name.split(".")[0] === id);
  if (!f) return null;
  const caminho = `recebidas/${f.name}`;
  return { mime: (f.metadata as any)?.mimetype || "image/jpeg", caminho, url: c.sb.storage.from(BUCKET_NANDO).getPublicUrl(caminho).data.publicUrl };
}
async function copiarFotos(c: CtxCadastro, leadId: string, ids: string[], jaTem: number): Promise<string[]> {
  const caminhos: string[] = [];
  for (let i = 0; i < ids.length && jaTem + caminhos.length < MAX_FOTOS; i++) {
    try {
      const m = await acharMidia(c, ids[i]);
      if (!m || !m.mime.startsWith("image/")) continue;
      const r = await fetch(m.url, { signal: AbortSignal.timeout(20000) });
      if (!r.ok) continue;
      const bytes = new Uint8Array(await r.arrayBuffer());
      const ext = m.mime.includes("png") ? "png" : m.mime.includes("webp") ? "webp" : "jpg";
      const caminho = `${leadId}/nando-foto-${jaTem + caminhos.length + 1}-${ids[i]}.${ext}`;
      const { error } = await c.sb.storage.from(BUCKET_FOTOS).upload(caminho, bytes, { contentType: m.mime, upsert: true });
      if (!error) caminhos.push(caminho); else console.error("[NANDO] foto cadastro", error.message);
    } catch (e) { console.error("[NANDO] foto cadastro", (e as Error).message); }
  }
  return caminhos;
}

// ---------------------------------------------------------------- aviso ao Jeferson
async function avisarJeferson(c: CtxCadastro, r: Rascunho, lead: { id: string; protocolo?: string | null }, atualizado: boolean, nFotos: number) {
  const req = requisitos(r);
  const texto = [
    `🏢 *Nando – prédio interessado na EXA*${atualizado ? " (cadastro atualizado)" : ""}`,
    resumoCadastro(r, c.tel).replace(/\n\*Fotos:\*.*$/m, ""),
    nFotos ? `*Fotos do elevador:* ${nFotos}` : "",
    `*Conversa com:* ${c.nomePessoa || "sem nome"} · +${telefoneCanonico(c.tel)}`,
    r.autoriza_contato_tecnico === true ? "Autorizou a EXA a consultar operadora e empresa do elevador." : r.autoriza_contato_tecnico === false ? "⚠️ NÃO autorizou contato com operadora/empresa do elevador." : "",
    req.length ? `⚠️ *Requisitos:* ${req.join("; ")}` : "",
    `*Protocolo:* ${lead.protocolo || lead.id.slice(0, 8)} · origem: WhatsApp (Nando) · termo ainda não assinado`,
    `${SITE_URL}/super_admin/sindicos-interessados`,
  ].filter(Boolean).join("\n");
  try {
    await enviarTexto(c.sb, ALERTA_NUMERO, texto);
    return true;
  } catch (e) {
    console.error("[NANDO] aviso cadastro falhou", (e as Error).message);
    // nao chegou no WhatsApp: fica nas ocorrencias do Nando para a equipe ver
    await c.sb.from("nando_ocorrencias").insert({ tipo: "predio_interessado", telefone: telefoneCanonico(c.tel), nome: c.nomePessoa || null, descricao: texto }).then(() => {}, () => {});
    return false;
  }
}

// ---------------------------------------------------------------- salvar em sindicos_interessados
async function salvar(c: CtxCadastro, r: Rascunho): Promise<string> {
  const f = faltando(r);
  if (f.length) return `Ainda falta: ${f.join("; ")}. Pergunte com calma (2 ou 3 itens por mensagem) e use anotar_cadastro_interessado antes de salvar.`;
  const canon = telefoneCanonico(c.tel);
  const whats = r.sindico_whatsapp || canon;
  const email = r.sindico_email || null;
  const agora = new Date();
  const quando = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(agora);
  const notas = [
    `[Nando · WhatsApp ${quando}] Cadastro feito na conversa com o Nando (origem: WhatsApp/Nando). Conversa com +${canon}${c.nomePessoa ? ` (${c.nomePessoa})` : ""}${r.papel ? `, papel: ${r.papel}` : ""}.`,
    "Termo de adesão NÃO aceito no chat (aceite pendente: enviar termo/contrato para assinatura).",
    email ? "" : "Sem e-mail informado (o campo e-mail do cadastro tem um endereço técnico do Nando, não é do síndico).",
    whats !== canon ? `WhatsApp informado do síndico: +${whats}.` : "WhatsApp do síndico = número que conversou com o Nando.",
    r.empresa_elevador_outra ? `Empresa do elevador: ${r.empresa_elevador_outra}.` : "",
    r.internet_nao_sabe ? "Operadoras de internet: não soube informar." : "",
    r.aprovacao ? `Aprovação no condomínio: ${r.aprovacao}.` : "",
    r.autoriza_contato_tecnico === true ? "Autorizou a EXA a consultar a operadora de internet e a empresa do elevador." : r.autoriza_contato_tecnico === false ? "NÃO autorizou contato com operadora/empresa do elevador." : "",
    requisitos(r).length ? `Requisitos a verificar: ${requisitos(r).join("; ")}.` : "",
    r.observacoes ? `Obs. do síndico: ${r.observacoes}` : "",
  ].filter(Boolean).join(" ");

  const campos: Record<string, unknown> = {
    nome_predio: r.nome_predio,
    endereco_logradouro: r.logradouro, endereco_numero: r.numero, endereco_complemento: r.complemento || null,
    endereco_bairro: r.bairro, endereco_cidade: r.cidade, endereco_uf: r.uf, cep: r.cep || null,
    quantidade_andares: r.andares, quantidade_blocos: r.blocos || 1, quantidade_unidades_total: r.unidades,
    quantidade_elevadores_sociais: r.elevadores_sociais,
    internet_operadoras: r.internet_operadoras || [],
    empresa_elevador: r.empresa_elevador || null,
    elevador_casa_maquinas: r.casa_maquinas,
    tipo_predio: r.tipo_predio,
    permite_airbnb: r.tipo_predio === "residencial" ? (r.permite_airbnb || null) : null,
    sindico_nome: r.sindico_nome,
    sindico_whatsapp: "+" + whats,
    sindico_email: email,
    // colunas legadas NOT NULL (validate_sindico_lead exige e-mail valido e celular so com digitos)
    nome_completo: r.sindico_nome,
    endereco: enderecoCompleto(r),
    numero_andares: r.andares,
    numero_unidades: r.unidades,
    email: email || `sem-email.${canon}@nando.examidia.com.br`,
    celular: whats.slice(2),
  };

  // evita duplicado: mesmo numero + mesmo predio -> atualiza o cadastro que ja existe
  const existentes = await cadastrosDoNumero(c);
  const chave = nomePredioChave(r.nome_predio);
  const igual = existentes.find((x) => nomePredioChave(x.nome_predio) === chave && chave.length > 0);
  let lead: { id: string; protocolo?: string | null };
  let jaFotos = 0;
  if (igual) {
    // sem e-mail novo: nao troca o e-mail que o cadastro antigo ja tinha pelo endereco tecnico
    if (!email) { delete campos.email; delete campos.sindico_email; }
    // campo que nao veio nesta conversa (CEP, complemento, operadoras "nao sei"...) nao apaga o que ja estava gravado
    for (const k of Object.keys(campos)) {
      const v = campos[k];
      if (v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length)) delete campos[k];
    }
    const obs = [String(igual.observacoes_internas || "").trim(), notas.replace("Cadastro feito", "Cadastro ATUALIZADO")].filter(Boolean).join("\n\n").slice(0, 8000);
    const { data, error } = await c.sb.from("sindicos_interessados").update({ ...campos, observacoes_internas: obs, updated_at: agora.toISOString() })
      .eq("id", igual.id).select("id,protocolo").single();
    if (error) throw new Error("não consegui atualizar o cadastro: " + error.message);
    lead = data; jaFotos = (igual.fotos_elevador_urls || []).length;
  } else {
    const { data, error } = await c.sb.from("sindicos_interessados").insert({
      ...campos, status: "novo", observacoes_internas: notas,
      // o aceite do termo NAO acontece no chat: sem isso a coluna ganharia now() por padrao e pareceria aceito
      aceite_timestamp: null, aceite_ip: null, aceite_user_agent: null, whatsapp_verificado: false,
    }).select("id,protocolo").single();
    if (error) throw new Error("não consegui gravar o cadastro: " + error.message);
    lead = data;
  }

  // fotos do elevador (as que a pessoa mandou nesta conversa)
  let nFotos = jaFotos;
  const ids: string[] = r.fotos_midia_ids || [];
  if (ids.length) {
    const novas = await copiarFotos(c, lead.id, ids, jaFotos);
    if (novas.length) {
      const todas = [...((igual?.fotos_elevador_urls as string[]) || []), ...novas].slice(0, MAX_FOTOS);
      await c.sb.from("sindicos_interessados").update({ fotos_elevador_urls: todas }).eq("id", lead.id);
      nFotos = todas.length;
    }
  }

  const avisou = await avisarJeferson(c, r, lead, !!igual, nFotos);
  await gravarRascunho(c, null, { ultimo_cadastro_interessado: { id: lead.id, protocolo: lead.protocolo || null, predio: r.nome_predio, em: agora.toISOString() } });
  c.registros.push(`cadastro de prédio interessado ${igual ? "ATUALIZADO" : "SALVO"}: ${r.nome_predio} (protocolo ${lead.protocolo || lead.id.slice(0, 8)}); Jeferson ${avisou ? "avisado" : "NÃO avisado (ficou nas ocorrências)"}`);
  const req = requisitos(r);
  return `${igual ? "Cadastro ATUALIZADO" : "Cadastro SALVO"} na lista da EXA. Protocolo: ${lead.protocolo || lead.id.slice(0, 8)}. ${avisou ? "O Jeferson (responsável da EXA) já foi avisado." : "A equipe da EXA foi avisada."}` +
    `${nFotos ? ` ${nFotos} foto(s) anexada(s).` : ""}${req.length ? ` Pontos que a equipe vai avaliar: ${req.join("; ")} — explique com delicadeza que a análise vai verificar isso, sem prometer aprovação.` : ""}` +
    " Agora explique os próximos passos (análise de internet, elevador e casa de máquinas → visita técnica → instalação → o Nando ensina a usar os avisos) e que o termo de adesão é enviado pela equipe para assinatura depois da análise.";
}

// ---------------------------------------------------------------- ferramentas
const CAMPOS_SCHEMA = {
  recomecar: { type: "boolean", description: "true = apaga o rascunho anterior e começa um cadastro novo (ex: outro prédio)" },
  nome_predio: { type: "string" },
  logradouro: { type: "string", description: "Rua/avenida (sem o número)" },
  numero: { type: "string" }, complemento: { type: "string" }, bairro: { type: "string" },
  cep: { type: "string", description: "Só se a pessoa souber" },
  cidade: { type: "string" }, uf: { type: "string", description: "2 letras, ex: PR" },
  andares: { type: "number" }, blocos: { type: "number", description: "Blocos/torres. Padrão 1" },
  unidades: { type: "number", description: "Total de unidades (apartamentos/salas)" },
  elevadores_sociais: { type: "number" },
  tipo_predio: { type: "string", enum: ["residencial", "comercial"] },
  permite_airbnb: { type: "string", enum: ["sim", "nao"] },
  internet_operadoras: { type: "array", items: { type: "string" }, description: "Operadoras disponíveis no prédio: Vivo, Ligga, Telecom Foz ou outra (nome). ['não sei'] se não souber." },
  empresa_elevador: { type: "string", description: "Atlas, TKE, Otis, Oriente, outra (nome) ou 'não sei'" },
  casa_maquinas: { type: "string", enum: ["sim", "nao", "nao_sei"] },
  sindico_nome: { type: "string", description: "Nome completo do síndico/responsável" },
  papel: { type: "string", description: "síndico, subsíndico, administradora, conselheiro, zelador..." },
  sindico_whatsapp: { type: "string", description: "Só se for DIFERENTE do número desta conversa (padrão: este número)" },
  sindico_email: { type: "string", description: "Opcional. 'não' se a pessoa não quiser informar" },
  aprovacao: { type: "string", description: "Como a decisão é tomada no prédio (síndico, conselho, assembleia) / se já foi conversado" },
  autoriza_contato_tecnico: { type: "boolean", description: "Se autoriza a EXA a consultar a operadora de internet e a empresa do elevador para a análise" },
  fotos_midia_ids: { type: "array", items: { type: "string" }, description: "midia_id das fotos do elevador/casa de máquinas que a pessoa mandou (até 5)" },
  observacoes: { type: "string" },
};

export const FERRAMENTAS_CADASTRO = [
  {
    name: "anotar_cadastro_interessado",
    description: "Prédio que AINDA NÃO é da EXA e cujo síndico/administradora quer a tela: guarda no rascunho do cadastro os dados que a pessoa for informando (só os campos novos; o resto continua guardado). Chame SEMPRE que receber dados novos, inclusive fotos do elevador. Devolve o resumo, o que ainda falta e alertas de requisito. NÃO salva na lista da EXA.",
    input_schema: { type: "object", properties: CAMPOS_SCHEMA },
  },
  {
    name: "salvar_cadastro_interessado",
    description: "Salva o cadastro do prédio interessado na lista da EXA e avisa o Jeferson. SÓ use depois de mostrar o resumo completo e a pessoa CONFIRMAR que está certo (confirmado=true). Se for o mesmo prédio já cadastrado por este número, atualiza em vez de duplicar.",
    input_schema: { type: "object", properties: { confirmado: { type: "boolean", description: "true só depois da confirmação explícita do resumo" } }, required: ["confirmado"] },
  },
  {
    name: "consultar_cadastro_interessado",
    description: "Mostra o rascunho do cadastro em andamento e os cadastros de interesse já feitos por este número (protocolo e situação). Use quando a pessoa perguntar como está o cadastro dela ou para retomar.",
    input_schema: { type: "object", properties: {} },
  },
];
export const NOMES_CADASTRO = new Set(FERRAMENTAS_CADASTRO.map((f) => f.name));

export async function executarCadastro(c: CtxCadastro, nome: string, e: any): Promise<string> {
  switch (nome) {
    case "anotar_cadastro_interessado": {
      let r: Rascunho = e.recomecar ? {} : (await rascunhoAtual(c)) || {};
      if (!r.iniciado_em) r.iniciado_em = new Date().toISOString();
      const avisos = aplicar(r, e || {});
      r.atualizado_em = new Date().toISOString();
      await gravarRascunho(c, r);
      const f = faltando(r), op = opcionaisPendentes(r), req = requisitos(r);
      c.registros.push(`rascunho do cadastro de prédio interessado atualizado (${r.nome_predio || "sem nome"}); faltam ${f.length} obrigatório(s)`);
      return `Rascunho guardado (ainda NÃO salvo na lista da EXA):\n${resumoCadastro(r, c.tel)}\n` +
        (avisos.length ? `\nAtenção: ${avisos.join("; ")}.` : "") +
        `\nObrigatórios que faltam: ${f.length ? f.join("; ") : "nenhum"}.` +
        (op.length ? `\nOpcionais ainda não perguntados: ${op.join("; ")}.` : "") +
        (req.length ? `\nRequisitos a explicar com delicadeza (não impede o cadastro, a equipe avalia): ${req.join("; ")}.` : "") +
        (f.length ? "" : "\nTudo pronto: mostre este resumo para a pessoa e pergunte se está tudo certo antes de usar salvar_cadastro_interessado.");
    }
    case "salvar_cadastro_interessado": {
      if (e?.confirmado !== true) return "Não salvei: mostre o resumo e espere a pessoa confirmar que está certo (aí use confirmado=true).";
      const r = await rascunhoAtual(c);
      if (!r) return "Não há cadastro em andamento. Comece com anotar_cadastro_interessado.";
      return await salvar(c, r);
    }
    case "consultar_cadastro_interessado": {
      const t = await contextoCadastroParaPrompt(c);
      return t || "Este número não tem cadastro de interesse nem rascunho em andamento.";
    }
  }
  return "Ferramenta desconhecida.";
}

// ---------------------------------------------------------------- roteiro para o prompt do sistema
export function roteiroCadastro(): string {
  return `CADASTRO DE PRÉDIO NOVO (síndico/administradora que QUER A EXA no prédio)
- Sinais: "Quero a EXA no meu prédio" (texto do botão "Falar com o Nando" do site), "quero a tela no meu condomínio", "como faço para ter o painel", "quanto custa para o condomínio", "sou síndico e tenho interesse". Nesses casos NÃO trate como número desconhecido com problema: entre no modo de cadastro (não abra ocorrência).
- Tom: os síndicos costumam ser pessoas mais maduras. Seja cordial, sereno e respeitoso, frases completas e claras, sem gírias e com no máximo 1 emoji na conversa toda. Mensagens curtas e acolhedoras. Você é o assistente virtual da EXA (uma IA) — nunca finja ser uma pessoa.
- Comece agradecendo o interesse, diga em 1–2 frases o que é a EXA e pergunte o nome da pessoa e se ela é síndico(a), subsíndico(a) ou da administradora. Depois explique como funciona e vá coletando os dados.
- O QUE É: uma tela moderna dentro do elevador social, com conteúdo útil para os moradores: avisos do condomínio, notícias de Foz do Iguaçu e do Brasil, a câmera ao vivo da Ponte da Amizade, clima e hora, e anúncios de empresas locais.
- CUSTO: ZERO para o condomínio. Equipamento, instalação, manutenção e internet da tela são pagos pela EXA (o projeto se sustenta com os anúncios). O condomínio não paga nada e não assume nenhuma despesa.
- AVISOS: o síndico manda o aviso aqui pelo WhatsApp, comigo (o Nando), e eu coloco na tela — não precisa de computador nem de aplicativo. Também existe o painel do síndico no site para acompanhar.
- ANÚNCIOS: só de empresas locais e com curadoria. Não entra política, apostas, bebida alcoólica, motéis nem nenhum conteúdo impróprio.
- REQUISITOS: prédio residencial em Foz do Iguaçu, com pelo menos 24 unidades num mesmo bloco. A decisão de receber a tela segue a convenção do condomínio (síndico, conselho ou assembleia). Se o prédio não atender algum requisito, explique com delicadeza e ofereça cadastrar assim mesmo para a equipe avaliar — nunca prometa aprovação.
- ETAPAS: (1) cadastro (agora, por aqui) → (2) análise da equipe (internet disponível, elevador e casa de máquinas) → (3) visita técnica agendada com o síndico → (4) instalação → (5) eu ensino o síndico a mandar os avisos. O termo de adesão é enviado pela equipe da EXA para assinatura depois da análise (não é assinado por aqui). Se a pessoa preferir preencher sozinha, o formulário do site é ${SITE_URL}/interessesindico (não mande os dois caminhos ao mesmo tempo, para não duplicar).
- Responda TODAS as dúvidas com paciência antes de seguir. Não invente: prazos, valores pagos ao condomínio ou detalhes técnicos que você não sabe → diga que a equipe da EXA confirma na análise.
- DADOS A COLETAR (os mesmos do formulário do site). Aqui a regra "uma pergunta por vez" vira "um bloco curto de 2 ou 3 dados por vez", numa lista fácil de responder:
  1) nome do prédio; endereço (rua, número, bairro, cidade, UF; CEP se souber);
  2) andares, blocos/torres, total de unidades, quantos elevadores sociais; residencial ou comercial (se residencial: permite Airbnb?);
  3) operadoras de internet disponíveis no prédio (Vivo, Ligga, Telecom Foz, outra ou não sei); empresa que faz a manutenção do elevador (Atlas, TKE, Otis, Oriente, outra ou não sei); se tem casa de máquinas (sim, não ou não sei);
  4) nome completo do síndico/responsável; o WhatsApp é ESTE número (só pergunte se for outro); e-mail (opcional); se autoriza a EXA a consultar a operadora e a empresa do elevador para a análise; como é a aprovação no prédio (opcional).
  5) fotos do elevador e da casa de máquinas, se puder (opcional; ajudam na análise). Fotos recebidas durante o cadastro NÃO são avisos: guarde com anotar_cadastro_interessado (fotos_midia_ids) e não ofereça criar aviso com elas.
- A cada resposta use anotar_cadastro_interessado com o que chegou (a ferramenta diz o que falta). Não pergunte de novo o que já foi respondido. Se a pessoa não souber algo (operadora, empresa do elevador, casa de máquinas), aceite "não sei" e siga.
- Quando não faltar nada obrigatório: mostre o RESUMO (como a ferramenta devolve) e pergunte "Está tudo certo? Posso enviar o cadastro para a equipe da EXA?". Só depois do "sim" use salvar_cadastro_interessado com confirmado=true. Correções → anotar_cadastro_interessado e mostre o resumo de novo.
- Depois de salvar: agradeça, informe o protocolo, explique os próximos passos em poucas frases e diga que a equipe da EXA vai entrar em contato. Não diga que salvou se a ferramenta não confirmou.
- Se a pessoa voltar depois perguntando do cadastro, use consultar_cadastro_interessado.`;
}
