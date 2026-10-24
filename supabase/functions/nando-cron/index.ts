// =====================================================================
// NANDO - rotinas automaticas (chamada a cada 5 minutos pelo pg_cron).
// 1) agendados que comecaram -> no_ar
// 2) avisos com data de saida vencida -> tira do painel e avisa quem criou
// 3) lembretes ("te lembro daqui 30 dias")
// 4) cobranca gentil de predio sem aviso ha 7+ dias (max 1x/semana, dia util, horario comercial)
// 5) resumo semanal para o Jeferson (segunda-feira, 8h)
// 6) limpeza de previas vencidas
// =====================================================================
import {
  db, removerDoPainel, enviarTexto, fmtData, primeiroNome, horaLocalIso, ALERTA_NUMERO, MODO_TESTE, telefoneCanonico,
  chavesTelefone, historico,
} from "../_shared/nando-core.ts";

const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  // so o agendador (pg_cron, com o token guardado em nando_config) ou a chave de servico chamam esta rotina
  const sb = db();
  const auth = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const tokenUrl = new URL(req.url).searchParams.get("token") || "";
  const { data: cfg } = await sb.from("nando_config").select("valor").eq("chave", "cron_token").maybeSingle();
  const okToken = !!cfg?.valor && tokenUrl === cfg.valor;
  if (!okToken && auth !== (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "-")) return json(401, { erro: "nao autorizado" });

  const agora = new Date();
  const log: string[] = [];
  const podeFalarCom = (tel: string) => !MODO_TESTE || chavesTelefone(tel).some((k) => chavesTelefone(ALERTA_NUMERO).includes(k));

  // 1) agendados que ja comecaram
  const { data: comecaram } = await sb.from("nando_avisos").update({ status: "no_ar" })
    .eq("status", "agendado").lte("inicio", agora.toISOString()).select("id");
  if (comecaram?.length) log.push(`${comecaram.length} agendado(s) entraram no ar`);

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
  if (!MODO_TESTE && diaSemana >= 1 && diaSemana <= 5 && hora >= 9 && hora < 17) {
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

  // 6) previas vencidas
  await sb.from("nando_previas").delete().lt("expira_em", new Date(agora.getTime() - 3600000).toISOString());

  return json(200, { ok: true, log });
});
