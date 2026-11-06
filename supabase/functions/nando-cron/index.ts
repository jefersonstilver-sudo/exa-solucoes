// =====================================================================
// NANDO - rotinas automaticas (chamada a cada 5 minutos pelo pg_cron).
// 1) agendados que comecaram -> no_ar (1b: avisos que se repetem)
// 2) avisos com data de saida vencida -> tira do painel e avisa quem criou
// 3) lembretes ("te lembro daqui 30 dias")
// 4) cobranca gentil de predio sem aviso ha 7+ dias (max 1x/semana, dia util, horario comercial)
// 5) resumo semanal para o Jeferson (segunda-feira, 8h)
// 6) limpeza de previas vencidas
// 7) vigia dos paineis: queda real -> Jeferson + tecnicos com diagnostico; voltou; resumo da noite (nando-paineis.ts)
// 8) contratos dos predios: envia os pedidos agendados pela ClickSign e guarda os assinados (predio-contratos.ts)
// 9) NUNCA uma mensagem sem resposta sem a EXA saber: mensagem recebida há 5+ min sem resposta do Nando nem de
//    uma pessoa da EXA vira ocorrência (Nando > WhatsApp do Jeferson + aviso no app), uma vez por mensagem
// =====================================================================
import {
  db, removerDoPainel, enviarTexto, fmtData, primeiroNome, horaLocalIso, ALERTA_NUMERO, MODO_TESTE, telefoneCanonico,
  chavesTelefone, historico, registrarOcorrencia, ehAdmin,
} from "../_shared/nando-core.ts";
import { gerarOcorrencias } from "../_shared/nando-agente.ts";
import { vigiarPaineis, diagnosticarPainel } from "../_shared/nando-paineis.ts";
import { rotinaContratos } from "../_shared/predio-contratos.ts";

const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  // so o agendador (pg_cron, com o token guardado em nando_config) ou a chave de servico chamam esta rotina
  const sb = db();
  const auth = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const tokenUrl = new URL(req.url).searchParams.get("token") || "";
  const { data: cfg } = await sb.from("nando_config").select("valor").eq("chave", "cron_token").maybeSingle();
  const okToken = !!cfg?.valor && tokenUrl === cfg.valor;
  if (!okToken && auth !== (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "-")) return json(401, { erro: "nao autorizado" });

  // conferência (token do cron): ?diagnostico=<painel> devolve o diagnóstico sem mandar nada
  const diag = new URL(req.url).searchParams.get("diagnostico");
  if (diag !== null) {
    try { return json(200, { ok: true, texto: await diagnosticarPainel(sb, diag) }); }
    catch (e) { return json(500, { ok: false, erro: (e as Error).message }); }
  }

  const agora = new Date();
  const log: string[] = [];
  const podeFalarCom = (tel: string) => !MODO_TESTE || chavesTelefone(tel).some((k) => chavesTelefone(ALERTA_NUMERO).includes(k));

  // 1) agendados que ja comecaram
  const { data: comecaram } = await sb.from("nando_avisos").update({ status: "no_ar" })
    .eq("status", "agendado").lte("inicio", agora.toISOString()).select("id");
  if (comecaram?.length) log.push(`${comecaram.length} agendado(s) entraram no ar`);

  // 1b) avisos que se repetem: publica a proxima vez (ate 24 h antes, com hora de aparecer e sumir)
  try { log.push(...await gerarOcorrencias(sb)); } catch (e) { log.push(`repetições falharam: ${(e as Error).message}`); }

  // 2) vencidos
  const { data: vencidos } = await sb.from("nando_avisos").select("*").in("status", ["no_ar", "agendado"])
    .not("fim", "is", null).lte("fim", agora.toISOString()).limit(50);
  for (const a of vencidos || []) {
    try {
      if (a.arquivo) await removerDoPainel(a.cliente_id, [a.arquivo]);
      await sb.from("nando_avisos").update({ status: "encerrado", removido_em: agora.toISOString(), removido_por: "Nando (data de saída)" }).eq("id", a.id);
      await historico(sb, a.id, "Nando", "retirou automaticamente (data de saída)");
      const { data: b } = await sb.from("buildings").select("nome").eq("id", a.building_id).single();
      if (a.criado_por_tel && podeFalarCom(a.criado_por_tel)) {
        await enviarTexto(sb, a.criado_por_tel,
          `Oi${a.criado_por_nome ? ", " + primeiroNome(a.criado_por_nome) : ""}! O aviso *"${a.titulo}"* foi concluído e já foi retirado do painel do ${b?.nome || "prédio"}. ✅\n\nPrecisando de um novo aviso, é só me chamar!`);
      }
      log.push(`encerrado: ${a.titulo}`);
    } catch (e) { log.push(`falha ao encerrar ${a.id}: ${(e as Error).message}`); }
  }

  // 3) lembretes
  const { data: lembrar } = await sb.from("nando_avisos").select("*").in("status", ["no_ar", "agendado"])
    .not("lembrar_em", "is", null).lte("lembrar_em", agora.toISOString()).limit(50);
  for (const a of lembrar || []) {
    await sb.from("nando_avisos").update({ lembrar_em: null }).eq("id", a.id);
    if (!a.criado_por_tel || !podeFalarCom(a.criado_por_tel)) continue;
    const { data: b } = await sb.from("buildings").select("nome").eq("id", a.building_id).single();
    const dias = Math.max(1, Math.round((agora.getTime() - new Date(a.inicio).getTime()) / 86400000));
    await enviarTexto(sb, a.criado_por_tel,
      `Oi${a.criado_por_nome ? ", " + primeiroNome(a.criado_por_nome) : ""}! Passando para lembrar: o aviso *"${a.titulo}"* está no painel do ${b?.nome || "prédio"} há ${dias} dias.\n\nEle ainda vale? Posso manter, tirar ou trocar por um novo. 😉`);
    await sb.from("nando_mensagens").insert({ telefone: telefoneCanonico(a.criado_por_tel), building_id: a.building_id, papel: "nando", conteudo: { texto: `Lembrete enviado sobre o aviso [${String(a.id).slice(0, 8)}] "${a.titulo}" (no ar há ${dias} dias). Perguntei se mantém, tira ou troca.` } });
    log.push(`lembrete: ${a.titulo}`);
  }

  // horario local
  const local = new Date(horaLocalIso(agora) + "Z"); // relogio de Brasilia lido como UTC
  const diaSemana = local.getUTCDay(); // 0 dom .. 6 sab
  const hora = local.getUTCHours();

  // 4) cobranca de predio parado (dia util, 9h-17h)
  // so liga quando o Jeferson decidir (secret NANDO_COBRANCA=true); abrir o Nando a todos NAO dispara mensagens proativas
  const cobrancaLigada = (Deno.env.get("NANDO_COBRANCA") || "false").toLowerCase() === "true";
  if (!MODO_TESTE && cobrancaLigada && diaSemana >= 1 && diaSemana <= 5 && hora >= 9 && hora < 17) {
    const { data: predios } = await sb.from("buildings").select("id,nome,nome_sindico,contato_sindico").eq("status", "ativo");
    for (const b of predios || []) {
      if (!b.contato_sindico) continue;
      const { data: perf } = await sb.from("nando_predio_perfil").select("*").eq("building_id", b.id).maybeSingle();
      if (perf?.pausado || perf?.cobranca_ativa === false) continue;
      if (perf?.ultima_cobranca_em && agora.getTime() - new Date(perf.ultima_cobranca_em).getTime() < 7 * 86400000) continue;
      const { count: noAr } = await sb.from("nando_avisos").select("id", { count: "exact", head: true }).eq("building_id", b.id).eq("status", "no_ar");
      if ((noAr || 0) > 0) continue;
      const { data: ult } = await sb.from("nando_avisos").select("removido_em,created_at").eq("building_id", b.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      const desde = ult ? new Date(ult.removido_em || ult.created_at) : null;
      const dias = desde ? Math.floor((agora.getTime() - desde.getTime()) / 86400000) : null;
      if (dias !== null && dias < 7) continue;
      await enviarTexto(sb, b.contato_sindico,
        `Bom dia${b.nome_sindico ? ", " + primeiroNome(b.nome_sindico) : ""}! Aqui é o Nando, da EXA. 😊\n\nO quadro de avisos do ${String(b.nome).trim()} está ${dias ? `há ${dias} dias ` : ""}sem nenhum aviso. Manter os moradores informados ajuda muito na convivência!\n\nQuer que eu prepare algum? Pode ser um lembrete de silêncio, coleta de lixo, garagem... é só me dizer.`);
      await sb.from("nando_predio_perfil").upsert({ building_id: b.id, ultima_cobranca_em: agora.toISOString() });
      log.push(`cobrança: ${b.nome}`);
    }
  }

  // 5) resumo semanal (segunda, entre 8h e 8h05)
  if (diaSemana === 1 && hora === 8 && local.getUTCMinutes() < 5) {
    const semana = new Date(agora.getTime() - 7 * 86400000).toISOString();
    const { data: av } = await sb.from("nando_avisos").select("building_id,status,created_at,removido_em").gte("created_at", semana);
    const { data: oc } = await sb.from("nando_ocorrencias").select("tipo,descricao").gte("created_at", semana);
    const { data: bs } = await sb.from("buildings").select("id,nome").eq("status", "ativo");
    const nomes = new Map((bs || []).map((b: any) => [b.id, String(b.nome).trim()]));
    const porPredio = new Map<string, number>();
    for (const a of av || []) if (a.status !== "rascunho") porPredio.set(a.building_id, (porPredio.get(a.building_id) || 0) + 1);
    const ranking = [...porPredio.entries()].sort((x, y) => y[1] - x[1]);
    const { data: noAr } = await sb.from("nando_avisos").select("building_id").eq("status", "no_ar");
    const comAviso = new Set((noAr || []).map((a: any) => a.building_id));
    const parados = (bs || []).filter((b: any) => !comAviso.has(b.id)).map((b: any) => String(b.nome).trim());
    const texto = `📊 *Resumo semanal do Nando*\n\n` +
      `Avisos publicados na semana: *${ranking.reduce((s, r) => s + r[1], 0)}*\n` +
      (ranking.length ? `Mais ativos: ${ranking.slice(0, 3).map(([id, n]) => `${nomes.get(id) || "?"} (${n})`).join(", ")}\n` : "") +
      `Prédios sem aviso no ar: ${parados.length ? parados.join(", ") : "nenhum 🎉"}\n` +
      `Ocorrências: ${oc?.length ? oc.map((o: any) => `${o.tipo}`).join(", ") : "zero"}`;
    await enviarTexto(sb, ALERTA_NUMERO, texto);
    log.push("resumo semanal enviado");
  }

  // 5b) rascunho nao fica guardado: o que nao foi publicado em 2 h e descartado
  await sb.from("nando_avisos").update({ status: "removido", removido_por: "rascunho não publicado (descartado)", removido_em: agora.toISOString() })
    .eq("status", "rascunho").lt("created_at", new Date(agora.getTime() - 2 * 3600000).toISOString());
  // 6) previas vencidas
  await sb.from("nando_previas").delete().lt("expira_em", new Date(agora.getTime() - 3600000).toISOString());

  // 7) vigia dos paineis (falha aqui nao derruba o resto da rotina)
  try { await vigiarPaineis(sb, log); } catch (e) { log.push(`vigia dos painéis falhou: ${(e as Error).message.slice(0, 160)}`); }

  // 8) contratos dos predios (pedidos agendados -> ClickSign; assinados -> Painel do Sindico)
  try { log.push(...await rotinaContratos(sb)); } catch (e) { log.push(`contratos falharam: ${(e as Error).message.slice(0, 160)}`); }

  // 9) mensagens sem resposta (06/11/2026: o Nando ficou mudo para o Jeferson das 10h45 às 18h30 sem ninguém saber)
  try { log.push(...await vigiarSemResposta(sb, agora)); } catch (e) { log.push(`vigia de respostas falhou: ${(e as Error).message.slice(0, 160)}`); }

  return json(200, { ok: true, log });
});

async function vigiarSemResposta(sb: ReturnType<typeof db>, agora: Date): Promise<string[]> {
  const out: string[] = [];
  const de = new Date(agora.getTime() - 6 * 3600000).toISOString();
  const ate = new Date(agora.getTime() - 5 * 60000).toISOString();
  const { data: recebidas } = await sb.from("nando_mensagens").select("id,telefone,created_at,conteudo")
    .eq("papel", "sindico").gte("created_at", de).lte("created_at", ate).order("id", { ascending: false }).limit(300);
  // a última mensagem recebida de cada número nesse intervalo
  const ultima = new Map<string, any>();
  for (const m of recebidas || []) if (!ultima.has(m.telefone)) ultima.set(m.telefone, m);
  for (const [tel, m] of ultima) {
    // depois dela, o Nando respondeu, uma pessoa da EXA respondeu ou o Nando registrou que decidiu não responder?
    const { data: depois } = await sb.from("nando_mensagens").select("id").eq("telefone", tel).in("papel", ["nando", "humano", "sistema"]).gt("id", m.id).limit(1);
    if (depois?.length) continue;
    // atendimento assumido por alguém da EXA no CRM: silêncio é de propósito
    const { data: at } = await sb.from("nando_atendimento").select("modo,humano_ate").eq("telefone", tel).maybeSingle().then((r) => r, () => ({ data: null }));
    if (at?.modo === "humano" && (!at.humano_ate || new Date(at.humano_ate).getTime() > agora.getTime())) continue;
    // modo teste: número que o Nando nunca atende de propósito (não é o Jeferson e nunca recebeu resposta em 60 dias)
    if (!ehAdmin(tel)) {
      const { count } = await sb.from("nando_mensagens").select("id", { count: "exact", head: true }).eq("telefone", tel).eq("papel", "nando")
        .gte("created_at", new Date(agora.getTime() - 60 * 86400000).toISOString());
      if (!count) continue;
    }
    // uma ocorrência por mensagem
    const marca = `msg #${m.id}`;
    const { data: ja } = await sb.from("nando_ocorrencias").select("id").eq("tipo", "sem_resposta").like("descricao", `%${marca}%`).limit(1);
    if (ja?.length) continue;
    const min = Math.round((agora.getTime() - new Date(m.created_at).getTime()) / 60000);
    const c = m.conteudo || {};
    const oque = String(c.texto || (c.midia ? `[${c.midia}]` : "(mensagem)")).replace(/\s+/g, " ").slice(0, 160);
    const nome = ehAdmin(tel) ? "Jeferson" : String(c.nome_whatsapp || "");
    await registrarOcorrencia(sb, {
      tipo: "sem_resposta", telefone: tel, nome,
      descricao: `⚠️ Recebi uma mensagem há ${min} min e NÃO respondi (${marca}).\n"${oque}"\nVeja nos registros do nando-webhook o que falhou e responda pelo CRM se for preciso.`,
    });
    await pushCeo(sb, `Nando sem responder · ${nome || tel}`, `${min} min sem resposta: ${oque}`, "/super_admin/crm-evolution/conversas/nando?telefone=" + tel);
    out.push(`sem resposta: ${tel} (${marca}, ${min} min)`);
  }
  return out;
}

async function pushCeo(sb: ReturnType<typeof db>, titulo: string, corpo: string, url: string) {
  try {
    const { data } = await sb.from("exa2_config").select("valor").eq("chave", "cron_token").maybeSingle();
    if (!data?.valor) return;
    await fetch(Deno.env.get("SUPABASE_URL") + "/functions/v1/exa2-push", {
      method: "POST", signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), "x-exa2-cron": String(data.valor) },
      body: JSON.stringify({ action: "enviar", para: "ceo", titulo, corpo: corpo.slice(0, 300), url, tag: "nando-sem-resposta", tipo: "alerta" }),
    });
  } catch (_) { /* aviso no app nunca derruba a rotina */ }
}
