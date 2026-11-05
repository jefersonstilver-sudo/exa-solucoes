// =====================================================================
// NANDO - vigia dos paineis (05/11/2026)
// Substitui o alerta antigo (monitor-panels pelo numero de notificacoes), que mandava ~100 mensagens/dia por pessoa.
//
// O que faz:
//  - QUEDA REAL: tela sem sinal (AnyDesk offline E o coletor do NUC mudo) ha 15+ min -> avisa o Jeferson e os tecnicos
//    com o diagnostico (energia, internet/operadora, radio/cabo no poco do elevador, NUC travado) e o que fazer.
//    Quedas curtas do AnyDesk (87% dos registros) e AnyDesk fora com o NUC tocando NAO geram aviso.
//  - VOLTOU: quando a tela volta, avisa quanto tempo ficou fora e a causa mais provavel (le o motivo do boot do NUC).
//  - NOITE (22h-7h): nao manda nada na hora; as 7h manda um resumo da noite (quedas, energia, instabilidade).
//  - Pergunta "por que o painel X esta offline?" (Jeferson/tecnico): ferramenta diagnosticar_painel.
// Dados: exa2-saude-frota (AnyDesk + coletor v7.1 + heartbeat do player), device_offline_incidents,
// devices.provider (operadora), devices.empresa_elevador_id -> fornecedores (empresa de elevador), buildings (contatos).
// Destinatarios: o Jeferson (ALERTA_NUMERO) + nando_config 'tecnicos' (JSON [{nome, telefone}]).
// =====================================================================
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { ALERTA_NUMERO, enviarTexto, telefoneCanonico, chavesTelefone, horaLocalIso } from "./nando-core.ts";

const MIN = 60000;
const QUEDA_MIN = 15;          // so avisa queda que dura 15+ min
const VOLTOU_ESPERA_MIN = 12;  // espera o coletor mandar a leitura nova antes de explicar a volta
const QUEDA_GERAL = 4;         // 4+ telas caindo juntas viram 1 mensagem so
const MODELOS = [Deno.env.get("NANDO_MODEL") || "claude-sonnet-5-5", "claude-sonnet-4-5"];

export type Tecnico = { nome: string; telefone: string };

// ---------------------------------------------------------------- quem recebe
export async function tecnicosNando(sb: SupabaseClient): Promise<Tecnico[]> {
  const { data } = await sb.from("nando_config").select("valor").eq("chave", "tecnicos").maybeSingle();
  try {
    const v = typeof data?.valor === "string" ? JSON.parse(data.valor) : data?.valor;
    return (Array.isArray(v) ? v : []).filter((t: any) => t?.telefone).map((t: any) => ({ nome: String(t.nome || "Técnico"), telefone: String(t.telefone) }));
  } catch { return []; }
}
export async function tecnicoDoTelefone(sb: SupabaseClient, tel: string): Promise<Tecnico | null> {
  const lista = await tecnicosNando(sb);
  const k = chavesTelefone(tel);
  return lista.find((t) => chavesTelefone(t.telefone).some((x) => k.includes(x))) || null;
}
async function destinatarios(sb: SupabaseClient): Promise<string[]> {
  const todos = [ALERTA_NUMERO, ...(await tecnicosNando(sb)).map((t) => t.telefone)].map(telefoneCanonico);
  return [...new Set(todos)];
}

// ---------------------------------------------------------------- leitura da frota
async function frota(sb: SupabaseClient): Promise<any[]> {
  const { data: cfg } = await sb.from("exa2_config").select("valor").eq("chave", "cron_token").maybeSingle();
  if (!cfg?.valor) throw new Error("exa2_config.cron_token ausente");
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/exa2-saude-frota`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-exa2-cron": String(cfg.valor), Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(45000),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j?.success) throw new Error(`saude-frota ${r.status}: ${String(j?.error || "").slice(0, 120)}`);
  // so as telas do grupo "Predios" (bancada, estoque e telas internas ficam de fora)
  const { data: grupos } = await sb.from("device_groups").select("id, nome");
  const g = (grupos || []).find((x: any) => /^pr[eé]dios$/i.test(String(x.nome || "").trim()));
  return (j.paineis || []).filter((p: any) => !g || p.grupo_id === g.id);
}

async function extras(sb: SupabaseClient, ids: string[]) {
  const { data: devs } = await sb.from("devices").select("id, building_id, empresa_elevador_id").in("id", ids);
  const elevIds = [...new Set((devs || []).map((d: any) => d.empresa_elevador_id).filter(Boolean))];
  const bIds = [...new Set((devs || []).map((d: any) => d.building_id).filter(Boolean))];
  const [{ data: elevs }, { data: bs }] = await Promise.all([
    elevIds.length ? sb.from("fornecedores").select("id, nome_fantasia, razao_social, telefone, email").in("id", elevIds) : Promise.resolve({ data: [] as any[] }),
    bIds.length ? sb.from("buildings").select("id, nome, nome_sindico, contato_sindico, nome_contato_predio, numero_contato_predio").in("id", bIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const out = new Map<string, { elevador: any | null; predio: any | null }>();
  for (const d of devs || []) out.set(d.id, {
    elevador: (elevs || []).find((e: any) => e.id === d.empresa_elevador_id) || null,
    predio: (bs || []).find((b: any) => b.id === d.building_id) || null,
  });
  return out;
}

const hhmm = (iso: string | null | undefined) => iso ? horaLocalIso(new Date(iso)).slice(11, 16) : "?";
const diaHora = (iso: string | null | undefined) => {
  if (!iso) return "?";
  const l = horaLocalIso(new Date(iso));
  const hoje = horaLocalIso(new Date()).slice(0, 10);
  return l.slice(0, 10) === hoje ? `hoje ${l.slice(11, 16)}` : `${l.slice(8, 10)}/${l.slice(5, 7)} ${l.slice(11, 16)}`;
};
const dur = (ms: number) => { const m = Math.max(1, Math.round(ms / MIN)); return m < 60 ? `${m} min` : m < 2880 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${Math.round(m / 1440)} dias`; };
const ehNoite = (d: Date) => { const h = Number(horaLocalIso(d).slice(11, 13)); return h >= 22 || h < 7; };

// ---------------------------------------------------------------- diagnostico (fatos + recomendacao, sem IA)
function nomeElevador(e: any) { return e ? String(e.nome_fantasia || e.razao_social || "empresa de elevador").trim() : null; }

/** Ficha de fatos de um painel e a recomendacao pelas regras. A IA so reescreve isto. */
export async function fichaPainel(sb: SupabaseClient, p: any, ex?: { elevador: any | null; predio: any | null }) {
  ex = ex || (await extras(sb, [p.id])).get(p.id) || { elevador: null, predio: null };
  const { data: incs } = await sb.from("device_offline_incidents").select("started_at, resolved_at")
    .eq("device_id", p.id).gte("started_at", new Date(Date.now() - 7 * 24 * 60 * MIN).toISOString()).order("started_at", { ascending: false }).limit(200);
  const longas = (incs || []).filter((i: any) => ((i.resolved_at ? new Date(i.resolved_at).getTime() : Date.now()) - new Date(i.started_at).getTime()) >= QUEDA_MIN * MIN);
  const noturnas = longas.filter((i: any) => ehNoite(new Date(i.started_at))).length;
  const aberta = (incs || []).find((i: any) => !i.resolved_at) || null;
  const vg = p.vigia || {};
  const ev = vg.eventos_24h || {};
  const boot = p.ultimo_boot || {};
  const elev = nomeElevador(ex.elevador);
  const oper = p.operadora && !/SEM PROVEDOR/i.test(p.operadora) ? p.operadora : null;

  const fatos: string[] = [
    `Painel: ${p.nome}${p.condominio && p.condominio !== p.nome ? ` (${p.condominio})` : ""}`,
    `Agora: ${p.status_anydesk === "online" ? "online" : "OFFLINE"}${aberta ? ` desde ${diaHora(aberta.started_at)} (${dur(Date.now() - new Date(aberta.started_at).getTime())})` : ""}`,
    `Diagnóstico do sistema: ${p.causa}`,
    p.coletor ? `Coletor do NUC: última leitura ${diaHora(p.coletor.visto_em)} (${p.coletor.vivo ? "ativo" : "parado"})` : "Coletor do NUC: não instalado (sem diagnóstico de energia/internet)",
    boot.tipo ? `Último ligamento do NUC: ${boot.tipo}${boot.ligou_em ? ` em ${diaHora(boot.ligou_em)}` : ""}` : "",
    vg.estado ? `Vigia de rede (última leitura): ${vg.estado}; eventos 24h: ${Object.entries(ev).map(([k, v]) => `${k} ${v}`).join(", ") || "nenhum"}; reinícios em 7 dias: ${vg.reboots_7d ?? "?"}` : "",
    p.perda_internet_pct != null ? `Internet: perda ${p.perda_internet_pct}% na operadora, ${p.perda_roteador_pct ?? "?"}% dentro do prédio; latência ${p.lat_ms ?? "?"} ms; download ${p.download_mbps ?? "?"} Mbps` : "",
    p.temp_c != null ? `Temperatura do NUC: ${p.temp_c} °C` : "",
    `Quedas de 15+ min em 7 dias: ${longas.length} (${noturnas} de noite, entre 22h e 7h); quedas de qualquer tamanho em 24h: ${p.quedas_24h}; fora no total em 7 dias: ${p.fora_7d}`,
    `Operadora: ${oper || "não cadastrada"}`,
    `Empresa de elevador (o NUC e as antenas ficam no poço do elevador; só ela dá acesso): ${elev ? `${elev}${ex.elevador?.telefone ? ` — tel ${ex.elevador.telefone}` : " (telefone não cadastrado)"}` : "não cadastrada"}`,
    ex.predio?.nome_sindico || ex.predio?.contato_sindico ? `Síndico: ${ex.predio?.nome_sindico || "?"}${ex.predio?.contato_sindico ? ` (${ex.predio.contato_sindico})` : ""}` : "",
    ex.predio?.nome_contato_predio || ex.predio?.numero_contato_predio ? `Contato do prédio (portaria/zelador): ${ex.predio?.nome_contato_predio || "?"}${ex.predio?.numero_contato_predio ? ` (${ex.predio.numero_contato_predio})` : ""}` : "",
  ].filter(Boolean);

  // recomendacao pelas regras (a IA nao inventa outra)
  const rec: string[] = [];
  const estadoVigia = String(vg.estado || "");
  const bootAbrupto = /abrupto|energia/i.test(String(boot.tipo || ""));
  const bootRecente = boot.ligou_em && Date.now() - new Date(boot.ligou_em).getTime() < 2 * 3600 * 1000;
  if (p.estado === "sem_sinal") {
    if (estadoVigia === "OPERADORA") rec.push(`A internet da operadora caiu (o roteador do prédio responde, a internet não): ligar para a ${oper || "operadora do prédio"} e abrir chamado.`);
    else if (/SEM_GATEWAY|SEM_CABO|SEM_ROTA/.test(estadoVigia)) rec.push(`O NUC perdeu o rádio/roteador ou o cabo (${estadoVigia}): pedir ao síndico/zelador para ver se o roteador do prédio está ligado; se estiver, agendar a ${elev || "empresa de elevador"} para acessar o poço e conferir antena, cabo e NUC.`);
    else if (!p.coletor) rec.push(`Sem coletor neste NUC: perguntar ao síndico/zelador se faltou energia no prédio; se não faltou, checar com a ${oper || "operadora"}; persistindo, agendar a ${elev || "empresa de elevador"} para reiniciar o NUC no poço.`);
    else rec.push(`O NUC parou de responder junto com a rede (energia, internet do prédio ou NUC travado): perguntar ao síndico/zelador se faltou energia; se não, checar a ${oper || "operadora"}; se a internet do prédio estiver normal, agendar a ${elev || "empresa de elevador"} para reiniciar o NUC no poço.`);
  } else if (p.estado === "sem_imagem") {
    rec.push(`O NUC está ligado mas sem imagem (${p.causa}): tentar reiniciar o programa/NUC pelo AnyDesk; se não voltar, agendar a ${elev || "empresa de elevador"} para conferir cabo HDMI e monitor.`);
  } else if (p.estado === "internet_ruim") {
    rec.push((p.perda_roteador_pct ?? 0) >= 5
      ? `Perda já dentro do prédio (roteador/rádio/cabo): agendar a ${elev || "empresa de elevador"} para conferir a antena e o cabo no poço.`
      : `Operadora com perda alta: abrir chamado com a ${oper || "operadora"}.`);
  } else if (p.estado === "instavel") {
    if (noturnas >= 3 || bootAbrupto) rec.push(`Muitas quedas${noturnas ? `, ${noturnas} de noite` : ""}${bootAbrupto ? " e o NUC religou de forma abrupta" : ""}: parece energia instável. Perguntar ao síndico se houve queda de energia; se repetir, avaliar nobreak no poço (com a ${elev || "empresa de elevador"}).`);
    else rec.push(`Instável: ${p.porque_cai || p.causa}. ${/operadora/i.test(p.porque_cai || "") ? `Abrir chamado com a ${oper || "operadora"}.` : `Agendar a ${elev || "empresa de elevador"} para conferir rádio/cabo no poço.`}`);
  } else if (p.estado === "quente") {
    rec.push(`NUC quente (${p.temp_c} °C): pedir à ${elev || "empresa de elevador"} para checar ventilação no poço.`);
  } else if (p.status_anydesk === "offline" && p.coletor?.vivo) {
    rec.push("Só o AnyDesk está fora; a tela continua tocando. Nada urgente: reiniciar o AnyDesk na próxima manutenção.");
  } else {
    rec.push("Funcionando normalmente agora. Nada a fazer.");
  }
  if (bootAbrupto && bootRecente && p.estado !== "sem_sinal") rec.push("O NUC religou há pouco de forma abrupta: provável falta de energia ou travamento (vale perguntar ao síndico se faltou luz).");
  if (elev && !ex.elevador?.telefone) rec.push(`Cadastrar o telefone da ${elev} em Fornecedores para eu já passar o contato.`);
  if (!elev) rec.push("Cadastrar a empresa de elevador deste painel (Painéis EXA).");

  return { fatos: fatos.join("\n"), recomendacao: rec, aberta, oper, elev };
}

// ---------------------------------------------------------------- texto com IA (so reescreve os fatos)
async function escrever(instrucao: string, fatos: string, reserva: string): Promise<string> {
  const key = Deno.env.get("NANDO_ANTHROPIC_API_KEY");
  if (!key) return reserva;
  const system = `Você é o NANDO, o assistente técnico da EXA Mídia no WhatsApp (telas em elevadores; cada tela tem um NUC e antenas/roteador no POÇO do elevador, que só a empresa de elevador acessa).
Escreva para o Jeferson (CEO) e os técnicos lerem no celular: português do Brasil, direto, frases curtas, sem textão, sem markdown de título.
Use SÓ os fatos e as recomendações recebidos. Não invente causa, horário, número nem contato. Se a causa for incerta, diga "provável".
Use *negrito* do WhatsApp só no nome do painel. No máximo 1 emoji no começo. Nunca escreva mensagens de erro técnico, código ou JSON.`;
  for (const modelo of MODELOS) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: modelo, max_tokens: 700, system, messages: [{ role: "user", content: `${instrucao}\n\nFATOS:\n${fatos}` }] }),
        signal: AbortSignal.timeout(40000),
      });
      if (!r.ok) continue;
      const j = await r.json();
      const t = (j.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
      if (t && !/error|exception|undefined|\{|\}/i.test(t)) return t;
    } catch { /* tenta o proximo modelo; senao vai a versao sem IA */ }
  }
  return reserva;
}

async function avisar(sb: SupabaseClient, texto: string, log: string[]) {
  for (const tel of await destinatarios(sb)) {
    try {
      await enviarTexto(sb, tel, texto);
      // fica na conversa: o "por que?" seguinte tem o contexto
      await sb.from("nando_mensagens").insert({ telefone: tel, papel: "nando", conteudo: { texto, origem: "vigia_paineis" } });
    } catch (e) { log.push(`aviso de painel falhou para ${tel.slice(-4)}: ${(e as Error).message.slice(0, 80)}`); }
  }
}

// ---------------------------------------------------------------- rotina (nando-cron, a cada 5 min)
export async function vigiarPaineis(sb: SupabaseClient, log: string[]) {
  const ligado = await sb.from("nando_config").select("valor").eq("chave", "vigia_paineis").maybeSingle();
  if (String(ligado.data?.valor ?? "ligado").toLowerCase() === "desligado") return;
  const agora = new Date();
  const paineis = await frota(sb);
  const porId = new Map(paineis.map((p: any) => [p.id, p]));
  const ids = paineis.map((p: any) => p.id);
  if (!ids.length) return;

  const { data: abertas } = await sb.from("device_offline_incidents").select("device_id, started_at").in("device_id", ids).is("resolved_at", null);
  const { data: estado } = await sb.from("nando_paineis_alertas").select("*").is("voltou_em", null);
  const jaAvisadas = new Set((estado || []).map((e: any) => `${e.device_id}|${new Date(e.inicio).getTime()}`));

  // 1) quedas reais novas (15+ min, tela sem sinal = NUC mudo tambem)
  const novas = (abertas || []).filter((i: any) => {
    const p: any = porId.get(i.device_id);
    return p && p.estado === "sem_sinal" && agora.getTime() - new Date(i.started_at).getTime() >= QUEDA_MIN * MIN
      && !jaAvisadas.has(`${i.device_id}|${new Date(i.started_at).getTime()}`);
  });
  const noite = ehNoite(agora);
  if (novas.length) {
    const ex = await extras(sb, novas.map((i: any) => i.device_id));
    const fichas = [];
    for (const i of novas) fichas.push({ i, p: porId.get(i.device_id), f: await fichaPainel(sb, porId.get(i.device_id), ex.get(i.device_id)) });
    if (!noite) {
      if (fichas.length >= QUEDA_GERAL) {
        const fatos = fichas.map((x) => `- ${x.p.nome} (operadora ${x.f.oper || "?"}): fora desde ${hhmm(x.i.started_at)}. ${x.p.causa}`).join("\n");
        const reserva = `🚨 *${fichas.length} telas caíram juntas*\n${fichas.map((x) => `• ${x.p.nome} — desde ${hhmm(x.i.started_at)}`).join("\n")}\n\nQueda simultânea costuma ser energia na região ou a operadora. Me pergunte "por que o painel X caiu?" para ver um por um.`;
        await avisar(sb, await escrever(`Várias telas caíram ao mesmo tempo. Escreva UM aviso: quantas e quais (lista curta com horário), o que costuma explicar queda simultânea (energia na região ou operadora em comum — veja se as operadoras se repetem) e diga que pode perguntar "por que o painel X caiu?" para o diagnóstico de cada um.`, fatos, reserva), log);
      } else {
        for (const x of fichas) {
          const reserva = `🔴 *${x.p.nome}* está fora do ar desde ${hhmm(x.i.started_at)}.\n\n${x.p.causa}\n\nO que fazer: ${x.f.recomendacao[0]}`;
          await avisar(sb, await escrever(`Uma tela caiu agora. Escreva o aviso de queda: 1) qual tela e desde quando; 2) um resumo do computador (NUC) em 1-2 frases: o que os dados mostram e a causa provável — se parece só reinício, queda de internet/operadora, energia (inclusive se houve quedas à noite ou se está instável), rádio/cabo; 3) o que fazer agora, seguindo a RECOMENDAÇÃO. Termine dizendo que avisa quando voltar.`, `${x.f.fatos}\nRECOMENDAÇÃO:\n- ${x.f.recomendacao.join("\n- ")}`, reserva), log);
        }
      }
    }
    for (const x of fichas) {
      await sb.from("nando_paineis_alertas").upsert({ device_id: x.i.device_id, inicio: x.i.started_at, avisado_em: noite ? null : agora.toISOString(), noite, resumo: x.p.causa.slice(0, 500) }, { onConflict: "device_id,inicio" });
    }
    log.push(`painéis: ${fichas.length} queda(s) real(is)${noite ? " (noite: vai no resumo das 7h)" : " avisada(s)"}`);
  }

  // 2) voltou: explica a causa depois que o coletor manda a leitura nova
  const abertasSet = new Set((abertas || []).map((i: any) => `${i.device_id}|${new Date(i.started_at).getTime()}`));
  for (const e of estado || []) {
    if (abertasSet.has(`${e.device_id}|${new Date(e.inicio).getTime()}`)) continue;
    const { data: inc } = await sb.from("device_offline_incidents").select("resolved_at").eq("device_id", e.device_id).eq("started_at", e.inicio).maybeSingle();
    const voltou = inc?.resolved_at ? new Date(inc.resolved_at) : agora;
    if (agora.getTime() - voltou.getTime() < VOLTOU_ESPERA_MIN * MIN) continue;
    const p: any = porId.get(e.device_id);
    const fora = dur(voltou.getTime() - new Date(e.inicio).getTime());
    if (e.avisado_em && !noite && p) {
      const f = await fichaPainel(sb, p);
      const reserva = `🟢 *${p.nome}* voltou às ${hhmm(voltou.toISOString())} (ficou ${fora} fora).\n\n${p.ultimo_boot?.tipo ? `O NUC religou: ${p.ultimo_boot.tipo}.` : p.causa}`;
      await avisar(sb, await escrever(`A tela voltou. Escreva o aviso de volta: qual tela, que horas voltou e quanto tempo ficou fora; a causa mais provável pelos dados (se o NUC religou de forma abrupta = falta de energia ou travamento; se o NUC não religou = foi a internet; se o vigia reiniciou = NUC ficou sem rede); e se precisa fazer algo ou não (siga a RECOMENDAÇÃO; se está tudo normal, diga que não precisa fazer nada).`, `${f.fatos}\nVoltou às ${hhmm(voltou.toISOString())}, ficou ${fora} fora.\nRECOMENDAÇÃO:\n- ${f.recomendacao.join("\n- ")}`, reserva), log);
    }
    await sb.from("nando_paineis_alertas").update({ voltou_em: voltou.toISOString(), fora_texto: fora }).eq("id", e.id);
  }

  // 3) resumo da noite (7h)
  const local = horaLocalIso(agora);
  if (local.slice(11, 13) === "07" && Number(local.slice(14, 16)) < 5) {
    const hoje = local.slice(0, 10);
    const { data: ja } = await sb.from("nando_config").select("valor").eq("chave", "vigia_resumo_noite").maybeSingle();
    if (ja?.valor !== hoje) {
      await sb.from("nando_config").upsert({ chave: "vigia_resumo_noite", valor: hoje });
      const desde = new Date(agora.getTime() - 10 * 3600 * 1000).toISOString();
      const { data: noturnas } = await sb.from("nando_paineis_alertas").select("*").eq("noite", true).gte("inicio", desde);
      const forasAgora = paineis.filter((p: any) => p.estado === "sem_sinal");
      const instaveis = paineis.filter((p: any) => p.estado === "instavel" || p.estado === "internet_ruim");
      const linhas: string[] = [];
      for (const n of noturnas || []) {
        const p: any = porId.get(n.device_id);
        linhas.push(`- ${p?.nome || "painel"}: caiu ${hhmm(n.inicio)}${n.voltou_em ? `, voltou ${hhmm(n.voltou_em)} (${n.fora_texto})` : ", AINDA FORA"}; último ligamento do NUC: ${p?.ultimo_boot?.tipo || "?"}; ${n.resumo || ""}`);
      }
      for (const p of forasAgora) if (!(noturnas || []).some((n: any) => n.device_id === p.id)) linhas.push(`- ${p.nome}: AINDA FORA. ${p.causa}`);
      for (const p of instaveis) linhas.push(`- ${p.nome}: ${p.estado === "instavel" ? "instável" : "internet ruim"} — ${p.causa}`);
      // quem ainda esta fora ganha o aviso completo agora
      for (const n of noturnas || []) if (!n.voltou_em) await sb.from("nando_paineis_alertas").update({ avisado_em: agora.toISOString() }).eq("id", n.id);
      const reserva = linhas.length ? `🌙 *Resumo da noite das telas*\n${linhas.map((l) => l.replace(/^- /, "• ")).join("\n")}` : "🌙 Noite tranquila: nenhuma tela caiu e nenhuma está instável. ✅";
      const texto = linhas.length
        ? await escrever(`Resumo da noite (22h-7h) das telas. Diga em poucas linhas: quais caíram e voltaram (e se o padrão indica falta de energia — NUC religou de forma abrupta, várias no mesmo horário — ou internet), quais AINDA estão fora (com o que fazer, seguindo a causa) e quais estão instáveis. Se várias caíram no mesmo horário, destaque. Termine com o que priorizar hoje.`, linhas.join("\n"), reserva)
        : reserva;
      await avisar(sb, texto, log);
      log.push("resumo da noite das telas enviado");
    }
  }
}

// ---------------------------------------------------------------- ferramenta: diagnosticar_painel
export const FERRAMENTA_DIAGNOSTICO = {
  name: "diagnosticar_painel",
  description: "SÓ para o Jeferson e os técnicos da EXA. Diagnóstico de um painel (tela do elevador): se está online, por que caiu ou está instável (energia, internet/operadora, rádio/cabo no poço, NUC travado), histórico de quedas, operadora, empresa de elevador e contatos do prédio, com a recomendação do que fazer. Use quando perguntarem 'por que o painel X está offline/caiu/instável', 'como está a tela do prédio Y', ou 'quais telas estão fora' (painel vazio = lista as que têm problema).",
  input_schema: { type: "object", properties: { painel: { type: "string", description: "nome do painel ou do prédio; vazio para listar as telas com problema" } } },
};

const norm = (s: unknown) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export async function diagnosticarPainel(sb: SupabaseClient, consulta: string): Promise<string> {
  const paineis = await frota(sb);
  const q = norm(consulta);
  if (!q) {
    const ruins = paineis.filter((p: any) => p.estado !== "tocando");
    if (!ruins.length) return `Todas as ${paineis.length} telas dos prédios estão funcionando agora.`;
    return `Telas com problema agora (${ruins.length} de ${paineis.length}):\n` + ruins.map((p: any) => `- ${p.nome} [${p.estado}] ${p.causa}`).join("\n") +
      "\nPara o diagnóstico completo de uma, chame diagnosticar_painel com o nome dela.";
  }
  const achados = paineis.filter((p: any) => norm(p.nome).includes(q) || norm(p.condominio).includes(q) || q.split(" ").every((w) => norm(`${p.nome} ${p.condominio}`).includes(w)));
  if (!achados.length) return `Não achei painel com "${consulta}". Painéis: ${paineis.map((p: any) => p.nome).join(", ")}.`;
  const out: string[] = [];
  for (const p of achados.slice(0, 3)) {
    const f = await fichaPainel(sb, p);
    out.push(`${f.fatos}\nRECOMENDAÇÃO (siga esta, não invente outra):\n- ${f.recomendacao.join("\n- ")}`);
  }
  return out.join("\n\n---\n\n") + "\n\nResponda curto: o que aconteceu, a causa provável e o que fazer (reiniciar, ligar para a operadora citada, ou agendar a empresa de elevador citada para acessar o poço, onde ficam o NUC e as antenas). Passe o contato se estiver nos fatos; se não estiver cadastrado, diga isso.";
}
