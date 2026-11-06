// EXA (06/11/2026) — RELATÓRIO DO PEDIDO (área do anunciante › Relatórios e aba Relatório do pedido).
// Tudo que o anunciante precisa saber do contrato: período, prédios e telas, exibições ESTIMADAS pela programação
// (os painéis dos elevadores não registram cada exibição — decisão do Jeferson em 06/11: relatório só estimado,
// com a metodologia escrita), disponibilidade das telas (desconta o tempo offline real de cada prédio), histórico
// de vídeos publicados e a programação atual.
// Acesso: o dono do pedido (JWT) ou a equipe (inclusive "ver como cliente").
// POST { acao: "lista", cliente_id? }  → pedidos do cliente
// POST { acao: "relatorio", pedido_id } → relatório completo
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const uuid = (v: unknown) => String(v || "").replace(/[^0-9a-f-]/gi, "").slice(0, 36);
const DIA = 86400_000;
const EQUIPE = ["super_admin", "admin", "admin_financeiro", "admin_departamental", "comercial"];
const STATUS_VISIVEIS = ["ativo", "video_aprovado", "pago", "pago_pendente_video", "expirado", "finalizado", "concluido", "cancelado"];

// dia (yyyy-mm-dd) no horário de Brasília
const diaBR = (t: number) => new Date(t - 3 * 3600_000).toISOString().slice(0, 10);
const inicioDiaBR = (d: string) => Date.parse(d + "T03:00:00Z");

function serie(nome: string): string {
  const n = String(nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/\bcine|cinema/.test(n)) return "cinema";
  if (/hotel/.test(n)) return "hotel";
  return "geral";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(jwt);
    if (!u?.user) return json(401, { ok: false, erro: "Entre na sua conta para ver o relatório." });
    const { data: papeis } = await sb.from("user_roles").select("role").eq("user_id", u.user.id);
    const equipe = (papeis || []).some((r: any) => EQUIPE.includes(String(r.role)));
    const b = await req.json().catch(() => ({}));

    if (b.acao === "lista") {
      const cliente = equipe && b.cliente_id ? uuid(b.cliente_id) : u.user.id;
      const { data } = await sb.from("pedidos").select("id,nome_pedido,status,tipo_produto,data_inicio,data_fim,lista_predios,created_at")
        .eq("client_id", cliente).in("status", STATUS_VISIVEIS).order("data_inicio", { ascending: false, nullsFirst: false });
      return json(200, { ok: true, pedidos: (data || []).filter((p: any) => p.data_inicio).map((p: any) => ({
        id: p.id, nome: p.nome_pedido || "Campanha EXA", status: p.status, produto: String(p.tipo_produto || "horizontal").includes("vertical") ? "vertical_premium" : "horizontal",
        inicio: p.data_inicio, fim: p.data_fim, predios: (p.lista_predios || []).length,
      })) });
    }

    // ------------------------------------------------------------------ relatório
    const pid = uuid(b.pedido_id);
    const { data: ped } = await sb.from("pedidos").select("*").eq("id", pid).maybeSingle();
    if (!ped) return json(404, { ok: false, erro: "Pedido não encontrado." });
    if (!equipe && ped.client_id !== u.user.id) return json(403, { ok: false, erro: "Este pedido não é da sua conta." });
    if (!ped.data_inicio) return json(200, { ok: true, pendente: true, pedido: { id: ped.id, nome: ped.nome_pedido }, aviso: "A campanha ainda não começou: o relatório aparece a partir do primeiro dia no ar." });

    const vertical = String(ped.tipo_produto || "").toLowerCase().includes("vertical");
    const [{ data: prods }, { data: confs }] = await Promise.all([
      sb.from("produtos_exa").select("codigo,duracao_video_segundos,max_clientes_por_painel"),
      sb.from("configuracoes_exibicao").select("horas_operacao_dia,dias_mes").limit(1),
    ]);
    const pr = (c: string) => (prods || []).find((x: any) => x.codigo === c);
    const H = pr("horizontal") || { duracao_video_segundos: 10, max_clientes_por_painel: 15 };
    const V = pr("vertical_premium") || { duracao_video_segundos: 15, max_clientes_por_painel: 3 };
    const horas = Number(confs?.[0]?.horas_operacao_dia) || 23;
    // ciclo oficial: todas as marcas horizontais + 1 vertical em tela cheia (Manual Técnico 2026: 15×10 s + 15 s = 165 s)
    const ciclo = H.max_clientes_por_painel * H.duracao_video_segundos + V.duracao_video_segundos;
    const ciclosDia = (horas * 3600) / ciclo;
    const exibDiaTela = Math.round(vertical ? ciclosDia / V.max_clientes_por_painel : ciclosDia);
    const duracao = vertical ? V.duracao_video_segundos : H.duracao_video_segundos;

    const hoje = Date.now();
    const ini = inicioDiaBR(String(ped.data_inicio).slice(0, 10));
    const fimContrato = ped.data_fim ? inicioDiaBR(String(ped.data_fim).slice(0, 10)) + DIA - 1 : hoje;
    const fim = Math.min(hoje, fimContrato);
    const dias: string[] = [];
    for (let t = ini; t <= fim; t += DIA) dias.push(diaBR(t + 3600_000));

    // prédios e telas
    const ids: string[] = (ped.lista_predios || []).filter(Boolean);
    const { data: predios } = ids.length ? await sb.from("buildings").select("id,nome,bairro,endereco,quantidade_telas,publico_estimado,visualizacoes_mes,codigo_predio").in("id", ids) : { data: [] as any[] };
    const { data: devs } = ids.length ? await sb.from("devices").select("id,building_id,is_deleted").in("building_id", ids) : { data: [] as any[] };
    const devPredio = new Map<string, string>((devs || []).filter((d: any) => !d.is_deleted).map((d: any) => [d.id, d.building_id]));
    const devsPorPredio = new Map<string, number>();
    for (const [, bid] of devPredio) devsPorPredio.set(bid, (devsPorPredio.get(bid) || 0) + 1);

    // tempo offline real por prédio e por dia (incidentes dos aparelhos do prédio dentro do período)
    const offline = new Map<string, Map<string, number>>(); // building -> dia -> segundos
    const devIds = [...devPredio.keys()];
    for (let i = 0; i < devIds.length; i += 80) {
      const { data: inc } = await sb.from("device_offline_incidents").select("device_id,started_at,resolved_at")
        .in("device_id", devIds.slice(i, i + 80)).lte("started_at", new Date(fim).toISOString())
        .or(`resolved_at.is.null,resolved_at.gte.${new Date(ini).toISOString()}`).limit(20000);
      for (const x of inc || []) {
        const bid = devPredio.get(x.device_id); if (!bid) continue;
        let a = Math.max(ini, Date.parse(x.started_at)); const z = Math.min(fim, x.resolved_at ? Date.parse(x.resolved_at) : hoje);
        const porDia = offline.get(bid) || new Map<string, number>();
        while (a < z) {
          const d = diaBR(a); const fimDia = inicioDiaBR(d) + DIA; const ate = Math.min(z, fimDia);
          porDia.set(d, Math.min(86400, (porDia.get(d) || 0) + (ate - a) / 1000));
          a = ate;
        }
        offline.set(bid, porDia);
      }
    }

    // exibições estimadas por prédio, por dia e por mês
    const porMes = new Map<string, { exibicoes: number; dias: number }>();
    const porDia = new Map<string, number>();
    let totalExib = 0, segOnline = 0, segPossivel = 0;
    const linhasPredios = (predios || []).map((p: any) => {
      const telas = Math.max(1, Number(p.quantidade_telas) || devsPorPredio.get(p.id) || 1);
      const nDev = Math.max(1, devsPorPredio.get(p.id) || 1);
      let exib = 0, on = 0, poss = 0;
      for (const d of dias) {
        const off = (offline.get(p.id)?.get(d) || 0) / nDev; // média por aparelho do prédio
        const frac = Math.max(0, 1 - off / 86400);
        const e = Math.round(exibDiaTela * telas * frac);
        exib += e; on += 86400 * frac; poss += 86400;
        porDia.set(d, (porDia.get(d) || 0) + e);
      }
      totalExib += exib; segOnline += on; segPossivel += poss;
      return {
        id: p.id, nome: String(p.nome || "").trim(), bairro: p.bairro || "", telas, exibicoes: exib,
        disponibilidade: poss ? Math.round((on / poss) * 1000) / 10 : 100,
        publico: Number(p.publico_estimado) || 0,
      };
    }).sort((a: any, b: any) => b.exibicoes - a.exibicoes);
    for (const [d, e] of porDia) {
      const m = d.slice(0, 7); const v = porMes.get(m) || { exibicoes: 0, dias: 0 };
      v.exibicoes += e; v.dias += 1; porMes.set(m, v);
    }

    // vídeos: atuais do pedido + histórico de publicações da conta dentro do período
    const { data: pvs } = await sb.from("pedido_videos").select("video_id,is_active,selected_for_display,is_base_video,approval_status,approved_at,created_at,videos(id,nome,duracao,orientacao,created_at)").eq("pedido_id", pid);
    const atuais = new Map<string, any>((pvs || []).map((x: any) => [x.video_id, x]));
    const { data: regras } = await sb.from("campaign_video_schedules").select("video_id,campaign_schedule_rules(days_of_week,start_time,end_time,is_all_day,is_active,rule_type,label),campaigns_advanced!inner(pedido_id)").eq("campaigns_advanced.pedido_id", pid);
    const regrasPorVideo = new Map<string, any[]>();
    for (const r of regras || []) regrasPorVideo.set(r.video_id, [...(regrasPorVideo.get(r.video_id) || []), ...((r as any).campaign_schedule_rules || []).filter((x: any) => x.is_active)]);

    const { data: hist } = await sb.from("videos").select("id,nome,duracao,orientacao,created_at,origem")
      .eq("client_id", ped.client_id).gte("created_at", new Date(ini - 7 * DIA).toISOString()).lte("created_at", new Date(fim).toISOString()).order("created_at");
    const todos = new Map<string, any>();
    for (const v of hist || []) todos.set(v.id, v);
    for (const x of pvs || []) if (x.videos) todos.set(x.video_id, x.videos);
    const lista = [...todos.values()].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

    // período estimado no ar: atual → desde a publicação; substituído → até a publicação seguinte da mesma série
    const SEM = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
    const descreverRegras = (rs: any[]) => rs.map((r) => {
      const d = Array.isArray(r.days_of_week) && r.days_of_week.length && r.days_of_week.length < 7 ? r.days_of_week.map((n: number) => SEM[n]).join(", ") : "todos os dias";
      const h = r.is_all_day || !r.start_time ? "o dia todo" : `${String(r.start_time).slice(0, 5)}–${String(r.end_time || "").slice(0, 5)}`;
      return `${d}, ${h}`;
    }).join(" · ");
    const videos = lista.map((v, i) => {
      const pv = atuais.get(v.id);
      const noAr = !!(pv && pv.is_active !== false && pv.selected_for_display !== false && (pv.approval_status || "approved") === "approved");
      const desde = Math.max(ini, Date.parse(pv?.approved_at || v.created_at));
      const prox = lista.slice(i + 1).find((w) => serie(w.nome) === serie(v.nome) && Date.parse(w.created_at) > Date.parse(v.created_at) + 3600_000);
      const ate = noAr ? fim : prox ? Math.min(fim, Date.parse(prox.created_at)) : null;
      const rs = regrasPorVideo.get(v.id) || [];
      return {
        id: v.id, nome: String(v.nome || "Vídeo").trim(), publicado_em: v.created_at, duracao: Number(v.duracao) || duracao,
        orientacao: v.orientacao || (vertical ? "vertical" : "horizontal"), serie: serie(v.nome),
        situacao: noAr ? "no_ar" : pv ? "pausado" : "substituido",
        principal: !!pv?.is_base_video, programacao: rs.length ? descreverRegras(rs) : noAr ? "todos os dias, o dia todo" : null,
        periodo: ate ? { de: new Date(desde).toISOString(), ate: new Date(ate).toISOString() } : null,
      };
    });
    // exibições estimadas por vídeo NO AR (divide o dia entre os vídeos no ar, desde a publicação de cada um)
    const noAr = videos.filter((v) => v.situacao === "no_ar");
    for (const v of noAr) (v as any).exibicoes = 0;
    for (const d of dias) {
      const t = inicioDiaBR(d) + 12 * 3600_000;
      const ativos = noAr.filter((v) => Date.parse(v.periodo!.de) <= t);
      if (!ativos.length) continue;
      for (const v of ativos) (v as any).exibicoes += Math.round((porDia.get(d) || 0) / ativos.length);
    }

    // publicações por mês e por série (ex.: programação semanal do cinema)
    const pubMes = new Map<string, number>();
    for (const v of videos) { const m = diaBR(Date.parse(v.publicado_em)).slice(0, 7); pubMes.set(m, (pubMes.get(m) || 0) + 1); }
    const series: Record<string, { videos: number; semanas: number }> = {};
    for (const v of videos) {
      const s = series[v.serie] || { videos: 0, semanas: 0 }; s.videos += 1; series[v.serie] = s;
    }
    for (const k of Object.keys(series)) {
      const semanas = new Set(videos.filter((v) => v.serie === k).map((v) => { const t = Date.parse(v.publicado_em); return Math.floor((t - 3 * 3600_000 + 3 * DIA) / (7 * DIA)); }));
      series[k].semanas = semanas.size;
    }

    const telas = linhasPredios.reduce((a: number, p: any) => a + p.telas, 0);
    const diasNoAr = dias.length;
    const totalDias = Math.max(1, Math.round((fimContrato - ini) / DIA));
    return json(200, {
      ok: true,
      gerado_em: new Date().toISOString(),
      pedido: {
        id: ped.id, nome: ped.nome_pedido || "Campanha EXA", status: ped.status, cliente: ped.client_name || null,
        produto: vertical ? "vertical_premium" : "horizontal", inicio: ped.data_inicio, fim: ped.data_fim, plano_meses: ped.plano_meses,
        dias_no_ar: diasNoAr, dias_restantes: ped.data_fim ? Math.max(0, Math.ceil((fimContrato - hoje) / DIA)) : null,
        progresso: Math.min(100, Math.round((diasNoAr / totalDias) * 100)),
      },
      formato: {
        produto: vertical ? "Vertical Premium (tela cheia 1080×1920)" : "Horizontal (1080×890)",
        duracao_s: duracao, marcas_por_tela: vertical ? V.max_clientes_por_painel : H.max_clientes_por_painel,
        horas_dia: horas, ciclo_s: ciclo, exibicoes_dia_tela: exibDiaTela,
      },
      totais: {
        predios: linhasPredios.length, telas, exibicoes: totalExib, horas_tela: Math.round((totalExib * duracao) / 360) / 10,
        media_dia: diasNoAr ? Math.round(totalExib / diasNoAr) : 0,
        disponibilidade: segPossivel ? Math.round((segOnline / segPossivel) * 1000) / 10 : 100,
        publico: linhasPredios.reduce((a: number, p: any) => a + (p.publico || 0), 0),
        videos_publicados: videos.length, videos_no_ar: noAr.length,
      },
      meses: [...porMes.entries()].sort().map(([mes, v]) => ({ mes, ...v })),
      dias: [...porDia.entries()].sort().slice(-90).map(([dia, exibicoes]) => ({ dia, exibicoes })),
      predios: linhasPredios,
      videos: videos.reverse(),
      publicacoes: { por_mes: [...pubMes.entries()].sort().map(([mes, qtd]) => ({ mes, qtd })), series },
      metodologia: `Exibições estimadas pela programação: em ${horas} h de operação por dia, cada ciclo dos painéis dura ${ciclo} s (${H.max_clientes_por_painel} marcas horizontais de ${H.duracao_video_segundos} s + 1 vertical premium de ${V.duracao_video_segundos} s). ${vertical ? `O Vertical Premium aparece em tela cheia uma vez a cada ${V.max_clientes_por_painel} ciclos` : "Cada marca horizontal aparece uma vez por ciclo"}: cerca de ${exibDiaTela} exibições por tela por dia. Multiplicamos pelo número de telas de cada prédio e descontamos o tempo em que cada tela ficou offline (registro real dos painéis). Os painéis dos elevadores não registram cada exibição individualmente; por isso os números são estimativas.`,
    });
  } catch (e) {
    console.error("[RELATORIO]", (e as Error).message);
    return json(500, { ok: false, erro: "Não consegui montar o relatório agora. Tente de novo em instantes." });
  }
});
