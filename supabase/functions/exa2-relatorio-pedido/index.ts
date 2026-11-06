// EXA (06/11/2026) — RELATÓRIO DO PEDIDO (área do anunciante › Relatórios e aba Relatório do pedido).
// Tudo que o anunciante precisa saber do contrato: período, prédios e telas, exibições calculadas pela programação
// (os painéis não registram cada exibição; decisão do Jeferson em 06/11: número pela programação, apresentado como entregue,
// calculado pela programação real de cada prédio, dia a dia — sem desconto de queda de internet: o NUC segue tocando), histórico
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
const TOCAM = ["ativo", "video_aprovado", "finalizado", "expirado", "concluido"];
// pedidos editoriais da EXA (rodízio Notícias Brasil → Notícias Foz → Curiosidades; 1 por rodada)
const EDITORIAIS = ["c08f3154-e0dc-4c39-b8a2-721d8acdde7f", "9cb8da99-ddb3-491c-b58c-63871eadc4cb", "7a4dc868-0ecd-4969-a1ec-5589d399b7c4"];
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
    const { data: confs } = await sb.from("configuracoes_exibicao").select("horas_operacao_dia").limit(1);
    const horas = Number(confs?.[0]?.horas_operacao_dia) || 23;
    const segDia = horas * 3600;

    const hoje = Date.now();
    const ini = inicioDiaBR(String(ped.data_inicio).slice(0, 10));
    const fimContrato = ped.data_fim ? inicioDiaBR(String(ped.data_fim).slice(0, 10)) + DIA - 1 : hoje;
    const fim = Math.min(hoje, fimContrato);
    const dias: string[] = [];
    for (let t = ini; t <= fim; t += DIA) dias.push(diaBR(t + 3600_000));

    // prédios e telas
    const ids: string[] = (ped.lista_predios || []).filter(Boolean);
    const { data: predios } = ids.length ? await sb.from("buildings").select("id,nome,bairro,quantidade_telas,publico_estimado").in("id", ids) : { data: [] as any[] };
    const { data: devs } = ids.length ? await sb.from("devices").select("id,building_id,is_deleted").in("building_id", ids) : { data: [] as any[] };
    const devsPorPredio = new Map<string, number>();
    for (const d of devs || []) if (!d.is_deleted) devsPorPredio.set(d.building_id, (devsPorPredio.get(d.building_id) || 0) + 1);

    // PROGRAMAÇÃO REAL DE CADA PRÉDIO, DIA A DIA (mesma regra do player v22 dos painéis, public/painel-web/ui/scripts/propagandas.js):
    // rodada = todos os horizontais (1 vídeo por pedido) com 1 vertical premium a cada 3 horizontais, 1 editorial
    // (Brasil → Foz → Curiosidades) e mais 1 vertical no fim; os verticais revezam entre si.
    // Quedas de internet não contam como tela apagada: o NUC continua tocando o que já baixou (decisão do Jeferson, 06/11).
    const { data: outros } = ids.length ? await sb.from("pedidos").select("id,status,tipo_produto,data_inicio,data_fim,lista_predios,blocked_at,is_test_order")
      .overlaps("lista_predios", ids).not("data_inicio", "is", null) : { data: [] as any[] };
    const tocam = (outros || []).filter((o: any) => o.id === ped.id || (!o.is_test_order && (TOCAM.includes(o.status) || o.status === "bloqueado")));
    const { data: durs } = tocam.length ? await sb.from("pedido_videos").select("pedido_id,videos(duracao)").eq("is_active", true).in("pedido_id", tocam.map((o: any) => o.id)) : { data: [] as any[] };
    const durPedido = new Map<string, number>();
    for (const x of durs || []) { const s = Number((x as any).videos?.duracao); if (s > 0) durPedido.set(x.pedido_id, Math.min(90, Math.max(5, s))); }
    const ehVert = (o: any) => String(o.tipo_produto || "").toLowerCase().includes("vertical");
    const dur = (o: any) => durPedido.get(o.id) || (EDITORIAIS.includes(o.id) ? 50 : ehVert(o) ? 15 : 10);
    const noDia = (o: any, d: string) => {
      const t = inicioDiaBR(d) + 12 * 3600_000;
      if (t < inicioDiaBR(String(o.data_inicio).slice(0, 10))) return false;
      if (o.data_fim && t > inicioDiaBR(String(o.data_fim).slice(0, 10)) + DIA) return false;
      if (o.status === "bloqueado" && o.id !== ped.id && (!o.blocked_at || Date.parse(o.blocked_at) <= t)) return false;
      return true;
    };
    const duracao = dur(ped);
    // exibições do NOSSO pedido por tela num dia, num prédio
    const programaDia = (bid: string, d: string) => {
      const ativos = tocam.filter((o: any) => (o.lista_predios || []).includes(bid) && noDia(o, d));
      if (!ativos.some((o: any) => o.id === ped.id)) ativos.push(ped);
      const ed = ativos.filter((o: any) => EDITORIAIS.includes(o.id));
      const hor = ativos.filter((o: any) => !EDITORIAIS.includes(o.id) && !ehVert(o));
      const ver = ativos.filter((o: any) => !EDITORIAIS.includes(o.id) && ehVert(o));
      const nH = hor.length, nE = ed.length, nP = ver.length;
      const media = (l: any[]) => (l.length ? l.reduce((a, o) => a + dur(o), 0) / l.length : 0);
      let rodada: number, porRodada: number, vPorRodada = 0;
      if (!nH && !nE) { rodada = ver.reduce((a, o) => a + dur(o), 0); porRodada = 1; }
      else {
        vPorRodada = nP ? (nH > 0 ? Math.floor((nH - 1) / 3) : 0) + 1 : 0;
        rodada = hor.reduce((a, o) => a + dur(o), 0) + (nE ? media(ed) : 0) + vPorRodada * media(ver);
        porRodada = vertical ? vPorRodada / nP : 1;
      }
      const exib = rodada > 0 ? (segDia / rodada) * porRodada : 0;
      return { exib, rodada, nH, nP, vPorRodada };
    };

    const porMes = new Map<string, { exibicoes: number; dias: number }>();
    const porDia = new Map<string, number>();
    let totalExib = 0, somaTelaDia = 0, contTelaDia = 0, rodadaHoje = 0, nRod = 0;
    const ultimoDia = dias[dias.length - 1];
    const linhasPredios = (predios || []).map((p: any) => {
      const telas = Math.max(1, Number(p.quantidade_telas) || devsPorPredio.get(p.id) || 1);
      let exib = 0, hojeTela = 0;
      for (const d of dias) {
        const x = programaDia(p.id, d);
        const e = Math.round(x.exib * telas);
        exib += e; somaTelaDia += x.exib; contTelaDia++;
        porDia.set(d, (porDia.get(d) || 0) + e);
        if (d === ultimoDia) { hojeTela = x.exib; rodadaHoje += x.rodada; nRod++; }
      }
      totalExib += exib;
      return {
        id: p.id, nome: String(p.nome || "").trim(), bairro: p.bairro || "", telas, exibicoes: exib,
        por_dia_tela: Math.round(hojeTela),
        participacao: Math.round(((hojeTela * duracao) / segDia) * 1000) / 10, // % do tempo da tela hoje
        horas_tela: Math.round((exib * duracao) / 360) / 10,
        publico: Number(p.publico_estimado) || 0,
      };
    }).sort((a: any, b: any) => b.exibicoes - a.exibicoes);
    for (const [d, e] of porDia) {
      const m = d.slice(0, 7); const v = porMes.get(m) || { exibicoes: 0, dias: 0 };
      v.exibicoes += e; v.dias += 1; porMes.set(m, v);
    }
    const exibDiaTela = Math.round(linhasPredios.length ? linhasPredios.reduce((a: number, p: any) => a + p.por_dia_tela, 0) / linhasPredios.length : 0);
    const ciclo = Math.round(nRod ? rodadaHoje / nRod : 0);
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
        duracao_s: duracao, horas_dia: horas, ciclo_s: ciclo, exibicoes_dia_tela: exibDiaTela,
        tela_cheia: vertical,
        participacao: Math.round(((exibDiaTela * duracao) / segDia) * 1000) / 10,
        minutos_dia_tela: Math.round((exibDiaTela * duracao) / 60),
      },
      totais: {
        predios: linhasPredios.length, telas, exibicoes: totalExib, horas_tela: Math.round((totalExib * duracao) / 360) / 10,
        media_dia: diasNoAr ? Math.round(totalExib / diasNoAr) : 0,
        publico: linhasPredios.reduce((a: number, p: any) => a + (p.publico || 0), 0),
        videos_publicados: videos.length, videos_no_ar: noAr.length,
      },
      meses: [...porMes.entries()].sort().map(([mes, v]) => ({ mes, ...v })),
      dias: [...porDia.entries()].sort().slice(-90).map(([dia, exibicoes]) => ({ dia, exibicoes })),
      predios: linhasPredios,
      videos: videos.reverse(),
      publicacoes: { por_mes: [...pubMes.entries()].sort().map(([mes, qtd]) => ({ mes, qtd })), series },
      metodologia: `Calculado pela programação de cada tela, dia a dia: os painéis funcionam ${horas} h por dia e tocam em rodadas com todos os anúncios horizontais do prédio, ${vertical ? "o Vertical Premium em tela cheia a cada 3 anúncios horizontais e de novo no fim da rodada (revezando com os outros verticais do prédio)" : "um vertical em tela cheia a cada 3 horizontais"} e um conteúdo editorial. Para cada prédio contamos os anúncios que estavam no ar em cada dia, a duração de cada vídeo e o número de telas. Hoje uma rodada leva em média ${ciclo} s e sua marca aparece cerca de ${exibDiaTela} vezes por tela por dia, ${Math.round((exibDiaTela * duracao) / 60)} minutos por dia em cada tela.`,
    });
  } catch (e) {
    console.error("[RELATORIO]", (e as Error).message);
    return json(500, { ok: false, erro: "Não consegui montar o relatório agora. Tente de novo em instantes." });
  }
});
